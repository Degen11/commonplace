# Quick Reference

A cheat sheet for navigating and working with the Commonplace codebase.

---

## Entry Points

| What | File |
|------|------|
| HTML shell | `index.html` |
| React bootstrap | `src/main.jsx` |
| App root / phase router | `src/components/App.jsx` |
| Global state provider | `src/contexts/QuotesContext.jsx` |
| API proxy (identify) | `api/identify.js` |
| API proxy (sync) | `api/sync.js` |
| All config constants | `src/config.js` |

## Where the Main Logic Lives

| Task | File | Function/Hook |
|------|------|--------------|
| AI identification pipeline | `src/hooks/useProcessing.js` | `useProcessing()` |
| Cloud sync (pull/push) | `src/hooks/useSync.js` | `useSync()` |
| Quote CRUD operations | `src/hooks/useQuoteActions.js` | `useQuoteActions()` |
| Edit mode / selection | `src/hooks/useEditState.js` | `useEditState()` |
| Filtering / sorting / search | `src/hooks/useViewPreferences.js` | `useViewPreferences()` |
| Duplicate detection | `src/utils/textFormatting.js` | `similarity()` |
| Text splitting | `src/utils/textFormatting.js` | `smartSplit()` |
| Local DB matching | `src/data/localQuotes.js` | `localLookup()` |
| File parsing (Kindle, CSV, etc.) | `src/utils/parsers.js` | `parseFile()`, `parseKindle()`, etc. |
| Export generation | `src/utils/export.js` | `exportCSV()`, `exportJSON()`, etc. |
| Phase transitions | `src/components/App.jsx` | `setPhase()` |
| Collection management | `src/contexts/QuotesContext.jsx` | `createCollection()`, etc. |
| Toast notifications | `src/contexts/ToastContext.jsx` | `addToast()` |

## Important Functions

### Text Processing (`src/utils/textFormatting.js`)

```
smartSplit(text)          Split pasted text into individual quotes
similarity(a, b)          Word-set overlap ratio (0-1) for duplicate detection
normalizeText(text)       Lowercase, remove punctuation for comparison
formatQuoteText(text)     Smart capitalize, fix dashes/quotes (if formatting enabled)
```

### API Shared (`api/_shared.js`)

```
rateLimit(key, max, window)   Per-IP rate limiting
cors(req, res)                CORS header handling
getSupabase()                 Supabase client singleton
```

## Common Patterns

### Refs for async safety
State values used in async callbacks (retries, debounced saves) are mirrored in `useRef` to prevent stale closures:
```javascript
const latestQuotes = useRef(quotes);
useEffect(() => { latestQuotes.current = quotes; }, [quotes]);
// In retry: use latestQuotes.current, NOT quotes
```

### Debounced persistence
State changes trigger debounced saves to localStorage (300ms) and Supabase (2s):
```
Edit → setState → useEffect → debounce → localStorage.setItem / POST /api/sync
```

### Phase management
`App.jsx` uses a `phase` state ("input" | "processing" | "collection") to render the correct top-level component. Phase transitions include a 200ms CSS fade.

### Error boundaries
Two levels: `ErrorBoundary` (root — catches everything) and `SectionErrorBoundary` (wraps individual panels so one crash doesn't take down the app).

### Inline editing pattern
Components use local `editingField` state. Clicking a field switches it to an input; blur or Enter saves. `InlineEditors.jsx` handles source and category inline editing with autocomplete suggestions.

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.jsx` | `TableView.jsx` |
| Hooks | `use` prefix, camelCase `.js` | `useSync.js` |
| Utilities | camelCase `.js` | `textFormatting.js` |
| Contexts | PascalCase `.jsx` | `QuotesContext.jsx` |
| API routes | kebab-case `.js` | `auto-group.js` |
| Data files | camelCase `.js` | `localQuotes.js` |

## Category System

**Source categories** (quote has a known origin):
`Film` `TV` `Book` `Music` `Speech` `Person` `Phrase`

**Vibe tags** (source unknown, describes the tone):
`Aphorism` `Philosophical` `Observation` `Comedic` `Poetic` `Existential` `Motivational` `Cynical` `Identity` `Reflection`

**Custom categories**: User-defined, stored in `customCats` array.

Colors for all categories are defined in `src/data/constants.js` → `CAT_COLORS`.

## Key Configuration Values (`src/config.js`)

| Constant | Value | What it controls |
|----------|-------|-----------------|
| `API_BATCH_SIZE` | 20 | Quotes per API request |
| `DUPE_SIMILARITY_THRESHOLD` | 0.55 | When to flag duplicates |
| `SYNC_DEBOUNCE_MS` | 2000 | Delay before cloud push |
| `PERSIST_DEBOUNCE_MS` | 300 | Delay before localStorage write |
| `TOMBSTONE_TTL_MS` | 7 days | Deletion record lifespan |
| `API_TIMEOUT_MS` | 30s | API request timeout |
| `MAX_QUOTE_TEXT_LENGTH` | 5000 | Max chars per quote |
| `TOAST_DURATION_MS` | 2500 | Toast auto-dismiss |

## Quirks and Gotchas

1. **No TypeScript** — everything is plain JavaScript, no type checking
2. **Styles are JS objects** — all in `styles.js`, not CSS files. Theme uses CSS custom properties.
3. **No real-time sync** — Supabase is used as a REST endpoint, not for subscriptions
4. **Device-based identity** — UUID in localStorage, no user accounts. Clearing localStorage = new device
5. **`<div>` table, not `<table>`** — `TableView.jsx` uses flexbox divs, not semantic table elements
6. **Checkboxes are styled divs** — not native `<input type="checkbox">`
7. **Local DB is lazy-loaded** — `localQuotes.js` is dynamically imported on first processing run
8. **Smart formatting is opt-in** — disabled by default in InputPhase
9. **Share links have two formats** — hash links (`#s=<base64>`) decode client-side; public links (`#p=<id>`) fetch from server
10. **Tombstones expire** — deleted quotes can reappear from cloud sync after 7 days if the other device hasn't synced

## API Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/identify` | 30 req/min per IP |
| `/api/sync` | 60 req/min per IP |
| `/api/share` | 15 req/min per IP |

## Z-Index Scale

```
50    Category pills
59    Overlays
60    Mini-header (sticky)
100   Dropdowns
500   Bulk action bar
1000  Modals
2000  Toasts
```

## Responsive Breakpoint

**640px** — below this, the app:
- Auto-switches from table to card view
- Shows mobile-optimized layouts
- Enables long-press for selection (`useLongPress`)
