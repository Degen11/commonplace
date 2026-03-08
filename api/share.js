import { getSupabase, checkRateLimit, setCorsHeaders, validateOrigin, getClientIp } from './_shared.js';

const RATE_LIMIT = 15;
const ID_LENGTH = 8;
const MAX_QUOTES = 10000;
const EXPIRY_DAYS = 30;

// Generate a short URL-safe ID (a-z, 0-9)
function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const bytes = new Uint8Array(ID_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < ID_LENGTH; i++) id += chars[bytes[i] % chars.length];
  return id;
}

// Validate a single quote for sharing (minimal: text, source, category, fav)
function validateShareQuote(q) {
  if (!Array.isArray(q) || q.length < 3) return null;
  const [text, source, category, fav] = q;
  if (typeof text !== 'string' || typeof source !== 'string' || typeof category !== 'string') return null;
  if (text.length === 0 || text.length > 5000) return null;
  if (source.length > 500 || category.length > 100) return null;
  const clean = s => s.replace(/<[^>]*>/g, '').trim();
  return [clean(text), clean(source), clean(category), fav === 1 ? 1 : 0];
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: 'Storage not configured' });

  // GET requests (viewing shared collections) skip origin/CSRF checks
  // so external visitors can load shared links
  if (req.method !== 'GET') {
    if (!validateOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
    if (!req.headers['x-requested-with']) return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ── GET: Fetch a shared collection ──
  if (req.method === 'GET') {
    const id = req.query.id;
    if (!id || typeof id !== 'string' || id.length < 4 || id.length > 20) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }

    try {
      const { data, error } = await supabase
        .from('shared_collections')
        .select('quotes, title, created_at, expires_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Shared collection not found' });

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return res.status(410).json({ error: 'This shared link has expired' });
      }

      // Increment view count (fire and forget)
      supabase.rpc('increment_view_count', { share_id: id }).catch(() => {});

      return res.status(200).json({
        quotes: data.quotes,
        title: data.title || null,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      });
    } catch (err) {
      console.error('Share GET error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to load shared collection' });
    }
  }

  // ── POST: Create a shared collection ──
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { quotes, title } = req.body || {};

    if (!Array.isArray(quotes) || quotes.length === 0) {
      return res.status(400).json({ error: 'quotes must be a non-empty array' });
    }
    if (quotes.length > MAX_QUOTES) {
      return res.status(400).json({ error: `Too many quotes (max ${MAX_QUOTES})` });
    }

    const validated = [];
    for (const q of quotes) {
      const v = validateShareQuote(q);
      if (v) validated.push(v);
    }

    if (validated.length === 0) {
      return res.status(400).json({ error: 'No valid quotes found' });
    }

    const sanitizedTitle = typeof title === 'string'
      ? title.replace(/<[^>]*>/g, '').trim().slice(0, 100)
      : null;

    const id = generateShareId();
    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { error } = await supabase
        .from('shared_collections')
        .insert({
          id,
          quotes: validated,
          title: sanitizedTitle,
          expires_at: expiresAt,
        });

      if (error) throw error;

      return res.status(201).json({
        id,
        url: `${req.headers['origin'] || 'https://commonplace.pro'}/#p=${id}`,
        expiresAt,
        count: validated.length,
      });
    } catch (err) {
      console.error('Share POST error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to create shared link' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
