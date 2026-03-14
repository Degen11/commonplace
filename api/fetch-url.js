import { withApiHandler, RATE_LIMITS } from './_shared.js';
import { fetchUrlSchema, parseBody } from './_schemas.js';

const MAX_CONTENT_LENGTH = 500_000; // 500KB text limit
const FETCH_TIMEOUT = 10_000; // 10s

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
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Commonplace/1.0 (quote-collector)',
        'Accept': 'text/html, text/plain, */*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL (${response.status})` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/') && !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'URL does not return text content' });
    }

    const text = await response.text();
    if (text.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: 'Page content is too large' });
    }

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
  let t = html
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
