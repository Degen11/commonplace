import { getSupabase, checkRateLimit, setCorsHeaders, validateOrigin, getClientIp, UUID_RE } from './_shared.js';

const RATE_LIMIT = 60;

// ── Validate a single quote object ──
function validateQuote(q) {
  if (!q || typeof q !== 'object') return null;
  if (typeof q.id !== 'string' || typeof q.text !== 'string') return null;
  if (q.text.length === 0 || q.text.length > 10000) return null;
  const validated = {
    id: q.id,
    text: q.text,
    source: typeof q.source === 'string' ? q.source.slice(0, 500) : 'Unknown',
    category: typeof q.category === 'string' ? q.category.slice(0, 100) : 'Unknown',
    confidence: ['high', 'medium', 'low'].includes(q.confidence) ? q.confidence : 'low',
    favorite: !!q.favorite,
  };
  if (typeof q.updatedAt === 'number' && q.updatedAt > 0) {
    validated.updatedAt = q.updatedAt;
  }
  return validated;
}

// ── Merge quotes by ID: union both sets, keep newer for conflicts ──
function mergeQuotes(clientQuotes, cloudQuotes, deletedIds) {
  const merged = new Map();

  for (const q of cloudQuotes) {
    if (q && q.id) merged.set(q.id, q);
  }

  for (const q of clientQuotes) {
    if (!q || !q.id) continue;
    const existing = merged.get(q.id);
    if (!existing || (q.updatedAt || 0) >= (existing.updatedAt || 0)) {
      merged.set(q.id, q);
    }
  }

  if (Array.isArray(deletedIds)) {
    for (const entry of deletedIds) {
      if (!entry || typeof entry.id !== 'string') continue;
      const deletedAt = typeof entry.deletedAt === 'number' ? entry.deletedAt : 0;
      const existing = merged.get(entry.id);
      if (existing && deletedAt >= (existing.updatedAt || 0)) {
        merged.delete(entry.id);
      }
    }
  }

  return Array.from(merged.values());
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!validateOrigin(req)) return res.status(403).json({ error: 'Forbidden' });
  if (!req.headers['x-requested-with']) return res.status(403).json({ error: 'Forbidden' });

  const supabase = getSupabase();
  if (!supabase) return res.status(500).json({ error: 'Storage not configured' });

  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, RATE_LIMIT, supabase))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ── GET: Fetch quotes for a device ──
  if (req.method === 'GET') {
    const deviceId = req.query.device_id;
    if (!deviceId || !UUID_RE.test(deviceId)) {
      return res.status(400).json({ error: 'Invalid device_id' });
    }

    try {
      let { data, error } = await supabase
        .from('device_data')
        .select('quotes, custom_categories, collections, updated_at')
        .eq('device_id', deviceId)
        .maybeSingle();

      // collections column may not exist yet — retry without it
      if (error && error.message?.includes('collections')) {
        const retry = await supabase
          .from('device_data')
          .select('quotes, custom_categories, updated_at')
          .eq('device_id', deviceId)
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (!data) return res.status(200).json({ quotes: [], customCategories: [], collections: [], updatedAt: null });

      return res.status(200).json({
        quotes: data.quotes || [],
        customCategories: data.custom_categories || [],
        collections: data.collections || [],
        updatedAt: data.updated_at,
      });
    } catch (err) {
      const detail = err?.message || err?.code || 'unknown';
      console.error('Sync GET error:', detail);
      return res.status(500).json({ error: 'Failed to load data', detail });
    }
  }

  // ── POST: Save quotes for a device ──
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { device_id, quotes, customCategories, deletedIds, collections } = req.body || {};

    if (!device_id || !UUID_RE.test(device_id)) {
      return res.status(400).json({ error: 'Invalid device_id' });
    }
    if (!Array.isArray(quotes)) {
      return res.status(400).json({ error: 'quotes must be an array' });
    }
    if (quotes.length > 50000) {
      return res.status(400).json({ error: 'Too many quotes' });
    }

    const validated = [];
    for (const q of quotes) {
      const v = validateQuote(q);
      if (v) validated.push(v);
    }

    const cats = Array.isArray(customCategories)
      ? customCategories
          .filter(c => typeof c === 'string' && c.length > 0 && c.length <= 50)
          .map(c => c.replace(/<[^>]*>/g, '').trim())
          .slice(0, 200)
      : [];

    const validCollections = Array.isArray(collections)
      ? collections.filter(c => c && typeof c.id === 'string' && typeof c.name === 'string').slice(0, 500)
      : [];

    try {
      const { data: existing } = await supabase
        .from('device_data')
        .select('quotes')
        .eq('device_id', device_id)
        .maybeSingle();

      const cloudQuotes = existing?.quotes || [];
      const merged = mergeQuotes(validated, cloudQuotes, deletedIds);

      if (merged.length > 50000) {
        return res.status(400).json({ error: 'Too many quotes after merge' });
      }

      // Try with collections column; fall back without it if column doesn't exist yet
      const row = { device_id, quotes: merged, custom_categories: cats, collections: validCollections };
      let { error } = await supabase.from('device_data').upsert(row, { onConflict: 'device_id' });

      if (error && error.message?.includes('collections')) {
        // collections column not yet added to table — save without it
        const { collections: _, ...rowWithout } = row;
        const retry = await supabase.from('device_data').upsert(rowWithout, { onConflict: 'device_id' });
        error = retry.error;
      }

      if (error) throw error;

      return res.status(200).json({ ok: true, count: merged.length, merged: true });
    } catch (err) {
      const detail = err?.message || err?.code || 'unknown';
      console.error('Sync POST error:', detail);
      return res.status(500).json({ error: 'Failed to save data', detail });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
