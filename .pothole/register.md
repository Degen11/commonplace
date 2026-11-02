# Pothole Register: commonplace

Verified: 38 confirmed, 13 refuted, 0 not verified — 51 finding(s) across 10 category file(s).
Detector coverage: Detector: detect-api. Coverage: all 9 Vercel endpoints in api/ tabulated (identify, auto-group, lookup, fetch-url, sync GET/POST, share GET/POST, og, share-page) for envelope, error shape, pagination and field naming, plus every in-repo consumer (useProcessing, useSync, QuotesContext, ExportDropdown, AddMorePanel, UrlImportPanel, InputPhase pre-warm). Error bodies are uniform {error: string} via withApiHandler and handlers; no list endpoint paginates (all bounded by schema max). Declared migrations (#p= to /c/, ?device_id= to X-Device-Id on sync GET) were not reported. Dropped as too thin: share GET validates id with a loose Zod schema while og.js and share-page.js use SHARE_ID_RE, and og.js collapses expired to 404 where share.js and share-page.js return 410 (no consumer impact found). No tool covers api debt in this phase (no OpenAPI or spectral linting is wired), so this slice is entirely AI-only. [coverage=full]
Detector coverage: Detector: detect-architecture. Coverage: madge ran (JS/TS) and reported 0 cycles, so cycle detection is tool-backed and clean; no load-bearing cycle to argue. Drift checked against the CLAUDE.md declarations and layering rules recorded in the survey (supabase server-only, api imports, apiRequest, copyWithToast, storage helpers, lazy localQuotes/compromise, manual memoization, withApiHandler, QuotesContext value-less, normalize twins, lower-layer back-imports): only the two drift items below survived; useSync useCallback and TableView/CardItem memo carry stated compiler/effect-deps justifications and were not reported. Zombie-path and god-module coverage is AI-only: styles.js, config.js, constants.js, helpers.js are libraries (no feature back-imports), so no god module. Out of category: api/og.js and api/share-page.js validate the id with SHARE_ID_RE instead of a Zod schema from _schemas.js (api); ResultsPhase.jsx size and CardItem/TableView co-change are code god-file/twin territory. [coverage=full]
Detector coverage: Detector: detect-build. Coverage: .github/workflows/ci.yml, .github/dependabot.yml, .lighthouserc.json, .npmrc, vercel.json, package.json scripts, vite.config.js build plugins, all four scripts/*.mjs, supabase/migration.sql and the README setup/env/deploy sections read end to end; every process.env read in src/, api/, scripts/ and vite.config.js (ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY, AI_DAILY_LIMIT) cross-checked against the only env sample (README.md env block; no .env.example exists). Commit subjects grepped for retry/re-run/flaky/again: no CI retry loops or retry bumps exist (the again hits are UI commits). No tool in this phase reads build inputs, so build coverage is AI-only. Out of category: (dependency) .npmrc sets legacy-peer-deps=true with no comment, added in 5b2f20c (Vite 7 to 8), silently masking an unnamed peer conflict for npm ci and the Vercel install; (signage) README.md:108 says Node.js 18+ while vite/eslint/jsdom require 20.19+, README cites 356 tests vs CLAUDE.md 443, and CLAUDE.md says eslint-plugin-react-hooks must be installed separately though it is a devDependency; (survey question) README.md:144 says push to main deploys on Vercel, and nothing in the repo shows whether production deploys wait for the CI lint/test/Lighthouse job, that gate, if any, lives in the Vercel dashboard. No credentials found in build files. [coverage=full]
Detector coverage: Detector: detect-code. Coverage: full sweep of src/, api/, scripts/, public/boot.js for diverged twins (copy-admission grep, keep-in-sync comments, cross-file comparison of pipeline/header/edit/save paths with git -L / -S history) and fossilized markers (zero TODO/FIXME/HACK/XXX in production code; provisional/legacy comments all young or tied to declared migrations). No feature flags exist (no boolean config toggles, no env flags beyond secrets/AI_DAILY_LIMIT), so no flag-gated dead paths. Tool gaps: sonar not configured, semgrep failed, repowise-health truncated at 60/136, so complexity is eslint-sonarjs plus partial repowise only. Deliberately not restated: the jscpd internal reIdentify/batchReIdentify block in useQuoteActions.js, every cognitive-complexity/bumpy-road/large-method finding on ResultsPhase, TableView, CardItem, useProcessing, QuotesContext; ResultsPhase god-component shape is covered by those and acknowledged in CLAUDE.md. Out of category: (swerve/security) api/_schemas.js:29 keeps a legacy free-text messages shape for /api/identify, added 2026-09-27 (db4af86) with no exit criterion and not listed among the survey migrations; (signage) CLAUDE.md declares only two normalize copies that must stay in sync, a third exists in localQuotes.js. Test files were not reviewed for debt (test owns them). [coverage=full]
Detector coverage: Detector: detect-dependency. Coverage: all 37 entries of package.json read and import-traced across src/, api/, scripts/, vite.config.js, eslint.config.js and CI; peer graph checked with npm ls; registry metadata (npm view) checked for quiet packages. osv-scanner ran with 0 findings, so no advisory reachability to judge. Unused-dependency and abandonment coverage is AI-only (knip, npm-check-updates and libyear not run). PARTIAL: abandonment check incomplete - @use-gesture/react (last publish 2024-03) and @dnd-kit/core + @dnd-kit/sortable (last publish 2024-12; upstream now ships @dnd-kit/react) are quiet, but GitHub repo pages were unreachable from this session (gh/api.github.com blocked), so archived status was not verified and nothing was filed; quiet is not abandoned. Not filed: babel-plugin-react-compiler exact pin 1.0.0 is the current npm latest, so it is not a fossil; vite-plugin-pwa sits in dependencies though build-only (no shipping effect). No credentials seen in package.json, .npmrc or lockfile. Out-of-category (signage): CLAUDE.md tech-stack line says @use-gesture/react powers useLongPress, but src/hooks/useLongPress.js uses raw touch events and only useSwipe imports @use-gesture. [coverage=partial]
Detector coverage: Detector: detect-knowledge. Coverage: no ADR directory exists; CLAUDE.md (sole declaration, treated as intended) memo/sync/env claims checked against code; all 4 process.env reads traced (api/_shared.js); author data from the brief, cross-checked with git shortlog (one human under three identities Degen11/Degen/degen11 plus Claude, so the hotspot authors column overstates diversity). AI-only category, no tool corroborates any of it. Out of category: README.md:131 says 356 tests vs 40 files/443 tests in CLAUDE.md (signage); collections merge on createdAt and have no updatedAt, so collection renames/membership edits on one device can be overwritten by the cloud copy on pull (correctness, likely architecture/bug detector); ?device_id= fallback in api/sync.js has no recorded exit criterion (migration/architecture). [coverage=full]
Detector coverage: Detector: detect-security. Coverage: authz/abuse trace over all 9 api/ entry points (identify, auto-group, sync GET/POST, share GET/POST, share-page, og, lookup, fetch-url) through withApiHandler in api/_shared.js; Supabase RLS and function grants in supabase/migration.sql; client XSS sinks and CSP in vercel.json. gitleaks ran (0) so secret coverage is tool-backed; semgrep failed (registry blocked), so known-insecure-pattern coverage is AI-only, hence partial. No user accounts exist by design (device UUID is the credential), so there is no UI-only permission check to find. Did not restate the eslint-sonar hotspots (slow-regex, no-hardcoded-ip in fetch-url, pseudo-random and code-eval in tests); none of them looked reachable enough to raise. Saw and left to api: identify returns the raw Anthropic envelope while other endpoints return shaped JSON. [coverage=partial]
Detector coverage: Detector: detect-signage. Coverage: 4 simulated newcomer tasks (add/adjust a results-list component under React Compiler; read or change quote state; add a client API call or clipboard copy; bring the repo up from README setup) plus a name/doc contradiction sweep of CLAUDE.md and README.md claims against code (directory layout, scripts, config constants, Z scale, API middleware/schemas, lazy-load, PWA/chunking, hover rules, helpers) and get*/is*/has*/load*/check* names in src and api. knip/ts-prune are not run in this phase, so dead-export coverage is AI-only; no documented-and-re-exported dead symbol found (no barrel index files exist). Out-of-category (architecture/code, code violating declared CLAUDE.md rules, not signage): CollectionsSidebar.jsx:403 does const Icon = getIcon(c.icon), the exact dynamic-component pattern CLAUDE.md forbids; raw fetchWithTimeout outside apiRequest in QuotesContext.jsx:121 (public share GET, also sends no X-Requested-With header) and useProcessing.js:508 (auto-group, not a listed exception); onMouseEnter/onMouseLeave hover state in SyncPill.jsx:82, CollectionsSidebar.jsx:118, HowItWorksAnimation.jsx:297; raw navigator.clipboard share-link copies in ExportDropdown.jsx:74 and :95 bypass copyWithToast (they do handle errors). Cosmetic, not filed: README test count 356 is stale (actual about 440); quotesStore isShareHash() also matches the /c/ path; CLAUDE.md test-dir list omits lookupConfidence.test.js. No drifted ADRs (none exist). [coverage=full]
Detector coverage: Detector: detect-swerve. Coverage: full git history (1108 commits, not shallow) walked for the 24-month window with workaround/revert/again/stale/compiler/z-index/tooltip greps; source grepped for folklore, catch-and-swallow, flags and wrapper chains; hotspots ResultsPhase, TableView, CardItem, useProcessing, QuotesContext, useSync, api/sync.js and styles.js read at the cited lines. No deterministic tool covers swerve debt. No flag graveyard and no catch-and-swallow cluster found (the few empty catches are fire-and-forget prefetch/history calls). Out of category, seen but not reported: (signage) CLAUDE.md says manual memo/useCallback were stripped and one useMemo remains, but TableRow, TableView and CardItem are memo()-wrapped and useSync.js uses useCallback; (code/signage) the apiRequest migration in b9afc5b was left incomplete: useProcessing.js:508 auto-group and QuotesContext.jsx:121 share fetch still hand-roll fetchWithTimeout and status handling and are not among the declared exceptions, and the status 410/404 branching there is api territory. The Feb 2026 TableView padding/scroll revert thrash (b24c1dd, 0b0cfb1, 55bf34f, f39343f) is old layout iteration with no surviving detour. No architecture-level cycle or layer violation observed. [coverage=full]
Detector coverage: Detector: detect-test. Coverage: NOT MEASURED. No coverage/lcov.info is committed and Pothole never runs the suite, so there is no hot-and-under-covered tool slice and no percentage is claimed; untested-behaviour findings rest on reading which production modules the 40 test files import and exercise. Assertion, skip, coupling and nondeterminism review is AI-only (no mutation testing, no flake detection, no run history). Read: every test file in src/ and api/. No .skip/.only/.todo/xit/xdescribe exists, and no retry setting in the vitest config (vite.config.js test block is globals only), so no stale-skip or retry findings. Minor nondeterminism noted, not filed: InputPhase.test.jsx and processingErrors.test.js reassign globalThis.requestIdleCallback / globalThis.localStorage without fully restoring them (file-local leakage only). Out of category, for detect-code: (1) src/hooks/useDndQuotes.js:59 undo calls removeFromCollection(collectionId, ids) with all dragged ids, including ones reported as skipped because they were already in the collection, so undo removes pre-existing memberships. (2) src/contexts/QuotesContext.jsx:136 object-form quotes from /api/share pass through unvalidated (q.id ? q : null) while the array form goes through validateShareQuote. (3) api/fetch-url.js checkHost resolves DNS and then fetch resolves again, a DNS-rebinding window (security/code). Signage: CLAUDE.md says manual React.memo was stripped, but TableView.jsx:107 and :280 use memo deliberately (commented in-file). [coverage=partial]
Tool coverage: Tools run: eslint-sonar (102 findings), jscpd (78 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (8 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 136 health findings: coverage is partial.
Coverage flags: unverified=0 partial-findings=21 missing-verdicts=0 never-scanned=0 stale-verdicts=0 unparseable=0 tool-coverage=partial
Category status: code=verified+full architecture=verified+full test=verified+partial dependency=verified+partial knowledge=verified+full build=verified+full api=verified+full security=verified+partial swerve=verified+full signage=verified+full
A category with 0 confirmed findings is "nothing confirmed", never "no debt". Read the coverage clauses above before drawing any conclusion from a count.

## Confirmed

Survived an adversarial Inspector. These are the register: everything downstream — scoring, work zones, issues — derives from this section only.

## PH-1149 /api/identify proxies the raw Anthropic message envelope while every other endpoint returns its own shape, and its consumer parses model text and an Anthropic error object the server never sends

```yaml
id: PH-1149
category: api
title: /api/identify proxies the raw Anthropic message envelope while every
  other endpoint returns its own shape, and its consumer parses model text and
  an Anthropic error object the server never sends
severity: major
traffic: 0.22087729473158527
confidence: confirmed
evidence:
  - api/identify.js:164
  - api/identify.js:79
  - api/auto-group.js:56
  - api/lookup.js:214
  - src/hooks/useProcessing.js:130
  - src/hooks/useProcessing.js:132
  - src/hooks/useProcessing.js:516
source:
  - detect-api
repair_cost: M
fingerprint: api:api/identify.js:identify-raw-anthropic-envelope
verdict_reason: "All refs resolve: identify.js:164 returns the raw Anthropic
  body while auto-group.js:56 returns {indices} and lookup.js:214 {results};
  identify.js:79 parseResults already parses the array server-side, and
  useProcessing.js:134-140 re-implements the same fence-strip and '[' repair.
  useProcessing.js:132 reads d.error.message, which no server path emits
  (non-2xx is thrown at :130 as 'API returned <status>', dropping the server's
  {error} text), whereas autoGroup at :516 reads err.error. Effect checked in
  utils/apiErrors.js: the daily-cap 429 is rendered as the generic 'Rate
  limited, wait a moment' message. Not the single-caller trap: the repo itself
  keeps a legacy identify request shape for cached PWA builds, so client and
  server do not ship in lockstep. Not documented as intentional; reachable on
  every AI batch. Major holds: hooks hotspot plus a shipped misleading error."
```

## PH-1150 /api/identify accepts two request shapes (items and legacy messages) with no exit condition for the legacy one

```yaml
id: PH-1150
category: api
title: /api/identify accepts two request shapes (items and legacy messages) with
  no exit condition for the legacy one
severity: minor
traffic: 0.12881854052041353
confidence: confirmed
evidence:
  - api/_schemas.js:29
  - api/_schemas.js:38
  - api/identify.js:129
  - api/identify.js:162
  - db4af86
source:
  - detect-api
repair_cost: S
fingerprint: api:api/_schemas.js:identify-legacy-messages-shape
verdict_reason: "_schemas.js:29-38 keeps the legacy messages[] shape beside
  items[], and identify.js:129/162 branch on it (legacy results uncached). The
  only stated exit is the schema comment 'until their service worker updates',
  with no date or removal criterion, and unlike the ?device_id= fallback it is
  declared in neither CLAUDE.md nor the survey's migrations. Worse than filed:
  the current build still sends the legacy field itself, since the
  InputPhase.jsx:131-134 pre-warm posts {messages: []}, so the old shape can
  never age out on its own. Checked the trap (no declared v1/v2 exit),
  documented (comment gives intent but no exit) and reachable (yes)."
```

## PH-1049 Supabase schema is applied by hand with no migration tooling; repo lagged production by six months and the file is not re-runnable

```yaml
id: PH-1049
category: build
title: Supabase schema is applied by hand with no migration tooling; repo lagged
  production by six months and the file is not re-runnable
severity: major
traffic: 0.07038251338668261
confidence: confirmed
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
verdict_reason: "Survived all four routes. evidence: migration.sql:2 is the
  paste-into-SQL-Editor instruction, :35 is a bare CREATE TRIGGER (no DROP/IF
  NOT EXISTS, so a re-run aborts), :96 is an appended ALTER ADD COLUMN;
  api/sync.js:99-106 retries the upsert without collections when the column is
  missing (a workaround for unknown prod schema state); git show 9c63bf5 adds
  api/share.js using shared_collections on 2026-03-08 while db4af86 (2026-09-27)
  says migration.sql now matches production. No trap matches; survey confirms
  single file, no migration tool, no recorded intent. Major holds: already
  worked around in code and drift has already happened."
```

## PH-1051 Node version is declared nowhere the builders read: no engines field or .nvmrc; CI hard-codes 22 independently

```yaml
id: PH-1051
category: build
title: "Node version is declared nowhere the builders read: no engines field or
  .nvmrc; CI hard-codes 22 independently"
severity: minor
traffic: 0.5119943795537377
confidence: confirmed
evidence:
  - package.json:1
  - .github/workflows/ci.yml:19
  - README.md:108
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:node-version-undeclared
verdict_reason: Survived all routes. package.json has no engines field and the
  repo has no .nvmrc/.node-version (ls -a); ci.yml:19 hard-codes node-version
  22; README.md:108 advertises Node 18+ while installed vite 8.3.5, eslint
  10.13.0 and jsdom 29.1.1 declare engines ^20.19 / >=22.12-ish. vercel.json
  sets no runtime, so the deploy Node version lives only in the dashboard. No
  trap or documented intent. The README 18+ wording itself is signage's half.
```

## PH-249 Local quote DB indexes 25 entries by un-normalized text, so their exact lookup can never match

```yaml
id: PH-249
category: code
title: Local quote DB indexes 25 entries by un-normalized text, so their exact
  lookup can never match
severity: major
traffic: 0.08245855696719873
confidence: confirmed
evidence:
  - src/data/localQuotes.js:3806
  - src/data/localQuotes.js:3834
  - src/data/localQuotes.js:694
  - src/data/localQuotes.js:2240
  - src/data/localQuotes.js:3795
  - commit 9b55e90 Added Russian support
  - commit 2815619 Updated helpers
source:
  - detect-code
repair_cost: S
fingerprint: code:src/data:local-map-keys-not-normalized
kind: duplication
repair: Build LOCAL_MAP, ENTRY_WORDSETS and WORD_INDEX from
  normalizeForLookup(entry.t) instead of the raw entry.t, and add a test that
  every data key round-trips through the normalizer.
verdict_reason: "All refutation routes failed: ran every LOCAL_DB entry through
  the module's own normalizeForLookup (localQuotes.js:3821) and exactly 25 keys
  change (23 Russian with ё/й, \"not penny’s boat\", \"spider-man\"); all 25
  MISS localLookup with exactOnly (the mode reIdentify/batchReIdentify use,
  useQuoteActions.js:111,180) and 11 also miss every fuzzy fallback.
  LOCAL_MAP/WORD_INDEX are built from raw entry.t (3806-3818). Survey excludes
  data rows but this is the index-building code. Note: 2815619 (15:00) predates
  9b55e90 (15:12) on 2026-02-23, so the Russian rows were added after the
  normalizer switch, not before; the defect is unaffected."
```

## PH-250 normalize() exists in three hand-synced copies; the server copy already lagged the client fix for three weeks

```yaml
id: PH-250
category: code
title: normalize() exists in three hand-synced copies; the server copy already
  lagged the client fix for three weeks
severity: minor
traffic: 0.0914958755602203
confidence: confirmed
evidence:
  - src/utils/textFormatting.js:142
  - api/_shared.js:207
  - src/data/localQuotes.js:3821
  - commit e985fb1 Helpers update
  - "commit a696b35 Refactor: extract shared hooks, consolidate patterns, break
    up ResultsPhase"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/utils:normalize-triplicated
kind: duplication
repair: Have localQuotes.js import normalize from utils/textFormatting.js, and
  move the shared body into one module that both src/ and api/ import, as
  logoPaths.js already is.
verdict_reason: "Three identical bodies verified: textFormatting.js:142
  normalize, api/_shared.js:207 normalizeForCache, localQuotes.js:3821
  normalizeForLookup. History holds: client went Unicode in e985fb1
  (2026-02-23); a696b35 (2026-03-15) is where _shared.js dropped the ASCII
  [^\\w\\s] strip. The sync comment and CLAUDE.md name only two copies, so
  documented intent does not cover the third, and a documented sync rule does
  not refute the cost claim. No trap matches; all copies are live."
```

## PH-251 Batch re-identify never got the pipeline's retry and failure reporting, and reports success when every batch fails

```yaml
id: PH-251
category: code
title: Batch re-identify never got the pipeline's retry and failure reporting,
  and reports success when every batch fails
severity: major
traffic: 0.22087729473158527
confidence: confirmed
evidence:
  - src/hooks/useQuoteActions.js:212
  - src/hooks/useQuoteActions.js:219
  - src/hooks/useQuoteActions.js:128
  - src/hooks/useProcessing.js:260
  - src/hooks/useProcessing.js:321
  - "commit e12a8f5 feat: pre-warm API, partial batch retry, and integration
    tests"
source:
  - detect-code
repair_cost: M
fingerprint: code:src/hooks:reidentify-batch-loop-diverged
kind: duplication
repair: Extract the batch-with-retry loop from useProcessing.handleApiBatch into
  a shared helper that returns {results, failed}, use it in batchReIdentify, and
  show an error toast for the failed count instead of the unconditional success
  toast.
verdict_reason: useQuoteActions.js:212 catch swallows every non-abort batch
  error ('Continue with remaining batches') and line 219 shows an unconditional
  success toast 'Re-identified N quotes', even when every call failed. No retry
  and no failed-count reporting, unlike useProcessing.js:260-282 (retry once,
  API_ERROR with affected count) and :321 FAILED_ENTRIES. Single reIdentify
  (line 128) does nothing visible on an empty result array. Not documented as
  intentional, reachable from BulkBar Re-identify.
```

## PH-252 MiniHeader missed the mobile header redesign: duplicate Add button and no layout menu on mobile

```yaml
id: PH-252
category: code
title: "MiniHeader missed the mobile header redesign: duplicate Add button and
  no layout menu on mobile"
severity: minor
traffic: 0.42808818545053934
confidence: confirmed
evidence:
  - src/components/MiniHeader.jsx:59
  - src/components/HeaderBar.jsx:67
  - src/components/HeaderBar.jsx:85
  - src/components/ResultsPhase.jsx:1169
  - "commit b3c39ea Facelift: landing input card, quote table rows, mobile cards"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/components:miniheader-mobile-diverged
kind: duplication
repair: Hide MiniHeader's "+ Add" button when isMobile and add the mobile Layout
  section (ViewMenuItems) to its overflow menu, ideally by having both headers
  render one shared overflow-menu component.
verdict_reason: "MiniHeader.jsx:59 renders '+ Add' unconditionally, including on
  mobile, while ResultsPhase.jsx:1169 shows the mobile FAB whenever !showBulkBar
  && !showAddMore, and MiniHeader renders whenever !headerVisible
  (ResultsPhase:779), so both appear together after scrolling. HeaderBar (lines
  67-68 of the cited area, about 85) has a mobile Layout/ViewMenuItems section
  that MiniHeader's mobile overflow (65-71) lacks, and the desktop ViewToggle is
  hidden on mobile. b3c39ea did not touch MiniHeader.jsx: its last commit is
  5147078, from before b3c39ea."
```

## PH-253 Blank-source guard was added to inline save only; the full editor still saves an empty source as high confidence

```yaml
id: PH-253
category: code
title: Blank-source guard was added to inline save only; the full editor still
  saves an empty source as high confidence
severity: minor
traffic: 0.1820996834885893
confidence: confirmed
evidence:
  - src/hooks/useEditState.js:84
  - src/hooks/useEditState.js:106
  - src/components/EditForm.jsx:169
  - "commit b3c39ea Facelift: landing input card, quote table rows, mobile cards"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/hooks:blank-source-guard-inline-only
kind: duplication
repair: Trim the source in saveEdit and keep the existing source (or skip the
  confidence bump) when it is blank, so both save paths share one rule.
verdict_reason: useEditState.js:84 saveEdit only guards blank text and writes
  source as given, untrimmed and possibly empty, with confidence 'high'.
  saveInlineField (:106) has the blank-source no-op that b3c39ea's message
  describes. EditForm.jsx:169 passes source straight to onSave, wired to
  saveEdit in TableView:154 and CardItem:107/110. isUnknownSource treats '' as
  unknown, so the quote reads as unknown but is high-confidence. Real, minor.
```

## PH-254 identifyBatch discards the server error message, so the AI daily-cap notice shows as a generic 'wait a moment' rate limit

```yaml
id: PH-254
category: code
title: identifyBatch discards the server error message, so the AI daily-cap
  notice shows as a generic 'wait a moment' rate limit
severity: minor
traffic: 0.22087729473158527
confidence: confirmed
evidence:
  - src/hooks/useProcessing.js:130
  - src/hooks/useProcessing.js:516
  - src/utils/api.js:72
  - src/utils/apiErrors.js:9
  - api/identify.js:136
  - "commit db4af86 Security hardening: AI spend cap, per-endpoint rate limits,
    SSRF, cache poisoning, sync ID"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/hooks:identify-batch-drops-server-error
kind: duplication
repair: In identifyBatch, read the JSON body on a non-OK response and throw its
  error message with .status attached, as apiRequest does, and let
  describeApiError prefer a server-supplied message.
verdict_reason: useProcessing.js:130 throws only 'API returned <status>' with no
  body read and no .status. apiErrors.js:9 maps any 429 to 'Wait a moment and
  try again'. api/identify.js:134-136 returns the 429 AI_DAILY_LIMIT 'try again
  tomorrow' message, which is lost. The handleApiBatch retry
  (useProcessing.js:260ff) re-calls on that 429. apiRequest (api.js:72) and
  autoGroup (:516) do read the body. Divergence verified, no documented reason.
```

## PH-255 styles.js is a god file: every component's styles, the palette and global CSS in one 1,000-line module that changes with everything

```yaml
id: PH-255
category: code
title: "styles.js is a god file: every component's styles, the palette and
  global CSS in one 1,000-line module that changes with everything"
severity: major
traffic: 1
confidence: confirmed
evidence:
  - src/components/styles.js:3
  - src/components/styles.js:31
  - src/components/styles.js:716
  - src/components/styles.js:1015
source:
  - detect-code
repair_cost: L
fingerprint: code:src/components:styles-js-god-file
kind: terrible
repair: Keep tokens and baseCSS in styles.js, and move each component's style
  object next to its component (as inputPhaseStyles.js already does for the
  landing page), one component per PR.
verdict_reason: "Facts verified: 1,022 lines; 215 commits in the window, the
  most of any file per the survey; 4 unrelated export groups (palette at :3,
  baseCSS at :31 to about :685, syncPillStyles, styles at :716, cardStyles at
  :1015); survey names it the change-coupling hub. Not generated, vendored or a
  barrel, so no trap. The CLAUDE.md single-file convention is documented intent
  but refutes only 'accidental', not the cost claim. Caveat for the gate: about
  69% of commits are Claude sessions plus one human, so the cost is mainly
  two-file edits per UI change and parallel-session conflicts, not a large team
  serialising."
```

## PH-649 legacy-peer-deps in .npmrc outlived its exit criterion and now masks an invalid peer on the React Compiler build path

```yaml
id: PH-649
category: dependency
title: legacy-peer-deps in .npmrc outlived its exit criterion and now masks an
  invalid peer on the React Compiler build path
severity: minor
traffic: 0.5119943795537377
confidence: confirmed
evidence:
  - .npmrc:1
  - package.json:55
  - package.json:58
  - vite.config.js:3
  - vite.config.js:81
  - 5b2f20c
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:.npmrc:stale-legacy-peer-deps-masks-peer-conflict
partial: true
verdict_reason: "All routes failed: commit 5b2f20c message states the exit
  criterion (remove once vite-plugin-pwa 1.3.0 ships vite@^8 peer); installed
  vite-plugin-pwa is 1.3.0 with vite ^8.0.0 peer; npm ls exits ELSPROBLEMS with
  @rolldown/plugin-babel@0.3.0 invalid for @vitejs/plugin-react@6.1.2 peer
  ^0.1.7||^0.2.0 (package.json:55/58, vite.config.js:3/81-82 is that pipeline).
  No trap matches; the reason is recorded only in a commit message, not in
  .npmrc, CLAUDE.md or the survey, and documented intent would not refute the
  masking cost anyway."
```

## PH-650 @babel/eslint-parser and @babel/preset-react are declared but nothing loads them

```yaml
id: PH-650
category: dependency
title: "@babel/eslint-parser and @babel/preset-react are declared but nothing
  loads them"
severity: minor
traffic: 0.5119943795537377
confidence: confirmed
evidence:
  - package.json:53
  - package.json:54
  - eslint.config.js:7
  - vite.config.js:82
  - c75536e
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:unused-babel-parser-and-preset
partial: true
verdict_reason: "All routes failed: eslint.config.js sets no
  languageOptions.parser (espree with ecmaFeatures.jsx); vite.config.js:82
  passes only reactCompilerPreset(); grep of repo configs/scripts/CI finds no
  other reference besides package.json:53-54; lockfile scan shows no package
  depends on or peers either one; c75536e message confirms they were added for a
  JSX-linting role nothing now fills. Not a two-packages or pin trap; nothing
  documents keeping them."
```

## PH-949 CLAUDE.md says manual memoization was stripped, omitting the three React.memo wrappers the drag path depends on

```yaml
id: PH-949
category: knowledge
title: CLAUDE.md says manual memoization was stripped, omitting the three
  React.memo wrappers the drag path depends on
severity: minor
traffic: 0.5664513387639842
confidence: confirmed
evidence:
  - CLAUDE.md:291
  - CLAUDE.md:365
  - src/components/TableView.jsx:103
  - src/components/TableView.jsx:280
  - src/components/CardItem.jsx:18
  - 86c0c55
  - "27e7971"
  - d581d56
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:CLAUDE.md:memo-exceptions-unrecorded
severity_was: major
verdict_reason: "All refs resolve: CLAUDE.md:291 forbids manual React.memo and
  :365 claims manual memo was stripped, yet TableView.jsx:107/280 and
  CardItem.jsx:21 wrap in memo; commits 86c0c55 (strip) then 27e7971/d581d56
  (restore for drag jank) show the cost landed. No trap or ESLint-requirement
  exception covers it. Lowered major->minor: read-site comments
  (TableView.jsx:103, :276, CardItem.jsx:18) state React.memo is required and
  why, so a reader editing those components is warned; only the project-level
  doc is stale, not reliably misleading."
```

## PH-549 Client-controlled prompt fields let any caller plant permanent high-confidence attributions in the shared quote cache

```yaml
id: PH-549
category: security
title: Client-controlled prompt fields let any caller plant permanent
  high-confidence attributions in the shared quote cache
severity: major
traffic: 0.22087729473158527
confidence: confirmed
evidence:
  - api/identify.js:67
  - api/identify.js:93
  - api/identify.js:117
  - api/_schemas.js:17
  - api/lookup.js:185
  - src/hooks/useProcessing.js:169
source:
  - detect-security
repair_cost: M
fingerprint: security:api/identify.js:identify-cache-poisoning-via-prompt
partial: true
verdict_reason: Survived evidence/trap/documented/unreachable. identify.js:67-73
  interpolates client text/hint/candidate verbatim into the prompt; cacheResults
  (identify.js:93-119) upserts model output keyed by normalized item text and
  skips rows already high (line 116-117), so a poisoned high row is never
  corrected; lookup.js:184-186 serves any cache hit before Wikiquote and its own
  writeCache only runs on a miss; useProcessing.js:169-189 trusts high lookup
  results with no AI step. The identify.js:89-92 comment claims clients cannot
  plant attributions, which this contradicts. Integrity exposure to all users,
  so major holds under the exposure carve-out.
```

## PH-550 fetch-url SSRF guard has a check-then-fetch DNS rebinding window and returns the response body

```yaml
id: PH-550
category: security
title: fetch-url SSRF guard has a check-then-fetch DNS rebinding window and
  returns the response body
severity: minor
traffic: 0.06340544648552357
confidence: confirmed
evidence:
  - api/fetch-url.js:33
  - api/fetch-url.js:77
  - api/fetch-url.js:82
  - api/fetch-url.js:149
source:
  - detect-security
repair_cost: M
fingerprint: security:api/fetch-url.js:fetch-url-dns-rebinding-window
partial: true
verdict_reason: "Evidence resolves: checkHost resolves via dns lookup
  (fetch-url.js:45) and fetch() re-resolves independently (line 82), per hop
  (line 77); body text is returned to caller (line 149). documented route does
  not refute: the comment at fetch-url.js:33-34 acknowledges the window as a
  known open gap, it does not argue it costs nothing. Minor is appropriate given
  rate limit and rebinding timing."
```

## PH-551 migration.sql cannot be re-applied to an existing database, so later appended security statements only land by hand

```yaml
id: PH-551
category: security
title: migration.sql cannot be re-applied to an existing database, so later
  appended security statements only land by hand
severity: minor
traffic: 0.07038251338668261
confidence: confirmed
evidence:
  - supabase/migration.sql:35
  - supabase/migration.sql:96
  - supabase/migration.sql:117
  - api/sync.js:51
  - api/sync.js:104
source:
  - detect-security
repair_cost: S
fingerprint: security:supabase/migration.sql:migration-not-replayable
partial: true
verdict_reason: "Evidence resolves: every statement in supabase/migration.sql is
  guarded (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS) except CREATE TRIGGER at
  line 35, so a re-run against an existing DB errors and the multi-statement run
  rolls back the appended RLS enable (line 101) and policy drop (line 118). No
  CI job touches the schema (.github/workflows/ci.yml has no supabase/postgres
  step), no documented reset path, and api/sync.js:51 and :103 keep
  collections-column fallbacks for exactly this drift. Fresh-from-empty replay
  works, so this is the re-apply variant of Case 4, not a squashed-baseline
  trap."
```

## PH-552 Global AI daily cap can be exhausted by a single IP, turning the spend guard into a site-wide outage

```yaml
id: PH-552
category: security
title: Global AI daily cap can be exhausted by a single IP, turning the spend
  guard into a site-wide outage
severity: minor
traffic: 0.12881854052041353
confidence: confirmed
evidence:
  - api/_shared.js:166
  - api/_shared.js:180
  - api/_shared.js:188
  - api/identify.js:135
  - api/auto-group.js:35
source:
  - detect-security
repair_cost: M
fingerprint: security:api/_shared.js:ai-daily-cap-single-client-exhaustion
partial: true
verdict_reason: "Evidence resolves: one global 'global:ai-daily' bucket
  (_shared.js:187-189, default 2000 at :180) shared by identify
  (identify.js:135) and auto-group (auto-group.js:35) with only per-minute
  per-IP limits (identify 30, auto-group 15 at _shared.js:166-170); 45/min from
  one IP exhausts 2000 in about 45 minutes and then every user gets
  AI_DAILY_LIMIT. The _shared.js:176-179 comment and CLAUDE.md document the cap
  as a spend bound but say nothing about single-client exhaustion, so documented
  does not refute the cost."
```

## PH-449 CLAUDE.md says manual React.memo/useCallback were stripped, but hot list components depend on React.memo

```yaml
id: PH-449
category: signage
title: CLAUDE.md says manual React.memo/useCallback were stripped, but hot list
  components depend on React.memo
severity: minor
traffic: 0.5664513387639842
confidence: confirmed
evidence:
  - CLAUDE.md:291
  - CLAUDE.md:365
  - src/components/TableView.jsx:103
  - src/components/TableView.jsx:107
  - src/components/TableView.jsx:280
  - src/components/CardItem.jsx:21
  - src/hooks/useSync.js:64
source:
  - detect-signage
repair_cost: S
fingerprint: signage:CLAUDE.md:claude-md-memo-stripped-claim-false
severity_was: major
verdict_reason: "evidence resolves: CLAUDE.md:365 says manual
  memo/useCallback/useMemo have been stripped and :291 names only one surviving
  useMemo, yet TableView.jsx:107/:280 and CardItem.jsx:21 wrap in memo() and
  useSync.js:64/69/138/162 use useCallback; trap/documented checked: not jargon,
  not an ADR. Lowered major->minor: each memo() carries an adjacent 'React.memo
  is required' comment (TableView.jsx:103,276; CardItem.jsx:18), so the claimed
  harm of an agent stripping them as stragglers is mitigated in-file; the doc
  contradiction itself is real."
```

## PH-450 README points to QuotesContext.jsx as the global quote/collection state, but it provides no value; state lives in the unlisted Zustand store

```yaml
id: PH-450
category: signage
title: README points to QuotesContext.jsx as the global quote/collection state,
  but it provides no value; state lives in the unlisted Zustand store
severity: minor
traffic: 0.18109258775720635
confidence: confirmed
evidence:
  - README.md:88
  - src/contexts/QuotesContext.jsx:1
  - src/contexts/QuotesContext.jsx:2
  - src/stores/quotesStore.js:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-quotes-context-global-state
verdict_reason: "evidence resolves: README.md:88 labels QuotesContext.jsx
  'Global state: quotes, collections, sync' and the README tree omits
  src/stores/; QuotesContext.jsx:1-2 says it is side-effects-only and state
  lives in useQuotesStore (quotesStore.js:1). Demonstrable doc/code
  contradiction; no trap, not marked future/optional."
```

## PH-451 README prerequisite says Node.js 18+, but Vite 8 requires Node ^20.19 or >=22.12

```yaml
id: PH-451
category: signage
title: README prerequisite says Node.js 18+, but Vite 8 requires Node ^20.19 or
  >=22.12
severity: minor
traffic: 0.5119943795537377
confidence: confirmed
evidence:
  - README.md:108
  - package.json:64
  - .github/workflows/ci.yml:19
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-node-version-too-old
verdict_reason: "evidence resolves: README.md:108 says Node.js 18+;
  package.json:64 pins vite ^8.3.5 whose installed engines field is ^20.19.0 ||
  >=22.12.0; ci.yml:19 uses Node 22. Stale prerequisite, no trap applies."
```

## PH-452 CLAUDE.md says eslint-plugin-react-hooks must be installed separately, but it is already a devDependency

```yaml
id: PH-452
category: signage
title: CLAUDE.md says eslint-plugin-react-hooks must be installed separately,
  but it is already a devDependency
severity: cosmetic
traffic: 0.5119943795537377
confidence: confirmed
evidence:
  - CLAUDE.md:332
  - package.json:61
  - eslint.config.js:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:CLAUDE.md:claude-md-react-hooks-plugin-install-note-stale
verdict_reason: "evidence resolves: CLAUDE.md:332 says eslint-plugin-react-hooks
  must be installed separately, but package.json:61 lists it as a devDependency
  (7.1.1 installed) and eslint.config.js:1 imports it; npm install provides it.
  Stale note, no trap applies."
```

## PH-349 Pseudo-element tooltip routed around per clip container with :has() overflow overrides and z-index lifts

```yaml
id: PH-349
category: swerve
title: Pseudo-element tooltip routed around per clip container with :has()
  overflow overrides and z-index lifts
severity: major
traffic: 1
confidence: confirmed
evidence:
  - src/components/styles.js:302
  - src/components/styles.js:304
  - src/components/styles.js:307
  - src/components/styles.js:446
  - commit ceba665 Fix tooltip clipping in notification bars
  - commit c1ac354 Fix tooltip linger artifact in notification bars
  - commit fcb2fed Fix tooltip fade-out direction
  - commit d7a5a4d Fix card tooltip being clipped by sibling card stacking
    contexts
  - commit fc4cf3f Revert card tooltip to above; bump wrapper z-index above
    sticky bar
  - commit 8db8f7d Revert Upgrade tooltips to @floating-ui
source:
  - detect-swerve
repair_cost: M
fingerprint: swerve:src/components:ui-tip-clipping-detours
verdict_reason: "All refs resolve: styles.js:302/304 :has(.ui-tip:hover)
  overflow:visible!important on sidebar-rail and notif-bar-wrapper, :307
  zero-duration fade to hide the clip artifact, :446 qcard-wrap z-index lift;
  six tooltip-clipping fixes on 2026-04-17
  (ceba665,c1ac354,fcb2fed,38cc3f3,d7a5a4d,fc4cf3f) are a workaround cluster on
  hot styles.js. Not a trap (no exit condition, repeated). CLAUDE.md documents
  the sidebar-rail rule and the native-title carve-out, which refutes
  'unexplained' but not the per-container cost claimed. Caveat: 8db8f7d reverted
  a bundled multi-change commit (054e74e also touched sync, masonry, view
  transitions), so it is weak evidence that the portal approach itself was
  rejected."
```

## PH-350 Drag-and-drop list rendering patched around the React Compiler with restored memo() and use-no-memo opt-outs

```yaml
id: PH-350
category: swerve
title: Drag-and-drop list rendering patched around the React Compiler with
  restored memo() and use-no-memo opt-outs
severity: major
traffic: 0.5664513387639842
confidence: confirmed
evidence:
  - src/components/TableView.jsx:104
  - src/components/TableView.jsx:276
  - src/components/TableView.jsx:289
  - src/components/CardItem.jsx:18
  - src/components/ResultsPhase.jsx:60
  - src/hooks/useDndQuotes.js:38
  - commit 27e7971 Restore React.memo on TableRow to fix drag jank in table view
  - commit d581d56 Restore React.memo on CardItem to fix card view drag jank
  - "commit f0d1495 fix: eliminate table shake during drag-and-drop"
  - commit 905154e fix empty virtualized list after view switch
  - commit 845af57 Fix drag-and-drop gaps caused by virtualizer absolute
    positioning
source:
  - detect-swerve
repair_cost: L
fingerprint: swerve:src/components:dnd-virtualizer-compiler-optouts
verdict_reason: Refs resolve (TableView.jsx:104/276 are the 'memo is required'
  comment heads for memo() at 107/280; 289 and ResultsPhase.jsx:60 are 'use no
  memo'; CardItem.jsx:18 comment + memo at 21; useDndQuotes.js:38 setOverDragId
  on every dragover, state held at useDndQuotes.js:16 and threaded through
  ResultsPhase.jsx:253/1040). Commits 27e7971/d581d56/f0d1495 restored memo the
  day after 86c0c55 stripped it, each citing overDragId re-renders, and the
  cause was never moved. 'use no memo' is documented in CLAUDE.md but memo()
  restorations contradict the declared policy, so documented route does not
  apply; hot files, cluster of detours.
```

## PH-849 useSync.test.js never imports useSync: it calls a mocked global fetch and checks config constants

```yaml
id: PH-849
category: test
title: "useSync.test.js never imports useSync: it calls a mocked global fetch
  and checks config constants"
severity: major
traffic: 0.1728413322246163
confidence: confirmed
evidence:
  - src/hooks/__tests__/useSync.test.js:3-5
  - src/hooks/__tests__/useSync.test.js:26-38
  - src/hooks/__tests__/useSync.test.js:131-149
  - src/hooks/useSync.js:93-159
source:
  - detect-test
repair_cost: L
fingerprint: test:src/hooks/__tests__/useSync.test.js:sync-test-exercises-fetch-mock-not-hook
repair: Render useSync with renderHook inside a QueryClientProvider, stub
  apiRequest, and assert on store syncStatus, the debounced push payload, the
  empty-collection guard and the onSyncError throttle instead of on fetch
  itself.
partial: true
verdict_reason: "evidence holds: useSync.test.js:3-5 admits re-implementation;
  every test calls its own vi.fn fetch (27-38) and 131-149 only range-check
  config constants; no test file imports useSync (grep), so schedulePush guard
  at useSync.js:153, onMutate/onError throttle (93-133) never run. No trap
  matches (not a shared-helper or explicit doesNotThrow test)."
```

## PH-850 processingErrors cloud-sync block asserts the behaviour of its own fetch mock, not of any sync code

```yaml
id: PH-850
category: test
title: processingErrors cloud-sync block asserts the behaviour of its own fetch
  mock, not of any sync code
severity: minor
traffic: 0.015986939294133067
confidence: confirmed
evidence:
  - src/hooks/__tests__/processingErrors.test.js:248-345
source:
  - detect-test
repair_cost: S
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:cloud-sync-block-tests-fetch-mock
kind: duplication
repair: Delete the cloud sync describe block and cover sync failure and
  reconnect through the real useSync hook in useSync.test.js.
partial: true
verdict_reason: "evidence holds: processingErrors.test.js:248-345 imports no
  sync module; 249-256 recomputes 2000*2^n inline, 258-344 call a
  rejecting/resolving fetch mock directly and assert on it; 264 uses the legacy
  ?device_id= form. No trap or documented intent."
```

## PH-851 batch-continuation test asserts less than its comments claim and stubs a removed /api/cache endpoint

```yaml
id: PH-851
category: test
title: batch-continuation test asserts less than its comments claim and stubs a
  removed /api/cache endpoint
severity: minor
traffic: 0.015986939294133067
confidence: confirmed
evidence:
  - src/hooks/__tests__/processingErrors.test.js:168-173
  - src/hooks/__tests__/processingErrors.test.js:87
  - src/hooks/__tests__/processingErrors.test.js:152
source:
  - detect-test
repair_cost: S
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:weak-batch-continuation-assertions
repair: Assert identifyCallCount is exactly 3, failedEntries has exactly 10
  items and setQuotes received the two batch-2 quotes, and drop the dead
  /api/cache stubs.
partial: true
verdict_reason: "evidence: processingErrors.test.js:168-169 comment says at
  least 3 identify calls but asserts >=2, and 171 asserts failedEntries >0 not
  10; api/ has no cache endpoint and no non-test source references /api/cache.
  Note: the /api/cache stub lines are 86 and 154 (refs 87/152 are adjacent
  lines), drift not a mismatch of claim."
```

## PH-852 ResultsPhase filter and sort tests re-implement Array.filter/sort inline; the real sort in useViewPreferences is untested

```yaml
id: PH-852
category: test
title: ResultsPhase filter and sort tests re-implement Array.filter/sort inline;
  the real sort in useViewPreferences is untested
severity: major
traffic: 0.12424325814938902
confidence: confirmed
evidence:
  - src/components/__tests__/ResultsPhase.test.jsx:260-337
  - src/hooks/useViewPreferences.js:120-134
  - src/hooks/__tests__/useViewPreferences.test.js:13-70
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/__tests__/ResultsPhase.test.jsx:inline-sort-filter-mirror-tests
repair: Replace the seven inline tests with renderHook(useViewPreferences) cases
  that set catFilter, favFilter and sortBy and assert on the returned filtered
  list.
partial: true
verdict_reason: "evidence holds: ResultsPhase.test.jsx:259-337 sorts/filters
  local arrays with test-written comparators; useViewPreferences.js:127-134
  differs (strip+sensitivity base for alpha, CONF_ORDER||0 vs ??1);
  useViewPreferences.test.js only checks sortBy default (line 26), no sort
  branch exercised."
```

## PH-853 HeaderBar test asserts a hard-coded active style that no longer matches styles.addMoreBtnActive

```yaml
id: PH-853
category: test
title: HeaderBar test asserts a hard-coded active style that no longer matches
  styles.addMoreBtnActive
severity: minor
traffic: 1
confidence: confirmed
evidence:
  - src/components/__tests__/HeaderBar.test.js:8-33
  - src/components/styles.js:851
  - src/components/HeaderBar.jsx:46
source:
  - detect-test
repair_cost: S
fingerprint: test:src/components/__tests__/HeaderBar.test.js:stale-local-style-copy
repair: Render HeaderBar with showAddMore true and false and assert the Add
  quotes button style against styles.addMoreBtnActive, or delete the file.
partial: true
verdict_reason: "evidence holds: HeaderBar.test.js:8-33 asserts a local
  activeOverride with --cp-accent; styles.js:851 addMoreBtnActive is
  --cp-text/--cp-border and HeaderBar.jsx:46 spreads that, so the test cannot
  fail and describes the old design."
```

## PH-854 CollectionDupeModal test named for the 800ms auto-close only checks the module loads; the rest mirror logic inline

```yaml
id: PH-854
category: test
title: CollectionDupeModal test named for the 800ms auto-close only checks the
  module loads; the rest mirror logic inline
severity: minor
traffic: 0.08333458252801561
confidence: confirmed
evidence:
  - src/components/__tests__/CollectionDupeModal.test.js:5-13
  - src/components/__tests__/CollectionDupeModal.test.js:16-69
  - src/components/CollectionDupeModal.jsx:26-31
source:
  - detect-test
repair_cost: S
fingerprint: test:src/components/__tests__/CollectionDupeModal.test.js:misnamed-and-mirror-tests
repair: Render the modal with fake timers, resolve every group via its Keep
  buttons, advance 800ms and assert onClose and onDeleteQuotes were called with
  the non-kept ids.
partial: true
verdict_reason: "evidence holds: CollectionDupeModal.test.js:5-13 only checks
  mod.default is a function (comment concedes delay unchecked); 16-69 evaluate
  inline ternary/reduce/filter on literals; CollectionDupeModal.jsx:26-31
  setTimeout(onClose,800) never rendered."
```

## PH-855 AddMorePanel, ShareImageModal and TableView tests assert on logic copied into the test file

```yaml
id: PH-855
category: test
title: AddMorePanel, ShareImageModal and TableView tests assert on logic copied
  into the test file
severity: minor
traffic: 0.0046501728851701726
confidence: confirmed
evidence:
  - src/components/__tests__/AddMorePanel.test.js:12-34
  - src/components/__tests__/ShareImageModal.test.js:3-38
  - src/components/__tests__/TableView.test.js:13-37
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/__tests__:mirror-copy-tests
kind: duplication
repair: Render each component (or export the helper from the component) and
  assert on the real output; delete tests that only exercise a copy.
partial: true
verdict_reason: "evidence holds: AddMorePanel.test.js:12-34,
  ShareImageModal.test.js:3-38 and TableView.test.js:13-37 each test a local
  copy of tabStyle (AddMorePanel.jsx:105), cursor/opacity
  (ShareImageModal.jsx:82-83) and the isDragging guard (TableView.jsx:129-131);
  none render the component."
```

## PH-856 App.test.jsx mocks every phase and hook and never drives a phase transition in the hottest file

```yaml
id: PH-856
category: test
title: App.test.jsx mocks every phase and hook and never drives a phase
  transition in the hottest file
severity: major
traffic: 0.75153996915182
confidence: confirmed
evidence:
  - src/components/__tests__/App.test.jsx:36-170
  - src/components/__tests__/App.test.jsx:214-258
  - src/components/App.jsx:84
  - src/components/App.jsx:170
source:
  - detect-test
repair_cost: L
fingerprint: test:src/components/__tests__/App.test.jsx:phase-orchestration-untested
repair: Add tests that click the mocked process-btn and review-modal
  Confirm/Cancel buttons already wired in the file and assert which phase
  renders next, plus the append-mode return to input.
partial: true
verdict_reason: "evidence holds: App.test.jsx has no fireEvent/userEvent/click
  anywhere; all phase tests assert initial render only (186-213),
  draft-persistence tests (236-258) assert only render. App.jsx:84
  sync-to-results transition is driven only by pre-seeded store. Minor ref note:
  App.jsx:170 is clearParentState (start fresh -> input), not append mode; core
  claim unaffected."
```

## PH-857 useProcessing duplicate-detection pre-pass and handleDupesContinue never run: pipeline tests stub similarity to 0 and localLookup to null

```yaml
id: PH-857
category: test
title: "useProcessing duplicate-detection pre-pass and handleDupesContinue never
  run: pipeline tests stub similarity to 0 and localLookup to null"
severity: major
traffic: 0.22087729473158527
confidence: confirmed
evidence:
  - src/hooks/useProcessing.js:360-420
  - src/hooks/useProcessing.js:146-166
  - src/hooks/__tests__/processingErrors.test.js:6-17
  - src/hooks/__tests__/lookupConfidence.test.js:6-17
source:
  - detect-test
repair_cost: L
fingerprint: test:src/hooks/useProcessing.js:dupe-prepass-and-local-lookup-untested
repair: Add renderHook tests that leave similarityFromKeys real, feed two
  near-identical entries plus an append-mode existing quote, and assert
  SHOW_DUPES fires and that handleDupesContinue keeps or skips entries per
  decision; add one with a localLookup stub that returns a match.
partial: true
verdict_reason: "evidence holds: processingErrors.test.js:6-17 and
  lookupConfidence.test.js:6-17 stub localLookup->null and
  similarity/similarityFromKeys->0; no test feeds duplicate entries,
  handleDupesContinue appears only as an App.test mock, useProcessing.test.js
  imports only the reducer. useProcessing.js:146-166 match branch and 360-420
  SHOW_DUPES/continuation are unexecuted."
```

## PH-858 QuotesContext share-link decoding of untrusted URL data has no test

```yaml
id: PH-858
category: test
title: QuotesContext share-link decoding of untrusted URL data has no test
severity: minor
traffic: 0.18109258775720635
confidence: confirmed
evidence:
  - src/contexts/QuotesContext.jsx:44-56
  - src/contexts/QuotesContext.jsx:117-162
  - src/components/__tests__/App.test.jsx:163
source:
  - detect-test
repair_cost: L
fingerprint: test:src/contexts/QuotesContext.jsx:share-decode-untested
repair: Unit-test the exported safeDecodeShareData with valid, oversized,
  non-array, malformed base64 and over-MAX_SHARE_ITEMS input, and test the
  public-link branch with fetchWithTimeout stubbed to 404, 410 and malformed
  bodies.
partial: true
verdict_reason: "evidence holds: safeDecodeShareData (QuotesContext.jsx:44-56)
  is exported and pure but grep finds no test importing it or
  validateShareQuote; the only test reference mocks QuotesContext out
  (App.test.jsx:163); the /c/<id> branch 117-162 is unexecuted."
```

## PH-859 api/sync.js server-side merge, tombstone deletion and collections-column fallback have no test

```yaml
id: PH-859
category: test
title: api/sync.js server-side merge, tombstone deletion and collections-column
  fallback have no test
severity: minor
traffic: 0.07038251338668261
confidence: confirmed
evidence:
  - api/sync.js:5-31
  - api/sync.js:80-115
source:
  - detect-test
repair_cost: L
fingerprint: test:api/sync.js:server-merge-untested
repair: Export mergeQuotes and unit-test last-write-wins,
  tombstone-newer-than-quote deletion and missing updatedAt; then test the POST
  handler with a fake Supabase that rejects the collections column once.
partial: true
verdict_reason: "evidence holds: api/__tests__ imports only lookup.js,
  _shared.js, identify.js, fetch-url.js, share-page.js and _shareData.js;
  mergeQuotes (sync.js:5-31) is module-private and the collections-column retry
  (sync.js:99-104) is untested."
```

## PH-860 withApiHandler origin and CSRF rejection paths are never exercised; every mock request is valid

```yaml
id: PH-860
category: test
title: withApiHandler origin and CSRF rejection paths are never exercised; every
  mock request is valid
severity: minor
traffic: 0.0914958755602203
confidence: confirmed
evidence:
  - api/_shared.js:90-99
  - api/_shared.js:253-258
  - api/__tests__/security.test.js:27-38
source:
  - detect-test
repair_cost: S
fingerprint: test:api/_shared.js:auth-gate-reject-paths-untested
repair: Add security tests that call a wrapped handler with a foreign Origin, a
  spoofed subdomain Referer, and a missing X-Requested-With header and assert
  403 without the handler running.
partial: true
verdict_reason: "evidence holds: security.test.js:27-38 mockReq always sets an
  allowed origin and x-requested-with and no test mutates headers;
  validateOrigin is never called in tests, so _shared.js:90-99 referer parsing
  and the 403 branches at 256-257 never run."
```

## PH-861 fetch-url per-hop SSRF re-check in the manual redirect loop is untested

```yaml
id: PH-861
category: test
title: fetch-url per-hop SSRF re-check in the manual redirect loop is untested
severity: minor
traffic: 0.06340544648552357
confidence: confirmed
evidence:
  - api/fetch-url.js:72-105
  - api/__tests__/security.test.js:154-178
source:
  - detect-test
repair_cost: L
fingerprint: test:api/fetch-url.js:redirect-hop-ssrf-untested
repair: Test the handler with a fetch stub returning a 302 to
  http://169.254.169.254/ and assert a 400 with the redirect-blocked message,
  plus non-http protocol and too-many-redirects cases.
partial: true
verdict_reason: "evidence holds: security.test.js:154-178 calls only
  isPrivateAddress/checkHost; the fetch-url default handler (redirect loop
  fetch-url.js:72-105, per-hop recheck, protocol and hop-cap rejections) is
  never invoked in any test."
```

## PH-862 Collection CRUD in quotesStore and its consumers (useDndQuotes drop/reorder, CollectionsSidebar) have no tests

```yaml
id: PH-862
category: test
title: Collection CRUD in quotesStore and its consumers (useDndQuotes
  drop/reorder, CollectionsSidebar) have no tests
severity: minor
traffic: 0.32016782885685596
confidence: confirmed
evidence:
  - src/stores/quotesStore.js:218-300
  - src/hooks/useDndQuotes.js:41-73
  - src/components/CollectionsSidebar.jsx:312-345
  - src/stores/__tests__/quotesStore.test.js:16-74
source:
  - detect-test
repair_cost: L
fingerprint: test:src/stores/quotesStore.js:collection-crud-untested
repair: Add store tests for create (duplicate and invalid names), rename,
  delete, addToCollection added/skipped counts and cleanCollectionRefs, then a
  renderHook test of useDndQuotes handleDndEnd for both the collection-drop and
  reorder branches.
partial: true
verdict_reason: "evidence holds: quotesStore.test.js has only tombstone,
  cloud-merge and cross-tab describes; collection CRUD (quotesStore.js:218-300)
  appears in tests only as vi.fn mocks in App/ResultsPhase tests; no test file
  for useDndQuotes or CollectionsSidebar (mocked at ResultsPhase.test.jsx:114).
  CollectionsSidebar 312-326 is handleSmartGroup, handleCreate/handleRename
  follow at 328-345."
```

## Refuted

Judged false positives, kept with their reasons **so the same false positive does not return** on the next run: the next Inspector reads these before judging, and overturning one needs a reason that answers the refutation.

## PH-1151 /api/sync identifies the device by an X-Device-Id header on GET but by a snake_case device_id body field on POST, inside an otherwise camelCase body

```yaml
id: PH-1151
category: api
title: /api/sync identifies the device by an X-Device-Id header on GET but by a
  snake_case device_id body field on POST, inside an otherwise camelCase body
severity: minor
traffic: 0.1728413322246163
confidence: refuted
evidence:
  - api/sync.js:40
  - api/_schemas.js:75
  - api/_schemas.js:77
  - src/hooks/useSync.js:37
  - src/hooks/useSync.js:45
source:
  - detect-api
repair_cost: M
fingerprint: api:api/sync.js:sync-device-id-split-transport
refutation: "documented: the header exists only to keep the device credential
  out of URL logs (sync.js:37-39 comment, useSync.js:34-35, CLAUDE.md 'Sync
  device ID goes in the X-Device-Id header, not the URL', commit db4af86). A
  POST body is not part of the URL, so the GET/POST transport difference is the
  stated design applied correctly, not an accidental split. Also, by the
  category boundary, this is a difference between two methods of one endpoint
  (/api/sync), not a disagreement between endpoints. The device_id spelling
  matches the legacy GET query param and the DB column. A new consumer of this
  one-team, internal endpoint learns nothing the schema does not already state."
```

## PH-749 Batch re-identify is a second live AI-batching flow that never received the pipeline's retry-and-failure-accounting fix

```yaml
id: PH-749
category: architecture
title: Batch re-identify is a second live AI-batching flow that never received
  the pipeline's retry-and-failure-accounting fix
severity: major
traffic: 0.22087729473158527
confidence: refuted
evidence:
  - src/hooks/useQuoteActions.js:152
  - src/hooks/useQuoteActions.js:212
  - src/hooks/useQuoteActions.js:219
  - src/hooks/useProcessing.js:260
  - e12a8f5
  - 4ba7b70
source:
  - detect-architecture
repair_cost: L
fingerprint: architecture:src/hooks:zombie-batch-identify-flow
refutation: "miscategorized: wrong category, this is code debt (diverged twins)
  because the unit is a duplicated batch loop inside two functions
  (useQuoteActions.batchReIdentify vs useProcessing.handleApiBatch), not a
  module-level zombie path; useQuoteActions.js is a live multi-purpose module,
  not a legacy twin of useProcessing. Evidence itself checks out: :212 swallows
  a failed batch, :219 toasts success for all, e12a8f5 touched only
  useProcessing.js, batchReIdentify reachable via ResultsPhase.jsx:883, and
  useQuoteActions.test.js has no batchReIdentify coverage - refile under code at
  major."
```

## PH-750 ExportDropdown share-link copies bypass the declared copyWithToast clipboard path

```yaml
id: PH-750
category: architecture
title: ExportDropdown share-link copies bypass the declared copyWithToast
  clipboard path
severity: minor
traffic: 0.19453210748037558
confidence: refuted
evidence:
  - src/components/ExportDropdown.jsx:74
  - src/components/ExportDropdown.jsx:95
  - src/utils/shareLinks.js:55
  - b9afc5b
source:
  - detect-architecture
repair_cost: S
fingerprint: architecture:src/components:clipboard-bypasses-copywithtoast
refutation: "miscategorized: wrong category, a single-file deviation from a code
  convention is not module-graph architecture; the two handlers
  (ExportDropdown.jsx:74, :95) route around copyWithToast because it cannot
  carry what they need (in-place toast {id} update, Retry action, show-the-URL
  fallback on failure) - that is swerve's routing-around-a-helper evidence.
  b9afc5b converted the export-menu copies that failed silently and left these,
  which already report failure, so the declared never-silent intent holds."
```

## PH-751 api/og.js imports client category constants, an api-to-src edge outside the declared layering

```yaml
id: PH-751
category: architecture
title: api/og.js imports client category constants, an api-to-src edge outside
  the declared layering
severity: minor
traffic: 0.0885421617927656
confidence: refuted
evidence:
  - api/og.js:8
  - src/data/constants.js:1
source:
  - detect-architecture
repair_cost: S
fingerprint: architecture:api:api-imports-client-constants
refutation: "trap (generic best practice is not a declaration): CLAUDE.md
  declares no api import-direction rule; the survey's 'api may import only
  api/_*.js plus logo geometry' is an informal inference (survey says 'Declared,
  informally'). The CAT_COLORS edge was added in c2454f5 together with the
  per-share OG cards and the logoPaths/wordmark edges; src/data/constants.js
  imports nothing, so the edge is to a pure data leaf and a category colour
  change reaching the OG card is palette consistency, not unintended coupling."
```

## PH-1050 No .env.example exists and the README env block omits AI_DAILY_LIMIT

```yaml
id: PH-1050
category: build
title: No .env.example exists and the README env block omits AI_DAILY_LIMIT
severity: minor
traffic: 0.0914958755602203
confidence: refuted
evidence:
  - api/_shared.js:182
  - README.md:121
  - .gitignore:9
source:
  - detect-build
repair_cost: S
fingerprint: build:README.md:env-sample-missing-ai-daily-limit
refutation: "documented: AI_DAILY_LIMIT is an optional override with a safe
  default (api/_shared.js:178-183, comment says Override with the AI_DAILY_LIMIT
  env var) and is documented in CLAUDE.md API middleware convention, so the
  claimed cost (an operator never learns the cap is tunable) is not shown. The
  deploy configured from README.md:121-126 works fully; unlike study Case 2 it
  gates neither startup nor a feature. The .gitignore:9 !.env.example carve-out
  is boilerplate, not evidence of an intended file."
```

## PH-1052 Local API workflow depends on an unpinned global vercel CLI with no in-repo install

```yaml
id: PH-1052
category: build
title: Local API workflow depends on an unpinned global vercel CLI with no
  in-repo install
severity: minor
traffic: 0.5119943795537377
confidence: refuted
evidence:
  - README.md:132
  - package.json:7
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:vercel-cli-unpinned-global
refutation: "miscategorized: wrong category, this is signage debt because the
  only evidence is README.md:132 prose telling a human to run vercel dev; no
  script, workflow, npm script or build step invokes the vercel CLI (grep of
  scripts/, .github/, package.json, vercel.json), so no automated build or
  pipeline from a fresh clone fails. Per study-case boundary, a human following
  prose is signage's."
```

## PH-1053 Sitemap lastmod depends on full git history the CI build never has

```yaml
id: PH-1053
category: build
title: Sitemap lastmod depends on full git history the CI build never has
severity: minor
traffic: 0.10359896029435692
confidence: refuted
evidence:
  - vite.config.js:46
  - .github/workflows/ci.yml:14
source:
  - detect-build
repair_cost: S
fingerprint: build:vite.config.js:sitemap-lastmod-needs-full-history
refutation: "documented: vite.config.js:32-36 and CLAUDE.md:363 state that
  lastmod is deliberately omitted when git cannot tell, e.g. shallow clones,
  which is exactly the declared best-effort statement the finding names as its
  missing input. The CI build (ci.yml:14) is a check job whose dist is never
  deployed, so its sitemap lacking lastmod costs nothing; the production clone
  depth question is a survey question, not in-repo evidence."
```

## PH-950 SUPABASE_SECRET_KEY documented as sync-only, but the global AI spend cap silently degrades to per-instance without a key valid for the hardcoded project

```yaml
id: PH-950
category: knowledge
title: SUPABASE_SECRET_KEY documented as sync-only, but the global AI spend cap
  silently degrades to per-instance without a key valid for the hardcoded
  project
severity: minor
traffic: 0.12881854052041353
confidence: refuted
evidence:
  - README.md:125
  - api/_shared.js:4
  - api/_shared.js:15
  - api/_shared.js:54
  - api/_shared.js:180
  - api/identify.js:135
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:api/_shared.js:supabase-key-gates-spend-cap
refutation: "documented: the in-memory fallback is deliberate and recorded at
  the read site (api/_shared.js:63-66 comment) and in CLAUDE.md Known issues
  (rate limiting falls back to per-instance tracking when Supabase is
  unavailable); SUPABASE_URL is a visible constant at _shared.js:4, so no
  required value lives only in someone's head. The remaining gap (README.md:125
  says the key is required 'for sync' only) is an incomplete setup instruction,
  which is signage's per Category boundaries."
```

## PH-951 Sync conflict-resolution rules (cloud wins ties, collections compared on createdAt) have no recorded rationale

```yaml
id: PH-951
category: knowledge
title: Sync conflict-resolution rules (cloud wins ties, collections compared on
  createdAt) have no recorded rationale
severity: minor
traffic: 0.3478031482231616
confidence: refuted
evidence:
  - src/utils/sync.js:27
  - src/stores/quotesStore.js:211
  - src/stores/quotesStore.js:353
  - CLAUDE.md:238
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:src/utils/sync.js:sync-merge-rules-undocumented
refutation: "trap (Case 4 'Not this'): a plain last-writer-wins merge with the
  comment 'keeping the newer version' (src/utils/sync.js:5-13) is not a
  surprising hand-rolled replacement for something standard. The real problem in
  the evidence, collections merged on immutable createdAt (quotesStore.js:211,
  :353) so cloud overwrites local collection edits, is a correctness defect for
  architecture/bug detectors, not missing rationale; the detector itself flagged
  it out of category."
```

## PH-952 Identification pipeline useProcessing.js is bus-factor-1 with its internal flow only partly recorded

```yaml
id: PH-952
category: knowledge
title: Identification pipeline useProcessing.js is bus-factor-1 with its
  internal flow only partly recorded
severity: minor
traffic: 0.3478031482231616
confidence: refuted
evidence:
  - src/hooks/useProcessing.js:40
  - src/hooks/useProcessing.js:296
  - src/hooks/useProcessing.js:503
  - CLAUDE.md:302
source:
  - detect-knowledge
repair_cost: M
fingerprint: knowledge:src/hooks/useProcessing.js:processing-pipeline-concentration
refutation: "evidence: CLAUDE.md:302 is the React Compiler rules bullet, not
  pipeline documentation; the actual recording is CLAUDE.md:249 (useProcessing
  bullet), the Data flow section and the Known issues batch-retry note, which
  together cover stage order, sub-functions, dupe detection and retry. The
  reducer (useProcessing.js:40-90) is 15 one-line self-describing cases,
  cancellation is a visible AbortController (:296-300), and two test files
  exist; the claimed unrecorded concentration is not shown by the cited refs."
```

## PH-553 Legacy identify messages path forwards an arbitrary client prompt to Anthropic with no removal criterion

```yaml
id: PH-553
category: security
title: Legacy identify messages path forwards an arbitrary client prompt to
  Anthropic with no removal criterion
severity: minor
traffic: 0.12881854052041353
confidence: refuted
evidence:
  - api/_schemas.js:29
  - api/identify.js:129
  - api/identify.js:164
source:
  - detect-security
repair_cost: S
fingerprint: security:api/identify.js:identify-legacy-raw-prompt-path
partial: true
refutation: "miscategorized (with evidence): the security claim, an arbitrary
  client prompt forwarded under the app key with the raw Anthropic envelope
  returned, holds just as much for the current items path. buildPrompt
  (identify.js:67-73) puts any 10k-char item text in verbatim, and line 164
  returns the raw data for both shapes, so removing the legacy path closes no
  exposure. What remains is a legacy request shape kept for cached clients with
  no sunset or exit criterion. That is swerve/knowledge debt (a migration in
  flight with no removal criterion), not security."
```

## PH-351 Sync API silently retries without the collections column instead of relying on the migration

```yaml
id: PH-351
category: swerve
title: Sync API silently retries without the collections column instead of
  relying on the migration
severity: minor
traffic: 0.07038251338668261
confidence: refuted
evidence:
  - api/sync.js:51
  - api/sync.js:100
  - supabase/migration.sql:97
  - "commit 5906058 Fix sync failure: handle missing collections column in
    device_data"
source:
  - detect-swerve
repair_cost: S
fingerprint: swerve:api:sync-collections-column-fallback
refutation: "miscategorized: wrong category — this is api debt because the
  branch at api/sync.js:51 and :100 is keyed on a contract/schema fact (a column
  name sniffed from the error message), which the swerve study case assigns to
  api (Case 2); nothing routes around our own code — it routes around an
  unapplied DB migration (5906058 body). The silent-drop of collections on
  fallback is real and should be refiled under api next scan."
```

## PH-352 Interactive styles route around inline style objects through an !important override layer

```yaml
id: PH-352
category: swerve
title: Interactive styles route around inline style objects through an
  !important override layer
severity: minor
traffic: 1
confidence: refuted
evidence:
  - src/components/styles.js:214
  - src/components/styles.js:630
  - src/components/styles.js:223
  - commit 38cc3f3 Fix card confidence stripe on hover and tooltip cutoff
source:
  - detect-swerve
repair_cost: L
fingerprint: swerve:src/components:important-override-layer
refutation: "trap: Case 1 'Not this' — implementing a declared design is design,
  not swerve. The !important layer and .hov-* helpers are the prescribed path,
  not a detour: styles.js:214 records it as inherent to the declared
  inline-style architecture, styles.js:630 and CLAUDE.md:307 instruct
  contributors to use .hov-* / @media(hover:hover) rules. No one changed
  behaviour to avoid a module; the finding itself concedes the choice is
  declared. The 154 !important rules and the 38cc3f3 stripe collision may be
  code/architecture cost of that design, for another category to file."
```

## Not verified

No verdict was recorded for these. They are neither confirmed nor absent — an Inspector did not complete, or its category has no verdicts file. Do not read this section as "less important"; read it as "unmeasured".

_None._
