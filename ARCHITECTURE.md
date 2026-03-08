# Architecture

> Commonplace — an AI-powered quote collection organizer.

This document describes how the codebase is structured, how data flows, and the key design decisions behind it. Reference this instead of reading source files when starting new conversations.

---

## High-Level Overview

Commonplace is a single-page React app with Vercel serverless functions as the backend. Users paste messy quotes, the app identifies sources/categories via Claude Haiku AI (with a 600+ local quote database as a fast fallback), and presents a clean, browsable, exportable collection.

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                    │
│                                                         │
│  InputPhase → ProcessingPhase → Collection View         │
│       │              │               │                  │
│       │         useProcessing    QuotesContext           │
│       │          ┌───┴───┐       (global state)         │
│       │          │       │           │                   │
│       │     localQuotes  API    localStorage             │
│       │     (600+ DB)    │       (primary store)         │
│       │                  │           │                   │
└───────┼──────────────────┼───────────┼──────────────────┘
        │                  │           │
        ▼                  ▼           ▼
   File parsing     /api/identify   /api/sync
   (client-side)    /api/share      (Supabase)
                    /api/auto-group
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, JavaScript (no TypeScript) |
| Styling | CSS-in-JS inline style objects (no CSS framework) |
| Icons | lucide-react |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Haiku |
| Analytics | @vercel/analytics, @vercel/speed-insights |
| Deployment | Vercel (auto-deploy on push to main) |

## Directory Structure

```
commonplace/
├── api/                        # Vercel serverless functions (backend)
│   ├── _shared.js              # Rate limiting, CORS helpers, Supabase client
│   ├── identify.js             # POST /api/identify — AI quote identification proxy
│   ├── sync.js                 # GET/POST /api/sync — device data sync
│   ├── share.js                # GET/POST /api/share — public collection sharing
│   ├── auto-group.js           # POST /api/auto-group — AI quote grouping
│   └── fetch-url.js            # URL metadata extraction
│
├── src/
│   ├── main.jsx                # React entry point, theme init, global CSS injection
│   ├── config.js               # All tunable constants: timeouts, limits, thresholds
│   │
│   ├── components/             # UI components (PascalCase .jsx)
│   │   ├── App.jsx             # Root orchestrator: phase management, modal routing
│   │   ├── InputPhase.jsx      # Landing page, text input, file import
│   │   ├── ProcessingPhase.jsx # AI identification progress display
│   │   ├── TableView.jsx       # Main table view with drag-to-reorder
│   │   ├── CardItem.jsx        # Card view for mobile
│   │   ├── HeaderBar.jsx       # Top toolbar: search, filters, view toggles
│   │   ├── MiniHeader.jsx      # Sticky header on scroll
│   │   ├── BulkBar.jsx         # Bulk actions: reassign category, delete
│   │   ├── EditForm.jsx        # Full quote editor modal
│   │   ├── InlineEditors.jsx   # Click-to-edit source/category inline
│   │   ├── QuoteActions.jsx    # Action buttons: fav, copy, delete, re-identify
│   │   ├── DupeModal.jsx       # Duplicate detection resolution
│   │   ├── CollectionDupeModal.jsx  # Duplicate checking for collections
│   │   ├── CollectionsSidebar.jsx   # Sidebar: create, rename, organize collections
│   │   ├── StatsPanel.jsx      # Statistics dashboard
│   │   ├── ExportDropdown.jsx  # Export: CSV, JSON, MD, TXT
│   │   ├── UrlPreviewModal.jsx # Extract quotes from URLs
│   │   ├── Toast.jsx           # Notification component
│   │   ├── ShortcutsModal.jsx  # Keyboard shortcuts help
│   │   ├── HowItWorksAnimation.jsx  # Landing page animated demo
│   │   ├── ErrorBoundary.jsx   # Root error boundary
│   │   ├── SectionErrorBoundary.jsx # Section-level error isolation
│   │   └── styles.js           # All CSS-in-JS: baseCSS, component styles, animations
│   │
│   ├── contexts/               # React Context providers
│   │   ├── QuotesContext.jsx   # Global quotes, collections, sync state
│   │   └── ToastContext.jsx    # Toast notification queue
│   │
│   ├── hooks/                  # Custom hooks (camelCase .js)
│   │   ├── useProcessing.js    # AI identification pipeline + duplicate detection
│   │   ├── useSync.js          # Cloud sync: pull/push to Supabase
│   │   ├── useQuoteActions.js  # Quote CRUD: delete, copy, re-identify
│   │   ├── useEditState.js     # Edit mode, inline editing, selection tracking
│   │   ├── useViewPreferences.js  # Filtering, sorting, search, layout prefs
│   │   ├── useToasts.js        # Toast queue management
│   │   ├── useInfiniteScroll.js   # Pagination: 100 items/page
│   │   ├── useLongPress.js     # Mobile long-press gesture
│   │   └── useTheme.js         # Dark/light theme toggle
│   │
│   ├── data/
│   │   ├── constants.js        # Categories, colors, confidence levels
│   │   └── localQuotes.js      # 600+ curated quotes (lazy-loaded)
│   │
│   └── utils/
│       ├── textFormatting.js   # Text normalization, similarity, proper nouns
│       ├── parsers.js          # File parsing: Kindle, Readwise, CSV, JSON, MD
│       ├── export.js           # Export: CSV, JSON, Markdown, TXT, share encoding
│       ├── shareImage.js       # Generate quote images for sharing
│       ├── apiErrors.js        # API error code descriptions
│       └── uuid.js             # UUID v4 generation
│
├── public/                     # Static assets
├── index.html                  # HTML entry point
├── vite.config.js              # Vite config (sourcemaps disabled for prod)
└── vercel.json                 # Deployment config + security headers
```

## Phase-Based App Flow

The app operates in three distinct phases, managed by `App.jsx`:

```
"input"  ──→  "processing"  ──→  "collection"
  │               │                    │
  InputPhase      ProcessingPhase      TableView / CardItem
  (paste/import)  (progress bar)       (browse, edit, export)
```

- **input**: Landing page. User pastes text or imports files.
- **processing**: AI identifies quotes in batches. Progress bar and live feed.
- **collection**: Main view. Table or cards with search, filter, sort, bulk ops.

Users can return to the input phase to add more quotes to their existing collection.

## Data Flow: Quote Identification Pipeline

This is the core flow — what happens when a user submits quotes:

```
User Input (pasted text or imported file)
        │
        ▼
   smartSplit()                  Split input into individual quote strings
        │
        ▼
   Deduplication                 Remove exact duplicates from input
        │
        ▼
   localLookup()                 Match against 600+ local quote database
   (lazy-loaded)                 ← No API call needed for matches
        │
        ├── Matched quotes → added immediately
        │
        ▼
   Batch to /api/identify        Unmatched quotes sent in batches of 20
        │                        Claude Haiku identifies source + category
        ▼
   Parse API response            Extract structured quote data from AI
        │
        ▼
   Duplicate detection           Compare new quotes against existing collection
   similarity() ≥ 0.55          using word-set overlap algorithm
        │
        ├── No match → add to collection
        │
        ▼
   DupeModal                     User resolves: Keep Both / Merge / Skip
        │
        ▼
   QuotesContext update           State updated, triggers:
        │                         ├── localStorage persist (300ms debounce)
        └──────────────────────── └── Supabase sync (2s debounce)
```

Key details:
- **Local DB is checked first** — 600+ quotes in `localQuotes.js`, lazy-loaded on first use to avoid bloating the initial bundle
- **Batches of 20** to stay within Claude Haiku's context limits (`API_BATCH_SIZE` in config.js)
- **Similarity algorithm**: `(overlap * 2) / (wordSetA.size + wordSetB.size)` on normalized, stopword-removed text
- **Threshold**: 0.55 (55% match triggers duplicate modal)

## Data Flow: Sync Architecture

Sync uses a device-based UUID system — **no user accounts required**.

```
Browser                                     Supabase
  │                                            │
  ├── On mount: GET /api/sync?device_id=xxx ──→│
  │◄── Returns cloud quotes for this device ───┤
  │                                            │
  │    ┌── Merge: union by ID,                 │
  │    │   keep newer by updatedAt,            │
  │    │   respect deletion tombstones         │
  │    └──────────────────────────────         │
  │                                            │
  ├── On edit (2s debounce):                   │
  │    POST /api/sync { quotes, collections } ─→│
  │                                            │
  └── Retry with exponential backoff ─────────→│
       2s → 4s → 8s → 16s (max 4 retries)
```

- **localStorage is the primary store** — enables offline-first behavior
- **Supabase is the backup** — explicit sync, not real-time subscriptions
- **Deletion tombstones** — deleted quote IDs tracked for 7 days (`TOMBSTONE_TTL_MS`) to handle out-of-order merge conflicts
- **Refs instead of closures** — `useSync` stores latest state in refs so retries always push the most current data, not stale closure values

## State Management

### QuotesContext (global)

The central store, provided at the app root:

```javascript
{
  quotes: [],              // All quote objects
  customCats: [],          // User-defined categories
  collections: [],         // Named collections with quoteIds
  columnOrder: [],         // Table column ordering
  activeCollectionId: null, // Currently viewed collection
  syncStatus: "idle",      // "idle" | "syncing" | "error"
  lastSynced: null,        // Timestamp
  initialLoading: true,    // True until first sync completes
}
```

### Local hook state

Each major feature has its own hook managing local state:
- `useEditState` — edit mode, selected IDs, inline editing
- `useViewPreferences` — sort, filter, search, layout mode
- `useProcessing` — processing phase state, batches, progress

### Pattern: Refs for async safety

Throughout the codebase, `useRef` is used to hold the latest state values for use in async operations (retries, debounced callbacks). This prevents stale closures — a critical concern when retry logic fires seconds after the initial call.

```javascript
// In useSync.js — ensures retries push the LATEST data
const latestQuotes = useRef(quotes);
useEffect(() => { latestQuotes.current = quotes; }, [quotes]);
```

## Data Structures

### Quote

```javascript
{
  id: "uuid-v4",
  text: "The quote text (max 5000 chars)",
  source: "Author or origin (max 500 chars)",
  category: "Film|TV|Book|Music|Speech|Person|Phrase|<VibeTag>|<Custom>",
  confidence: "high" | "medium" | "low",
  favorite: false,
  updatedAt: 1709900000000
}
```

### Collection

```javascript
{
  id: "uuid-v4",
  name: "My Collection (max 50 chars)",
  icon: "Heart",           // lucide-react icon name, or null
  quoteIds: ["uuid", ...],
  createdAt: 1709900000000
}
```

### Categories

Two types:
- **Source categories**: Film, TV, Book, Music, Speech, Person, Phrase — assigned when the AI identifies a known origin
- **Vibe tags**: Aphorism, Philosophical, Observation, Comedic, Poetic, Existential, Motivational, Cynical, Identity, Reflection — assigned when the source is unknown, describing the tone/nature
- **Custom**: User-created categories stored in `customCats`

## API Layer

All endpoints live in `api/` and share utilities from `api/_shared.js` (CORS, rate limiting, Supabase client).

### POST /api/identify
- **Purpose**: Proxy to Anthropic Claude Haiku for quote identification
- **Input**: `{ formatting: boolean, messages: [{role, content}] }`
- **Output**: Claude's response with identified quotes in JSON
- **Rate limit**: 30 req/min per IP
- **Security**: Origin validation, CSRF header check (`X-Requested-With`), payload size validation

### GET/POST /api/sync
- **GET** `?device_id=<uuid>` — fetch device's quotes from Supabase
- **POST** `{ device_id, quotes, customCategories, deletedIds, collections }` — merge and save
- **Merge logic**: Union by ID, keep newer by `updatedAt`, respect deletion tombstones
- **Rate limit**: 60 req/min per IP

### GET/POST /api/share
- **GET** `?id=<shareId>` — fetch public collection (tracks view count)
- **POST** `{ quotes, title }` — create public link (30-day expiry)
- **Share encoding**: Minimal arrays `[text, source, category, favorite]` base64-encoded for URL hash sharing
- **Rate limit**: 15 req/min per IP

### POST /api/auto-group
- **Purpose**: AI-powered grouping — given quotes and a theme, returns matching quote IDs
- **Timeout**: 45s (longer than identify)

## Styling Architecture

All styles are **CSS-in-JS inline objects** defined in `src/components/styles.js`:

- No external CSS framework (no Tailwind, no CSS modules)
- CSS custom properties for theming (`--cp-bg`, `--cp-text`, etc.)
- Light/dark themes toggled via `useTheme` hook, applied as CSS vars on `:root`
- Responsive breakpoint: **640px** (mobile < 640, desktop ≥ 640)
- Global CSS (animations, resets) injected via `<style>` tag in `main.jsx`

**Z-index scale:**
| Value | Usage |
|-------|-------|
| 50 | Category pills |
| 59 | Overlays |
| 60 | Mini-header |
| 100 | Dropdowns |
| 500 | Bulk action bar |
| 1000 | Modals |
| 2000 | Toasts |

## Key Design Decisions

### No authentication
Sync uses a device-generated UUID. No accounts, no passwords, no OAuth. Privacy-first — each browser is its own identity.

### localStorage as primary, Supabase as backup
The app works fully offline. Supabase sync is debounced and retried in the background. If sync fails, the user never notices — their data is safe in localStorage.

### Lazy-loaded local quote database
The 600+ quote local DB (`localQuotes.js`, ~62 KB) is dynamically imported only when `useProcessing` runs. This keeps the initial page load fast.

### Refs over context for async operations
Hooks like `useSync` and `useQuoteActions` use `useRef` to track latest state values. This prevents stale closures in retry logic and debounced callbacks — a pattern used consistently throughout.

### Inline CSS-in-JS
Chosen for simplicity and zero build overhead. All styles co-located in `styles.js` with CSS custom properties for theming. Trade-off: no automatic vendor prefixing or CSS extraction.

### Batch API calls
Quotes are sent to Claude in batches of 20 (`API_BATCH_SIZE`). This balances throughput against context limits and provides a smooth progress bar experience.

### Deletion tombstones
When a quote is deleted, its ID is recorded with a timestamp. During sync merge, tombstones prevent deleted quotes from being re-added from the cloud. Tombstones expire after 7 days.

## Security

- **API keys**: `ANTHROPIC_API_KEY` and `SUPABASE_SECRET_KEY` are server-side only, never sent to client
- **CORS**: Whitelisted origins (commonplace.pro, localhost dev ports)
- **CSRF**: `X-Requested-With` header validation on API endpoints
- **Rate limiting**: Per-IP per-endpoint (15-60 req/min depending on endpoint)
- **Input sanitization**: HTML-unsafe characters stripped (`<>"'&`), length limits enforced
- **Security headers** (via vercel.json): HSTS, X-Content-Type-Options, X-Frame-Options: DENY, CSP

## Performance

- **Memoized components**: Table rows use `React.memo` to prevent unnecessary re-renders
- **Infinite scroll pagination**: 100 items per page (`useInfiniteScroll`)
- **Debouncing**: Sync push (2s), search (150ms), localStorage persist (300ms)
- **Lazy imports**: Local quotes DB loaded on demand
- **Sourcemaps disabled** in production builds
- **No external CSS**: All styles inlined, no extra network requests

## Configuration

All tunable constants are centralized in `src/config.js`:

| Constant | Value | Purpose |
|----------|-------|---------|
| `SYNC_DEBOUNCE_MS` | 2000 | Delay before pushing to Supabase |
| `API_BATCH_SIZE` | 20 | Quotes per API request |
| `DUPE_SIMILARITY_THRESHOLD` | 0.55 | Word-overlap ratio for duplicate detection |
| `TOMBSTONE_TTL_MS` | 7 days | How long deleted IDs are tracked |
| `PERSIST_DEBOUNCE_MS` | 300 | Delay before localStorage write |
| `MAX_QUOTE_TEXT_LENGTH` | 5000 | Max chars per quote |
| `TOAST_DURATION_MS` | 2500 | Auto-dismiss time for toasts |

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...                # Required. Server-side only.
SUPABASE_SECRET_KEY=...                      # Required for sync. Or VITE_SUPABASE_ANON_KEY_COMMONPLACE.
```
