# Findings: build

Detector: detect-build. Coverage: .github/workflows/ci.yml, .github/dependabot.yml, .lighthouserc.json, .npmrc, vercel.json, package.json scripts, vite.config.js build plugins, all four scripts/*.mjs, supabase/migration.sql and the README setup/env/deploy sections read end to end; every process.env read in src/, api/, scripts/ and vite.config.js (ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY, AI_DAILY_LIMIT) cross-checked against the only env sample (README.md env block; no .env.example exists). Commit subjects grepped for retry/re-run/flaky/again: no CI retry loops or retry bumps exist (the again hits are UI commits). No tool in this phase reads build inputs, so build coverage is AI-only. Out of category: (dependency) .npmrc sets legacy-peer-deps=true with no comment, added in 5b2f20c (Vite 7 to 8), silently masking an unnamed peer conflict for npm ci and the Vercel install; (signage) README.md:108 says Node.js 18+ while vite/eslint/jsdom require 20.19+, README cites 356 tests vs CLAUDE.md 443, and CLAUDE.md says eslint-plugin-react-hooks must be installed separately though it is a devDependency; (survey question) README.md:144 says push to main deploys on Vercel, and nothing in the repo shows whether production deploys wait for the CI lint/test/Lighthouse job, that gate, if any, lives in the Vercel dashboard. No credentials found in build files. [coverage=full]

## PH-1049 Supabase schema is applied by hand with no migration tooling; repo lagged production by six months and the file is not re-runnable

```yaml
id: PH-1049
category: build
title: Supabase schema is applied by hand with no migration tooling; repo lagged
  production by six months and the file is not re-runnable
severity: major
traffic: 0.07038251338668261
confidence: ai-suspected
evidence:
  - supabase/migration.sql:2
  - supabase/migration.sql:35
  - supabase/migration.sql:96
  - api/sync.js:99
  - 9c63bf5
  - db4af86
source:
  - detect-build
repair_cost: M
fingerprint: build:supabase:schema-applied-by-hand-no-migrations
```

The only schema artifact is one cumulative file to paste into the Supabase SQL Editor (line 2). Code started using shared_collections in 9c63bf5 (2026-03-08) but the table only entered the repo in db4af86 (2026-09-27), whose message says migration.sql now matches production: for six months the production schema existed only in the dashboard. Additions are appended to the tail (ALTER ... ADD COLUMN at :96) while :35 is a bare CREATE TRIGGER with no IF NOT EXISTS / DROP, so re-running the file against an existing database aborts there, and applying a change means hand-picking the tail. Nothing records which revision production has, and api/sync.js:99-108 already works around that unknown state with a retry that drops the collections column when the upsert fails. A fresh clone cannot bring up a matching database or know what a release must apply; the missing input is a versioned, ordered migration history (e.g. supabase/migrations with the CLI).

## PH-1050 No .env.example exists and the README env block omits AI_DAILY_LIMIT

```yaml
id: PH-1050
category: build
title: No .env.example exists and the README env block omits AI_DAILY_LIMIT
severity: minor
traffic: 0.0914958755602203
confidence: ai-suspected
evidence:
  - api/_shared.js:182
  - README.md:121
  - .gitignore:9
source:
  - detect-build
repair_cost: S
fingerprint: build:README.md:env-sample-missing-ai-daily-limit
```

The code reads three env vars; the only sample is the README prose block, which lists ANTHROPIC_API_KEY and SUPABASE_SECRET_KEY but not AI_DAILY_LIMIT (read at api/_shared.js:182, the global AI spend cap; documented only in CLAUDE.md and a code comment). .gitignore:9 carves out !.env.example, so a committed sample was intended but never added. Feature-level, not startup-gating: absent, the cap silently defaults to 2000 calls/day, so an operator configuring a new environment from the sample never learns the spend cap is tunable.

## PH-1051 Node version is declared nowhere the builders read: no engines field or .nvmrc; CI hard-codes 22 independently

```yaml
id: PH-1051
category: build
title: "Node version is declared nowhere the builders read: no engines field or
  .nvmrc; CI hard-codes 22 independently"
severity: minor
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - package.json:1
  - .github/workflows/ci.yml:19
  - README.md:108
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:node-version-undeclared
```

vite 8, eslint 10 and jsdom 29 require Node ^20.19 or >=22.12, but package.json has no engines field and there is no .nvmrc/.node-version. CI pins node-version 22 inline in ci.yml:19, and the production Vercel build takes its Node version from a dashboard setting (Vercel reads engines.node when present). The CI runtime and the deploy runtime can therefore drift apart with nothing in the repo to reconcile them, and local installs on the README-advertised Node 18 fail. Missing input: a single in-repo Node version declaration that CI (node-version-file) and Vercel both resolve from.

## PH-1052 Local API workflow depends on an unpinned global vercel CLI with no in-repo install

```yaml
id: PH-1052
category: build
title: Local API workflow depends on an unpinned global vercel CLI with no
  in-repo install
severity: minor
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - README.md:132
  - package.json:7
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:vercel-cli-unpinned-global
```

The serverless functions in api/ can only be run locally via vercel dev (README.md:132; CLAUDE.md Common commands), but vercel is neither a devDependency nor an npm script, and no version is declared. Every contributor exercising api/ locally runs whatever global CLI version they happen to have. Missing input: a pinned vercel devDependency (and an npm script such as dev:api).

## PH-1053 Sitemap lastmod depends on full git history the CI build never has

```yaml
id: PH-1053
category: build
title: Sitemap lastmod depends on full git history the CI build never has
severity: minor
traffic: 0.10359896029435692
confidence: ai-suspected
evidence:
  - vite.config.js:46
  - .github/workflows/ci.yml:14
source:
  - detect-build
repair_cost: S
fingerprint: build:vite.config.js:sitemap-lastmod-needs-full-history
```

The generateSitemap plugin derives each page lastmod from git log and deliberately omits it in shallow clones. ci.yml:14 uses actions/checkout@v4 with the default fetch-depth of 1, so the CI build always emits a sitemap without lastmod and never exercises the path production relies on; the production builder clone depth is not declared in the repo either, so whether the deployed sitemap carries dates depends on an unrecorded builder setting. Missing input: fetch-depth 0 in CI (or a declared statement that lastmod is best-effort).
