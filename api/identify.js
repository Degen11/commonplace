import { withApiHandler, callAnthropic, checkAiDailyCap, normalizeForCache, ANTHROPIC, RATE_LIMITS, ERROR_MESSAGES } from './_shared.js';
import { identifySchema, parseBody } from './_schemas.js';

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
9. Some inputs carry a parenthetical note like "(unverified match found online: "X" as CATEGORY — confirm if correct, or give the correct source/category if not)". This is only a candidate lead from an automated search, not a confirmed fact. Evaluate it against your own knowledge: if you recognize the quote and the given source/category checks out, use it (confidence "high" or "medium" as appropriate); if you know a better or more accurate attribution, use that instead and disregard the suggestion; if you don't recognize the quote at all, treat it exactly as you would any other unknown quote — don't default to repeating the suggestion just because it's there.
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

const MAX_CONTENT_CHARS = 10000;
const UNKNOWN_SOURCE = 'Unknown source';

// Same numbered-list format the client used to build before the prompt moved
// server-side.
function buildPrompt(items) {
  const block = items.map((it, i) => {
    const hintStr = it.hint ? ` (attributed to: ${it.hint})` : '';
    const candidateStr = it.candidate
      ? ` (unverified match found online: "${it.candidate.source}" as ${it.candidate.category} — confirm if correct, or give the correct source/category if not)`
      : '';
    return `[${i}] ${it.text}${hintStr}${candidateStr}`;
  }).join('\n');
  return `Identify these:\n${block}`;
}

// Parse the model's JSON array (the response continues the '[' prefill).
function parseResults(data) {
  const raw = data.content.map(x => x.text || '').join('').replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(raw.startsWith('[') ? raw : '[' + raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Cache identified sources so the same quote never costs tokens twice. Written
// here from the model's own answer rather than accepted from the browser, so
// clients can't plant arbitrary attributions for every other user. Existing
// high-confidence rows are never overwritten.
async function cacheResults(items, results, supabase) {
  if (!supabase) return;
  const rows = new Map();
  for (const r of results) {
    const item = Number.isInteger(r?.i) ? items[r.i] : null;
    if (!item || typeof r.source !== 'string' || !r.source || r.source === UNKNOWN_SOURCE) continue;
    if (r.confidence !== 'high' && r.confidence !== 'medium') continue;
    const normalized = normalizeForCache(item.text);
    if (normalized.length <= 5) continue;
    rows.set(normalized, {
      normalized_text: normalized,
      source: r.source.slice(0, 500),
      category: (typeof r.category === 'string' && r.category ? r.category : 'Reflection').slice(0, 100),
      confidence: r.confidence,
      updated_at: new Date().toISOString(),
    });
  }
  if (rows.size === 0) return;
  try {
    const { data: locked } = await supabase
      .from('quote_cache')
      .select('normalized_text')
      .in('normalized_text', [...rows.keys()])
      .eq('confidence', 'high');
    for (const row of locked || []) rows.delete(row.normalized_text);
    if (rows.size === 0) return;
    await supabase.from('quote_cache').upsert([...rows.values()], { onConflict: 'normalized_text' });
  } catch {
    // Cache write failure is non-critical
  }
}

export default withApiHandler(async (req, res, { supabase }) => {
  const { ok, data: body, error: validationError } = parseBody(identifySchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const content = body.items ? buildPrompt(body.items) : body.messages[0].content;
  if (content.length > MAX_CONTENT_CHARS) {
    return res.status(400).json({ error: 'Input too large. Send fewer quotes per batch.' });
  }
  const wantsFormatting = body.formatting === true;

  if (!(await checkAiDailyCap(supabase))) {
    return res.status(429).json({ error: ERROR_MESSAGES.AI_DAILY_LIMIT });
  }

  const safeBody = {
    model: ANTHROPIC.MODEL,
    // 10 quotes (≤10k chars in) with cleanText echoed back fit well within this
    max_tokens: 4096,
    temperature: 0,
    system: wantsFormatting ? SYSTEM_PROMPT_WITH_FORMATTING : SYSTEM_PROMPT,
    messages: [
      { role: 'user', content },
      { role: 'assistant', content: '[' },
    ],
  };

  const result = await callAnthropic(safeBody);
  if (!result.ok) return res.status(result.status).json({ error: result.error });

  const data = result.data;

  // Validate response structure before proxying to client
  if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
    console.error('Anthropic returned unexpected structure:', JSON.stringify(data).slice(0, 200));
    return res.status(502).json({ error: 'AI returned an unexpected response format. Please try again.' });
  }

  if (body.items) await cacheResults(body.items, parseResults(data), supabase);

  return res.status(200).json(data);
}, {
  rateLimit: RATE_LIMITS.IDENTIFY,
  requireAnthropicKey: true,
});
