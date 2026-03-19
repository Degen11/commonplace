# CLAUDE.md

## Project overview

Commonplace is a quote collection organizer. Users paste messy text (or import files), and the app identifies sources and categories using a local database of 3,700+ quotes and Claude Haiku AI as a fallback. The result is a searchable, filterable, exportable collection. Live at [commonplace.pro](https://commonplace.pro).

## Tech stack

- **React 18** (no TypeScript — plain JSX/JS throughout)
- **Vite 7** — dev server and build
- **Zustand 5** — primary state management (`src/stores/quotesStore.js`)
- **TanStack React Query 5** — server state / sync mutations
- **TanStack React Virtual 3** — virtualized list rendering
- **motion 12** (Framer Motion successor) — animations via `motion/react`
- **@dnd-kit** — drag-and-drop reordering (core + sortable)
- **Fuse.js 7** — fuzzy search
- **compromise 14** — NLP (proper noun detection in text formatting)
- **Zod 4** — API request validation (server-side, `api/_schemas.js`)
- **satori + @resvg/resvg-js** — share image generation (server-side SVG → PNG)
- **sonner 2** — toast notifications
- **lucide-react** — icons
- **@supabase/supabase-js 2** — database client (server-side only)
- **vite-plugin-pwa** — service worker / PWA manifest
- **Vercel** — hosting + serverless functions
- **Vitest 4** — test runner (configured in `vite.config.js`)

## Architecture

### Directory layout

```
api/                          Vercel serverless functions (Node.js)
  _shared.js                  Supabase client, CORS, rate limiting, origin validation, withApiHandler middleware
  _schemas.js                 Zod schemas for all API endpoints
  identify.js                 POST — proxy to Claude Haiku for quote identification
  sync.js                     GET/POST — device-based cloud sync via Supabase
  share.js                    GET/POST — public collection sharing (30-day expiry)
  auto-group.js               POST — AI-powered thematic quote grouping
  cache.js                    POST — cache AI identification results in Supabase
  lookup.js                   POST — external lookup (Wikiquote, Open Library, cache)
  fetch-url.js                POST — extract content from URLs
  og.js                       GET — Open Graph image generation

src/
  main.jsx                    Entry point — React root, QueryClient, providers, theme init, CSS injection
  config.js                   All tunable constants (timeouts, limits, thresholds, localStorage keys)

  stores/
    quotesStore.js             Zustand store — quotes, collections, column order, deletion tombstones

  contexts/
    QuotesContext.jsx           Thin bridge over Zustand — handles mount-time side effects (share links, cloud pull)
    ToastContext.jsx            Toast notification queue

  components/
    App.jsx                    Root orchestrator — phase management, hook init (useProcessing, useQuoteActions, useTheme)
    ResultsPhase.jsx           Results phase — owns view prefs, edit state, keyboard shortcuts, sidebar, all results UI
    ResultsModals.jsx          All modal dialogs for results phase (shortcuts, share image, confirm clear/delete, dupe modal)
    NotificationBars.jsx       Status/notification bars (shared view, API errors, processing stats, attention/review)
    QuickAddBar.jsx            Inline quote add form with dupe detection
    InputPhase.jsx             Landing page — text input, file import, URL fetch
    ProcessingPhase.jsx        AI identification progress display
    TableView.jsx              Main table view with inline editing and drag-to-reorder
    CardItem.jsx               Card view (mobile)
    HeaderBar.jsx              Top toolbar — search, filters, view toggles, sync pill
    MiniHeader.jsx             Sticky header on scroll
    BulkBar.jsx                Bulk actions — reassign category/source, delete
    EditForm.jsx               Full quote editor modal
    InlineEditors.jsx          Click-to-edit source/category with autocomplete
    CollectionsSidebar.jsx     Collection management sidebar
    styles.js                  All CSS-in-JS style objects + baseCSS (global CSS string)

  hooks/
    useProcessing.js           Core pipeline — local lookup → external lookup → AI batch identification
    useSync.js                 Cloud sync via TanStack Query mutations, exponential backoff
    useQuoteActions.js         Quote CRUD — delete, copy, re-identify, favorite
    useEditState.js            Edit mode, selected IDs, inline editing state
    useViewPreferences.js      Filtering, sorting, search, layout mode (persisted to localStorage)
    useKeyboardShortcuts.js    Global keyboard shortcuts (Esc cascade, Ctrl+A, etc.)
    useDndQuotes.js            Drag-and-drop state, sensors, and handlers for quote reordering/collection drops
    useInfiniteScroll.js       Pagination — 100 items per page via intersection observer
    useTheme.js                Dark/light theme toggle (CSS custom properties)
    useMounted.js              Mount guard ref + useSafeDispatch for async safety
    useFlipPosition.js         Viewport-aware flip positioning for dropdowns
    useScrollLock.js           Lock body scroll when modals are open
    useSwipe.js                Touch swipe gestures
    useLongPress.js            Mobile long-press for selection
    useClickOutside.js         Close dropdowns/popups on outside click

  data/
    constants.js               Categories, colors, confidence levels, example quotes, sanitization
    localQuotes.js             3,700+ curated quotes — lazy-loaded via dynamic import

  utils/
    textFormatting.js          smartSplit, normalize, similarity (dupe detection), basicFormat, proper nouns
    parsers.js                 File parsing — Kindle highlights, Readwise, CSV, JSON, Markdown
    quotes.js                  makeQuote factory, findDuplicateGroups
    export.js                  Export generators — CSV, JSON, Markdown, plain text
    shareImage.js              Generate quote share images via Canvas (2x resolution)
    api.js                     fetchWithTimeout, shared API headers
    apiErrors.js               Human-readable API error descriptions
    storage.js                 loadFromStorage / saveToStorage — safe localStorage JSON read/write with validation
    helpers.js                 Shared utilities: pluralize, groupBy, countBy, propsEqual, Set helpers (addToSet, removeFromSet, etc.)
    sync.js                    mergeByTimestamp — cloud/local merge helper
    dragGhost.js               Custom drag preview elements
    richTextKeys.js            Key constants for rich text handling
    uuid.js                    UUID v4 generation
    smartRestore.js            Smart session restore logic
```

### App phases

The app has three phases managed by `App.jsx` via `setPhase()`:

1. **input** — `InputPhase.jsx` — paste text, import files, fetch URLs
2. **processing** — `ProcessingPhase.jsx` — progress bar while AI identifies quotes
3. **results** — `TableView.jsx` / `CardItem.jsx` — browse, edit, filter, export

Users can return to input to add more quotes (append mode).

### Data flow: quote identification

```
User input → smartSplit() → deduplicate against existing
  → localLookup() against 3,700+ local DB (lazy-loaded)
    → matched: added immediately
    → unmatched: POST /api/lookup (Wikiquote, Open Library, server cache)
      → still unmatched: POST /api/identify in batches of 10 (API_BATCH_SIZE)
        → results cached via POST /api/cache (fire-and-forget)
  → duplicate detection (similarity > 0.55 threshold) → DupeModal
  → quotes added to store → localStorage persist (300ms debounce) → Supabase sync (2s debounce)
```

## State management

**Zustand store** (`src/stores/quotesStore.js`) is the single source of truth for:
- `quotes[]`, `customCats[]`, `collections[]`, `columnOrder[]`
- `activeCollectionId`, `isSharedView`
- Sync state: `syncStatus`, `lastSynced`, `initialLoading`
- Deletion tombstones: `_deletedIds[]` (expire after 7 days)

**QuotesContext** (`src/contexts/QuotesContext.jsx`) wraps the Zustand store for backward compatibility. It handles mount-time effects (shared link decoding, initial cloud pull) and bridges the store to `useQuotesContext()`. All consumers use `useQuotesContext()` — they don't access the Zustand store directly.

**Local hook state** — each feature hook manages its own state:
- `useProcessing` — useReducer state machine (idle → dupes → processing → done). Initialized in App.jsx (spans phases)
- `useEditState` — edit mode, selected quote IDs, inline editing. Initialized in ResultsPhase
- `useViewPreferences` — sort column/direction, category filter, search term, layout mode. Initialized in ResultsPhase
- `useQuoteActions` — delete/copy/re-identify animations. Initialized in App.jsx (handleFileImport used by InputPhase)
- `useKeyboardShortcuts` — results-only keyboard handler. Initialized in ResultsPhase

**Pattern: refs for async safety** — throughout the codebase, `useRef` holds latest state values for use in async callbacks (retries, debounced saves). This prevents stale closure bugs. The Zustand migration reduced some of this, but the pattern persists in hooks like `useProcessing`.

## Data persistence

- **localStorage** is the primary store — offline-first. Keys are defined in `config.js` (`LS_QUOTES`, `LS_CATS`, etc.)
- **Supabase** (PostgreSQL) is the cloud backup — sync is explicit, not real-time. Schema is in `supabase/migration.sql`
- **Sync model**: device-based UUID (no user accounts). Each browser gets a UUID stored in `commonplace_device_id`. `useSync` manages pull (on mount) and push (2s debounce after changes) via TanStack Query mutations with exponential backoff retry
- **Deletion tombstones**: deleted quote IDs are tracked for 7 days (`TOMBSTONE_TTL_MS`) to prevent re-sync of deleted items
- **Cross-tab sync**: the Zustand store listens to `window.storage` events to pick up changes from other tabs. `useTheme` also listens to sync dark/light mode across tabs
- **Persistence**: Zustand store subscribes to its own state changes and debounces writes to localStorage (300ms)

## Key components

- **`App.jsx`** — Phase orchestrator (~170 lines). Initializes cross-phase hooks (`useProcessing`, `useQuoteActions`, `useTheme`), manages phase state, renders `InputPhase`/`ProcessingPhase`/`ResultsPhase` with `AnimatePresence`.
- **`ResultsPhase.jsx`** — The results phase. Calls `useQuotesContext()` directly. Initializes `useViewPreferences`, `useEditState`, `useKeyboardShortcuts`, `useDndQuotes` internally. Delegates modals to `ResultsModals`, notification bars to `NotificationBars`.
- **`quotesStore.js`** — Zustand store with all collection CRUD, cloud merge logic, cross-tab sync, and debounced persistence.
- **`QuotesContext.jsx`** — Mount-time bootstrapping: decodes share links (hash `#s=` for base64, `#p=` for public), kicks off initial cloud pull, bridges Zustand to React context.
- **`useProcessing.js`** — The identification pipeline. Uses a useReducer state machine. Handles local lookup → external lookup → AI batching → duplicate detection → auto-transition to results.
- **`useSync.js`** — TanStack Query-based sync. `pull()` fetches cloud data on mount; `schedulePush()` debounces and pushes via mutation with exponential backoff.
- **`styles.js`** — All CSS-in-JS. Contains `baseCSS` (global CSS string injected in main.jsx) and style objects for every component. Theme uses CSS custom properties (`--cp-bg`, `--cp-text`, etc.).
- **`_schemas.js`** — Zod schemas for all API endpoints. Server-side validation with filter-style arrays (silently drops invalid items).
- **`_shared.js`** — Supabase client, rate limiting, CORS, origin validation, and `withApiHandler()` middleware that wraps all API endpoints with shared CORS/auth/rate-limit/content-type handling.

## Common commands

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # vitest run
vercel dev        # Test serverless functions locally
```

## Code conventions

- **No TypeScript** — entire codebase is plain JavaScript with JSX
- **CSS-in-JS** — all styles are inline style objects in `styles.js`, no CSS files. Theme via CSS custom properties on `:root`. Global CSS is a string (`baseCSS`) injected via `<style>` tag in `main.jsx`
- **Fonts** — `FONT_SANS` is Satoshi (via Fontshare CDN), `FONT_SERIF` is Playfair Display (Google Fonts). Playfair is used only for the "Commonplace" wordmark (logo); all other headings and UI text use Satoshi. Don't introduce new fonts or expand Playfair usage beyond the logo
- **Border-radius system** — two tiers: `6px` for containers (cards, modals, panels, dropdowns, bars) and `4px` for small elements (buttons, inputs, tags, pills, checkboxes, menu items). `2px` for progress tracks. `50`/`50%` for circles. Don't introduce arbitrary radius values outside this system
- **Letter-spacing** — negative (`-0.02em` to `-0.03em`) on large headings, `0.04em` on uppercase labels, `0.02em` on small tags/pills, `0.01em` on secondary body text. Use `em` units, not `px`
- **Category pill colors** — desaturated by design (text blended ~25% toward gray, bg at 0.07-0.08 opacity). Don't restore to full Tailwind saturation
- **File naming**: components are PascalCase `.jsx`, hooks are `use*` camelCase `.js`, utils are camelCase `.js`, API routes are kebab-case `.js`, API private modules prefixed with `_`
- **Hooks own their domain** — each major feature gets a custom hook (`useProcessing`, `useSync`, `useEditState`, etc.) that encapsulates state + logic. App.jsx initializes them and passes props down
- **Functional updaters** — `setQuotes(prev => [...prev, ...new])` pattern used everywhere (Zustand setters accept both direct values and updater functions)
- **useReducer for complex state** — `useProcessing` uses a reducer/dispatch pattern for its state machine
- **Memoization** — `useMemo` for derived data, `useCallback` for handlers passed as props, `React.memo` on expensive list items with `propsEqual()` from `utils/helpers.js` for custom comparators
- **Constants centralized** — all magic numbers live in `src/config.js`. Category definitions and Z-index scale in `src/data/constants.js`. UI thresholds (swipe, long-press, breakpoints), localStorage keys, and share hash prefixes all in `config.js`
- **Animation timing tiers** — three standardized durations in `config.js`: `ANIM_FAST_MS` (150ms, micro-interactions), `ANIM_STANDARD_MS` (250ms, default transitions), `ANIM_SLOW_MS` (400ms, deliberate feedback like save pulse). CSS animations in `baseCSS` mirror these tiers. Don't introduce new arbitrary durations
- **API middleware** — all serverless functions use `withApiHandler()` from `_shared.js` for CORS, auth, rate limiting, and content-type validation. Anthropic model/URL/version are centralized in `ANTHROPIC` constant. Rate limits in `RATE_LIMITS` object
- **API validation** — all serverless functions use Zod schemas from `_schemas.js`. Filter-style validation: invalid items are silently dropped, not rejected
- **CSRF protection** — all API calls include `X-Requested-With: CommonplaceApp` header, validated server-side via `withApiHandler`
- **Click-outside pattern** — use `useClickOutside(ref, isOpen, onClose)` hook instead of inline `useEffect` with `mousedown` listeners. `OverflowMenu` handles its own click-outside internally
- **Mount guard pattern** — use `useMounted()` from `hooks/useMounted.js` instead of manual `mountedRef` + `useEffect` boilerplate. For dispatch wrappers, use `useSafeDispatch(dispatch)`
- **Immutable Set updates** — use `addToSet`, `removeFromSet`, `toggleInSet`, `addAllToSet`, `removeAllFromSet` from `utils/helpers.js` instead of inline `new Set(prev)` + mutate patterns
- **Flip positioning** — use `useFlipPosition(ref)` from `hooks/useFlipPosition.js` for viewport-aware dropdown positioning instead of manual `getBoundingClientRect` + `useState`
- **Text normalization** — `normalize()` in `textFormatting.js` (client) and `normalizeForCache()` in `api/_shared.js` (server) must stay in sync. Both use Unicode property escapes for correctness
- **localStorage access** — use `loadFromStorage()` for reads and `saveToStorage()` for writes (both in `utils/storage.js`) instead of raw `localStorage.getItem`/`setItem` with try/catch
- **Pluralization** — use `pluralize(count, "quote")` from `utils/helpers.js` instead of inline ternaries like `` `${n} ${n === 1 ? "quote" : "quotes"}` ``
- **Responsive breakpoint** — `MOBILE_BREAKPOINT_PX` (640px) from `config.js`. Below this: card view, long-press selection, mobile layouts

## Z-index scale

Defined as `Z` constants in `src/data/constants.js`:

```
Z.CATEGORY_PILLS  50    Category pills
Z.OVERLAY         59    Overlays
Z.MINI_HEADER     60    Mini-header (sticky)
Z.DROPDOWN        100   Dropdowns
Z.BULK_BAR        500   Bulk action bar
Z.MODAL           1000  Modals
Z.TOAST           2000  Toasts
```

## Known issues and rough edges

- `ResultsPhase.jsx` has been broken up: DnD logic extracted to `useDndQuotes`, modals to `ResultsModals`, notification bars to `NotificationBars`. Still the largest component but more manageable
- The Zustand migration is partial — `QuotesContext.jsx` still exists as a bridge layer. Components use `useQuotesContext()` rather than subscribing to the Zustand store directly, so they don't get selective re-render benefits yet
- Comment in `QuotesContext.jsx` line 99 says sync "will be replaced by TanStack Query in phase 2" — the `useSync` hook already uses TanStack Query, but the context bridge remains
- No TODO/FIXME comments exist in the codebase currently
- The `similarity()` function in `textFormatting.js` guards against empty word sets (returns 0 early). This was previously a fragile NaN-producing division; the guard was consolidated in a cleanup pass
- Share links come in two formats: hash links (`#s=<base64>`) decode client-side, public links (`#p=<id>`) fetch from server. Both are handled in `QuotesContext.jsx` mount effect
- Rate limiting falls back to per-instance in-memory tracking when Supabase is unavailable. In serverless environments each invocation can get a fresh map, making this weaker than persistent rate limiting. The in-memory fallback is better than no enforcement but not bulletproof

## What to avoid

- **Don't bypass QuotesContext** — even though Zustand is the real store, all components read from `useQuotesContext()`. Adding direct Zustand subscriptions would create two competing data paths
- **Don't change localStorage keys** — they're defined in `config.js` and used by both the store and the sync system. Changing them breaks existing users' data
- **Don't modify `_shared.js` ALLOWED_ORIGINS** without also updating the CSP header in `vercel.json` — they must stay in sync
- **Font CDN in CSP** — `vercel.json` CSP allows `api.fontshare.com` (style-src) and `cdn.fontshare.com` (font-src) for Satoshi. If switching fonts, update both `index.html` and the CSP
- **Don't remove the `X-Requested-With` header** from client-side API calls — all serverless functions validate it as CSRF protection
- **Lazy-load `localQuotes.js`** — it's ~477KB and is dynamically imported in `useProcessing`. Don't convert to a static import. It's pre-warmed via `requestIdleCallback` in `main.jsx` so the module is cached before first use
- **`styles.js` is the only place for styles** — don't add CSS files or inline styles directly in components. The `baseCSS` string is injected once in `main.jsx`
- **API batch size** (`API_BATCH_SIZE = 10` in config.js) — tuned for Claude Haiku's context limits. Increasing it may cause truncated responses
- **Tombstone TTL** (7 days) — if a device doesn't sync within 7 days, deleted quotes can reappear from the cloud. This is by design
- **`vercel.json` security headers** — CSP, HSTS, frame-ancestors are set here. Changes affect production immediately on deploy
- **The assistant prefill** in `identify.js` (line 95: `{ role: 'assistant', content: '[' }`) forces Claude to start its response with `[`, ensuring valid JSON array output. Don't remove it
- **SSRF protection in `fetch-url.js`** — `isPrivateHostname()` blocks requests to private/internal IPs (RFC1918, loopback, link-local, cloud metadata). Manual redirect following validates each hop. Don't bypass these checks or switch back to `redirect: 'follow'`
- **OG font pinned version** — `og.js` loads Inter font from jsdelivr with a pinned version (`@5.1.1`). Don't change to `@latest` — unpinned CDN URLs risk breakage from upstream changes
