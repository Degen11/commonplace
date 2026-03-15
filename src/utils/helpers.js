// ── Shared utility functions ──
// Small, reusable helpers extracted from repeated patterns across the codebase.

/**
 * Pluralize a word based on count.
 * pluralize(1, "quote") → "1 quote"
 * pluralize(5, "quote") → "5 quotes"
 * pluralize(1, "entry", "entries") → "1 entry"
 */
export function pluralize(count, singular, plural = singular + "s") {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Group an array of objects by a key.
 * groupBy([{a:1},{a:2},{a:1}], "a") → {1: [{a:1},{a:1}], 2: [{a:2}]}
 */
export function groupBy(arr, key) {
  const grouped = {};
  for (const item of arr) {
    const k = item[key];
    (grouped[k] = grouped[k] || []).push(item);
  }
  return grouped;
}

/**
 * Count occurrences of each value for a given key.
 * countBy([{a:"x"},{a:"y"},{a:"x"}], "a") → {x: 2, y: 1}
 */
export function countBy(arr, key) {
  const counts = {};
  for (const item of arr) {
    const k = item[key];
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

// ── Immutable Set helpers ──
// Return new Sets — safe for React state updates like setSelected(prev => addToSet(prev, id)).

/** Return a new Set with `item` added. */
export function addToSet(set, item) { return new Set(set).add(item); }

/** Return a new Set with `item` removed. */
export function removeFromSet(set, item) { const s = new Set(set); s.delete(item); return s; }

/** Return a new Set with `item` toggled (added if missing, removed if present). */
export function toggleInSet(set, item) { const s = new Set(set); s.has(item) ? s.delete(item) : s.add(item); return s; }

/** Return a new Set with all `items` added. */
export function addAllToSet(set, items) { const s = new Set(set); for (const i of items) s.add(i); return s; }

/** Return a new Set with all `items` removed. */
export function removeAllFromSet(set, items) { const s = new Set(set); for (const i of items) s.delete(i); return s; }

/**
 * Create a shallow props equality comparator for React.memo.
 * Compares only the listed keys, returning true if all are ===.
 *
 * Usage: memo(Component, propsEqual("q", "isSel", "isEd", ...))
 *
 * For props that need custom comparison (e.g. checking a Map/Set for a
 * specific key), pass a tuple: ["actionProps", (prev, next) => ...]
 */
export function propsEqual(...keys) {
  return (prev, next) => {
    for (const key of keys) {
      if (typeof key === "string") {
        if (prev[key] !== next[key]) return false;
      } else {
        // Custom comparator tuple: [propName, (prev, next) => boolean]
        const [, comparator] = key;
        if (!comparator(prev, next)) return false;
      }
    }
    return true;
  };
}
