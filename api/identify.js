// Allowed origins — add your production domain and local dev
const ALLOWED_ORIGINS = [
  'https://commonplace.pro',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

// Simple in-memory rate limiter
// NOTE: This resets on every Vercel cold start and does NOT reliably
// persist across invocations. For real protection, use Vercel KV or
// Upstash Redis. Kept here as a minimal speed bump only.
const rateMap = new Map();
const RATE_LIMIT = 30; // max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();

  // On-demand cleanup of stale entries
  for (const [key, entry] of rateMap) {
    if (now - entry.start > RATE_WINDOW * 2) {
      rateMap.delete(key);
    }
  }

  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

// ── Helper: set CORS headers for allowed origins ──
function setCorsHeaders(req, res) {
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ── Server-side system prompt (never exposed to client) ──
const SYSTEM_PROMPT = `You are an expert in film, television, literature, music, history, philosophy, and popular culture. Your job is to identify the origin of quotes and phrases. Given a numbered list, identify each one. Respond ONLY with a JSON array (no markdown, no preamble).
Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low"}

CATEGORY DEFINITIONS:
- Film: movies and screenplays
- TV: television shows and series
- Book: novels, non-fiction, poetry, plays
- Music: song lyrics
- Speech: famous speeches, interviews, public statements
- Person: attributed to a real person (not from a specific work)
- Phrase: common idiom or expression with no single clear origin

VIBE TAGS (use when source is not identifiable — always pick the best fit, never skip):
Aphorism=short punchy universal truth | Philosophical=abstract ideas about existence/reality | Observation=comment on human behavior or the world | Comedic=humorous or witty | Poetic=lyrical or emotionally vivid | Existential=questions of purpose/being/mortality | Motivational=inspires action or perseverance | Cynical=skeptical or darkly realistic | Identity=relates to self-concept | Reflection=introspective or personal insight

IDENTIFICATION RULES — follow strictly:
1. Commit to your best guess. If you are 40% or more confident of an origin, provide it with confidence "low" or "medium" rather than defaulting to Unknown source.
2. Consider paraphrases. If a quote is a loose version of a famous line, attribute it to that origin with confidence "medium" or "low".
3. Check all domains. Before giving up, mentally check: is this from a film? TV show? Novel? Song? A philosopher, politician, or historical figure? A common saying?
4. Partial attribution is better than none. "Attributed to Mark Twain (origin disputed)" is more useful than Unknown.
5. Unknown source is a last resort — only use it when you genuinely have no plausible attribution after considering all categories.
6. Always assign a vibe tag as the category whenever source is Unknown. category="Unknown" with no vibe tag is never acceptable.
7. Be concise with sources: "The Dark Knight (2008) - The Joker" not "The Dark Knight directed by Christopher Nolan".
Return exactly one JSON object per input item.`;

// Same prompt but with the cleanText field for formatting mode
const SYSTEM_PROMPT_WITH_FORMATTING = SYSTEM_PROMPT.replace(
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low"}',
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low","cleanText":"the text with typos fixed and proper capitalization"}'
) + ' For cleanText: fix typos, fix \'i\' → \'I\', capitalize the first word, preserve original meaning.';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Service not configured' });
  }

  // ── Origin validation ──
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── Content-Type validation ──
  // Requiring application/json prevents simple form-encoded CSRF
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  // ── Custom header check (lightweight CSRF mitigation) ──
  // Browsers cannot send custom headers in simple requests without preflight
  if (!req.headers['x-requested-with']) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }

  // Validate the request body
  const body = req.body;
  if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  // Validate the first message structure
  const firstMsg = body.messages[0];
  if (!firstMsg || firstMsg.role !== 'user' || typeof firstMsg.content !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  // Limit input size to prevent abuse
  if (firstMsg.content.length > 10000) {
    return res.status(400).json({ error: 'Input too large. Send fewer quotes per batch.' });
  }

  // ── Detect if client wants formatting mode ──
  // The client sends a boolean flag; we pick the right server-side prompt.
  const wantsFormatting = body.formatting === true;

  // ── Build safe request — all LLM parameters controlled server-side ──
  const safeBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: wantsFormatting ? SYSTEM_PROMPT_WITH_FORMATTING : SYSTEM_PROMPT,
    messages: [{ role: 'user', content: firstMsg.content }],
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(safeBody)
    });

    if (!response.ok) {
      // Log status only — avoid logging full upstream response body
      console.error('Anthropic API error:', response.status);

      // Return generic error to client — never forward upstream details
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    // Log error name/message only — avoid logging stack traces or request details
    console.error('API proxy error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to reach AI service' });
  }
}
