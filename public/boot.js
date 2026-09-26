// Runs before first paint: a render-blocking classic <script> in index.html's
// <head>. External rather than inline because the CSP has no 'unsafe-inline'
// for scripts. Keep it tiny and dependency-free.
//
// Storage keys mirror LS_THEME / LS_QUOTES in src/config.js, and the share
// prefixes mirror SHARE_HASH_PREFIX / PUBLIC_HASH_PREFIX / PUBLIC_SHARE_PATH
// (src/__tests__/boot.test.js checks they stay in sync).
(function () {
  var html = document.documentElement;
  var theme = null;
  var quotes = null;
  try {
    theme = localStorage.getItem("commonplace_theme");
    quotes = localStorage.getItem("commonplace_quotes");
  } catch (e) { /* storage blocked: first-visit defaults */ }

  // Saved theme. With no saved choice, the prefers-color-scheme media query
  // in the CSS handles it; an explicit "light" overrides that query.
  if (theme === "dark") html.classList.add("dark");
  else if (theme === "light") html.classList.add("light");

  // #root ships a prerendered landing page (scripts/prerender.mjs). Visitors
  // who'll see something else first (a saved collection or a shared link)
  // get it hidden so it doesn't flash before the app renders.
  var hasQuotes = !!quotes && quotes !== "[]" && quotes !== "null";
  var isShare = /^#[sp]=/.test(location.hash) || location.pathname.indexOf("/c/") === 0;
  if (hasQuotes || isShare) html.classList.add("cp-app");
})();
