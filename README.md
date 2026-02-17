# Keeper

Paste your messy quotes, phrases, and fragments. Keeper organizes everything and identifies the sources.

## What it does

You dump in a pile of text — one entry per line — and Keeper figures out what each one is. Movie quotes get tagged as Film, song lyrics as Music, famous sayings get attributed to the right person. Everything comes back sorted, categorized, and ready to export.

**How it works:**

A local database of ~130 common quotes handles instant matching with zero API calls. Anything it doesn't recognize gets batched and sent to Claude Haiku for identification. The result is fast, cheap, and accurate.

**Example input:**
```
You can't handle the truth
The world breaks everyone — Hemingway
"Be the change" (Gandhi)
To infinity and beyond
Not all those who wander are lost
```

**What you get back:**

Each entry identified with its source, categorized (Film, TV, Book, Music, Speech, Person, Phrase), and confidence-rated. Edit anything that's wrong, add custom categories, favorite the ones you love, then export as CSV, Markdown, or JSON.

## Features

- **AI-powered identification** — Claude Haiku identifies sources and categories
- **Local database** — 130+ common quotes matched instantly, no API needed
- **Smart parsing** — handles attribution via em dashes, hyphens, tildes, and parentheses
- **Batch processing** — groups of 20 sent in single API calls to minimize cost
- **Deduplication** — catches duplicates within a batch and across additions
- **Three export formats** — CSV, Markdown (grouped by category), JSON
- **Add more without clearing** — append new entries to an existing collection
- **Bulk edit** — select multiple entries, reassign categories or sources at once
- **Sort by confidence** — surface entries that need manual attention
- **Custom categories** — add your own beyond the defaults
- **Mobile responsive** — auto-switches to card view on small screens

## Cost

The local database handles the most common quotes for free. For everything else, Haiku is extremely cheap — roughly $0.014 per batch of 20 quotes. Processing 10,000 quotes costs about $1.40.

## Setup

**Prerequisites:** An [Anthropic API key](https://console.anthropic.com/) with credits loaded.

1. Fork or clone this repo
2. Deploy to [Vercel](https://vercel.com) (auto-detects Vite)
3. Add your API key in Vercel: **Settings → Environment Variables → `ANTHROPIC_API_KEY`**
4. Deploy and you're live

The `api/identify.js` serverless function proxies requests to Anthropic so your API key never touches the browser. It's hardened to lock the model to Haiku, cap token usage, and limit input size.

## Project structure

```
├── api/
│   └── identify.js       # Serverless proxy to Anthropic API
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx            # Entire app (single component)
│   └── main.jsx           # React entry point
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

## Tech stack

React 18, Vite, Vercel serverless functions, Claude Haiku API. No CSS framework — all inline styles for zero dependencies.

## License

MIT
