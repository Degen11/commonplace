import { createClient } from '@supabase/supabase-js';

// ── Config ──
export const SUPABASE_URL = 'https://aoyagemikimsycaupych.supabase.co';

export const ALLOWED_ORIGINS = [
  'https://commonplace.pro',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

// UUID v4 validation
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Supabase client (lazy, shared) ──
export function getSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY
    || process.env.VITE_SUPABASE_ANON_KEY_COMMONPLACE;
  if (!key) return null;
  return createClient(SUPABASE_URL, key);
}

// ── Rate limiting ──
const rateMap = new Map();

function checkRateLimitInMemory(ip, limit) {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now - entry.start > 120000) rateMap.delete(key);
  }
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > 60000) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

export async function checkRateLimit(ip, limit, supabase) {
  if (!supabase) return checkRateLimitInMemory(ip, limit);
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip: ip,
      p_limit: limit,
      p_window_sec: 60,
    });
    if (error) throw error;
    return data;
  } catch {
    return checkRateLimitInMemory(ip, limit);
  }
}

// ── CORS helpers ──
export function setCorsHeaders(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ── Common security checks ──
export function validateOrigin(req) {
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  return ALLOWED_ORIGINS.some(o => origin === o || referer === o || referer.startsWith(o + '/'));
}

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}
