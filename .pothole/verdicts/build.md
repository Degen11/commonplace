# Verdicts: build

Inspector: inspect-build. Coverage: every finding judged; all evidence refs opened and both cited commits checked with git show. Engine ranges read from installed node_modules package.json files.

## PH-1049 confirmed

```yaml
id: PH-1049
verdict: confirmed
reason: "Survived all four routes. evidence: migration.sql:2 is the
  paste-into-SQL-Editor instruction, :35 is a bare CREATE TRIGGER (no DROP/IF
  NOT EXISTS, so a re-run aborts), :96 is an appended ALTER ADD COLUMN;
  api/sync.js:99-106 retries the upsert without collections when the column is
  missing (a workaround for unknown prod schema state); git show 9c63bf5 adds
  api/share.js using shared_collections on 2026-03-08 while db4af86 (2026-09-27)
  says migration.sql now matches production. No trap matches; survey confirms
  single file, no migration tool, no recorded intent. Major holds: already
  worked around in code and drift has already happened."
fingerprint: build:supabase:schema-applied-by-hand-no-migrations
```

## PH-1050 refuted

```yaml
id: PH-1050
verdict: refuted
reason: "documented: AI_DAILY_LIMIT is an optional override with a safe default
  (api/_shared.js:178-183, comment says Override with the AI_DAILY_LIMIT env
  var) and is documented in CLAUDE.md API middleware convention, so the claimed
  cost (an operator never learns the cap is tunable) is not shown. The deploy
  configured from README.md:121-126 works fully; unlike study Case 2 it gates
  neither startup nor a feature. The .gitignore:9 !.env.example carve-out is
  boilerplate, not evidence of an intended file."
fingerprint: build:README.md:env-sample-missing-ai-daily-limit
```

## PH-1051 confirmed

```yaml
id: PH-1051
verdict: confirmed
reason: Survived all routes. package.json has no engines field and the repo has
  no .nvmrc/.node-version (ls -a); ci.yml:19 hard-codes node-version 22;
  README.md:108 advertises Node 18+ while installed vite 8.3.5, eslint 10.13.0
  and jsdom 29.1.1 declare engines ^20.19 / >=22.12-ish. vercel.json sets no
  runtime, so the deploy Node version lives only in the dashboard. No trap or
  documented intent. The README 18+ wording itself is signage's half.
fingerprint: build:package.json:node-version-undeclared
```

## PH-1052 refuted

```yaml
id: PH-1052
verdict: refuted
reason: "miscategorized: wrong category, this is signage debt because the only
  evidence is README.md:132 prose telling a human to run vercel dev; no script,
  workflow, npm script or build step invokes the vercel CLI (grep of scripts/,
  .github/, package.json, vercel.json), so no automated build or pipeline from a
  fresh clone fails. Per study-case boundary, a human following prose is
  signage's."
fingerprint: build:package.json:vercel-cli-unpinned-global
```

## PH-1053 refuted

```yaml
id: PH-1053
verdict: refuted
reason: "documented: vite.config.js:32-36 and CLAUDE.md:363 state that lastmod
  is deliberately omitted when git cannot tell, e.g. shallow clones, which is
  exactly the declared best-effort statement the finding names as its missing
  input. The CI build (ci.yml:14) is a check job whose dist is never deployed,
  so its sitemap lacking lastmod costs nothing; the production clone depth
  question is a survey question, not in-repo evidence."
fingerprint: build:vite.config.js:sitemap-lastmod-needs-full-history
```
