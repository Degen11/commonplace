// Shared FAQ content. This is the single source of truth for the visible FAQ
// section on the landing page (InputPhase.jsx) — the FAQPage JSON-LD in
// index.html is generated from this same array at build time (see the
// injectFaqJsonLd plugin in vite.config.js), so the two can never drift.
export const FAQ_ITEMS = [
  {
    q: "What is Commonplace?",
    a: "Commonplace is a free AI-powered quote organizer. Paste quotes in any format and it identifies the sources, assigns categories, and builds a searchable collection you can export as CSV, Markdown, or JSON.",
  },
  {
    q: "Is Commonplace free?",
    a: "Yes, Commonplace is completely free. No account, subscription, or payment is required.",
  },
  {
    q: "How does AI quote identification work?",
    a: "Commonplace first checks a local database of 3,700+ curated quotes for instant matches. Unmatched quotes are looked up via Wikiquote and Open Library, then identified by Claude AI (by Anthropic) as a final fallback.",
  },
  {
    q: "What file formats can I import?",
    a: "Commonplace supports .txt, .csv, .json, and .md files, including exports from Kindle highlights, Readwise, Notion, and similar apps. You can also import quotes directly from a URL.",
  },
  {
    q: "How do I export my quote collection?",
    a: "Export your collection as CSV, Markdown, or JSON. These formats are compatible with Notion, Obsidian, Roam Research, and other note-taking tools.",
  },
  {
    q: "Is my quote data private?",
    a: "Yes. Your quotes are stored locally in your browser's local storage by default. No account is required and no personal data is collected. Cloud sync is optional and uses an anonymous device ID — no email or login needed.",
  },
];
