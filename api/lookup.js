import { setCorsHeaders, validateOrigin, getClientIp, checkRateLimit, getSupabase } from './_shared.js';

const RATE_LIMIT = 60;

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

    // Check snippet actually contains meaningful overlap with our quote
    const snippet = (results[0].snippet || '').replace(/<[^>]*>/g, '').toLowerCase();
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => snippet.includes(w)).length;
    if (matchCount < Math.min(3, words.length * 0.3)) return null;

    return { source: title, platform: 'wikiquote' };
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
    return { source, category: 'Book', platform: 'openlibrary' };
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

// Infer category from a Wikiquote page title (which has no category metadata)
function inferCategory(source) {
  if (!source) return 'Person';
  const s = source.toLowerCase();
  // Film/TV patterns: "Title (YYYY film)", "Title (film)", "Title (YYYY)"
  if (/\(\d{4}\s*film\)/.test(s) || /\(film\)/.test(s)) return 'Film';
  if (/\(tv series\)|\(television\)|\(tv\)/.test(s)) return 'TV';
  // Wikiquote pages for shows, tours, specials
  if (/\b(show|tour|series|season|episode|sitcom|comedy special)\b/.test(s)) return 'TV';
  // If it has a year in parens and no person-like name, likely Film/TV
  if (/\(\d{4}\)/.test(s) && /\s/.test(source.replace(/\(\d{4}\)/, '').trim())) return 'Film';
  return 'Person';
}

function normalizeForCache(text) {
  return (text || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!validateOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  if (!req.headers['x-requested-with']) return res.status(403).json({ error: 'Forbidden' });

  const supabase = getSupabase();
  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { quotes } = req.body || {};
  if (!Array.isArray(quotes) || quotes.length === 0 || quotes.length > 20) {
    return res.status(400).json({ error: 'Invalid quotes array (1-20 items)' });
  }

  const results = await Promise.all(quotes.map(async (q, i) => {
    const text = typeof q.text === 'string' ? q.text : '';
    const hint = typeof q.hint === 'string' ? q.hint : null;
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
        confidence: 'medium',
      };
      // Cache for next time
      writeCache(norm, result.source, result.category, result.confidence, supabase);
      return { i, found: true, ...result, platform: best.platform };
    }

    return { i, found: false };
  }));

  return res.status(200).json({ results });
}
