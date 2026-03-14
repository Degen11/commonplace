import { withApiHandler, normalizeForCache, RATE_LIMITS } from './_shared.js';
import { cacheSchema, parseBody } from './_schemas.js';

export default withApiHandler(async (req, res, { supabase }) => {
  if (!supabase) return res.status(200).json({ cached: 0 });

  const { ok, data: parsed, error: validationError } = parseBody(cacheSchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const rows = parsed.items
    .map(it => ({
      normalized_text: normalizeForCache(it.text),
      source: String(it.source).slice(0, 500),
      category: String(it.category || 'Reflection').slice(0, 100),
      confidence: ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'medium',
      updated_at: new Date().toISOString(),
    }))
    .filter(r => r.normalized_text.length > 5);

  if (rows.length === 0) return res.status(200).json({ cached: 0 });

  try {
    await supabase
      .from('quote_cache')
      .upsert(rows, { onConflict: 'normalized_text' });
    return res.status(200).json({ cached: rows.length });
  } catch {
    return res.status(200).json({ cached: 0 });
  }
}, {
  rateLimit: RATE_LIMITS.CACHE,
  requireJson: false,
});
