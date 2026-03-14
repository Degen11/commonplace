// ===================== CONSTANTS =====================

// Z-index scale — centralized to prevent magic numbers in styles
export const Z = {
  CATEGORY_PILLS: 50,
  OVERLAY:        59,
  MINI_HEADER:    60,
  DROPDOWN:       100,
  BULK_BAR:       500,
  MODAL:          1000,
  TOAST:          2000,
};

// Source categories — identified from a known origin
export const SOURCE_CATEGORIES = ["Film","TV","Book","Music","Game","Speech","Person","Phrase"];

// Vibe tags — used when source is Unknown; describe the nature/tone of the entry
export const VIBE_TAGS = [
  "Aphorism",
  "Philosophical",
  "Observation",
  "Comedic",
  "Poetic",
  "Existential",
  "Motivational",
  "Cynical",
  "Identity",
  "Reflection",
];

export const DEFAULT_CATEGORIES = [...SOURCE_CATEGORIES, ...VIBE_TAGS, "Unknown"];
export const QUOTED_CATS = new Set(["Film","TV","Book","Music","Game","Speech","Person"]);

export const CAT_COLORS = {
  // Source categories
  Film:         { bg: "rgba(139,92,246,0.14)",   text: "#7C3AED" },   // violet
  TV:           { bg: "rgba(34,197,94,0.14)",     text: "#16A34A" },   // green
  Book:         { bg: "rgba(217,119,6,0.14)",     text: "#D97706" },   // amber
  Music:        { bg: "rgba(225,29,72,0.12)",     text: "#E11D48" },   // rose
  Speech:       { bg: "rgba(59,130,246,0.14)",    text: "#2563EB" },   // blue
  Person:       { bg: "rgba(168,85,247,0.14)",    text: "#9333EA" },   // purple
  Game:         { bg: "rgba(79,70,229,0.14)",     text: "#4F46E5" },   // indigo
  Phrase:       { bg: "rgba(14,165,233,0.14)",    text: "#0891B2" },   // cyan

  // Vibe tags
  Aphorism:     { bg: "rgba(180,83,9,0.12)",      text: "#B45309" },   // amber-dark
  Philosophical:{ bg: "rgba(99,102,241,0.14)",    text: "#6366F1" },   // indigo
  Observation:  { bg: "rgba(20,184,166,0.14)",    text: "#0D9488" },   // teal
  Comedic:      { bg: "rgba(249,115,22,0.12)",    text: "#EA580C" },   // orange
  Poetic:       { bg: "rgba(219,39,119,0.12)",    text: "#DB2777" },   // pink
  Existential:  { bg: "rgba(100,116,139,0.12)",   text: "#64748B" },   // slate
  Motivational: { bg: "rgba(5,150,105,0.14)",     text: "#059669" },   // emerald
  Cynical:      { bg: "rgba(220,38,38,0.12)",     text: "#DC2626" },   // red
  Identity:     { bg: "rgba(124,58,237,0.14)",    text: "#7C3AED" },   // violet
  Reflection:   { bg: "rgba(2,132,199,0.14)",     text: "#0284C7" },   // sky

  // Fallback
  Unknown:      { bg: "rgba(120,113,108,0.10)",   text: "#78716C" },   // stone
};

const CUSTOM_PALETTE = [
  { bg: "rgba(5,150,105,0.14)",    text: "#059669" },
  { bg: "rgba(180,83,9,0.12)",     text: "#B45309" },
  { bg: "rgba(67,56,202,0.14)",    text: "#4338CA" },
  { bg: "rgba(220,38,38,0.12)",    text: "#DC2626" },
  { bg: "rgba(13,148,136,0.14)",   text: "#0D9488" },
  { bg: "rgba(234,88,12,0.12)",    text: "#EA580C" },
];

export const getCatColor = (c, customCats) =>
  CAT_COLORS[c] || (customCats.indexOf(c) >= 0
    ? CUSTOM_PALETTE[customCats.indexOf(c) % CUSTOM_PALETTE.length]
    : CAT_COLORS.Unknown);

export const CONF_ORDER  = { low: 0, medium: 1, high: 2 };
export const CONF_COLORS = { high: "#16A34A", medium: "#D97706", low: "#DC2626" };
export const CONF_LABELS = {
  low:    "Low confidence — likely needs manual correction",
  medium: "Medium confidence — might be inaccurate",
  high:   "High confidence",
};

export const EXAMPLE_QUOTES = `You can't handle the truth
The world breaks everyone — Hemingway
"Be the change" (Gandhi)
To infinity and beyond
Not all those who wander are lost — Tolkien
I think therefore I am
Get busy living or get busy dying
Is this the real life is this just fantasy
Winter is coming
The only thing we have to fear is fear itself`;

export const REORDERABLE_COLS = ["content", "source", "category"];

// Sanitize user-provided names (categories, collections) — strip HTML-unsafe chars
export const sanitizeName = (name) => name.replace(/[<>"'&]/g, '').trim().slice(0, 50);

// All valid categories including vibe tags — used to validate API responses
export function buildValidCats(allCats) {
  return new Set([...allCats, ...VIBE_TAGS]);
}

// Default vibe tag when category can't be determined — "Unknown" should never be assigned
const VIBE_SET = new Set(VIBE_TAGS);
export function fallbackCategory(category, allCats) {
  if (category && category !== "Unknown") {
    const valid = allCats ? buildValidCats(allCats) : new Set([...SOURCE_CATEGORIES, ...VIBE_TAGS]);
    if (valid.has(category)) return category;
  }
  return "Reflection";
}