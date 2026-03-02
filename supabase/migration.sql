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
