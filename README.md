# Commonplace

Organize your quote collection. Paste messy quotes, phrases, and fragments — Commonplace identifies sources, categorizes everything, and gives you a clean, browsable collection.

## Features

- **AI-powered identification** — Claude Haiku identifies sources and categories for film, TV, book, music, speech, and person quotes
- **Local quote database** — 600+ curated quotes matched instantly without an API call
- **Duplicate detection** — flags near-duplicates before adding, with keep/merge/skip options
- **Multiple views** — table, compact table, and card layouts with drag-to-reorder
- **Inline editing** — click any field to edit; "Did you mean?" suggestions from the local database
- **Bulk operations** — multi-select with Shift+click, bulk category/source reassignment, bulk delete
- **Search & filter** — full-text search across quotes and sources, category pill filters, favorites
- **Import** — paste text, drag-and-drop `.txt`/`.csv` files, Kindle highlights, Readwise exports
- **Export** — plain text, CSV, Markdown, JSON, clipboard (plain + rich text), shareable URL links
- **Persistence** — auto-saves to localStorage; restore previous sessions on return
- **Review flow** — step through low-confidence entries one by one for quick correction
- **Custom categories** — add your own beyond the built-in source categories and vibe tags
- **Formatting cleanup** — optional smart quote normalization, dash cleanup, capitalization fixes
- **Statistics panel** — collection insights with category distribution and confidence breakdown
- **Responsive** — card view on mobile, table view on desktop, sticky mini-header on scroll

## Tech Stack

- **Frontend:** React 18, Vite 5, JavaScript (no TypeScript)
- **Styling:** CSS-in-JS (inline style objects), no CSS framework
- **Icons:** lucide-react
- **Backend:** Vercel Serverless Function (`/api/identify`) proxying to Anthropic API
- **Deployment:** Vercel
- **Analytics:** @vercel/analytics, @vercel/speed-insights

## Setup

```bash
git clone <repo-url>
cd commonplace
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

The API key is used server-side only (in `api/identify.js`) and is never exposed to the client.

## Development

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

Use `vercel dev` to test the `/api/identify` serverless function locally.

## Project Structure

```
api/
  identify.js              Vercel serverless function — AI identification proxy
public/
  favicon.svg              App icon
  og-image.svg             Social sharing preview
src/
  main.jsx                 React entry point
  components/
    App.jsx                Main state management and orchestration
    InputPhase.jsx         Landing page, text input, file import
    ProcessingPhase.jsx    Progress display during identification
    TableView.jsx          Table/compact results view with column reorder
    CardItem.jsx           Card-based results view
    EditForm.jsx           Inline editor with suggestion engine
    DupeModal.jsx          Duplicate detection resolution modal
    QuoteActions.jsx       Reusable action buttons (fav, copy, delete, re-identify)
    StatsPanel.jsx         Collection statistics dashboard
    Toast.jsx              Toast notifications
    Footer.jsx             Footer attribution
    Logo.jsx               Custom SVG logo
    HowItWorksAnimation.jsx  Animated landing page demo
    styles.js              Centralized style objects and CSS
  hooks/
    useInfiniteScroll.js   Paginated rendering (100 items/page)
    useLongPress.js        Mobile long-press gesture for selection
    useToasts.js           Toast notification queue
  data/
    constants.js           Categories, colors, confidence levels, config
    localQuotes.js         600+ curated quote database for instant matching
  utils/
    helpers.js             Text processing, parsing, export, sharing utilities
```

## Deployment

Deployed to Vercel. Push to `main` triggers automatic deployment.

Required Vercel environment variable:
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude Haiku

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal > close dropdown > clear selection > close edit > clear search |
| `Ctrl/Cmd + A` | Select all visible quotes |

## Troubleshooting

- **"Service not configured"** — `ANTHROPIC_API_KEY` is missing from environment variables
- **API fails / 502** — check Anthropic API status; the app falls back to local matching and marks failures for retry
- **Quotes not persisting** — localStorage may be full or disabled (private browsing); export as a file instead
- **Table view missing on mobile** — table view auto-switches to cards below 640px viewport width
- **Import not working** — only `.txt` and `.csv` files are supported; Kindle and Readwise formats are auto-detected
