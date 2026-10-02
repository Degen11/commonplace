// ── API utilities ──
// Shared fetch helpers to eliminate duplicated timeout/abort/header logic.

import { API_TIMEOUT_MS } from "../config";

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

export const TIMEOUT_MESSAGE = "That took too long to respond. Check your connection and try again.";

/**
 * Call one of our own /api endpoints: shared headers, a timeout, JSON parsing,
 * and the server's `error` message surfaced as the thrown Error's message.
 * Sends a POST with a JSON body when `body` is given, otherwise a GET.
 *
 * A timeout throws an Error named "TimeoutError" (with TIMEOUT_MESSAGE);
 * aborting via `signal` still throws the usual AbortError.
 *
 * @param {string} path
 * @param {{ body?: any, headers?: object, timeoutMs?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<any>} parsed JSON response
 */
export async function apiRequest(path, { body, headers, timeoutMs = API_TIMEOUT_MS, signal } = {}) {
  let res;
  try {
    res = await fetchWithTimeout(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { ...API_HEADERS, ...headers },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }, timeoutMs, signal);
  } catch (err) {
    if (err.name === "AbortError" && !signal?.aborted) {
      const timeoutErr = new Error(TIMEOUT_MESSAGE);
      timeoutErr.name = "TimeoutError";
      throw timeoutErr;
    }
    throw err;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
