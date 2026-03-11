// ── localStorage helpers ──
// Eliminates the repeated try/parse/validate/fallback pattern used across
// QuotesContext, useViewPreferences, and App.jsx initializers.

/**
 * Read and parse a JSON value from localStorage.
 * Returns `fallback` if the key is missing, corrupt, or fails validation.
 *
 * @param {string} key - localStorage key
 * @param {function} [validate] - predicate applied to the parsed value; defaults to Array.isArray
 * @param {*} [fallback] - value returned when missing or invalid; defaults to []
 */
export function loadFromStorage(key, validate = Array.isArray, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      const parsed = JSON.parse(raw);
      if (validate(parsed)) return parsed;
    }
  } catch { /* corrupt or quota — fall through */ }
  return typeof fallback === "function" ? fallback() : fallback;
}
