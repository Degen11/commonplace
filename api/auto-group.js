import { getSupabase, checkRateLimit, setCorsHeaders, validateOrigin, getClientIp } from './_shared.js';

const RATE_LIMIT = 15; // stricter than identify — AI grouping is heavier use

const SYSTEM_PROMPT = `You filter quotes by theme. Given a theme and numbered quotes, return a JSON array of matching indices. Example: [0,3,7]
Rules:
- Include quotes that clearly match the theme (direct or strong thematic connection)
- Return [] if nothing matches
- Return ONLY the JSON array, nothing else`;

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Service not configured' });
  if (!validateOrigin(req)) return res.status(403).json({ error: 'Forbidden' });

  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) return res.status(415).json({ error: 'Content-Type must be application/json' });
  if (!req.headers['x-requested-with']) return res.status(403).json({ error: 'Forbidden' });

  const supabase = getSupabase();
  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }

  const { theme, quotes } = req.body || {};

  if (!theme || typeof theme !== 'string' || theme.length > 200) {
    return res.status(400).json({ error: 'Invalid theme (string, max 200 chars)' });
  }
  if (!Array.isArray(quotes) || quotes.length === 0 || quotes.length > 500) {
    return res.status(400).json({ error: 'Invalid quotes array (1-500 items)' });
  }

  // Build compact quote list — index + truncated text to minimize tokens
  const quotesBlock = quotes
    .map((q, i) => `[${i}] ${q.length > 100 ? q.slice(0, 100) + '…' : q}`)
    .join('\n');

  const userContent = `Theme: "${theme}"\n\nQuotes:\n${quotesBlock}`;

  // Guard total input size
  if (userContent.length > 60000) {
    return res.status(400).json({ error: 'Input too large. Try with fewer quotes.' });
  }

  const safeBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024, // indices only — very small output
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(safeBody),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const text = (data.content || []).map(x => x.text || '').join('');
    const raw = text.replace(/```json|```/g, '').trim();

    let indices;
    try {
      indices = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid response. Please try again.' });
    }

    if (!Array.isArray(indices) || !indices.every(i => Number.isInteger(i) && i >= 0 && i < quotes.length)) {
      return res.status(502).json({ error: 'AI returned invalid indices. Please try again.' });
    }

    return res.status(200).json({ indices });
  } catch (error) {
    console.error('Auto-group API error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to reach AI service' });
  }
}
