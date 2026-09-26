// Renders public/og-image.svg → public/og-image.png (the static default
// og:image / twitter:image, 1200×630).
//
// Run with: npm run og-image
//
// Text renders in the real brand fonts: Satoshi and Playfair Display Italic,
// loaded from api/_fonts/ (TTF copies of the self-hosted .woff2 files, which
// resvg can't read; the copies also carry fixed family names, since the
// shipped Satoshi .woff2 files report their family as "false"). The same
// files back the dynamic cards in api/og.js. The "Commonplace" wordmark is the
// traced path from src/components/wordmarkPath.js, re-synced into the SVG on
// every run so the card can't drift from the in-app wordmark.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORDMARK_PATH } from '../src/components/wordmarkPath.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
const fontDir = resolve(root, 'api/_fonts');
const svgPath = resolve(publicDir, 'og-image.svg');

const source = readFileSync(svgPath, 'utf8');
const svg = source.replace(/(<path id="wordmark" d=")[^"]*(")/, `$1${WORDMARK_PATH}$2`);
if (!svg.includes(WORDMARK_PATH)) throw new Error('og-image.svg is missing <path id="wordmark" d="…">');
if (svg !== source) {
  writeFileSync(svgPath, svg);
  console.log('  og-image.svg (wordmark path re-synced)');
}

const png = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontFiles: ['Satoshi-Regular', 'Satoshi-Medium', 'Satoshi-Bold', 'PlayfairDisplay-Italic']
      .map(name => resolve(fontDir, `${name}.ttf`)),
    defaultFontFamily: 'Satoshi',
  },
  fitTo: { mode: 'width', value: 1200 },
}).render().asPng();

writeFileSync(resolve(publicDir, 'og-image.png'), png);
console.log(`  og-image.png (${png.length} bytes)`);
