import { createClient } from '@supabase/supabase-js';

// ── Config ──
const SUPABASE_URL = 'https://aoyagemikimsycaupych.supabase.co';

const ALLOWED_ORIGINS = [
  'https://commonplace.pro',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

// Rate limiting (same pattern as identify.js)
const rateMap = new Map();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now - entry.start > RATE_WINDOW * 2) rateMap.delete(key);
  }
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

function setCorsHeaders(req, res) {
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// UUID v4 validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabase() {
  // Try secret key first (server-side only, bypasses RLS), then fall back to anon key
  const key = process.env.SUPABASE_SECRET_KEY
    || process.env.VITE_SUPABASE_ANON_KEY_COMMONPLACE;
  if (!key) return null;
  return createClient(SUPABASE_URL, key);
}

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

  // Start with cloud quotes
  for (const q of cloudQuotes) {
    if (q && q.id) merged.set(q.id, q);
  }

  // Merge client quotes — keep whichever has a newer updatedAt
  for (const q of clientQuotes) {
    if (!q || !q.id) continue;
    const existing = merged.get(q.id);
    if (!existing || (q.updatedAt || 0) >= (existing.updatedAt || 0)) {
      merged.set(q.id, q);
    }
  }

  // Apply deletions
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
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── Security checks ──
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  if (!ALLOWED_ORIGINS.some(o => origin === o || referer === o || referer.startsWith(o + '/'))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!req.headers['x-requested-with']) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Storage not configured' });
  }

  // ── GET: Fetch quotes for a device ──
  if (req.method === 'GET') {
    const deviceId = req.query.device_id;
    if (!deviceId || !UUID_RE.test(deviceId)) {
      return res.status(400).json({ error: 'Invalid device_id' });
    }

    try {
      const { data, error } = await supabase
        .from('device_data')
        .select('quotes, custom_categories, updated_at')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(200).json({ quotes: [], customCategories: [], updatedAt: null });

      return res.status(200).json({
        quotes: data.quotes || [],
        customCategories: data.custom_categories || [],
        updatedAt: data.updated_at,
      });
    } catch (err) {
      console.error('Sync GET error:', err?.message || 'unknown');
      return res.status(500).json({ error: 'Failed to load data' });
    }
  }

  // ── POST: Save quotes for a device ──
  if (req.method === 'POST') {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { device_id, quotes, customCategories, deletedIds } = req.body || {};

    if (!device_id || !UUID_RE.test(device_id)) {
      return res.status(400).json({ error: 'Invalid device_id' });
    }
    if (!Array.isArray(quotes)) {
      return res.status(400).json({ error: 'quotes must be an array' });
    }
    if (quotes.length > 50000) {
      return res.status(400).json({ error: 'Too many quotes' });
    }

    // Validate each quote
    const validated = [];
    for (const q of quotes) {
      const v = validateQuote(q);
      if (!v) continue; // Skip invalid entries silently
      validated.push(v);
    }

    // Validate custom categories
    const cats = Array.isArray(customCategories)
      ? customCategories
          .filter(c => typeof c === 'string' && c.length > 0 && c.length <= 50)
          .map(c => c.replace(/<[^>]*>/g, '').trim())
          .slice(0, 200)
      : [];

    try {
      // Fetch current cloud data for merge
      const { data: existing } = await supabase
        .from('device_data')
        .select('quotes')
        .eq('device_id', device_id)
        .maybeSingle();

      const cloudQuotes = existing?.quotes || [];

      // Merge client quotes with cloud quotes (union by ID, newer wins)
      const merged = mergeQuotes(validated, cloudQuotes, deletedIds);

      if (merged.length > 50000) {
        return res.status(400).json({ error: 'Too many quotes after merge' });
      }

      const { error } = await supabase
        .from('device_data')
        .upsert({
          device_id: device_id,
          quotes: merged,
          custom_categories: cats,
        }, { onConflict: 'device_id' });

      if (error) throw error;

      return res.status(200).json({ ok: true, count: merged.length, merged: true });
    } catch (err) {
      console.error('Sync POST error:', err?.message || 'unknown');
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
