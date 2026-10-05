// ── Quote object helpers ──

import { generateId } from "./uuid";
import { makeSimilarityKey, similarityFromKeys } from "./textFormatting";
import { UNKNOWN_SOURCE, FALLBACK_CATEGORY } from "../data/constants";

/**
 * Create a quote object with consistent shape.
 * Replaces the 4 near-identical object literals in useProcessing.runProcessing.
 */
export function makeQuote(text, source, category, confidence) {
  return {
    id: generateId(),
    text,
    source: source || UNKNOWN_SOURCE,
    category: category || FALLBACK_CATEGORY,
    confidence: confidence || "low",
    favorite: false,
    updatedAt: Date.now(),
  };
}

/**
 * Find groups of duplicate quotes using union-find.
 * Extracted from App.jsx handleFindDupes (~50 lines of inline algorithm).
 *
 * @param {Array} quotes - array of quote objects
 * @param {number} threshold - similarity threshold (e.g. 0.55)
 * @returns {Array} array of { entries, minScore, maxScore } groups, sorted by maxScore desc
 */
export function findDuplicateGroups(quotes, threshold) {
  // Precompute { norm, words } once per quote — reused across all O(n²) pairs.
  const norms = quotes.map(q => {
    const key = makeSimilarityKey(q.text);
    return {
      id: q.id,
      text: q.text,
      source: q.source,
      category: q.category,
      norm: key.norm,
      words: key.words,
    };
  });

  // Union-find
  const parent = norms.map((_, i) => i);
  const scores = new Map();
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (a, b) => { parent[find(a)] = find(b); };

  for (let i = 0; i < norms.length; i++) {
    for (let j = i + 1; j < norms.length; j++) {
      const score = similarityFromKeys(norms[i], norms[j], threshold);
      if (score > threshold) {
        union(i, j);
        scores.set(`${i}:${j}`, score);
      }
    }
  }

  // Collect clusters with 2+ members
  const clusters = new Map();
  norms.forEach((_, i) => {
    const root = find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(i);
  });

  const groups = [];
  for (const members of clusters.values()) {
    if (members.length < 2) continue;
    let minScore = 1, maxScore = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const key = `${Math.min(members[i], members[j])}:${Math.max(members[i], members[j])}`;
        const s = scores.get(key);
        if (s !== undefined) {
          minScore = Math.min(minScore, s);
          maxScore = Math.max(maxScore, s);
        }
      }
    }
    groups.push({ entries: members.map(i => norms[i]), minScore, maxScore });
  }

  groups.sort((a, b) => b.maxScore - a.maxScore);
  return groups;
}

// Name suffixes that follow a comma but belong to the name ("Martin Luther King, Jr.")
const NAME_SUFFIX = /^(jr|sr|ii|iii|iv|phd|md)\.?([\s,]|$)/i;

/**
 * Split a source into a primary line and an optional secondary line for display,
 * e.g. "J.R.R. Tolkien, The Fellowship of the Ring" → ["J.R.R. Tolkien", "The Fellowship of the Ring"]
 * and "Cosmos (1980) - Carl Sagan" → ["Cosmos (1980)", "Carl Sagan"]. Splits once, at the
 * first top-level " - ", " — " or ", " (never inside parentheses). Display only: the
 * stored source string is never changed.
 *
 * @param {string} source
 * @returns {{ primary: string, secondary: string }}
 */
export function splitSource(source) {
  const s = (source || "").trim();
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (depth > 0) continue;
    let sepLen = 0;
    if ((ch === "-" || ch === "—" || ch === "–") && s[i - 1] === " " && s[i + 1] === " ") sepLen = 2;
    else if (ch === "," && s[i + 1] === " " && !NAME_SUFFIX.test(s.slice(i + 2))) sepLen = 2;
    if (!sepLen) continue;
    const start = ch === "," ? i : i - 1;
    const primary = s.slice(0, start).trim();
    const secondary = s.slice(i + sepLen).trim();
    if (primary && secondary) return { primary, secondary };
  }
  return { primary: s, secondary: "" };
}

/** True when a quote has no real attribution yet. */
export function isUnknownSource(source) {
  return !source || !source.trim() || source === UNKNOWN_SOURCE;
}
