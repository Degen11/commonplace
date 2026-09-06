// Renders public/og-image.svg to public/og-image.png — a static fallback for
// social-card meta tags (og:image, twitter:image, schema screenshot) that
// doesn't depend on the api/og serverless function being up.
//
// Run with: npm run og-image
//
// The source SVG requests Playfair Display / Satoshi / DM Mono (loaded via
// CDN in the browser). resvg has no access to those at render time, so we
// substitute widely-available serif/sans/mono families that are close in
// spirit — this is a static fallback image, not a pixel copy of the live
// brand fonts.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const svg = readFileSync(resolve(publicDir, 'og-image.svg'), 'utf8');

const png = new Resvg(svg, {
  font: {
    loadSystemFonts: true,
    serifFamily: 'Liberation Serif',
    sansSerifFamily: 'Liberation Sans',
    monospaceFamily: 'Liberation Mono',
  },
  fitTo: { mode: 'width', value: 1200 },
}).render().asPng();

writeFileSync(resolve(publicDir, 'og-image.png'), png);
console.log(`  og-image.png (${png.length} bytes)`);
