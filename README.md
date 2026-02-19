# Commonplace

**Paste your messy quotes. Get back a clean, attributed collection.**

Commonplace takes a raw pile of quotes, phrases, and fragments — one per line — and figures out where each one came from. Movie quotes get tagged as Film. Song lyrics as Music. Famous sayings get attributed to the right person, with confidence ratings on everything.

---

## How it works

### 1. Paste anything

No formatting required. Throw in whatever you have:

```
You can't handle the truth
The world breaks everyone — Hemingway
"Be the change" (Gandhi)
To infinity and beyond
Not all those who wander are lost
```

Commonplace handles attribution hints via em dashes, hyphens, tildes, and parentheses. If you already know the source, include it and it'll be preserved.

### 2. Instant local matching

A curated database of 600+ well-known quotes runs first — no API call, no cost, instant results. The most common film lines, song lyrics, speeches, literary quotes, and philosophical phrases are all covered. If your quote is in there, it comes back in milliseconds with high confidence.

### 3. AI identification for everything else

Anything the local database doesn't recognize gets batched and sent to Claude Haiku. Haiku identifies the source, assigns a category, and rates its confidence. Batches of 20 go out in a single API call to keep costs minimal.

### 4. Review and clean up

Everything comes back in a table or card view. Low-confidence entries are flagged so you know what to double-check. You can:

- Edit any text, source, or category inline
- Use the **Did you mean?** hint when your text is close to a known quote
- Hit **Re-identify** on any entry to get a fresh AI pass
- Bulk-edit categories or sources across multiple entries at once
- Add custom categories beyond the built-in ones

### 5. Export

When you're done, export as **CSV**, **Markdown** (grouped by category), **JSON**, or plain text. Copy everything to clipboard in one shot, or generate a shareable link to send your collection to someone else.

---

## Categories

**Source categories** — used when the origin is known:
`Film` · `TV` · `Book` · `Music` · `Speech` · `Person` · `Phrase`

**Vibe tags** — used when the source is unknown, to describe the nature of the entry:
`Aphorism` · `Philosophical` · `Observation` · `Comedic` · `Poetic` · `Existential` · `Motivational` · `Cynical` · `Identity` · `Reflection`

---

## Cost

The local database covers the most common quotes for free. For everything else, Haiku is extremely cheap — roughly $0.014 per batch of 20 quotes. Processing 1,000 quotes costs under $1.

---

## Tech

React 18, Vite, Vercel serverless functions, Claude Haiku. No CSS framework — zero external style dependencies.

---

*© Degen Hill. All rights reserved.*
