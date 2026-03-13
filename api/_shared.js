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

// ── Supabase client (lazy, per-request) ──
export function getSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY
    || process.env.VITE_SUPABASE_ANON_KEY_COMMONPLACE;
  if (!key) return null;
  return createClient(SUPABASE_URL, key);
}

// ── Rate limiting ──
const rateMap = new Map();
const RATE_MAP_MAX_SIZE = 10_000; // prevent unbounded growth from many unique IPs

function checkRateLimitInMemory(ip, limit) {
  const now = Date.now();
  // Evict expired entries — full sweep when approaching capacity
  if (rateMap.size > RATE_MAP_MAX_SIZE / 2) {
    for (const [key, entry] of rateMap) {
      if (now - entry.start > 60000) rateMap.delete(key);
    }
  }
  // Hard cap: if still over limit after cleanup, drop oldest entries
  if (rateMap.size >= RATE_MAP_MAX_SIZE) {
    const toDelete = rateMap.size - RATE_MAP_MAX_SIZE + 1;
    const keys = rateMap.keys();
    for (let i = 0; i < toDelete; i++) {
      const { value } = keys.next();
      if (value !== undefined) rateMap.delete(value);
    }
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
  // Parse referer origin properly to prevent subdomain spoofing
  // (e.g. "https://commonplace.pro.evil.com/" must not pass)
  let refererOrigin = '';
  try { refererOrigin = new URL(referer).origin; } catch { /* invalid referer */ }
  return ALLOWED_ORIGINS.some(o => origin === o || refererOrigin === o);
}

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}
