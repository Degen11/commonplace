import { useState } from "react";
import { Z } from "./styles";

export function FavBtn({ q, onFav }) {
  return (
    <button
      style={{ ...Z.actBtn, color: q.favorite ? "#F59E0B" : "#9B9A97" }}
      title={q.favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={() => onFav(q.id)}
    >
      {q.favorite ? "★" : "☆"}
    </button>
  );
}

// Fix 4: replaced two-overlapping-rectangles with a cleaner clipboard icon
export function CopyBtn({ q, onCopy }) {
  return (
    <button
      style={{ ...Z.actBtn, color: "#9B9A97" }}
      title="Copy quote"
      onClick={() => onCopy(q)}
    >
      <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="3.5" width="8.5" height="10" rx="1.25" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4 3.5V2.5C4 1.95 4.45 1.5 5 1.5h3.5C9.05 1.5 9.5 1.95 9.5 2.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="3.5" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="3.5" y1="9.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// Hits the API on just this one entry — useful when Claude got something wrong
export function ReidentifyBtn({ q, onReidentify }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onReidentify(q);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      style={{ ...Z.actBtn, color: "#9B9A97", opacity: loading ? 0.4 : 1, fontSize: 12 }}
      title="Re-identify with AI"
      onClick={handle}
      disabled={loading}
    >
      {loading ? "·" : "🔄"}
    </button>
  );
}

export function EditBtn({ q, onEdit }) {
  return (
    <button style={Z.actBtn} title="Edit" onClick={() => onEdit(q)}>✎</button>
  );
}

export function DelBtn({ q, onDelete }) {
  return (
    <button style={{ ...Z.actBtn, color: "#EB5757" }} title="Delete" onClick={() => onDelete(q.id)}>✕</button>
  );
}

// Fix 3: CSS tooltip via className + data-tip instead of native title attribute
// (native title has an uncontrollable browser delay; CSS ::after has none)
export function ConfDot({ q, CONF_LABELS }) {
  if (!q.confidence || q.confidence === "high") return null;
  return (
    <span
      className="conf-tooltip"
      data-tip={CONF_LABELS[q.confidence]}
      style={{ ...Z.confDot, background: q.confidence === "medium" ? "#FFB74D" : "#D6D6D4" }}
    />
  );
}
