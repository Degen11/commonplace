# Commonplace

An AI-powered quote collection organizer that identifies sources, categorizes entries, and gives you a clean, browsable collection.

**Live:** [commonplace.pro](https://commonplace.pro)

## What It Does

Paste messy quotes, fragments, and phrases. Commonplace uses Claude Haiku to identify who said it and what category it belongs to (Film, TV, Book, Music, etc.), then presents everything in a searchable, filterable collection you can edit, organize, and export.

## Features

- **AI identification** — Claude Haiku recognizes sources and assigns categories automatically
- **Local quote database** — 600+ curated quotes matched instantly without an API call
- **Duplicate detection** — flags near-duplicates with keep/merge/skip resolution
- **Collections** — organize quotes into named collections with icons and AI auto-grouping
- **Multiple views** — table, compact table, and card layouts with drag-to-reorder
- **Inline editing** — click any field to edit; "Did you mean?" suggestions from the local DB
- **Bulk operations** — multi-select, bulk category/source reassignment, bulk delete
- **Search & filter** — full-text search, category pill filters, favorites toggle
- **Import** — paste text, drag-and-drop files, Kindle highlights, Readwise exports, CSV/JSON/Markdown
- **Export** — plain text, CSV, Markdown, JSON, clipboard, shareable URL links
- **Cloud sync** — device-based sync via Supabase (no account required)
- **Sharing** — public collection links with 30-day expiry, quote image generation
- **Statistics** — category distribution, confidence breakdown, collection insights
- **Custom categories** — extend beyond built-in source categories and vibe tags
- **Formatting cleanup** — optional smart quote normalization, dash cleanup, capitalization fixes
- **Responsive** — card view on mobile, table on desktop, keyboard shortcuts throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, JavaScript |
| Styling | CSS-in-JS (inline style objects) |
| Icons | lucide-react |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Haiku |
| Deployment | Vercel |

## Project Structure

```
api/                          Vercel serverless functions
  _shared.js                  Rate limiting, CORS, Supabase client
  identify.js                 AI quote identification proxy
  sync.js                     Device data sync
  share.js                    Public collection sharing
  auto-group.js               AI quote grouping
src/
  main.jsx                    Entry point
  config.js                   All tunable constants
  components/                 React components
    App.jsx                   Root orchestrator and phase management
    InputPhase.jsx            Landing page and text input
    TableView.jsx             Main results table
    CollectionsSidebar.jsx    Collection management
    styles.js                 All CSS-in-JS styles
  contexts/                   React Context providers
    QuotesContext.jsx          Global state: quotes, collections, sync
  hooks/                      Custom hooks
    useProcessing.js           AI identification pipeline
    useSync.js                 Cloud sync logic
    useQuoteActions.js         Quote CRUD operations
    useEditState.js            Edit mode and selection
    useViewPreferences.js      Filtering, sorting, search
  data/
    constants.js               Categories, colors, confidence levels
    localQuotes.js             600+ curated quote database
  utils/
    textFormatting.js          Text normalization and similarity
    parsers.js                 File format parsers
    export.js                  Export format generators
```

For detailed architecture, data flow diagrams, and design decisions, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone <repo-url>
cd commonplace
npm install
```

### Environment Variables

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...        # Required — server-side only
SUPABASE_SECRET_KEY=...              # Required for sync
```

### Development

```bash
npm run dev          # Vite dev server on localhost:5173
vercel dev           # Test serverless functions locally
```

### Production

```bash
npm run build        # Build to dist/
npm run preview      # Preview production build
```

Push to `main` triggers automatic deployment on Vercel.

## Key Concepts

- **Phases** — the app moves through three phases: input (paste/import), processing (AI identification), and collection (browse/edit/export)
- **Source categories vs. vibe tags** — quotes with a known origin get a source category (Film, TV, Book, etc.); quotes with unknown sources get a vibe tag (Philosophical, Comedic, Poetic, etc.)
- **Device sync** — each browser gets a UUID; sync works without user accounts
- **Offline-first** — localStorage is primary storage; Supabase syncs in the background

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal / clear selection / clear search |
| `Ctrl/Cmd + A` | Select all visible quotes |

## Troubleshooting

- **"Service not configured"** — `ANTHROPIC_API_KEY` is missing from environment variables
- **API fails / 502** — check Anthropic API status; the app falls back to local matching
- **Quotes not persisting** — localStorage may be full or disabled; export as a file
- **Table view missing on mobile** — auto-switches to cards below 640px
- **Import not working** — supported formats: .txt, .csv, .json, .md; Kindle and Readwise auto-detected
