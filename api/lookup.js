import { withApiHandler, normalizeForCache, RATE_LIMITS } from './_shared.js';
import { lookupSchema, parseBody } from './_schemas.js';

// Grammatical stop words to ignore when measuring overlap between our quote
// and a search snippet. Without this, two unrelated quotes that both happen
// to use "the," "that," or "with" can look like they overlap.
const LOOKUP_STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but',
  'with', 'from', 'by', 'as', 'is', 'was', 'are', 'be', 'been', 'has',
  'have', 'had', 'it', 'its', 'this', 'that', 'these', 'those', 'my', 'his',
  'her', 'our', 'your', 'not', 'all', 'one', 'two', 'other', 'each', 'some',
  'than', 'then', 'there', 'when', 'while', 'after', 'before', 'until',
  'since', 'into', 'about', 'over', 'under', 'through', 'between',
  'without', 'within', 'who', 'what', 'why', 'how', 'them', 'they', 'him',
  'she', 'he', 'we', 'you', 'come',
]);

// ── Wikiquote search ──
// Uses MediaWiki API to search for quote text and find the page (author/source) it appears on
export async function searchWikiquote(text) {
  const query = text.slice(0, 120);
  const url = `https://en.wikiquote.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=0&srlimit=3&format=json&origin=*`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Commonplace/1.0 (https://commonplace.pro)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const results = data?.query?.search;
    if (!results || results.length === 0) return null;

    // The page title is typically the author or source name
    const title = results[0].title;
    if (!title) return null;

    // Only accept titles that look like actual attributable sources.
    // Wikiquote has concept pages ("Consciousness"), date pages ("August 4"),
    // and theme pages that are useless as attributions.
    // Person names can't be reliably distinguished from work titles
    // (e.g. "Basic Instinct" looks like "First Last"), so we only accept
    // titled works with years and let the AI handle person attributions.
    const hasYear = /\(\d{4}/.test(title);
    if (!hasYear) return null;

    // Check real overlap between our quote and the snippet. Both sides are
    // normalized the same way (punctuation/case stripped) and stop words are
    // dropped so two unrelated quotes can't "match" on generic words like
    // "the," "life," or "find" — a bare word count was too easy to satisfy
    // by coincidence and let a wrong page through as a confident match.
    const snippet = normalizeForCache((results[0].snippet || '').replace(/<[^>]*>/g, ''));
    const meaningfulWords = [...new Set(
      normalizeForCache(text).split(' ').filter(w => w.length > 3 && !LOOKUP_STOP_WORDS.has(w))
    )];
    const matchCount = meaningfulWords.filter(w => snippet.includes(w)).length;
    const matchRatio = meaningfulWords.length > 0 ? matchCount / meaningfulWords.length : 0;
    // Require real majority overlap, not just a handful of shared words
    if (matchCount < 2 || matchRatio < 0.5) return null;

    const { category, certain } = inferCategory(title);
    // Only "high" when the text overlap is strong AND the category wasn't a guess —
    // otherwise this is a plausible lead, not a confirmed match, and should be
    // checked by the AI identification step rather than accepted outright.
    const confidence = (matchRatio >= 0.7 && certain) ? 'high' : 'medium';

    return { source: title, category, platform: 'wikiquote', confidence };
  } catch {
    return null;
  }
}

// ── Open Library search (books) ──
// Searches Open Library for book/author when hint suggests literary content
export async function searchOpenLibrary(hint) {
  if (!hint) return null;

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(hint)}&limit=3&fields=title,author_name,first_publish_year`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.docs?.length) return null;

    const book = data.docs[0];
    if (!book.title) return null;

    // Make sure the top hit is actually related to the hint — Open Library's
    // search is lenient and will happily return its best-effort guess for a
    // loosely related or generic query, not just a real match.
    const hintWords = normalizeForCache(hint).split(' ').filter(w => w.length > 2);
    const titleNorm = normalizeForCache(book.title);
    const titleOverlap = hintWords.filter(w => titleNorm.includes(w)).length;
    if (hintWords.length > 0 && titleOverlap / hintWords.length < 0.5) return null;

    const author = book.author_name?.[0] || '';
    const year = book.first_publish_year ? ` (${book.first_publish_year})` : '';
    const source = author ? `${book.title}${year} - ${author}` : `${book.title}${year}`;
    // Open Library can confirm a book/author exists, but has no full-text
    // search to confirm this exact quote is actually in it — so this is
    // always a lead for the AI to confirm, never a confident match on its own.
    return { source, category: 'Book', platform: 'openlibrary', confidence: 'medium' };
  } catch {
    return null;
  }
}

// ── Supabase quote cache ──
// One batched query for all quotes in the request (up to 20) instead of
// one round trip per quote. Returns Map<normalized_text, cache row>.
async function checkCacheBatch(normalizedTexts, supabase) {
  if (!supabase || normalizedTexts.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from('quote_cache')
      .select('normalized_text, source, category, confidence')
      .in('normalized_text', normalizedTexts);
    if (error || !data) return new Map();
    return new Map(data.map(r => [
      r.normalized_text,
      { source: r.source, category: r.category, confidence: r.confidence },
    ]));
  } catch {
    return new Map();
  }
}

async function writeCache(normalizedText, source, category, confidence, supabase) {
  if (!supabase) return;
  try {
    await supabase
      .from('quote_cache')
      .upsert({
        normalized_text: normalizedText,
        source,
        category,
        confidence,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'normalized_text' });
  } catch {
    // Cache write failure is non-critical
  }
}

// Infer category from a Wikiquote page title (which has no category metadata).
// Since the Wikiquote whitelist only accepts titles with years, this mostly
// sees patterns like "Title (YYYY)", "Title (YYYY film)", etc.
// Returns `certain: false` when the category is a guess rather than backed by
// an explicit type annotation — callers use this to avoid treating a guessed
// category as a confirmed match. Note a birth-death range like "(1926-2022)"
// doesn't match the bare "(YYYY)" pattern below (it has trailing digits before
// the close-paren), so it falls all the way through to the uncertain default
// rather than being guessed as a Film.
export function inferCategory(source) {
  if (!source) return { category: 'Reflection', certain: false };
  const s = source.toLowerCase();
  // Explicit type annotations from Wikiquote disambiguation
  if (/\(\d{4}\s*film\)/.test(s) || /\(film\)/.test(s)) return { category: 'Film', certain: true };
  if (/\(tv series\)|\(television\)|\(tv\)/.test(s)) return { category: 'TV', certain: true };
  if (/\(video game\)|\(game\)/.test(s)) return { category: 'Game', certain: true };
  if (/\(novel\)|\(book\)|\(play\)|\(poem\)/.test(s)) return { category: 'Book', certain: true };
  if (/\(song\)|\(album\)|\(musical\)/.test(s)) return { category: 'Music', certain: true };
  // Wikiquote pages for shows, tours, specials
  if (/\b(show|tour|series|season|episode|sitcom|comedy special)\b/.test(s)) return { category: 'TV', certain: true };
  // Title with year but no explicit type — likely Film (most common on Wikiquote),
  // but it's a guess, not a confirmed type
  if (/\(\d{4}\)/.test(s)) return { category: 'Film', certain: false };
  // Anything else that slips through — don't guess
  return { category: 'Reflection', certain: false };
}

export default withApiHandler(async (req, res, { supabase }) => {
  const { ok, data: body, error: validationError } = parseBody(lookupSchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  // 1. Check cache for all quotes in one query
  const norms = body.quotes.map(q => (q.text ? normalizeForCache(q.text) : null));
  const cacheHits = await checkCacheBatch(norms.filter(Boolean), supabase);

  const results = await Promise.all(body.quotes.map(async (q, i) => {
    const { text, hint } = q;
    if (!text) return { i, found: false };

    const norm = norms[i];
    const cached = cacheHits.get(norm);
    if (cached) {
      return { i, found: true, ...cached, platform: 'cache' };
    }

    // 2. Search Wikiquote and Open Library in parallel
    const [wiki, openLib] = await Promise.all([
      searchWikiquote(text),
      hint ? searchOpenLibrary(hint) : null,
    ]);

    // Pick best result: OpenLib (specific) > Wikiquote (general)
    const best = openLib || wiki;
    if (best) {
      const result = {
        source: best.source,
        category: best.category || 'Reflection',
        confidence: best.confidence || 'medium',
      };
      // Cache results so the same quote doesn't re-hit external APIs
      if (result.confidence === 'high' || result.confidence === 'medium') {
        writeCache(norm, result.source, result.category, result.confidence, supabase);
      }
      return { i, found: true, ...result, platform: best.platform };
    }

    return { i, found: false };
  }));

  return res.status(200).json({ results });
}, {
  rateLimit: RATE_LIMITS.LOOKUP,
});
