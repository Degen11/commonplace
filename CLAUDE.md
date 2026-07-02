# CLAUDE.md

## Project overview

Commonplace is a quote collection organizer. Users paste messy text (or import files), and the app identifies sources and categories using a local database of 3,700+ quotes and Claude Haiku AI (`claude-haiku-4-5-20251001`) as a fallback. The result is a searchable, filterable, exportable collection. Live at [commonplace.pro](https://commonplace.pro).

## Tech stack

- **React 19** (no TypeScript — plain JSX/JS throughout)
- **React Compiler** (`babel-plugin-react-compiler` pinned at 1.0.0) — automatic memoization, wired up in `vite.config.js` via `@rolldown/plugin-babel` with `reactCompilerPreset` from `@vitejs/plugin-react`
- **Vite 8** (rolldown-based) — dev server and build
- **Zustand 5** — primary state management (`src/stores/quotesStore.js`)
- **TanStack React Query 5** — server state / sync mutations
- **TanStack React Virtual 3** — virtualized list rendering
- **motion 12** (Framer Motion successor) — animations via `motion/react`
- **@base-ui/react 1** — headless Dialog (`ModalShell`), Menu (`QuoteActions`, `MiniHeader`), Popover (`QuickAddBar`, `CollectionsSidebar`) — provides focus traps, dismiss behavior, and ARIA semantics
- **@dnd-kit** — drag-and-drop reordering (`@dnd-kit/core` 6 + `@dnd-kit/sortable` 10)
- **@use-gesture/react 10** — touch gesture bindings (`useSwipe`, `useLongPress`)
- **react-modal-sheet 5** — mobile bottom sheet (`MobileSheet.jsx`)
- **Fuse.js 7** — fuzzy search
- **compromise 14** — NLP (proper noun detection in text formatting)
- **clsx 2** — conditional className composition
- **Zod 4** — API request validation (server-side, `api/_schemas.js`)
- **satori + @resvg/resvg-js** — share image generation (server-side SVG → PNG); resvg also powers `scripts/generate-icons.mjs`
- **sonner 2** — toast notifications
- **lucide-react** — icons
- **@supabase/supabase-js 2** — database client (server-side only)
- **@vercel/analytics + @vercel/speed-insights** — rendered in `App.jsx`
- **vite-plugin-pwa** — service worker / PWA manifest (precaches app shell + icons, runtime-caches Google Fonts and Fontshare)
- **Vercel** — hosting + serverless functions
- **Vitest 4** — test runner (configured in `vite.config.js`)
- **ESLint 10** — flat config (`eslint.config.js`), React Compiler compatibility checks

## Architecture

### Directory layout

```
public/                       Static assets
  favicon.svg                 Source artwork for all app icons
  favicon.ico, *.png          Generated icons — regenerate via `npm run icons`, don't hand-edit
  robots.txt, sitemap.xml     SEO files

scripts/
  generate-icons.mjs          Renders favicon.svg → PNG/ICO app icons (uses @resvg/resvg-js)

api/                          Vercel serverless functions (Node.js)
  _shared.js                  Supabase client, CORS, rate limiting, origin validation, withApiHandler middleware
  _schemas.js                 Zod schemas for all API endpoints
  identify.js                 POST — proxy to Claude Haiku (claude-haiku-4-5-20251001) for quote identification
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
    QuotesContext.jsx           Side-effects-only provider — share link decoding, cloud pull/push scheduling, storage toast
    ToastContext.jsx            Toast notification queue

  components/
    App.jsx                    Root orchestrator — phase management, hook init (useProcessing, useQuoteActions, useTheme)
    ResultsPhase.jsx           Results phase — owns view prefs, edit state, keyboard shortcuts, sidebar, all results UI
    ResultsModals.jsx          All modal dialogs for results phase (shortcuts, share image, confirm clear/delete, dupe modal)
    NotificationBars.jsx       Status/notification bars (shared view, API errors, processing stats, attention/review)
    QuickAddBar.jsx            Inline quote add form with dupe detection
    InputPhase.jsx             Landing page — text input, file import, scroll-reveal, formatting preview
    inputPhaseStyles.js        Homepage-specific styles (HP object), timeline data, reveal transition helper
    UrlImportPanel.jsx         URL import panel — fetch URL, extraction mode selector, preview modal
    ProcessingPhase.jsx        AI identification progress display (ring, per-phase subtitle, elapsed time + ETA on long jobs)
    TableView.jsx              Main table view with inline editing and drag-to-reorder
    CardItem.jsx               Card view (mobile)
    HeaderBar.jsx              Top toolbar — search, filters, view toggles, sync pill
    MiniHeader.jsx             Sticky header on scroll
    BulkBar.jsx                Bulk actions — reassign category/source, delete
    EditForm.jsx               Full quote editor modal
    InlineEditors.jsx          Click-to-edit source/category with autocomplete
    CollectionsSidebar.jsx     Collection management sidebar
    OnboardingModal.jsx        First-run 3-step onboarding walkthrough
    QuoteActions.jsx           Shared action components (FavBtn, OverflowMenu with pop animation)
    HighlightText.jsx          Search term highlighting in table/card views
    AddMorePanel.jsx           Panel for adding more quotes from results
    AnimatedNumber.jsx         Animated number transitions
    ConfirmModal.jsx           Reusable confirmation dialog
    ModalShell.jsx             Shared modal wrapper — Base UI Dialog root/portal/backdrop boilerplate
    EntryReviewModal.jsx       Pre-processing review of split entries before identification
    CollectionDupeModal.jsx    Collection-level duplicate resolution
    DupeModal.jsx              Quote duplicate detection modal
    EmptyState.jsx             Empty state placeholder UI
    ErrorBoundary.jsx          Top-level React error boundary
    SectionErrorBoundary.jsx   Section-scoped error boundary
    ExportDropdown.jsx         Export format menu
    Footer.jsx                 App footer
    HowItWorksAnimation.jsx    Onboarding animation sequence
    Logo.jsx                   Commonplace wordmark
    MobileSheet.jsx            Mobile bottom sheet overlay
    ShareImageModal.jsx        Share image preview/download
    ShortcutsModal.jsx         Keyboard shortcuts reference
    StatsPanel.jsx             Collection statistics panel
    StatsOverlay.jsx           Stats overlay display
    ScrollTopButton.jsx        Floating "back to top" button (fades in past ~600px scroll, bottom-left)
    SyncPill.jsx               Cloud sync status indicator
    ToolbarSection.jsx         Reusable toolbar section wrapper
    UrlPreviewModal.jsx        URL content preview before import
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
    useScrollLock.js           Lock body scroll when modals are open
    useSwipe.js                Touch swipe gestures
    useLongPress.js            Mobile long-press for selection
    useToasts.js               Toast notification management (variants: info/success/error/loading; accepts an `extra` opts arg, e.g. `{ id }` to update a toast in place)
    useAnimatedNumber.js       Smooth number transition animations
    useLatestRef.js            Ref kept in sync with latest value (compiler-safe stale-closure helper)

  data/
    constants.js               Categories, colors, confidence levels, example quotes, sanitization
    localQuotes.js             3,700+ curated quotes — lazy-loaded via dynamic import. Builds ENTRY_WORDSETS (Map<entry,Set<word>>) and WORD_INDEX (inverted word→entries map) at module init for fast word-overlap lookup

  utils/
    textFormatting.js          smartSplit, normalize, similarity (dupe detection), basicFormat, proper nouns
    parsers.js                 File parsing — Kindle highlights, Readwise, CSV, JSON, Markdown
    quotes.js                  makeQuote factory, findDuplicateGroups
    export.js                  Export generators — CSV, JSON, Markdown, plain text
    shareImage.js              Generate quote share images via Canvas (2x resolution)
    api.js                     fetchWithTimeout, shared API headers
    apiErrors.js               Human-readable API error descriptions
    storage.js                 loadFromStorage / saveToStorage — safe localStorage JSON read/write with validation
    helpers.js                 Shared utilities: pluralize, groupBy, countBy, Set helpers (addToSet, removeFromSet, etc.)
    sync.js                    mergeByTimestamp — cloud/local merge helper
    richTextKeys.js            Key constants for rich text handling
    uuid.js                    UUID v4 generation
    smartRestore.js            Smart session restore logic

  **/__tests__/                Tests colocated with their modules (25 files, 314 tests)
    components/                App, AddMorePanel, CollectionDupeModal, HeaderBar, InputPhase,
                               ProcessingPhase, ResultsPhase, ShareImageModal, SyncPill, TableView, styles
    hooks/                     processingErrors, useEditState, useProcessing, useQuoteActions, useSync
    utils/                     export, helpers, parsers, quotes, smartRestore, storage, sync, textFormatting, uuid
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

**QuotesContext** (`src/contexts/QuotesContext.jsx`) is a side-effects-only provider — no context value is provided. It handles mount-time effects: shared link decoding, initial cloud pull, debounced push scheduling, and storage limit toasts (which require `ToastContext`). All components read state directly from `useQuotesStore()`.

**Local hook state** — each feature hook manages its own state:
- `useProcessing` — useReducer state machine (idle → dupes → processing → done). Initialized in App.jsx (spans phases)
- `useEditState` — edit mode, selected quote IDs, inline editing. Initialized in ResultsPhase
- `useViewPreferences` — sort column/direction, category filter, search term, layout mode. Initialized in ResultsPhase
- `useQuoteActions` — delete/copy/re-identify animations. Initialized in App.jsx (handleFileImport used by InputPhase)
- `useKeyboardShortcuts` — results-only keyboard handler. Initialized in ResultsPhase

**Pattern: refs for async safety** — `useRef` holds latest state values for use in long-running async callbacks (retries, debounced saves). Ref assignments are done in `useEffect` (not during render) to stay compatible with the React Compiler. `hooks/useLatestRef.js` encapsulates this; the pattern appears in hooks like `useProcessing`, `useQuoteActions`, and `useKeyboardShortcuts`.

## Data persistence

- **localStorage** is the primary store — offline-first. Keys are defined in `config.js` (`LS_QUOTES`, `LS_CATS`, etc.)
- **Supabase** (PostgreSQL) is the cloud backup — sync is explicit, not real-time. Schema is in `supabase/migration.sql`
- **Sync model**: device-based UUID (no user accounts). Each browser gets a UUID stored in `commonplace_device_id`. `useSync` manages pull (on mount) and push (2s debounce after changes) via TanStack Query mutations with exponential backoff retry
- **Deletion tombstones**: deleted quote IDs are tracked for 7 days (`TOMBSTONE_TTL_MS`) to prevent re-sync of deleted items
- **Cross-tab sync**: the Zustand store listens to `window.storage` events to pick up changes from other tabs. `useTheme` also listens to sync dark/light mode across tabs
- **Persistence**: Zustand store subscribes to its own state changes and debounces writes to localStorage (300ms)

## Key components

- **`App.jsx`** — Phase orchestrator (~260 lines). Initializes cross-phase hooks (`useProcessing`, `useQuoteActions`, `useTheme`), manages phase state, renders `InputPhase`/`ProcessingPhase`/`ResultsPhase` inside `MotionConfig reducedMotion="user"` → `LayoutGroup` → `AnimatePresence`.
- **`ResultsPhase.jsx`** — The results phase. Reads state directly from `useQuotesStore`. Initializes `useViewPreferences`, `useEditState`, `useKeyboardShortcuts`, `useDndQuotes` internally. Delegates modals to `ResultsModals`, notification bars to `NotificationBars`.
- **`quotesStore.js`** — Zustand store with all collection CRUD, cloud merge logic, cross-tab sync, and debounced persistence.
- **`QuotesContext.jsx`** — Side-effects-only provider. Decodes share links (hash `#s=` for base64, `#p=` for public), kicks off initial cloud pull, schedules debounced push to Supabase. Provides no context value — it just renders `children`.
- **`useProcessing.js`** — The identification pipeline. Uses a useReducer state machine. Three extracted sub-functions (`handleLocalLookup`, `handleExternalLookup`, `handleApiBatch`) orchestrated by `runProcessing()`. Handles local lookup → external lookup → AI batching → duplicate detection → auto-transition to results.
- **`useSync.js`** — TanStack Query-based sync. `pull()` fetches cloud data on mount; `schedulePush()` debounces and pushes via mutation with exponential backoff.
- **`styles.js`** — All CSS-in-JS. Contains `baseCSS` (global CSS string injected in main.jsx) and style objects for every component. Theme uses CSS custom properties (`--cp-bg`, `--cp-text`, etc.). Homepage-specific styles live separately in `inputPhaseStyles.js`.
- **`_schemas.js`** — Zod schemas for all API endpoints. Server-side validation with filter-style arrays (silently drops invalid items).
- **`_shared.js`** — Supabase client, rate limiting, CORS, origin validation, and `withApiHandler()` middleware that wraps all API endpoints with shared CORS/auth/rate-limit/content-type handling.

## Common commands

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run test      # vitest run (25 test files, 314 tests across components, hooks, utils)
npm run icons     # Regenerate public/ app icons (PNG/ICO) from favicon.svg
npm run lint      # eslint src/ api/ — React Compiler compatibility + serverless correctness rules
vercel dev        # Test serverless functions locally
```

## Code conventions

- **No TypeScript** — entire codebase is plain JavaScript with JSX
- **CSS-in-JS** — all styles are inline style objects in `styles.js`, no CSS files. Theme via CSS custom properties on `:root`. Global CSS is a string (`baseCSS`) injected via `<style>` tag in `main.jsx`
- **`color-scheme`** — declared in `baseCSS` (`:root` light, `html.dark` + media-query fallback dark) and as a `<meta>` in `index.html`. This is what makes native UI (select popups, scrollbars, autofill, carets) follow the theme — keep it when touching theme CSS
- **Reduced motion** — two layers: `MotionConfig reducedMotion="user"` in `App.jsx` disables motion/react transforms, and a `@media(prefers-reduced-motion:reduce)` block at the end of `baseCSS` collapses CSS animations/transitions to .01ms (not 0, so `animationend`/`transitionend` listeners still fire). New animations are covered automatically — don't add per-component reduced-motion checks
- **Tooltips** — use the `.ui-tip` class with `data-tip="..."` (variants: `ui-tip-below`, `ui-tip-left`, `ui-tip-right`), not the native `title` attribute. Icon-only controls also need `aria-label` (the CSS-pseudo-element tooltip is not a reliable accessible name). Exception: inside clip containers where the tooltip would be cut off (e.g. the horizontally scrolling `.cat-scroll`), native `title` + `aria-label` is acceptable. The `.sidebar-rail:has(.ui-tip:hover)` rule lets collapsed-sidebar tooltips escape its `overflow:hidden`
- **Native `<select>` styling** — selects spread `SELECT_RESET` (in `styles.js`, also exported as `styles.selectReset`): `appearance:none` plus a data-URI chevron as `backgroundImage`. Use `backgroundColor` (never the `background` shorthand, which wipes the chevron) and reserve ≥24px right padding
- **Scrollbars** — themed globally via the standard `scrollbar-width`/`scrollbar-color` properties only. Don't add `::-webkit-scrollbar` rules — they disable macOS overlay scrollbars
- **theme-color sync** — `useTheme.js` writes `THEME_COLOR_LIGHT`/`THEME_COLOR_DARK` (from `config.js`) into both `theme-color` metas on every theme change so mobile browser chrome follows the in-app toggle
- **Fonts** — `FONT_SANS` is Satoshi (via Fontshare CDN), `FONT_SERIF` is Playfair Display (Google Fonts). Playfair is used only for the "Commonplace" wordmark (logo); all other headings and UI text use Satoshi. Don't introduce new fonts or expand Playfair usage beyond the logo
- **Border-radius system** — two tiers: `6px` for containers (cards, modals, panels, dropdowns, bars) and `4px` for small elements (buttons, inputs, tags, pills, checkboxes, menu items). `2px` for progress tracks. `50`/`50%` for circles. Don't introduce arbitrary radius values outside this system
- **Letter-spacing** — negative (`-0.02em` to `-0.03em`) on large headings, `0.04em` on uppercase labels, `0.02em` on small tags/pills, `0.01em` on secondary body text. Use `em` units, not `px`
- **Category pill colors** — desaturated by design (text blended ~25% toward gray, bg at 0.07-0.08 opacity). Don't restore to full Tailwind saturation
- **File naming**: components are PascalCase `.jsx`, hooks are `use*` camelCase `.js`, utils are camelCase `.js`, API routes are kebab-case `.js`, API private modules prefixed with `_`
- **Hooks own their domain** — each major feature gets a custom hook (`useProcessing`, `useSync`, `useEditState`, etc.) that encapsulates state + logic. App.jsx initializes them and passes props down
- **Functional updaters** — `setQuotes(prev => [...prev, ...new])` pattern used everywhere (Zustand setters accept both direct values and updater functions)
- **useReducer for complex state** — `useProcessing` uses a reducer/dispatch pattern for its state machine
- **React Compiler handles memoization** — don't add manual `useMemo`, `useCallback`, or `React.memo` unless the compiler's ESLint rules specifically require it (e.g., unstable function references in `useEffect` deps). The compiler automatically optimizes re-renders. One intentional `useMemo` remains: the Fuse.js index in `useViewPreferences.js` uses a fingerprint-keyed `useMemo` to skip expensive rebuilds on metadata-only changes — this is annotated with an `eslint-disable` comment
- **Constants centralized** — all magic numbers live in `src/config.js`. Category definitions and Z-index scale in `src/data/constants.js`. UI thresholds (swipe, long-press, breakpoints), localStorage keys, and share hash prefixes all in `config.js`
- **Animation timing tiers** — three standardized durations in `config.js`: `ANIM_FAST_MS` (150ms, micro-interactions), `ANIM_STANDARD_MS` (250ms, default transitions), `ANIM_SLOW_MS` (400ms, deliberate feedback like save pulse). CSS animations in `baseCSS` mirror these tiers. Don't introduce new arbitrary durations
- **Spring physics** — motion/react spring configs are used for key interactions: phase transitions (`App.jsx`, stiffness: 380, damping: 30), modals (`ModalShell.jsx` uses spring-like cubic-bezier keyframes), bulk bar entrance, and stats overlay. Standard spring config: `{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }`. CSS keyframes use `cubic-bezier(0.16, 1, 0.3, 1)` for spring-like overshoot
- **Shared element transitions** — `LayoutGroup` wraps `AnimatePresence` in `App.jsx`. Elements with matching `layoutId` props morph across phase transitions: `"app-logo"` on the logo (InputPhase nav → ProcessingPhase nav → HeaderBar title), `"phase-action"` on the process button → progress ring. Use `layoutId` sparingly — only for elements that create meaningful visual continuity between phases
- **Staggered list entrances** — CSS class `stagger-in` triggers cascading entrance animation on table rows (`.qrow`) and cards (`.qcard`) with 35ms offsets. Applied on mount in `TableView` and `MobileCardList`. The `list-shuffle` class triggers on sort/filter/collection changes via fingerprint detection. Both use the `cubic-bezier(0.16, 1, 0.3, 1)` easing
- **Drag-and-drop visuals** — dragged items get scale(1.04), rotate(-2deg), elevated drop-shadow, and accent border. Source rows dim to 0.35 opacity with grayscale(0.3) and scale(0.98). Drop targets use `dropGlow` animation with box-shadow pulse. Collection drop targets scale 1.03 on hover
- **API middleware** — all serverless functions use `withApiHandler()` from `_shared.js` for CORS, auth, rate limiting, and content-type validation. Anthropic model/URL/version are centralized in `ANTHROPIC` constant. Rate limits in `RATE_LIMITS` object
- **API validation** — all serverless functions use Zod schemas from `_schemas.js`. Filter-style validation: invalid items are silently dropped, not rejected
- **CSRF protection** — all API calls include `X-Requested-With: CommonplaceApp` header, validated server-side via `withApiHandler`
- **No mount guards needed** — React 18+ removed the "setState on unmounted component" warning. Don't add mount-guard refs or safe-dispatch wrappers
- **React Compiler rules** — the compiler requires code that follows the Rules of React. Key constraints: (1) don't read or write `ref.current` during render — assign refs in `useEffect` or event handlers; (2) don't call `setState` directly inside `useEffect` for derived state — use initializers, direct computation, or the `setState`-during-render pattern (see `useInfiniteScroll.js` for an example); (3) don't create components dynamically during render (e.g., `const Icon = getIcon(name)`) — use `createElement` or pass the component as a prop. Run `npm run lint` to check for compiler bailouts
- **Immutable Set updates** — use `addToSet`, `removeFromSet`, `toggleInSet`, `addAllToSet`, `removeAllFromSet` from `utils/helpers.js` instead of inline `new Set(prev)` + mutate patterns
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
- No TODO/FIXME comments exist in the codebase currently
- **React Compiler vs TanStack Virtual** — the two components that call `useWindowVirtualizer()` (`TableView` and `MobileCardList` in `ResultsPhase.jsx`) carry a `"use no memo"` directive. The virtualizer is a stable mutable instance, so compiler-memoized `getVirtualItems()` results went stale when it re-rendered without a compiler-visible dep change (symptom: cards→table view switch left the table empty until a window resize). Don't remove the directives; virtualization itself still windows correctly without compiler memoization. Minor derived-state patterns in `ToolbarSection` and `UrlPreviewModal` also skip compiler optimization — those are functional and don't cause bugs. ESLint currently reports **zero errors and zero warnings** (`npm run lint`, covering `src/` and `api/`). Note: `eslint-plugin-react-hooks` must be installed separately to run the check
- **API batch retry** — `useProcessing.js` retries each failed batch exactly once. On retry failure the batch's items are added to `failedEntries` with a count-specific error message and processing continues to the next batch (no early exit). This is intentional: a single-batch failure should never prevent other batches from completing
- **Pre-warm `/api/identify`** — `InputPhase.jsx` fires a minimal POST to `/api/identify` on first non-empty keystroke via `requestIdleCallback` (falls back to `setTimeout(cb, 200)`). This warms the serverless cold-start before the user clicks "Organize". The request is expected to fail validation (empty messages array) — that's fine, the goal is only to initialize the function runtime. The `prewarmedRef` ref ensures this fires at most once per mount
- Share links come in two formats: hash links (`#s=<base64>`) decode client-side, public links (`#p=<id>`) fetch from server. Both are handled in `QuotesContext.jsx` mount effect
- Rate limiting falls back to per-instance in-memory tracking when Supabase is unavailable. In serverless environments each invocation can get a fresh map, making this weaker than persistent rate limiting. The in-memory fallback is better than no enforcement but not bulletproof

## What to avoid

- **Don't change localStorage keys** — they're defined in `config.js` and used by both the store and the sync system. Changing them breaks existing users' data
- **Don't modify `_shared.js` ALLOWED_ORIGINS** without also updating the CSP header in `vercel.json` — they must stay in sync
- **Font CDN in CSP** — `vercel.json` CSP allows `api.fontshare.com` (style-src) and `cdn.fontshare.com` (font-src) for Satoshi. If switching fonts, update `index.html`, the CSP, **and** the Workbox `runtimeCaching` entries in `vite.config.js` (Fontshare is cached there so Satoshi works offline — don't remove those entries)
- **App icons are generated** — `public/favicon.ico`, `apple-touch-icon.png`, and `icon-*.png` come from `npm run icons` (renders `favicon.svg`). Don't hand-edit the PNGs; if the SVG artwork changes, re-run the script (it depends on favicon.svg's structure — 32×32 viewBox, background `<rect>` first)
- **Theme color triple** — `THEME_COLOR_LIGHT`/`THEME_COLOR_DARK` in `config.js`, the `theme-color` metas in `index.html`, and `theme_color`/`background_color` in the `vite.config.js` PWA manifest must all stay in sync (currently `#FAF8F4` / `#1A1A1A`, matching `--cp-bg`)
- **Don't remove the `X-Requested-With` header** from client-side API calls — all serverless functions validate it as CSRF protection
- **Lazy-load `localQuotes.js`** — it's ~477KB and is dynamically imported in `useProcessing`. Don't convert to a static import. It's pre-warmed via `requestIdleCallback` in `main.jsx` so the module is cached before first use. The module builds `ENTRY_WORDSETS` and `WORD_INDEX` at init time (once); the word-overlap path in `localLookup` uses these to avoid scanning all 3,700 entries — don't remove them
- **`serialize-javascript` npm override** — `package.json` has an `overrides` entry pinning `serialize-javascript` to `^7.0.5` to resolve a high-severity vulnerability in the `vite-plugin-pwa → workbox-build → @rollup/plugin-terser` chain. Don't remove it; doing so re-introduces the vulnerability
- **`styles.js` is the primary place for styles** — don't add CSS files or inline styles directly in components. The `baseCSS` string is injected once in `main.jsx`. The one exception is `inputPhaseStyles.js`, which holds homepage-specific styles (`HP` object, timeline data, `reveal` helper) extracted from `InputPhase.jsx` to keep it manageable
- **API batch size** (`API_BATCH_SIZE = 10` in config.js) — tuned for Claude Haiku's context limits. Increasing it may cause truncated responses
- **Tombstone TTL** (7 days) — if a device doesn't sync within 7 days, deleted quotes can reappear from the cloud. This is by design
- **`vercel.json` security headers** — CSP, HSTS, frame-ancestors are set here. Changes affect production immediately on deploy
- **The assistant prefill** in `identify.js` (`{ role: 'assistant', content: '[' }`) forces Claude to start its response with `[`, ensuring valid JSON array output. Don't remove it
- **SSRF protection in `fetch-url.js`** — `isPrivateHostname()` blocks requests to private/internal IPs (RFC1918, loopback, link-local, cloud metadata). Manual redirect following validates each hop. Don't bypass these checks or switch back to `redirect: 'follow'`
- **OG font pinned version** — `og.js` loads Inter font from jsdelivr with a pinned version (`@5.1.1`). Don't change to `@latest` — unpinned CDN URLs risk breakage from upstream changes
- **Build chunk splitting** — `vite.config.js` uses a function-based `manualChunks` to split `motion` and `@dnd-kit` into separate chunks. Don't use object-based config (causes circular chunk warnings between dndkit and tanstack)
- **Onboarding localStorage key** — `LS_ONBOARDED` (`commonplace_onboarded`) tracks whether the user has seen the first-run modal. Don't reset this without user intent
- **Don't remove `babel-plugin-react-compiler`** from `vite.config.js` — the entire codebase relies on compiler-managed memoization. Removing it would cause performance regressions since manual `memo`/`useCallback`/`useMemo` have been stripped
- **Don't remove `LayoutGroup`** from `App.jsx` — it wraps `AnimatePresence` and enables shared element transitions (`layoutId`) across phases. Removing it breaks the logo morph and button→ring transitions between input/processing/results. If adding new `layoutId` props, ensure they're unique and only used on elements that should visually connect across phase transitions
