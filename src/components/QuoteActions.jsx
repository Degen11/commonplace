import { Z } from "./styles";

export function FavBtn({ q, onFav }) {
  return (
    <button
      className="act-btn"
      style={Z.actBtn}
      onClick={e => { e.stopPropagation(); onFav(q.id); }}
      title={q.favorite ? "Unfavorite" : "Favorite"}
    >
      {q.favorite ? "★" : "☆"}
    </button>
  );
}

export function CopyBtn({ q, onCopy }) {
  return (
    <button
      className="act-btn"
      style={Z.actBtn}
      onClick={e => { e.stopPropagation(); onCopy(q); }}
      title="Copy to clipboard"
    >
      📋
    </button>
  );
}

export function ReidentifyBtn({ q, onReidentify, loading }) {
  return (
    <button
      className="act-btn"
      style={{
        ...Z.actBtn,
        ...(loading ? { opacity: 0.5, cursor: "wait" } : {}),
      }}
      onClick={e => { e.stopPropagation(); if (!loading) onReidentify(q); }}
      title={loading ? "Re-identifying..." : "Re-identify source"}
      disabled={loading}
    >
      {loading ? "⏳" : "🔄"}
    </button>
  );
}

export function DelBtn({ q, onDelete }) {
  return (
    <button
      className="act-btn"
      style={Z.actBtn}
      onClick={e => { e.stopPropagation(); onDelete(q.id); }}
      title="Delete"
    >
      🗑
    </button>
  );
}

export function ConfDot({ q, CONF_LABELS }) {
  const colors = { high: "#10B981", medium: "#F59E0B", low: "#EF4444" };
  return (
    <span
      className="conf-tooltip"
      data-tip={CONF_LABELS[q.confidence] || "Unknown"}
      style={{ ...Z.confDot, background: colors[q.confidence] || "#D1D5DB" }}
    />
  );
}