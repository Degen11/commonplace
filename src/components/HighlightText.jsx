import { memo } from "react";

const highlightStyle = {
  background: "rgba(255, 213, 79, 0.35)",
  borderRadius: 2,
  padding: "0 1px",
};

const HighlightText = memo(function HighlightText({ text, term }) {
  if (!term || !text) return text || null;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={highlightStyle}>{part}</mark>
      : part
  );
});

export default HighlightText;
