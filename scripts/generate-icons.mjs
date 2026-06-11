// Generates the PNG/ICO app icons from public/favicon.svg.
// Run with: npm run icons
//
// Outputs (all to public/):
//   icon-192.png, icon-512.png   — PWA manifest icons (rounded rect, transparent corners)
//   icon-512-maskable.png        — full-bleed with artwork in the 80% safe zone
//   apple-touch-icon.png         — 180px full-bleed square (iOS applies its own mask)
//   favicon.ico                  — 32px PNG-in-ICO fallback
//
// Depends on favicon.svg's structure: a 32x32 viewBox whose first element is the
// background <rect>. Re-check the string surgery below if the SVG is redrawn.

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const BG = '#3C5775'; // background of favicon.svg's rounded rect

const svg = readFileSync(resolve(publicDir, 'favicon.svg'), 'utf8');

// Artwork without the <svg> wrapper and the rounded background rect
const inner = svg
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .replace(/<rect[^>]*\/>/, '');

// Full-bleed square: solid background, artwork inset by `pad` viewBox units.
// pad 4 → artwork occupies 32/40 = 80% (the maskable safe zone).
const fullBleed = (pad) => {
  const s = 32 + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}"><rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" fill="${BG}"/>${inner}</svg>`;
};

const renderPng = (svgStr, size) =>
  new Resvg(svgStr, { fitTo: { mode: 'width', value: size } }).render().asPng();

// Minimal ICO container with a single PNG-encoded image (supported since Vista)
const pngToIco = (png, size) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);  // width
  entry.writeUInt8(size, 1);  // height
  entry.writeUInt16LE(1, 4);  // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12); // data offset: 6 header + 16 entry
  return Buffer.concat([header, entry, png]);
};

const out = (name, buf) => {
  writeFileSync(resolve(publicDir, name), buf);
  console.log(`  ${name} (${buf.length} bytes)`);
};

out('icon-192.png', renderPng(svg, 192));
out('icon-512.png', renderPng(svg, 512));
out('icon-512-maskable.png', renderPng(fullBleed(4), 512));
out('apple-touch-icon.png', renderPng(fullBleed(2), 180));
out('favicon.ico', pngToIco(renderPng(svg, 32), 32));
console.log('Icons generated.');
