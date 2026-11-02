# Road Survey: commonplace

**Date:** 2026-11-02 · **Commit:** ca98d98 (`main`) · **Pothole version:** 0.2.0

> **Scan framing.** Single-package Vite/React SPA plus Vercel serverless functions
> (`api/`), one repo, one deployable. Traffic model built from the full history
> (the session clone was unshallowed first: 658 commits in the 24-month window,
> 169 live files, 129 coupled pairs). This run was executed end-to-end on the
> owner's instruction ("run pothole, merge the PR it opens, file grouped issues"),
> so the gate answers below are the surveyor's defaults, recorded as such rather
> than as owner answers.

## Stack

- **Languages/runtimes:** JavaScript + JSX only (no TypeScript, by declared convention); Node (Vercel serverless functions in `api/`, build scripts in `scripts/`); SQL (`supabase/migration.sql`).
- **Package manager / build:** npm (`package-lock.json`, `.npmrc`); Vite 8 (rolldown) with `@rolldown/plugin-babel` + React Compiler; `vite-plugin-pwa`; post-build prerender (`scripts/prerender.mjs`); Vercel hosting (`vercel.json`). CI: GitHub Actions `.github/workflows/ci.yml` (lint → test → build → Lighthouse CI, plus Dependabot auto-merge of non-major updates).
- **Test framework(s):** Vitest 4 (40 test files colocated under `**/__tests__/`, including `api/__tests__/` and `src/__tests__/boot.test.js`).
- **Available adapters:** eslint-sonar (bundled), semgrep 1.183.0, jscpd 5.4.2, gitleaks 8 (built from source), osv-scanner 2.7.0, madge 8.0.0, repowise 0.57.0, scc 3.7.0 (complexity source for the traffic model).
- **Tools not available (degraded slices):** `coverage/lcov.info` is not committed, so **hot-and-under-covered (test) is NOT MEASURED** — Pothole never runs the target's tests. No SonarQube server. knip and dependency-cruiser are not adapters this run uses.

## Map (modules and responsibilities)

| Module | Responsibility | Traffic (peak file) | Notes |
|---|---|---|---|
| `src/components` | Every screen and widget of the three app phases (input → processing → results), plus the CSS-in-JS system (`styles.js`, `inputPhaseStyles.js`) | 1.00 (`styles.js`) | Highest-traffic module by far. `ResultsPhase.jsx` (hotspot 0.32), `TableView.jsx` (0.26), `App.jsx` (0.24, 192 commits) are the top three hotspots in the repo. `styles.js` is the hub of change coupling (InputPhase 0.61, ToolbarSection 0.59, DupeModal 0.72, BulkBar 0.63 …). Bus-factor-1: `CollectionsSidebar.jsx`, `CardItem.jsx`. `CardItem.jsx`↔`TableView.jsx` co-change 38× (0.63) — two renderings of the same row. |
| `src/hooks` | Feature hooks that own each domain's state + logic — the identification pipeline (`useProcessing`), sync, edit state, view prefs, quote actions, gestures | 0.22 (`useProcessing.js`) | `useProcessing.js` is repowise's worst-health file (2.5/10) and the highest-complexity file (scc 102). Coupled to `App.jsx` (0.57). |
| `src/contexts` | Side-effects-only provider (share-link decode, cloud pull/push scheduling) plus Toast and Results contexts | 0.18 (`QuotesContext.jsx`) | `QuotesContext.jsx`↔`App.jsx` 0.70; ↔`useSync.js` 0.60. |
| `src/stores` | Zustand store — single source of truth for quotes, collections, tombstones, cross-tab sync, debounced persistence | 0.09 (`quotesStore.js`) | scc 54. |
| `src/utils` | Pure helpers: text normalization/splitting, parsers (Kindle/Readwise/CSV/JSON/MD), export generators, API wrapper, storage, sync merge, share links | 0.11 (`helpers.js`) | `textFormatting.js` `normalize()` must stay in sync with `api/_shared.js` `normalizeForCache()` (declared). |
| `src/data` | Static data: category/colour constants and the lazily-loaded 3,700-quote local DB with its word indexes; FAQ content | 0.09 (`constants.js`) | `localQuotes.js` is data (~477KB) — see exclusions. |
| `src` (root files) | Entry/bootstrap: `main.jsx`, `Root.jsx`, `prerender.jsx`, `config.js` (all tunable constants) | 0.12 (`config.js`) | |
| `api` | Vercel serverless functions: AI identify/auto-group proxies to Claude Haiku, sync, public sharing + OG cards, external lookup, URL fetch (SSRF-guarded); `_shared.js` middleware, `_schemas.js` Zod validation | 0.13 (`identify.js`) | `_shared.js` (scc 48) holds CORS/rate-limit/origin middleware. `fetch-url.js` carries the SSRF guard. |
| `scripts` | Build-time generators: icons, OG image, wordmark trace, landing-page prerender | 0.03 | Run by hand except `prerender.mjs` (part of `npm run build`). |
| `public` | Static assets, legal pages, `boot.js` pre-paint script, 404 page, fonts | 0.06 | `boot.js` must mirror storage keys/share prefixes in `config.js` (guarded by `boot.test.js`). |
| `supabase` | Database schema (`migration.sql`) | 0.04 | Single migration file; no migration tool. |
| root config | `vite.config.js`, `vercel.json` (CSP/headers/rewrites), `eslint.config.js`, `index.html`, `package.json`, `CLAUDE.md` | 0.51 (`package.json`), 0.35 (`CLAUDE.md`) | `package.json` traffic is mostly Dependabot. `CLAUDE.md` is co-changed with many components — it is the only architecture document. |

## Intended architecture

- **Declared decisions (ADRs/docs):** No ADR directory exists. `CLAUDE.md` is the sole architecture declaration and is treated as **INTENDED** for drift judgement. Declared decisions (verbatim gist, source `CLAUDE.md`):
  - "No TypeScript — entire codebase is plain JavaScript with JSX."
  - "React Compiler handles memoization — don't add manual `useMemo`, `useCallback`, or `React.memo` unless the compiler's ESLint rules specifically require it." One sanctioned `useMemo` (Fuse index in `useViewPreferences.js`). Two sanctioned `"use no memo"` directives (`TableView`, `MobileCardList`).
  - "`styles.js` is the primary place for styles — don't add CSS files or inline styles directly in components" (exception: `inputPhaseStyles.js`).
  - "Constants centralized — all magic numbers live in `src/config.js`." Z-index scale in `src/data/constants.js`.
  - "API calls go through `apiRequest()` (`utils/api.js`), not raw `fetch()`" — exceptions: InputPhase pre-warm ping, `useProcessing` lookup/identify calls.
  - "Clipboard copies go through `copyWithToast()`."
  - "localStorage access — use `loadFromStorage()` / `saveToStorage()`" instead of raw `localStorage`.
  - "all serverless functions use `withApiHandler()` from `_shared.js`" and Zod schemas from `_schemas.js`.
  - "`normalize()` (client) and `normalizeForCache()` (server) must stay in sync."
  - "Don't modify `_shared.js` ALLOWED_ORIGINS without also updating the CSP header in `vercel.json`."
  - Lazy-load `localQuotes.js` and `compromise` — never static imports.
  - Hover rules inside `@media(hover:hover)`; no `onMouseEnter`/`onMouseLeave` hover styling.
  - Border-radius two-tier system (6px containers / 4px small / pill exception); animation timing tiers `ANIM_*_MS`; no new fonts.
  - "Semantic colors follow the theme — use `var(--cp-info*)` / `var(--cp-danger*)` … not `CLR_BLUE`/`CLR_RED` or hex literals."
  - Tooltips via `.ui-tip` + `data-tip`, not native `title` (exception inside clip containers).
  - `ResultsPhase.jsx` "Still the largest component but more manageable" (acknowledged debt).
- **Layering rules:** Declared, informally:
  - Components read state directly from `useQuotesStore()`; `QuotesContext` provides **no value** (side effects only).
  - Hooks own their domain; `App.jsx` initialises cross-phase hooks and passes props; `ResultsPhase` initialises results-only hooks.
  - `api/*` endpoints may import only `api/_*.js` private modules plus shared logo geometry (`src/components/logoPaths.js` is shared with `api/og.js`, declared).
  - Supabase client is server-side only (`@supabase/supabase-js` must not be imported from `src/`).
  - No other import-direction rules are declared.
- **Known migrations in flight:**
  - Legacy public share links `#p=<id>` → `/c/<id>` (old format still accepted; declared, ongoing).
  - Sync device id: `?device_id=` query param → `X-Device-Id` header (`api/sync.js` still accepts the query param "for clients on an old cached build").
  - No other migrations declared.

## Exclusions

- `node_modules/` — vendored dependencies (gitignored).
- `dist/` — build output (gitignored).
- `.repowise/` — repowise index cache (regenerated, never reviewed); proposed for `.gitignore`.
- `.pothole/` — this assessment's own output.
- `src/data/localQuotes.js` — curated quote **data** (~3,700 entries); judge only its index-building code at the bottom, never the data rows for duplication/size.
- `src/data/faq.js` — content data.
- `src/components/wordmarkPath.js` — generated by `npm run wordmark`; do not hand-edit.
- `public/favicon.ico`, `public/*.png`, `public/og-image.png` — generated icons/images.
- `public/fonts/`, `api/_fonts/` — binary font assets.
- `package-lock.json` — lockfile (dependency detector may read it; no other detector judges it).

## Open questions for the gate

1. Is `CLAUDE.md` wholly current? It is the only declaration and is treated as INTENDED; any line the signage detector proves stale is itself a finding. (Surveyor default: treat as intended.)
2. Should `coverage/lcov.info` be produced in CI and committed so the next run can measure hot-and-under-covered files? (Default: leave unmeasured this run.)
3. Is the `?device_id=` query-param fallback in `api/sync.js` scheduled for removal, and if so when? (Default: treat as an open migration; flag only if it has no exit criterion.)
4. Is `.repowise/` acceptable to add to `.gitignore`? (Default: yes — added.)
