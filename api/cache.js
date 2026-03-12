import { setCorsHeaders, validateOrigin, getClientIp, checkRateLimit, getSupabase } from './_shared.js';
import { cacheSchema, parseBody } from './_schemas.js';

const RATE_LIMIT = 60;

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
  if (!supabase) return res.status(200).json({ cached: 0 });

  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

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
}
