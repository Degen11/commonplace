// ===================== CONSTANTS =====================

// Source categories — identified from a known origin
export const SOURCE_CATEGORIES = ["Film","TV","Book","Music","Speech","Person","Phrase"];

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
export const QUOTED_CATS = new Set(["Film","TV","Book","Music","Speech","Person"]);

export const CAT_COLORS = {
  // Source categories
  Film:         { bg: "#F3E8FF",   text: "#7C3AED" },
  TV:           { bg: "#DCFCE7",   text: "#16A34A" },
  Book:         { bg: "#FEF3C7",   text: "#D97706" },
  Music:        { bg: "#FFE4E6",   text: "#E11D48" },
  Speech:       { bg: "#DBEAFE",   text: "#2563EB" },
  Person:       { bg: "#F0ABFC33", text: "#A21CAF" },
  Phrase:       { bg: "#E0F2FE",   text: "#0284C7" },

  // Vibe tags
  Aphorism:     { bg: "#FEF9C3",   text: "#A16207" },
  Philosophical:{ bg: "#EDE9FE",   text: "#5B21B6" },
  Observation:  { bg: "#CCFBF1",   text: "#0D9488" },
  Comedic:      { bg: "#FFF7ED",   text: "#EA580C" },
  Poetic:       { bg: "#FCE7F3",   text: "#BE185D" },
  Existential:  { bg: "#F1F5F9",   text: "#475569" },
  Motivational: { bg: "#DCFCE7",   text: "#15803D" },
  Cynical:      { bg: "#FEE2E2",   text: "#991B1B" },
  Identity:     { bg: "#EDE9FE",   text: "#7C3AED" },
  Reflection:   { bg: "#E0F2FE",   text: "#0369A1" },

  // Fallback
  Unknown:      { bg: "#F1F1EF",   text: "#787774" },
};

const CUSTOM_PALETTE = [
  { bg: "#D1FAE5",   text: "#059669" },
  { bg: "#FDE68A55", text: "#B45309" },
  { bg: "#C7D2FE",   text: "#4338CA" },
  { bg: "#FECACA55", text: "#DC2626" },
  { bg: "#CCFBF1",   text: "#0D9488" },
  { bg: "#FED7AA55", text: "#EA580C" },
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