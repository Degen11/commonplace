import { TIMEOUT_MESSAGE } from "./api";

// Translate API errors into user-friendly messages based on HTTP status or error type.
//
// Errors from apiRequest carry the HTTP status as `.status` and the server's
// own `error` text as the message. For a 429 that text says which limit was
// hit (a short burst limit vs. the daily AI cap, which resets tomorrow), so
// it's shown as-is rather than collapsed into a generic "wait a moment".
export function describeApiError(err) {
  const msg = err?.message || "";
  if (err?.name === "TimeoutError") return TIMEOUT_MESSAGE;

  // Prefer the status apiRequest attached; fall back to parsing older
  // "API returned 429"-style messages.
  const statusMatch = msg.match(/\b(\d{3})\b/);
  const status = Number.isInteger(err?.status) ? err.status : statusMatch ? parseInt(statusMatch[1], 10) : null;
  const serverMessage = Number.isInteger(err?.status) && msg && !msg.startsWith("Request failed") ? msg : null;

  if (status === 429) return serverMessage || "Rate limited — too many requests. Wait a moment and try again.";
  if (status === 401 || status === 403) return "Authentication error — the API key may be invalid or expired.";
  if (status === 502) return "AI service temporarily unavailable. Try again in a moment.";
  if (status === 503) return "AI service is overloaded. Try again shortly.";
  if (status === 504) return serverMessage || "AI service took too long. Try again.";
  if (status >= 500) return "Server error — the AI service had an issue. Try again.";
  if (status === 400) return serverMessage || "Bad request — the input may be too large or malformed.";

  if (msg.includes("malformed JSON")) return "AI returned an unreadable response. Try again.";
  if (msg.includes("Invalid API response")) return "AI returned an unexpected response format. Try again.";
  if ((err?.name === "TypeError" && msg.includes("fetch")) || msg.includes("Failed to fetch") || msg.includes("NetworkError")) return "Network error — check your connection and try again.";

  return "Couldn't reach AI. Try again.";
}
