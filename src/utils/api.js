// ── API utilities ──
// Shared fetch helpers to eliminate duplicated timeout/abort/header logic.

export const API_HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "CommonplaceApp",
};

/**
 * Fetch with automatic timeout and optional external abort signal forwarding.
 * Replaces the repeated AbortController + setTimeout + signal-wiring pattern.
 *
 * @param {string} url
 * @param {RequestInit} options - fetch options (signal will be overridden)
 * @param {number} timeoutMs - abort after this many milliseconds
 * @param {AbortSignal} [externalSignal] - optional caller-controlled signal
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options, timeoutMs, externalSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException("Aborted", "AbortError");
    }
    externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
