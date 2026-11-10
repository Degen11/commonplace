# Database migrations

The schema lives in `migrations/`, one file per change, named
`<YYYYMMDDHHMMSS>_<what>.sql` (the Supabase CLI convention). Files run in name
order. `20260302000000_baseline.sql` is the whole schema as it stood when this
folder was introduced.

## Rules

- **Never edit a migration that has been applied to production.** Add a new
  file instead.
- **Every statement must be replayable**: `CREATE ... IF NOT EXISTS`,
  `CREATE OR REPLACE`, `DROP ... IF EXISTS` before a `CREATE TRIGGER` or
  `CREATE POLICY`, `ADD COLUMN IF NOT EXISTS`. Each file runs in one
  transaction, so a single statement that errors on an existing database
  rolls back everything after it in that file (that's how the `DROP POLICY`
  on `shared_collections` once failed to reach production).
- **No RLS policies.** The API reads and writes with the secret key, which
  bypasses RLS. RLS is on for every table so the publishable key can't touch
  anything, and any policy would only open data up to it.

CI (`.github/workflows/ci.yml`, job `migrations`) runs
`scripts/check-migrations.sh` against a fresh Postgres. It applies every file
twice and checks the end state: RLS on for all tables, no policies, the
tables, columns and trigger exist, and `check_rate_limit` /
`increment_view_count` work. Run it locally with
`DATABASE_URL=postgres://... scripts/check-migrations.sh` against a scratch
database.

## Applying to production

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref aoyagemikimsycaupych
supabase db push          # applies migrations not yet recorded as applied
```

The production database predates this folder, so the first time, record the
baseline as already applied instead of running it:

```bash
supabase migration repair --status applied 20260302000000
```

Without the CLI, paste each new file into the Dashboard SQL Editor, in order.
Because the files are replayable, re-running one is safe.

## Not in the baseline

Production also has the `pg_trgm` extension installed in `public`. Nothing in
the app uses it, so it's left out here rather than recreated in new
databases.
