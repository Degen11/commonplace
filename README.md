# Commonplace

Your personal library of ideas — paste messy quotes, and get an organized, searchable collection with sources identified automatically.

**Try it now:** [commonplace.pro](https://commonplace.pro)

## What It Does

Drop in your collection of quotes, phrases, and fragments. Commonplace identifies who said each one, assigns a category (Film, TV, Book, Music, Speech, etc.), and gives you a clean library you can search, filter, edit, and export.

No signup. No account. Free to use.

## Features

- **Instant AI identification** — recognizes thousands of quotes and attributes them to the right source
- **3,700+ built-in quotes** — common quotes are matched instantly without waiting for AI
- **Duplicate detection** — flags near-duplicates so you can keep, merge, or skip
- **Collections** — group quotes into named collections with icons, or let AI auto-group them by theme
- **Multiple views** — table, compact table, and card layouts with drag-to-reorder
- **Inline editing** — click any field to edit; smart suggestions from the built-in database
- **Bulk operations** — multi-select, bulk reassign categories/sources, bulk delete
- **Search & filter** — full-text search, category filters, favorites
- **Import anything** — paste text, drag-and-drop files (.txt, .csv, .json, .md), Kindle highlights, Readwise exports, or fetch from a URL
- **Export anywhere** — plain text, CSV, Markdown, JSON, clipboard, or shareable link
- **Cloud sync** — your collection syncs across devices automatically (no account needed)
- **Sharing** — generate public links or quote images to share
- **Dark mode** — light and dark themes
- **Works on mobile** — responsive card view on small screens, full table on desktop

## How It Works

1. **Paste** — drop your quotes into the input area, one per line (messy is fine)
2. **Process** — Commonplace checks its built-in database first, then uses Claude AI for the rest
3. **Browse** — your organized collection appears with sources, categories, and confidence levels
4. **Refine** — edit, reorder, filter, group into collections, and export however you like

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal / clear selection / clear search |
| `Ctrl/Cmd + A` | Select all visible quotes |

---

## Technical Details

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, JavaScript |
| Styling | CSS-in-JS (inline style objects) |
| Icons | lucide-react |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Haiku |
| Deployment | Vercel |

### Project Structure

```
api/                          Vercel serverless functions
  _shared.js                  Rate limiting, CORS, Supabase client
  identify.js                 AI quote identification proxy
  sync.js                     Device data sync
  share.js                    Public collection sharing
  auto-group.js               AI quote grouping
  fetch-url.js                URL content extraction
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
    localQuotes.js             3,700+ curated quote database
  utils/
    textFormatting.js          Text normalization and similarity
    parsers.js                 File format parsers
    export.js                  Export format generators
```

### Getting Started

#### Prerequisites

- Node.js 18+
- npm

#### Setup

```bash
git clone <repo-url>
cd commonplace
npm install
```

#### Environment Variables

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...        # Required — server-side only
SUPABASE_SECRET_KEY=...              # Required for sync
```

#### Development

```bash
npm run dev          # Vite dev server on localhost:5173
vercel dev           # Test serverless functions locally
```

#### Production

```bash
npm run build        # Build to dist/
npm run preview      # Preview production build
```

Push to `main` triggers automatic deployment on Vercel.

### Key Concepts

- **Phases** — the app moves through three phases: input (paste/import), processing (AI identification), and collection (browse/edit/export)
- **Source categories vs. vibe tags** — quotes with a known origin get a source category (Film, TV, Book, etc.); quotes with unknown sources get a vibe tag (Philosophical, Comedic, Poetic, etc.)
- **Device sync** — each browser gets a UUID; sync works without user accounts
- **Offline-first** — localStorage is primary storage; Supabase syncs in the background

### Troubleshooting

- **"Service not configured"** — `ANTHROPIC_API_KEY` is missing from environment variables
- **API fails / 502** — check Anthropic API status; the app falls back to local matching
- **Quotes not persisting** — localStorage may be full or disabled; export as a file
- **Table view missing on mobile** — auto-switches to cards below 640px
- **Import not working** — supported formats: .txt, .csv, .json, .md; Kindle and Readwise auto-detected
