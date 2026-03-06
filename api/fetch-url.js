import { setCorsHeaders, validateOrigin, getClientIp, getSupabase, checkRateLimit } from './_shared.js';

const RATE_LIMIT = 15; // per minute
const MAX_CONTENT_LENGTH = 500_000; // 500KB text limit
const FETCH_TIMEOUT = 10_000; // 10s

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!validateOrigin(req)) return res.status(403).json({ error: 'Forbidden' });

  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) return res.status(415).json({ error: 'Content-Type must be application/json' });
  if (!req.headers['x-requested-with']) return res.status(403).json({ error: 'Forbidden' });

  const supabase = getSupabase();
  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Commonplace/1.0 (quote-collector)',
        'Accept': 'text/html, text/plain, */*',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);

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

    // Extract text from HTML by stripping tags
    let extracted;
    if (contentType.includes('text/html')) {
      extracted = htmlToText(text);
    } else {
      extracted = text;
    }

    // Split into lines, clean up
    const lines = extracted
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5 && l.length < 2000);

    return res.status(200).json({
      lines: lines.slice(0, 500), // cap at 500 lines
      total: lines.length,
      title: extractTitle(text, contentType),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'URL took too long to respond' });
    }
    console.error('fetch-url error:', err?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to fetch URL' });
  }
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
