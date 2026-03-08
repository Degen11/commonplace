-- Commonplace: device-based cloud storage
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- One row per device. Quotes and categories stored as JSONB arrays.
-- This avoids per-quote row management and makes sync trivially simple:
-- GET = read one row, POST = upsert one row.
CREATE TABLE IF NOT EXISTS device_data (
  device_id  UUID PRIMARY KEY,
  quotes     JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for safety, even though we use the service role key server-side.
ALTER TABLE device_data ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed — the service role key bypasses RLS entirely.
-- If you later add auth, you'd add policies like:
--   CREATE POLICY "users can access own data" ON device_data
--     FOR ALL USING (auth.uid()::text = device_id::text);

-- Index on updated_at for potential future cleanup queries
CREATE INDEX IF NOT EXISTS idx_device_data_updated_at ON device_data(updated_at);

-- Optional: auto-update the updated_at column on every write
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_data_updated_at
  BEFORE UPDATE ON device_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── Rate limiting (durable across serverless cold starts) ──
CREATE TABLE IF NOT EXISTS rate_limits (
  ip           TEXT PRIMARY KEY,
  tokens       INT NOT NULL DEFAULT 30,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atomic rate limit check: returns TRUE if allowed, FALSE if blocked.
-- Uses row-level locking to prevent race conditions.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_limit INT DEFAULT 30,
  p_window_sec INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_row rate_limits%ROWTYPE;
  v_cutoff TIMESTAMPTZ := now() - make_interval(secs := p_window_sec);
BEGIN
  -- Ensure row exists
  INSERT INTO rate_limits (ip, tokens, window_start)
  VALUES (p_ip, p_limit, now())
  ON CONFLICT (ip) DO NOTHING;

  -- Lock and read
  SELECT * INTO v_row FROM rate_limits WHERE ip = p_ip FOR UPDATE;

  IF v_row.window_start < v_cutoff THEN
    -- Window expired, reset
    UPDATE rate_limits SET tokens = p_limit - 1, window_start = now() WHERE ip = p_ip;
    RETURN TRUE;
  END IF;

  IF v_row.tokens <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE rate_limits SET tokens = v_row.tokens - 1 WHERE ip = p_ip;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ── Quote identification cache ──
-- Caches AI identification results so the same quote never costs tokens twice.
-- Key is normalized text (lowercase, no punctuation); stores source attribution.
CREATE TABLE IF NOT EXISTS quote_cache (
  normalized_text TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'Reflection',
  confidence      TEXT NOT NULL DEFAULT 'medium',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quote_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quote_cache_updated_at ON quote_cache(updated_at);

-- ── Quotes-500K reference table ──
-- Pre-imported from the Quotes-500K dataset (ShivaliGoel/Quotes-500K).
-- ~500K rows with author + category tags. Used as a lookup layer between
-- the local DB and external APIs to reduce AI token usage.
-- Import using: scripts/import-quotes-500k.mjs
CREATE TABLE IF NOT EXISTS quotes_500k (
  id         SERIAL PRIMARY KEY,
  quote      TEXT NOT NULL,
  normalized TEXT NOT NULL,
  author     TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT ''
);

ALTER TABLE quotes_500k ENABLE ROW LEVEL SECURITY;

-- Exact match on normalized text (most common lookup path)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_500k_normalized ON quotes_500k(normalized);

-- Enable pg_trgm for fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_quotes_500k_trgm ON quotes_500k USING gin (normalized gin_trgm_ops);

-- Fuzzy search RPC: finds closest matching quote by trigram similarity
CREATE OR REPLACE FUNCTION search_quotes_500k(
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.45,
  max_results INT DEFAULT 1
) RETURNS TABLE(quote TEXT, author TEXT, category TEXT, sim FLOAT) AS $$
BEGIN
  RETURN QUERY
    SELECT q.quote, q.author, q.category,
           similarity(q.normalized, query_text)::FLOAT AS sim
    FROM quotes_500k q
    WHERE similarity(q.normalized, query_text) >= match_threshold
    ORDER BY sim DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
