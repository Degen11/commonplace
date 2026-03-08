import { memo } from "react";

const highlightStyle = {
  background: "rgba(255, 213, 79, 0.35)",
  borderRadius: 2,
  padding: "0 1px",
};

// Regex to match rich text markers: **bold**, *italic*, __underline__
// Order matters: ** and __ before * to avoid partial matches
const RICH_RE = /(\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*))/g;

function parseRichSegments(text) {
  const segments = [];
  let lastIndex = 0;
  let match;
  RICH_RE.lastIndex = 0;
  while ((match = RICH_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "plain", text: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      segments.push({ type: "bold", text: match[2] });
    } else if (match[3]) {
      segments.push({ type: "underline", text: match[3] });
    } else if (match[4]) {
      segments.push({ type: "italic", text: match[4] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "plain", text: text.slice(lastIndex) });
  }
  return segments;
}

function applyHighlight(str, term, keyPrefix) {
  if (!term) return str;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = str.split(regex);
  if (parts.length === 1) return str;
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={`${keyPrefix}-${i}`} style={highlightStyle}>{part}</mark>
      : part
  );
}

const STYLE_MAP = {
  bold: { fontWeight: 600 },
  italic: { fontStyle: "italic" },
  underline: { textDecoration: "underline" },
};

const HighlightText = memo(function HighlightText({ text, term }) {
  if (!text) return null;

  const segments = parseRichSegments(text);
  const hasRichText = segments.some(s => s.type !== "plain");

  // Fast path: no rich text and no search term
  if (!hasRichText && !term) return text;

  // No rich text but has search term: simple highlight
  if (!hasRichText) {
    return applyHighlight(text, term, "h");
  }

  // Render rich segments with optional search highlighting
  return segments.map((seg, i) => {
    const content = applyHighlight(seg.text, term, `s${i}`);
    if (seg.type === "plain") return <span key={i}>{content}</span>;
    return <span key={i} style={STYLE_MAP[seg.type]}>{content}</span>;
  });
});

export default HighlightText;
