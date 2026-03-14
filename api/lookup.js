import { withApiHandler, normalizeForCache, RATE_LIMITS } from './_shared.js';
import { lookupSchema, parseBody } from './_schemas.js';

// ── Wikiquote search ──
// Uses MediaWiki API to search for quote text and find the page (author/source) it appears on
async function searchWikiquote(text) {
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

    // Check snippet actually contains meaningful overlap with our quote
    const snippet = (results[0].snippet || '').replace(/<[^>]*>/g, '').toLowerCase();
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => snippet.includes(w)).length;
    if (matchCount < Math.min(3, words.length * 0.3)) return null;

    // Strong overlap = high confidence (most words matched in snippet)
    const matchRatio = words.length > 0 ? matchCount / words.length : 0;
    const confidence = matchRatio >= 0.6 ? 'high' : 'medium';

    return { source: title, platform: 'wikiquote', confidence };
  } catch {
    return null;
  }
}

// ── Open Library search (books) ──
// Searches Open Library for book/author when hint suggests literary content
async function searchOpenLibrary(hint) {
  if (!hint) return null;

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(hint)}&limit=3&fields=title,author_name,first_publish_year`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.docs?.length) return null;

    const book = data.docs[0];
    const author = book.author_name?.[0] || '';
    const year = book.first_publish_year ? ` (${book.first_publish_year})` : '';
    const source = author ? `${book.title}${year} - ${author}` : `${book.title}${year}`;
    return { source, category: 'Book', platform: 'openlibrary', confidence: author ? 'high' : 'medium' };
  } catch {
    return null;
  }
}

// ── Supabase quote cache ──
async function checkCache(normalizedText, supabase) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('quote_cache')
      .select('source, category, confidence')
      .eq('normalized_text', normalizedText)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
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
function inferCategory(source) {
  if (!source) return 'Reflection';
  const s = source.toLowerCase();
  // Explicit type annotations from Wikiquote disambiguation
  if (/\(\d{4}\s*film\)/.test(s) || /\(film\)/.test(s)) return 'Film';
  if (/\(tv series\)|\(television\)|\(tv\)/.test(s)) return 'TV';
  if (/\(video game\)|\(game\)/.test(s)) return 'Game';
  if (/\(novel\)|\(book\)|\(play\)|\(poem\)/.test(s)) return 'Book';
  if (/\(song\)|\(album\)|\(musical\)/.test(s)) return 'Music';
  // Wikiquote pages for shows, tours, specials
  if (/\b(show|tour|series|season|episode|sitcom|comedy special)\b/.test(s)) return 'TV';
  // Title with year but no explicit type — likely Film (most common on Wikiquote)
  if (/\(\d{4}\)/.test(s)) return 'Film';
  // Anything else that slips through — don't guess
  return 'Reflection';
}

export default withApiHandler(async (req, res, { supabase }) => {
  const { ok, data: body, error: validationError } = parseBody(lookupSchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const results = await Promise.all(body.quotes.map(async (q, i) => {
    const { text, hint } = q;
    if (!text) return { i, found: false };

    const norm = normalizeForCache(text);

    // 1. Check cache first
    const cached = await checkCache(norm, supabase);
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
        category: best.category || inferCategory(best.source),
        confidence: best.confidence || 'medium',
      };
      // Cache high-confidence results so the same quote doesn't re-hit external APIs
      if (result.confidence === 'high') {
        writeCache(norm, result.source, result.category, result.confidence, supabase);
      }
      return { i, found: true, ...result, platform: best.platform };
    }

    return { i, found: false };
  }));

  return res.status(200).json({ results });
}, {
  rateLimit: RATE_LIMITS.LOOKUP,
  requireJson: false,
});
