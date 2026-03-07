// Translate API errors into user-friendly messages based on HTTP status or error type.
export function describeApiError(err) {
  const msg = err?.message || "";

  // Parse HTTP status from error message (e.g., "API returned 429")
  const statusMatch = msg.match(/(\d{3})/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : null;

  if (status === 429) return "Rate limited \u2014 too many requests. Wait a moment and try again.";
  if (status === 401 || status === 403) return "Authentication error \u2014 the API key may be invalid or expired.";
  if (status === 502) return "AI service temporarily unavailable. Try again in a moment.";
  if (status === 503) return "AI service is overloaded. Try again shortly.";
  if (status >= 500) return "Server error \u2014 the AI service had an issue. Try again.";
  if (status === 400) return "Bad request \u2014 the input may be too large or malformed.";

  if (msg.includes("malformed JSON")) return "AI returned an unreadable response. Try again.";
  if (msg.includes("Invalid API response")) return "AI returned an unexpected response format. Try again.";
  if (err.name === "TypeError" || msg.includes("fetch")) return "Network error \u2014 check your connection and try again.";

  return "Couldn't reach AI. Try again.";
}
