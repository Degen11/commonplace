#!/usr/bin/env bash
# Apply every migration in supabase/migrations to $DATABASE_URL, in order, each
# in its own transaction, then do it all a second time. The second pass proves
# the files are replayable: a statement that fails on an existing schema (like
# a bare CREATE TRIGGER) would roll back everything after it in that file.
# Finally, assert the security-relevant end state.
#
# Usage: DATABASE_URL=postgres://... scripts/check-migrations.sh
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to an empty scratch database}"
cd "$(dirname "$0")/.."
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"

shopt -s nullglob
files=(supabase/migrations/*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "no migrations found" >&2
  exit 1
fi

# Supabase's anon/authenticated roles don't exist in plain Postgres; create
# them so policies or grants that name them still apply.
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;
SQL

for pass in 1 2; do
  for f in "${files[@]}"; do
    echo "pass $pass: $f"
    psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 --single-transaction -f "$f"
  done
done

fail() { echo "FAIL: $1" >&2; exit 1; }
q() { psql "$DATABASE_URL" -tA -v ON_ERROR_STOP=1 -c "$1"; }

# Every public table has RLS on, and no table has a policy: the server reads
# and writes with the secret key, so any policy would only open data up to the
# publishable key.
no_rls=$(q "SELECT string_agg(relname, ', ') FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity")
[ -z "$no_rls" ] || fail "RLS disabled on: $no_rls"
policies=$(q "SELECT string_agg(tablename || '.' || policyname, ', ') FROM pg_policies WHERE schemaname = 'public'")
[ -z "$policies" ] || fail "unexpected policies: $policies"

for t in device_data rate_limits quote_cache shared_collections; do
  [ "$(q "SELECT to_regclass('public.$t') IS NOT NULL")" = "t" ] || fail "missing table $t"
done
[ "$(q "SELECT count(*) FROM information_schema.columns WHERE table_name = 'device_data' AND column_name = 'collections'")" = "1" ] || fail "device_data.collections missing"
[ "$(q "SELECT count(*) FROM pg_trigger WHERE tgname = 'device_data_updated_at'")" = "1" ] || fail "device_data_updated_at trigger missing or duplicated"

# The functions the API calls work
key="ci-check-$$-$RANDOM"
[ "$(q "SELECT check_rate_limit('$key', 1, 60)")" = "t" ] || fail "check_rate_limit first call"
[ "$(q "SELECT check_rate_limit('$key', 1, 60)")" = "f" ] || fail "check_rate_limit should block the second call"
q "DELETE FROM rate_limits WHERE ip = '$key'" >/dev/null
q "INSERT INTO shared_collections (id) VALUES ('$key')" >/dev/null
q "SELECT public.increment_view_count('$key')" >/dev/null
[ "$(q "SELECT view_count FROM shared_collections WHERE id = '$key'")" = "1" ] || fail "increment_view_count"
q "DELETE FROM shared_collections WHERE id = '$key'" >/dev/null

echo "migrations OK (${#files[@]} files, applied twice)"
