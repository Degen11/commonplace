import { getSupabase, checkRateLimit, setCorsHeaders, validateOrigin, getClientIp } from './_shared.js';

const RATE_LIMIT = 30;

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
Return exactly one JSON object per input item.

EXAMPLE INPUT:
[0] You can't handle the truth
[1] The only limit to our realization of tomorrow is our doubts of today
[2] Winter is coming

EXAMPLE OUTPUT:
[{"i":0,"source":"A Few Good Men (1992) - Col. Jessup","category":"Film","confidence":"high"},{"i":1,"source":"Franklin D. Roosevelt","category":"Person","confidence":"medium"},{"i":2,"source":"Game of Thrones (2011) - House Stark","category":"TV","confidence":"high"}]`;

const SYSTEM_PROMPT_WITH_FORMATTING = SYSTEM_PROMPT.replace(
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low"}',
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low","cleanText":"the text with typos fixed and proper capitalization"}'
) + ' For cleanText: fix typos, fix \'i\' → \'I\', capitalize the first word, preserve original meaning.';

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

  const body = req.body;
  if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const firstMsg = body.messages[0];
  if (!firstMsg || firstMsg.role !== 'user' || typeof firstMsg.content !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  if (firstMsg.content.length > 10000) {
    return res.status(400).json({ error: 'Input too large. Send fewer quotes per batch.' });
  }

  const wantsFormatting = body.formatting === true;

  const safeBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    temperature: 0,
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
      console.error('Anthropic API error:', response.status);
      if (response.status === 429) {
        return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment and try again.' });
      }
      if (response.status === 401) {
        return res.status(502).json({ error: 'AI authentication failed. Please contact support.' });
      }
      if (response.status === 529 || response.status === 503) {
        return res.status(503).json({ error: 'AI service is overloaded. Please try again shortly.' });
      }
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('API proxy error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to reach AI service' });
  }
}
