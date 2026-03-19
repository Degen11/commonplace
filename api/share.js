import { withApiHandler, RATE_LIMITS } from './_shared.js';
import { sharePostSchema, shareGetSchema, parseBody } from './_schemas.js';

const ID_LENGTH = 8;
const EXPIRY_DAYS = 30;
const SHARE_BASE_URL = 'https://commonplace.pro';

// Generate a short URL-safe ID (a-z, 0-9)
function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  const bytes = new Uint8Array(ID_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < ID_LENGTH; i++) id += chars[bytes[i] % chars.length];
  return id;
}

export default withApiHandler(async (req, res, { supabase }) => {
  // ── GET: Fetch a shared collection ──
  if (req.method === 'GET') {
    const { ok, error: idError } = parseBody(shareGetSchema, req.query);
    if (!ok) return res.status(400).json({ error: 'Invalid share ID' });
    const { id } = req.query;

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
    const { ok, data: parsed, error: validationError } = parseBody(sharePostSchema, req.body);
    if (!ok) return res.status(400).json({ error: validationError });

    const { quotes: validated, title: sanitizedTitle } = parsed;

    if (validated.length === 0) {
      return res.status(400).json({ error: 'No valid quotes found' });
    }

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
        url: `${SHARE_BASE_URL}/#p=${id}`,
        expiresAt,
        count: validated.length,
      });
    } catch (err) {
      console.error('Share POST error:', err?.message || err);
      return res.status(500).json({ error: 'Failed to create shared link' });
    }
  }

}, {
  methods: ['GET', 'POST'],
  requireJson: false,
  // GET requests (viewing shared collections) skip origin/CSRF checks
  // so external visitors can load shared links
  requireAuth: (req) => req.method !== 'GET',
  rateLimit: RATE_LIMITS.SHARE,
  requireSupabase: true,
});
