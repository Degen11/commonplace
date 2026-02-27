import { Star, Copy, RefreshCw, Trash2 } from "lucide-react";
import { Z } from "./styles";

export function FavBtn({ q, onFav }) {
  return (
    <button
      className="act-btn"
      style={Z.actBtn}
      onClick={e => { e.stopPropagation(); onFav(q.id); }}
      title={q.favorite ? "Unfavorite" : "Favorite"}
      onMouseEnter={e => {
        if (!q.favorite) {
          e.currentTarget.style.color = "#F59E0B";
        }
      }}
      onMouseLeave={e => {
        if (!q.favorite) {
          e.currentTarget.style.color = "#6B6764";
        }
      }}
    >
      <Star 
        size={16}
        fill={q.favorite ? "#F59E0B" : "none"}
        color={q.favorite ? "#F59E0B" : "currentColor"}
        strokeWidth={1.5}
      />
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
      onMouseEnter={e => e.currentTarget.style.color = "#2383E2"}
      onMouseLeave={e => e.currentTarget.style.color = "#6B6764"}
    >
      <Copy size={16} strokeWidth={1.5} />
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
      onMouseEnter={e => !loading && (e.currentTarget.style.color = "#059669")}
      onMouseLeave={e => !loading && (e.currentTarget.style.color = "#6B6764")}
    >
      <RefreshCw
        size={16}
        strokeWidth={1.5}
        className={loading ? "spin" : ""}
      />
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
      onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
      onMouseLeave={e => e.currentTarget.style.color = "#6B6764"}
    >
      <Trash2 size={16} strokeWidth={1.5} />
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