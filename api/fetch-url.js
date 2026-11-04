import { lookup } from 'node:dns/promises';
import { lookup as dnsLookup } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';
import { pipeline } from 'node:stream';
import zlib from 'node:zlib';
import { withApiHandler, RATE_LIMITS } from './_shared.js';
import { fetchUrlSchema, parseBody } from './_schemas.js';

const MAX_CONTENT_LENGTH = 500_000; // 500KB text limit
const FETCH_TIMEOUT = 10_000; // 10s
const MAX_REDIRECTS = 5;

// ── SSRF protection ──
// Checking the hostname string alone isn't enough: IPv6 forms like
// [::ffff:127.0.0.1] or [fd12::1], and public DNS names that resolve to
// private IPs (127.0.0.1.nip.io), all got past it. So every hop resolves the
// name and checks each resulting address against these ranges. (BlockList also
// matches IPv4-mapped IPv6 addresses against the IPv4 rules.)
const BLOCKED_RANGES = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) BLOCKED_RANGES.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
]) BLOCKED_RANGES.addSubnet(net, prefix, 'ipv6');

export function isPrivateAddress(address) {
  const family = isIP(address);
  if (!family) return true;
  return BLOCKED_RANGES.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

// Returns an error message if the host must not be fetched, else null.
// This is the early check that gives a clear error (and covers IP literals,
// which never go through DNS). It doesn't by itself protect the connection:
// a DNS server can answer this lookup with a public address and the next one
// with a private one (DNS rebinding). pinnedLookup below closes that gap.
export async function checkHost(hostname) {
  const bare = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
  if (bare === 'localhost' || bare.endsWith('.localhost') || bare.endsWith('.local') || bare.endsWith('.internal')) {
    return PRIVATE_HOST_ERROR;
  }
  let addresses;
  if (isIP(bare)) {
    addresses = [bare];
  } else {
    try {
      addresses = (await lookup(bare, { all: true, verbatim: true })).map(a => a.address);
    } catch {
      return 'Could not resolve that URL\'s host';
    }
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) return PRIVATE_HOST_ERROR;
  return null;
}

const PRIVATE_HOST_ERROR = 'URLs pointing to private/internal addresses are not allowed';

// The DNS lookup the socket itself uses (http.request's `lookup` option). It
// validates the addresses it resolves and hands the socket exactly those, so
// the address that's checked is the address that's connected to: there's no
// second resolution for a rebinding DNS server to answer differently.
// `resolve` is injectable for tests.
export function pinnedLookup(hostname, options, callback, resolve = dnsLookup) {
  resolve(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) return callback(err);
    if (addresses.length === 0 || addresses.some(a => isPrivateAddress(a.address))) {
      return callback(Object.assign(new Error(PRIVATE_HOST_ERROR), { code: 'EPRIVATEHOST' }));
    }
    // net.connect asks for all addresses when it does happy-eyeballs
    if (options?.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

// fetch() used to decompress transparently; http.get doesn't. Decoding here
// means MAX_CONTENT_LENGTH counts decompressed bytes (no zip bombs).
const DECODERS = {
  gzip: zlib.createGunzip, 'x-gzip': zlib.createGunzip,
  deflate: zlib.createInflate, br: zlib.createBrotliDecompress,
};
export function decodedBody(response) {
  const make = DECODERS[(response.headers['content-encoding'] || '').trim().toLowerCase()];
  return make ? pipeline(response, make(), () => {}) : response;
}

// One HTTP(S) GET with no redirect following, connected via pinnedLookup
// (`lookup` is overridable only so tests can reach a local server).
// Resolves with the raw IncomingMessage (status, lowercase headers, and an
// async-iterable body).
export function get(url, { headers, signal, lookup = pinnedLookup } = {}) {
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    // agent: false — a fresh connection every time. A pooled keep-alive
    // socket would skip `lookup` entirely, and the global agent's pool is
    // shared with any other http.get in the process.
    const req = client.get(url, { headers, signal, lookup, agent: false }, resolve);
    req.on('error', reject);
  });
}

export default withApiHandler(async (req, res) => {
  const { ok, data: body, error: validationError } = parseBody(fetchUrlSchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const { url, extractMode } = body;

  // Validate protocol (Zod validates URL format, but we also need protocol check)
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    // Manual redirect following with hop limit and SSRF validation per hop
    let response;
    let currentUrl = url;
    for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
      // Block private/internal addresses (SSRF), re-checked on every hop
      const hostError = await checkHost(new URL(currentUrl).hostname);
      if (hostError) {
        return res.status(400).json({ error: hops === 0 ? hostError : 'Redirect to private/internal address blocked' });
      }

      response = await get(new URL(currentUrl), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Commonplace/1.0 (quote-collector)',
          'Accept': 'text/html, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      if (![301, 302, 303, 307, 308].includes(response.statusCode)) break;

      const location = response.headers.location;
      response.resume(); // discard the redirect's body so the socket is freed
      if (!location) break;

      const redirectUrl = new URL(location, currentUrl);
      if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
        return res.status(400).json({ error: 'Redirect to unsupported protocol' });
      }

      currentUrl = redirectUrl.href;

      if (hops === MAX_REDIRECTS) {
        return res.status(400).json({ error: 'Too many redirects' });
      }
    }

    const status = response.statusCode;
    if (status < 200 || status > 299) {
      response.resume();
      return res.status(502).json({ error: `Failed to fetch URL (${status})` });
    }

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/') && !contentType.includes('application/json')) {
      response.destroy();
      return res.status(400).json({ error: 'URL does not return text content' });
    }

    // Some responses (e.g. 204 No Content) have no body to stream
    if (status === 204 || status === 205) {
      return res.status(400).json({ error: 'URL returned no content' });
    }

    // Stream-read with size cap to prevent memory exhaustion from huge responses
    const chunks = [];
    let totalBytes = 0;
    const body = decodedBody(response);
    for await (const chunk of body) {
      totalBytes += chunk.length;
      if (totalBytes > MAX_CONTENT_LENGTH) {
        body.destroy();
        response.destroy();
        return res.status(400).json({ error: 'Page content is too large' });
      }
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf-8');

    // Extract text from HTML based on extractMode
    let extracted;
    if (contentType.includes('text/html')) {
      extracted = extractByMode(text, extractMode);
    } else {
      extracted = text;
    }

    // Split into lines, clean up
    const minLen = extractMode === 'headings' ? 2 : 5;
    const lines = extracted
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > minLen && l.length < 2000);

    return res.status(200).json({
      lines: lines.slice(0, 500), // cap at 500 lines
      total: lines.length,
      title: extractTitle(text, contentType),
      extractMode,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'URL took too long to respond' });
    }
    // pinnedLookup refused the address at connect time (e.g. DNS rebinding)
    if (err.code === 'EPRIVATEHOST') {
      return res.status(400).json({ error: PRIVATE_HOST_ERROR });
    }
    console.error('fetch-url error:', err?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to fetch URL' });
  } finally {
    clearTimeout(timeout);
  }
}, {
  rateLimit: RATE_LIMITS.FETCH_URL,
});

function extractByMode(html, mode) {
  switch (mode) {
    case 'quotes':
      return extractQuotes(html);
    case 'main':
      return extractMainContent(html);
    case 'headings':
      return extractHeadings(html);
    default:
      return htmlToText(html);
  }
}

function extractQuotes(html) {
  const quotes = [];

  // Extract <blockquote> content
  const bqMatches = html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi);
  for (const m of bqMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 5) quotes.push(text);
  }

  // Extract <q> tag content
  const qMatches = html.matchAll(/<q[^>]*>([\s\S]*?)<\/q>/gi);
  for (const m of qMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 5) quotes.push(text);
  }

  // Extract text in quotation marks from paragraphs (curly and straight quotes)
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const quotePatterns = [
    /\u201C([^\u201D]{10,500})\u201D/g,  // curly double quotes
    /\u2018([^\u2019]{10,500})\u2019/g,  // curly single quotes
    /"([^"]{10,500})"/g,                  // straight double quotes
  ];
  for (const pat of quotePatterns) {
    const matches = stripTags(body).matchAll(pat);
    for (const m of matches) {
      const text = m[1].trim();
      if (text.length > 10 && !quotes.includes(text)) quotes.push(text);
    }
  }

  return quotes.join('\n');
}

function extractMainContent(html) {
  // Remove non-content elements
  const t = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '');

  // Try to find <article> or <main> content first
  const articleMatch = t.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || t.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  const source = articleMatch ? articleMatch[1] : t;

  // Extract only paragraph and heading content
  const blocks = [];
  const blockPattern = /<(p|h[1-6]|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = blockPattern.exec(source)) !== null) {
    const text = stripTags(match[2]).trim();
    if (text.length > 20) blocks.push(text);
  }

  // If we found meaningful blocks, use them; otherwise fall back to full text
  if (blocks.length > 3) return blocks.join('\n');
  return htmlToText(html);
}

function extractHeadings(html) {
  const headings = [];
  const hPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = hPattern.exec(html)) !== null) {
    const level = match[1];
    const text = stripTags(match[2]).trim();
    if (text.length > 0) {
      headings.push(`${'#'.repeat(Number(level))} ${text}`);
    }
  }
  return headings.join('\n');
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function htmlToText(html) {
  // Remove script/style/head content
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');

  // Convert block elements to newlines
  t = t.replace(/<\/(p|div|li|h[1-6]|tr|br|blockquote)>/gi, '\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining tags
  t = t.replace(/<[^>]+>/g, ' ');

  // Decode common entities
  t = t.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');

  // Clean up whitespace
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n\s*\n/g, '\n');

  return t.trim();
}

function extractTitle(text, contentType) {
  if (!contentType.includes('text/html')) return null;
  const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim().slice(0, 200) : null;
}
