// Geometry for the folded speech-bubble mark (32×32 viewBox), shared by
// Logo.jsx and api/og.js. public/favicon.svg and public/og-image.svg carry
// copies of these paths: update them too if the mark changes, then run
// `npm run icons` and `npm run og-image`.
//
// The text lines and the gap around the folded corner are holes in the bubble
// (fill-rule evenodd) rather than shapes painted in the background color, so
// the mark works on any background, including satori/resvg renders.

// Bubble with its top-right corner folded away, minus two text lines
export const LOGO_BUBBLE_PATH =
  "M6 5H20.4V10A2.6 2.6 0 0 0 23 12.6H28V20A2 2 0 0 1 26 22H13.5L8 27V22H6A2 2 0 0 1 4 20V7A2 2 0 0 1 6 5Z" +
  "M8.5 10.55H16.5A0.95 0.95 0 0 1 16.5 12.45H8.5A0.95 0.95 0 0 1 8.5 10.55Z" +
  "M8.5 15.55H22A0.95 0.95 0 0 1 22 17.45H8.5A0.95 0.95 0 0 1 8.5 15.55Z";

// The folded-over corner, drawn at LOGO_FLAP_OPACITY so it reads as paper
export const LOGO_FLAP_PATH = "M21 5L28 12H23A2 2 0 0 1 21 10Z";
export const LOGO_FLAP_OPACITY = 0.6;
