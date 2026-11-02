# Roadwork: commonplace

## What this is scored from

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

**Every RQI below is an upper bound on quality, not a score** — at least one finding came from a partial detector run, so its slice is a floor rather than a total; 3 category/ies were only partly measured (dependency, security, test), so their slices are floors rather than totals; deterministic tools were skipped, so the slices they own are unmeasured. Unmeasured debt cannot lower an RQI, so a good number here means "nothing worse was found", never "nothing worse is there".

Scored: 38 confirmed · excluded: 13 refuted, 0 unverified. Refuted and unverified findings are **not** work and appear in no zone below; the unverified ones are not absent either — they were never judged.

Model (`lib/scoring.mjs`): interest = severity weight × traffic × amplifier, priority = interest ÷ repair cost, RQI = 100 × exp(−interest ÷ files). Severity weights {"cosmetic":0.1,"minor":0.3,"major":0.7,"structural":1}; cost weights {"S":1,"M":3,"L":8,"XL":20}; a confirmed swerve or signage finding amplifies its module's other findings ×1.5, once, never compounded.

## Scoreboard

Repo total: **38 confirmed finding(s), 6.6961 interest** across 9 module(s) and 169 file(s) in the traffic model.

_No repo-wide RQI is reported. Density across a whole repo is dominated by its clean files — every real repo lands at 95-100 whatever it carries — so the number could not move and would read as a clean bill of health. RQI is meaningful per module, where the denominator is the module's own size._

| module | findings | interest | RQI | files |
|---|---|---:|---:|---:|
| src/components | 9 | 4.2966 | 94 | 67 |
| . _(unattributed: repo-root files and git-ref evidence — not a module)_ | 8 | 1.0598 | 91 | 11 |
| src/hooks | 7 | 0.5607 | 98 | 23 |
| api | 8 | 0.4731 | 96 | 11 |
| src/stores | 1 | 0.0961 | 95 | 2 |
| supabase | 2 | 0.0704 | 93 | 1 |
| src/data | 1 | 0.0577 | 98 | 3 |
| src/contexts | 1 | 0.0543 | 98 | 3 |
| src/utils | 1 | 0.0274 | 100 | 25 |

_Ordered by accumulated interest — the burden — not by RQI. RQI is a density, so ranking on it puts the smallest directory on top: a two-file deploy directory with one finding outranks a seven-finding module carrying five times the interest. Anchors: one hot major finding per file ≈ 50, one hot structural per file ≈ 37._

## Work zones (repair in this order)

Findings are grouped by module, and across modules when git history says their files change together (coupling ≥ 0.5). Close the road once.

**Read the order with its bias in mind.** Zones rank by *summed priority*, and priority divides interest by repair cost, so this order favours many cheap repairs over one large one: eight hot cosmetic S findings outrank one hot major S, and because `XL` divides by 20 while `S` divides by 1, the largest structural work will always appear near the bottom however severe it is. That is the intended reading — cheap wins first — but it means **the interest column, not the position, is what says how much a zone actually costs the team.** Where the two disagree, the disagreement is the information.

### Zone 1: api + src/components + src/hooks + src/utils + supabase — priority 1.8534, cost L

Why together: coupled — src/components/App.jsx ↔ src/hooks/useProcessing.js (co 23, strength 0.57); src/components/App.jsx ↔ src/hooks/useQuoteActions.js (co 16, strength 0.70); src/components/App.jsx ↔ src/hooks/useEditState.js (co 16, strength 0.52); api/identify.js ↔ api/sync.js (co 7, strength 0.54); api/sync.js ↔ src/components/App.jsx (co 7, strength 0.54); api/fetch-url.js ↔ src/components/App.jsx (co 6, strength 0.60); api/fetch-url.js ↔ api/sync.js (co 5, strength 0.50); api/_shared.js ↔ api/auto-group.js (co 4, strength 0.67); api/auto-group.js ↔ api/sync.js (co 4, strength 0.67); api/identify.js ↔ supabase/migration.sql (co 4, strength 0.67); src/hooks/useProcessing.js ↔ supabase/migration.sql (co 4, strength 0.67); api/auto-group.js ↔ src/components/App.jsx (co 4, strength 0.67); src/hooks/__tests__/useSync.test.js ↔ src/hooks/useProcessing.js (co 3, strength 1.00); api/lookup.js ↔ supabase/migration.sql (co 3, strength 0.50); src/components/App.jsx ↔ supabase/migration.sql (co 3, strength 0.50).

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-853 | test | minor ×amp | 1.00 | 0.45 | 0.45 | S | HeaderBar test asserts a hard-coded active style that no longer matches styles.addMoreBtnActive |
| PH-349 | swerve | major ×amp | 1.00 | 1.05 | 0.35 | M | Pseudo-element tooltip routed around per clip container with :has() overflow overrides and z-index lifts |
| PH-252 | code | minor ×amp | 0.43 | 0.1926 | 0.1926 | S | MiniHeader missed the mobile header redesign: duplicate Add button and no layout menu on mobile |
| PH-255 | code | major ×amp | 1.00 | 1.05 | 0.1312 | L | styles.js is a god file: every component's styles, the palette and global CSS in one 1,000-line module that changes with everything |
| PH-856 | test | major ×amp | 0.75 | 0.7891 | 0.0986 | L | App.test.jsx mocks every phase and hook and never drives a phase transition in the hottest file |
| PH-350 | swerve | major ×amp | 0.57 | 0.5948 | 0.0743 | L | Drag-and-drop list rendering patched around the React Compiler with restored memo() and use-no-memo opt-outs |
| PH-254 | code | minor | 0.22 | 0.0663 | 0.0663 | S | identifyBatch discards the server error message, so the AI daily-cap notice shows as a generic 'wait a moment' rate limit |
| PH-253 | code | minor | 0.18 | 0.0546 | 0.0546 | S | Blank-source guard was added to inline save only; the full editor still saves an empty source as high confidence |
| PH-1149 | api | major | 0.22 | 0.1546 | 0.0515 | M | /api/identify proxies the raw Anthropic message envelope while every other endpoint returns its own shape, and its consumer parses model text and an Anthropic error object the server never sends |
| PH-251 | code | major | 0.22 | 0.1546 | 0.0515 | M | Batch re-identify never got the pipeline's retry and failure reporting, and reports success when every batch fails |
| PH-549 | security | major | 0.22 | 0.1546 | 0.0515 | M | Client-controlled prompt fields let any caller plant permanent high-confidence attributions in the shared quote cache |
| PH-852 | test | major ×amp | 0.12 | 0.1305 | 0.0435 | M | ResultsPhase filter and sort tests re-implement Array.filter/sort inline; the real sort in useViewPreferences is untested |
| PH-1150 | api | minor | 0.13 | 0.0386 | 0.0386 | S | /api/identify accepts two request shapes (items and legacy messages) with no exit condition for the legacy one |
| PH-854 | test | minor ×amp | 0.08 | 0.0375 | 0.0375 | S | CollectionDupeModal test named for the 800ms auto-close only checks the module loads; the rest mirror logic inline |
| PH-250 | code | minor | 0.09 | 0.0274 | 0.0274 | S | normalize() exists in three hand-synced copies; the server copy already lagged the client fix for three weeks |
| PH-860 | test | minor | 0.09 | 0.0274 | 0.0274 | S | withApiHandler origin and CSRF rejection paths are never exercised; every mock request is valid |
| PH-551 | security | minor | 0.07 | 0.0211 | 0.0211 | S | migration.sql cannot be re-applied to an existing database, so later appended security statements only land by hand |
| PH-857 | test | major | 0.22 | 0.1546 | 0.0193 | L | useProcessing duplicate-detection pre-pass and handleDupesContinue never run: pipeline tests stub similarity to 0 and localLookup to null |
| PH-1049 | build | major | 0.07 | 0.0493 | 0.0164 | M | Supabase schema is applied by hand with no migration tooling; repo lagged production by six months and the file is not re-runnable |
| PH-849 | test | major | 0.17 | 0.121 | 0.0151 | L | useSync.test.js never imports useSync: it calls a mocked global fetch and checks config constants |
| PH-552 | security | minor | 0.13 | 0.0386 | 0.0129 | M | Global AI daily cap can be exhausted by a single IP, turning the spend guard into a site-wide outage |
| PH-550 | security | minor | 0.06 | 0.019 | 0.0063 | M | fetch-url SSRF guard has a check-then-fetch DNS rebinding window and returns the response body |
| PH-850 | test | minor | 0.02 | 0.0048 | 0.0048 | S | processingErrors cloud-sync block asserts the behaviour of its own fetch mock, not of any sync code |
| PH-851 | test | minor | 0.02 | 0.0048 | 0.0048 | S | batch-continuation test asserts less than its comments claim and stubs a removed /api/cache endpoint |
| PH-859 | test | minor | 0.07 | 0.0211 | 0.0026 | L | api/sync.js server-side merge, tombstone deletion and collections-column fallback have no test |
| PH-861 | test | minor | 0.06 | 0.019 | 0.0024 | L | fetch-url per-hop SSRF re-check in the manual redirect loop is untested |
| PH-855 | test | minor ×amp | 0.00 | 0.0021 | 0.0007 | M | AddMorePanel, ShareImageModal and TableView tests assert on logic copied into the test file |

Files this zone opens:
- 9c63bf5
- api/__tests__/security.test.js:154-178
- api/__tests__/security.test.js:27-38
- api/_schemas.js:17
- api/_schemas.js:29
- api/_schemas.js:38
- api/_shared.js:166
- api/_shared.js:180
- api/_shared.js:188
- api/_shared.js:207
- api/_shared.js:253-258
- api/_shared.js:90-99
- api/auto-group.js:35
- api/auto-group.js:56
- api/fetch-url.js:149
- api/fetch-url.js:33
- api/fetch-url.js:72-105
- api/fetch-url.js:77
- api/fetch-url.js:82
- api/identify.js:117
- api/identify.js:129
- api/identify.js:135
- api/identify.js:136
- api/identify.js:162
- api/identify.js:164
- api/identify.js:67
- api/identify.js:79
- api/identify.js:93
- api/lookup.js:185
- api/lookup.js:214
- api/sync.js:104
- api/sync.js:5-31
- api/sync.js:51
- api/sync.js:80-115
- api/sync.js:99
- commit 27e7971 Restore React.memo on TableRow to fix drag jank in table view
- commit 845af57 Fix drag-and-drop gaps caused by virtualizer absolute positioning
- commit 8db8f7d Revert Upgrade tooltips to @floating-ui
- commit 905154e fix empty virtualized list after view switch
- commit a696b35 Refactor: extract shared hooks, consolidate patterns, break up ResultsPhase
- commit b3c39ea Facelift: landing input card, quote table rows, mobile cards
- commit c1ac354 Fix tooltip linger artifact in notification bars
- commit ceba665 Fix tooltip clipping in notification bars
- commit d581d56 Restore React.memo on CardItem to fix card view drag jank
- commit d7a5a4d Fix card tooltip being clipped by sibling card stacking contexts
- commit db4af86 Security hardening: AI spend cap, per-endpoint rate limits, SSRF, cache poisoning, sync ID
- commit e12a8f5 feat: pre-warm API, partial batch retry, and integration tests
- commit e985fb1 Helpers update
- commit f0d1495 fix: eliminate table shake during drag-and-drop
- commit fc4cf3f Revert card tooltip to above; bump wrapper z-index above sticky bar
- commit fcb2fed Fix tooltip fade-out direction
- db4af86
- src/components/App.jsx:170
- src/components/App.jsx:84
- src/components/CardItem.jsx:18
- src/components/CollectionDupeModal.jsx:26-31
- src/components/EditForm.jsx:169
- src/components/HeaderBar.jsx:46
- src/components/HeaderBar.jsx:67
- src/components/HeaderBar.jsx:85
- src/components/MiniHeader.jsx:59
- src/components/ResultsPhase.jsx:1169
- src/components/ResultsPhase.jsx:60
- src/components/TableView.jsx:104
- src/components/TableView.jsx:276
- src/components/TableView.jsx:289
- src/components/__tests__/AddMorePanel.test.js:12-34
- src/components/__tests__/App.test.jsx:214-258
- src/components/__tests__/App.test.jsx:36-170
- src/components/__tests__/CollectionDupeModal.test.js:16-69
- src/components/__tests__/CollectionDupeModal.test.js:5-13
- src/components/__tests__/HeaderBar.test.js:8-33
- src/components/__tests__/ResultsPhase.test.jsx:260-337
- src/components/__tests__/ShareImageModal.test.js:3-38
- src/components/__tests__/TableView.test.js:13-37
- src/components/styles.js:1015
- src/components/styles.js:3
- src/components/styles.js:302
- src/components/styles.js:304
- src/components/styles.js:307
- src/components/styles.js:31
- src/components/styles.js:446
- src/components/styles.js:716
- src/components/styles.js:851
- src/data/localQuotes.js:3821
- src/hooks/__tests__/lookupConfidence.test.js:6-17
- src/hooks/__tests__/processingErrors.test.js:152
- src/hooks/__tests__/processingErrors.test.js:168-173
- src/hooks/__tests__/processingErrors.test.js:248-345
- src/hooks/__tests__/processingErrors.test.js:6-17
- src/hooks/__tests__/processingErrors.test.js:87
- src/hooks/__tests__/useSync.test.js:131-149
- src/hooks/__tests__/useSync.test.js:26-38
- src/hooks/__tests__/useSync.test.js:3-5
- src/hooks/__tests__/useViewPreferences.test.js:13-70
- src/hooks/useDndQuotes.js:38
- src/hooks/useEditState.js:106
- src/hooks/useEditState.js:84
- src/hooks/useProcessing.js:130
- src/hooks/useProcessing.js:132
- src/hooks/useProcessing.js:146-166
- src/hooks/useProcessing.js:169
- src/hooks/useProcessing.js:260
- src/hooks/useProcessing.js:321
- src/hooks/useProcessing.js:360-420
- src/hooks/useProcessing.js:516
- src/hooks/useQuoteActions.js:128
- src/hooks/useQuoteActions.js:212
- src/hooks/useQuoteActions.js:219
- src/hooks/useSync.js:93-159
- src/hooks/useViewPreferences.js:120-134
- src/utils/api.js:72
- src/utils/apiErrors.js:9
- src/utils/textFormatting.js:142
- supabase/migration.sql:117
- supabase/migration.sql:2
- supabase/migration.sql:35
- supabase/migration.sql:96

### Zone 2: . — priority 0.1699, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-949 | knowledge | minor | 0.57 | 0.1699 | 0.1699 | S | CLAUDE.md says manual memoization was stripped, omitting the three React.memo wrappers the drag path depends on |

Files this zone opens:
- 27e7971
- 86c0c55
- CLAUDE.md:291
- CLAUDE.md:365
- d581d56
- src/components/CardItem.jsx:18
- src/components/TableView.jsx:103
- src/components/TableView.jsx:280

### Zone 3: . — priority 0.1699, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-449 | signage | minor | 0.57 | 0.1699 | 0.1699 | S | CLAUDE.md says manual React.memo/useCallback were stripped, but hot list components depend on React.memo |

Files this zone opens:
- CLAUDE.md:291
- CLAUDE.md:365
- src/components/CardItem.jsx:21
- src/components/TableView.jsx:103
- src/components/TableView.jsx:107
- src/components/TableView.jsx:280
- src/hooks/useSync.js:64

### Zone 4: . — priority 0.1536, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-1051 | build | minor | 0.51 | 0.1536 | 0.1536 | S | Node version is declared nowhere the builders read: no engines field or .nvmrc; CI hard-codes 22 independently |

Files this zone opens:
- .github/workflows/ci.yml:19
- README.md:108
- package.json:1

### Zone 5: . — priority 0.1536, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-649 | dependency | minor | 0.51 | 0.1536 | 0.1536 | S | legacy-peer-deps in .npmrc outlived its exit criterion and now masks an invalid peer on the React Compiler build path |

Files this zone opens:
- .npmrc:1
- 5b2f20c
- package.json:55
- package.json:58
- vite.config.js:3
- vite.config.js:81

### Zone 6: . — priority 0.1536, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-650 | dependency | minor | 0.51 | 0.1536 | 0.1536 | S | @babel/eslint-parser and @babel/preset-react are declared but nothing loads them |

Files this zone opens:
- c75536e
- eslint.config.js:7
- package.json:53
- package.json:54
- vite.config.js:82

### Zone 7: . — priority 0.1536, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-451 | signage | minor | 0.51 | 0.1536 | 0.1536 | S | README prerequisite says Node.js 18+, but Vite 8 requires Node ^20.19 or >=22.12 |

Files this zone opens:
- .github/workflows/ci.yml:19
- README.md:108
- package.json:64

### Zone 8: src/data — priority 0.0577, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-249 | code | major | 0.08 | 0.0577 | 0.0577 | S | Local quote DB indexes 25 entries by un-normalized text, so their exact lookup can never match |

Files this zone opens:
- commit 2815619 Updated helpers
- commit 9b55e90 Added Russian support
- src/data/localQuotes.js:2240
- src/data/localQuotes.js:3795
- src/data/localQuotes.js:3806
- src/data/localQuotes.js:3834
- src/data/localQuotes.js:694

### Zone 9: . — priority 0.0543, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-450 | signage | minor | 0.18 | 0.0543 | 0.0543 | S | README points to QuotesContext.jsx as the global quote/collection state, but it provides no value; state lives in the unlisted Zustand store |

Files this zone opens:
- README.md:88
- src/contexts/QuotesContext.jsx:1
- src/contexts/QuotesContext.jsx:2
- src/stores/quotesStore.js:1

### Zone 10: . — priority 0.0512, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-452 | signage | cosmetic | 0.51 | 0.0512 | 0.0512 | S | CLAUDE.md says eslint-plugin-react-hooks must be installed separately, but it is already a devDependency |

Files this zone opens:
- CLAUDE.md:332
- eslint.config.js:1
- package.json:61

### Zone 11: src/stores — priority 0.012, cost L

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-862 | test | minor | 0.32 | 0.0961 | 0.012 | L | Collection CRUD in quotesStore and its consumers (useDndQuotes drop/reorder, CollectionsSidebar) have no tests |

Files this zone opens:
- src/components/CollectionsSidebar.jsx:312-345
- src/hooks/useDndQuotes.js:41-73
- src/stores/__tests__/quotesStore.test.js:16-74
- src/stores/quotesStore.js:218-300

### Zone 12: src/contexts — priority 0.0068, cost L

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-858 | test | minor | 0.18 | 0.0543 | 0.0068 | L | QuotesContext share-link decoding of untrusted URL data has no test |

Files this zone opens:
- src/components/__tests__/App.test.jsx:163
- src/contexts/QuotesContext.jsx:117-162
- src/contexts/QuotesContext.jsx:44-56

## Not scored

- **13 refuted** — judged false positives; kept in the register with their reasons so the same false positive does not return.
- **0 unverified** — never judged. Not absent, not confirmed. Re-run `/pothole:verify` for those categories before reading any number above as complete.
