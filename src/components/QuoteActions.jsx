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

// Appears on hover — copies the quote formatted nicely to clipboard
export function CopyBtn({ q, onCopy }) {
  return (
    <button
      style={{ ...Z.actBtn, color: "#9B9A97" }}
      title="Copy quote"
      onClick={() => onCopy(q)}
    >
      <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3.5" y="3.5" width="7" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M3.5 3V2a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
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

// ConfDot lives here too since it's always rendered near the action area
export function ConfDot({ q, CONF_LABELS }) {
  if (!q.confidence || q.confidence === "high") return null;
  return (
    <span
      title={CONF_LABELS[q.confidence]}
      style={{ ...Z.confDot, background: q.confidence === "medium" ? "#FFB74D" : "#D6D6D4", cursor: "help" }}
    />
  );
}
