import { createClient } from '@supabase/supabase-js';

// ── Config ──
export const SUPABASE_URL = 'https://aoyagemikimsycaupych.supabase.co';

export const ALLOWED_ORIGINS = [
  'https://commonplace.pro',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
];

// ── Supabase client (lazy, per-request) ──
export function getSupabase() {
  const key = process.env.SUPABASE_SECRET_KEY;
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
  // Hard cap: if still over limit after cleanup, drop oldest entries.
  // Collect keys into an array first — deleting from a Map while iterating
  // its live keys iterator can skip entries or stop early in some engines.
  if (rateMap.size >= RATE_MAP_MAX_SIZE) {
    const toDelete = rateMap.size - RATE_MAP_MAX_SIZE + 1;
    const keys = Array.from(rateMap.keys()).slice(0, toDelete);
    for (const key of keys) rateMap.delete(key);
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
    // Supabase unavailable — still enforce rate limits in-memory.
    // In serverless environments this is per-instance (weaker), but
    // better than allowing unlimited requests through.
    return checkRateLimitInMemory(ip, limit);
  }
}

// Best-effort IP validation — reject obviously spoofed values
function looksLikeIp(ip) {
  if (!ip || ip.length > 45) return false;
  // IPv4 or IPv6 (loose check — just reject garbage)
  return /^[\d.:a-fA-F]+$/.test(ip);
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
  const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
  if (forwarded && looksLikeIp(forwarded)) return forwarded;
  return req.socket?.remoteAddress || 'unknown';
}

// ── Anthropic API configuration ──
export const ANTHROPIC = {
  URL: 'https://api.anthropic.com/v1/messages',
  MODEL: 'claude-haiku-4-5-20251001',
  VERSION: '2023-06-01',
};

// ── Per-endpoint rate limits (requests per minute) ──
export const RATE_LIMITS = {
  IDENTIFY:   30,
  SYNC:       60,
  SHARE:      15,
  AUTO_GROUP:  15,
  CACHE:      60,
  LOOKUP:     60,
  FETCH_URL:  15,
};

// ── Standardized error messages ──
export const ERROR_MESSAGES = {
  RATE_LIMITED:        'Too many requests. Please wait a moment and try again.',
  FORBIDDEN:           'Forbidden',
  METHOD_NOT_ALLOWED:  'Method not allowed',
  INVALID_CONTENT_TYPE:'Content-Type must be application/json',
  SERVICE_NOT_CONFIGURED: 'Service not configured',
  STORAGE_NOT_CONFIGURED: 'Storage not configured',
  AI_UNREACHABLE:      'Failed to reach AI service',
};

// ── Text normalization for cache keys ──
// Must stay in sync with normalize() in src/utils/textFormatting.js.
// Uses Unicode property escapes for correct handling of non-Latin scripts.
export function normalizeForCache(text) {
  return (text || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── API handler middleware ──
// Wraps a handler with CORS, method validation, origin check, CSRF check,
// and rate limiting. Eliminates the boilerplate repeated in every endpoint.
//
// Options:
//   methods      — allowed HTTP methods (default: ['POST'])
//   requireJson  — enforce Content-Type: application/json (default: true for POST)
//   requireAuth  — validate origin + CSRF header (default: true)
//                   Can be a function (req) => boolean for conditional auth (e.g. share GET)
//   rateLimit    — requests per minute, or null to skip (default: null)
//   requireSupabase — return error if Supabase is unavailable (default: false)
//   requireAnthropicKey — return error if ANTHROPIC_API_KEY is missing (default: false)
//
export function withApiHandler(handler, {
  methods = ['POST'],
  requireJson = null,
  requireAuth = true,
  rateLimit = null,
  requireSupabase = false,
  requireAnthropicKey = false,
} = {}) {
  // Default requireJson: true for POST-only endpoints, false otherwise
  if (requireJson === null) {
    requireJson = methods.length === 1 && methods[0] === 'POST';
  }

  const allowedMethods = [...methods, 'OPTIONS'].join(', ');

  return async (req, res) => {
    setCorsHeaders(req, res, allowedMethods);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!methods.includes(req.method)) {
      return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
    }

    // Auth check — can be boolean or a function of (req) for conditional auth
    const needsAuth = typeof requireAuth === 'function' ? requireAuth(req) : requireAuth;
    if (needsAuth) {
      if (!validateOrigin(req)) return res.status(403).json({ error: ERROR_MESSAGES.FORBIDDEN });
      if (!req.headers['x-requested-with']) return res.status(403).json({ error: ERROR_MESSAGES.FORBIDDEN });
    }

    // Content-Type check for methods with a body
    if (requireJson && req.method !== 'GET') {
      const ct = req.headers['content-type'] || '';
      if (!ct.includes('application/json')) {
        return res.status(415).json({ error: ERROR_MESSAGES.INVALID_CONTENT_TYPE });
      }
    }

    if (requireAnthropicKey && !process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: ERROR_MESSAGES.SERVICE_NOT_CONFIGURED });
    }

    const supabase = requireSupabase || rateLimit ? getSupabase() : null;
    if (requireSupabase && !supabase) {
      return res.status(500).json({ error: ERROR_MESSAGES.STORAGE_NOT_CONFIGURED });
    }

    if (rateLimit) {
      const ip = getClientIp(req);
      const sb = supabase || getSupabase();
      if (!(await checkRateLimit(ip, rateLimit, sb))) {
        return res.status(429).json({ error: ERROR_MESSAGES.RATE_LIMITED });
      }
    }

    return handler(req, res, { supabase });
  };
}
