// UUID v4 generator with fallback for environments where
// crypto.randomUUID() is unavailable (older Safari, non-HTTPS, WebViews).
export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch { /* falls through to polyfill */ }
  }
  // RFC 4122 v4 polyfill
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
