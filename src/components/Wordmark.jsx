import { WORDMARK_PATH, WORDMARK_VIEWBOX, WORDMARK_ASPECT_RATIO } from "./wordmarkPath";

// ── Wordmark — "Commonplace" traced from Playfair Display Bold ──
// A vector path instead of styled text so the page never has to load
// Playfair Display just for these 11 characters (see scripts/generate-wordmark.mjs).
export default function Wordmark({ height = 20, color = "currentColor", style }) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      height={height}
      width={height * WORDMARK_ASPECT_RATIO}
      role="img"
      aria-label="Commonplace"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path d={WORDMARK_PATH} fill={color} />
    </svg>
  );
}
