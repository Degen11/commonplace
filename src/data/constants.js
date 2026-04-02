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
  // Source categories — desaturated (text blended ~25% toward neutral gray)
  Film:         { bg: "rgba(139,92,246,0.08)",   text: "#7A48CE" },   // violet
  TV:           { bg: "rgba(34,197,94,0.08)",     text: "#2D9754" },   // green
  Book:         { bg: "rgba(217,119,6,0.08)",     text: "#C07621" },   // amber
  Music:        { bg: "rgba(225,29,72,0.07)",     text: "#C53253" },   // rose
  Speech:       { bg: "rgba(59,130,246,0.08)",    text: "#3967CD" },   // blue
  Person:       { bg: "rgba(168,85,247,0.08)",    text: "#8B43CC" },   // purple
  Game:         { bg: "rgba(79,70,229,0.08)",     text: "#5851C8" },   // indigo
  Phrase:       { bg: "rgba(14,165,233,0.08)",    text: "#238AA2" },   // cyan

  // Vibe tags
  Aphorism:     { bg: "rgba(180,83,9,0.07)",      text: "#A45B23" },   // amber-dark
  Philosophical:{ bg: "rgba(99,102,241,0.08)",    text: "#6769D2" },   // indigo
  Observation:  { bg: "rgba(20,184,166,0.08)",    text: "#278C83" },   // teal
  Comedic:      { bg: "rgba(249,115,22,0.07)",    text: "#CC5F26" },   // orange
  Poetic:       { bg: "rgba(219,39,119,0.07)",    text: "#C13A76" },   // pink
  Existential:  { bg: "rgba(100,116,139,0.08)",   text: "#64748B" },   // slate
  Motivational: { bg: "rgba(5,150,105,0.08)",     text: "#218D6C" },   // emerald
  Cynical:      { bg: "rgba(220,38,38,0.07)",     text: "#C23939" },   // red
  Identity:     { bg: "rgba(124,58,237,0.08)",    text: "#7A48CE" },   // violet
  Reflection:   { bg: "rgba(2,132,199,0.08)",     text: "#1E80B2" },   // sky

  // Fallback
  Unknown:      { bg: "rgba(120,113,108,0.07)",   text: "#78716C" },   // stone
};

const CUSTOM_PALETTE = [
  { bg: "rgba(5,150,105,0.08)",    text: "#218D6C" },
  { bg: "rgba(180,83,9,0.07)",     text: "#A45B23" },
  { bg: "rgba(67,56,202,0.08)",    text: "#5349B8" },
  { bg: "rgba(220,38,38,0.07)",    text: "#C23939" },
  { bg: "rgba(13,148,136,0.08)",   text: "#278C83" },
  { bg: "rgba(234,88,12,0.07)",    text: "#CC5F26" },
];

export const getCatColor = (c, customCats) => {
  if (CAT_COLORS[c]) return CAT_COLORS[c];
  const idx = customCats.indexOf(c);
  return idx >= 0 ? CUSTOM_PALETTE[idx % CUSTOM_PALETTE.length] : CAT_COLORS.Unknown;
};

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