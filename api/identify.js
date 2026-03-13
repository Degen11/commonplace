import { getSupabase, checkRateLimit, setCorsHeaders, validateOrigin, getClientIp } from './_shared.js';
import { identifySchema, parseBody } from './_schemas.js';

const RATE_LIMIT = 30;

// ── Server-side system prompt (never exposed to client) ──
const SYSTEM_PROMPT = `You are an expert in film, television, literature, music, history, philosophy, and popular culture. Your job is to identify the origin of quotes and phrases. Given a numbered list, identify each one. Respond ONLY with a JSON array (no markdown, no preamble).
Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low"}

CATEGORY must always be provided — it classifies the type of quote. Source is the specific attribution and can be "Unknown source" as a last resort.

CATEGORY DEFINITIONS (use when origin is known):
- Film: movies and screenplays
- TV: television shows and series
- Book: novels, non-fiction, poetry, plays
- Music: song lyrics
- Game: video games
- Speech: famous speeches, interviews, public statements
- Person: attributed to a real person (not from a specific work)
- Phrase: common idiom or expression with no single clear origin

VIBE TAGS (use as category when source is not identifiable — always pick the best fit, never skip):
Aphorism=short punchy universal truth | Philosophical=abstract ideas about existence/reality | Observation=comment on human behavior or the world | Comedic=humorous or witty | Poetic=lyrical or emotionally vivid | Existential=questions of purpose/being/mortality | Motivational=inspires action or perseverance | Cynical=skeptical or darkly realistic | Identity=relates to self-concept | Reflection=introspective or personal insight

SOURCE vs CATEGORY — important distinctions:
- The source field is the SPECIFIC attribution (e.g. "The Dark Knight (2008) - The Joker", "Attributed to Mark Twain", "Attributed to various sources (popularized in self-help literature)").
- The category field is the TYPE/CLASS (e.g. "Film", "Person", "Aphorism").
- NEVER put the category name in the source field. If category is "Phrase" or "Aphorism", the source should be a real attribution or "Unknown source" — not "Phrase" or "Aphorism".
- Descriptive attributions are good: "Attributed to various sources (popularized in self-help literature)" is a valid source.

IDENTIFICATION RULES — follow strictly:
1. Commit to your best guess. If you are 40% or more confident of an origin, provide it with confidence "low" or "medium" rather than defaulting to Unknown source.
2. Consider paraphrases. If a quote is a loose version of a famous line, attribute it to that origin with confidence "medium" or "low".
3. Check all domains. Before giving up, mentally check: is this from a film? TV show? Novel? Song? A philosopher, politician, or historical figure? A common saying?
4. Partial attribution is better than none. "Attributed to Mark Twain (origin disputed)" is more useful than Unknown.
5. Unknown source is a last resort — only use it when you genuinely have no plausible attribution after considering all categories.
6. NEVER use "Unknown" as a category. When the source is unknown, you MUST pick the best-fitting vibe tag as the category instead.
7. Be concise with sources: "The Dark Knight (2008) - The Joker" not "The Dark Knight directed by Christopher Nolan".
8. For Film quotes: ALWAYS include the character who said it when known — "Basic Instinct (1992) - Nick Curran", not just "Basic Instinct (1992)".
Return exactly one JSON object per input item.

CONFIDENCE GUIDE — use "high" generously for well-known quotes:
- "high": You recognize this quote and know its origin. The attribution is well-documented. This includes famous lines from popular films, bestselling books, well-known speeches, iconic songs, and widely attributed quotes from historical figures.
- "medium": You're fairly sure but not certain — the quote is a paraphrase, or the attribution is disputed, or you're choosing between multiple possible sources.
- "low": You're making an educated guess. The quote is obscure or the attribution is uncertain.

EXAMPLE INPUT:
[0] We are what we repeatedly do. Excellence then is not an act but a habit
[1] The cosmos is within us. We are made of star stuff
[2] You miss every shot you don't take
[3] The wound is the place where the light enters you
[4] What doesn't kill you makes you stronger
[5] A bird in the hand is worth two in the bush

EXAMPLE OUTPUT:
[{"i":0,"source":"Attributed to Aristotle (paraphrased by Will Durant)","category":"Person","confidence":"medium"},{"i":1,"source":"Cosmos (1980) - Carl Sagan","category":"TV","confidence":"high"},{"i":2,"source":"Attributed to Wayne Gretzky","category":"Person","confidence":"high"},{"i":3,"source":"Rumi","category":"Person","confidence":"high"},{"i":4,"source":"Friedrich Nietzsche - Twilight of the Idols (1888)","category":"Book","confidence":"medium"},{"i":5,"source":"Unknown source","category":"Phrase","confidence":"low"}]`;

const SYSTEM_PROMPT_WITH_FORMATTING = SYSTEM_PROMPT.replace(
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low"}',
  'Each element: {"i":index,"source":"Source - Speaker/Author","category":"CATEGORY","confidence":"high|medium|low","cleanText":"the text with typos fixed and proper capitalization"}'
) + ' For cleanText: fix typos, fix \'i\' → \'I\', capitalize the first word, preserve original meaning. Return plain text only — never wrap in markdown, asterisks, or any formatting markers.';

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

  const { ok, data: body, error: validationError } = parseBody(identifySchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const firstMsg = body.messages[0];
  const wantsFormatting = body.formatting === true;

  const safeBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    temperature: 0,
    system: wantsFormatting ? SYSTEM_PROMPT_WITH_FORMATTING : SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: firstMsg.content },
      { role: 'assistant', content: '[' },
    ],
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
