// Prerenders the landing page into dist/index.html after `vite build`.
//
// Run automatically by `npm run build`. Renders src/prerender.jsx (the same
// <Root> tree the browser renders) as a first-time visitor sees it, then:
//   - inlines baseCSS as <style id="cp-base-css"> so the markup is styled
//     before any JS runs (main.jsx reuses that tag instead of injecting another)
//   - puts the markup inside #root, wrapped in <div data-prerendered>, which
//     public/boot.js hides for visitors who'll see something else first
//     (saved quotes, shared links)
//
// The client doesn't hydrate this markup; createRoot replaces it (see main.jsx).
// Components run once here under a jsdom window with empty storage, so the
// output never depends on the machine that built it.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = resolve(root, 'dist/index.html');

// A browser-ish global scope for module init and render-time reads
// (matchMedia, localStorage, location). Effects don't run under
// renderToString, so nothing here needs to be functional beyond reads.
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url: 'https://commonplace.pro/' });
const { window } = dom;
window.matchMedia = (query) => ({
  matches: false, media: query, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
});
for (const key of ['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'matchMedia', 'HTMLElement', 'Element', 'Node', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true, writable: true });
}
globalThis.requestIdleCallback = () => 0;

const vite = await createServer({
  root,
  configFile: resolve(root, 'vite.config.js'),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  logLevel: 'error',
});

let html, css;
try {
  ({ html, css } = (await vite.ssrLoadModule('/src/prerender.jsx')).render());
} finally {
  await vite.close();
}

if (!html.includes('<h1')) throw new Error('Prerender produced no <h1>; is the landing page still the default phase?');

const index = readFileSync(indexPath, 'utf8');
if (!index.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty <div id="root"></div> to fill');

// public/boot.js adds .cp-app for visitors who shouldn't see the landing page.
const hideRule = 'html.cp-app [data-prerendered]{display:none}';

const out = index
  // Function replacers: the markup and CSS must not be scanned for $& / $' patterns.
  .replace('</head>', () => `  <style id="cp-base-css">${hideRule}${css}</style>\n  </head>`)
  .replace('<div id="root"></div>', () => `<div id="root"><div data-prerendered>${html}</div></div>`);

writeFileSync(indexPath, out);
console.log(`  prerendered dist/index.html (${(html.length / 1024).toFixed(1)} KB markup, ${(css.length / 1024).toFixed(1)} KB CSS)`);
process.exit(0);
