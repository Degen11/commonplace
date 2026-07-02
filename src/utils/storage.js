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

/**
 * JSON-stringify and write a value to localStorage.
 * Silently swallows quota/security errors — Supabase is the backup.
 *
 * @param {string} key - localStorage key
 * @param {*} value - value to serialize
 * @returns {boolean} true if write succeeded
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a raw string value from localStorage (no JSON parsing).
 * For legacy string-valued keys (theme, sort, flags, draft text) whose
 * stored format predates the JSON helpers and must not change.
 *
 * @param {string} key - localStorage key
 * @param {string|null} [fallback] - returned when missing or on error
 */
export function loadString(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return raw;
  } catch { /* security/quota — fall through */ }
  return fallback;
}

/**
 * Write a raw string value to localStorage (no JSON stringification).
 * Silently swallows quota/security errors — Supabase is the backup.
 *
 * @param {string} key - localStorage key
 * @param {string} value - string to store
 * @returns {boolean} true if write succeeded
 */
export function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove one or more keys from localStorage, ignoring errors.
 *
 * @param {...string} keys - localStorage keys to remove
 */
export function removeFromStorage(...keys) {
  try {
    for (const key of keys) localStorage.removeItem(key);
  } catch { /* ignore */ }
}
