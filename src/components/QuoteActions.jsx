import { Star, Copy, Check, RefreshCw, Trash2, Share2 } from "lucide-react";
import { Z } from "./styles";
import { CONF_COLORS } from "../data/constants";

export function FavBtn({ q, onFav }) {
  return (
    <button
      className="act-btn ui-tip"
      data-tip={q.favorite ? "Remove from favorites" : "Add to favorites"}
      style={{ ...Z.actBtn, "--hover-color": "#F59E0B", ...(q.favorite ? { color: "#F59E0B" } : {}) }}
      onClick={e => { e.stopPropagation(); onFav(q.id); }}
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

export function CopyBtn({ q, onCopy, copiedId }) {
  const isCopied = copiedId === q.id;
  return (
    <button
      className="act-btn ui-tip"
      data-tip={isCopied ? "Copied!" : "Copy quote and source"}
      style={{ ...Z.actBtn, "--hover-color": "#2383E2", ...(isCopied ? { color: "#059669" } : {}) }}
      onClick={e => { e.stopPropagation(); if (!isCopied) onCopy(q); }}
    >
      {isCopied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.5} />}
    </button>
  );
}

export function ReidentifyBtn({ q, onReidentify, loading }) {
  return (
    <button
      className="act-btn ui-tip"
      data-tip={loading ? "Re-identifying…" : "Re-identify with AI"}
      style={{
        ...Z.actBtn,
        "--hover-color": "#059669",
        ...(loading ? { opacity: 0.5, cursor: "wait" } : {}),
      }}
      onClick={e => { e.stopPropagation(); if (!loading) onReidentify(q); }}
      disabled={loading}
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
      className="act-btn ui-tip"
      data-tip="Delete entry"
      style={{ ...Z.actBtn, "--hover-color": "#EF4444" }}
      onClick={e => { e.stopPropagation(); onDelete(q.id); }}
    >
      <Trash2 size={16} strokeWidth={1.5} />
    </button>
  );
}

export function ShareImageBtn({ q, onShareImage }) {
  return (
    <button
      className="act-btn ui-tip"
      data-tip="Save as image"
      style={{ ...Z.actBtn, "--hover-color": "#7C3AED" }}
      onClick={e => { e.stopPropagation(); onShareImage(q); }}
    >
      <Share2 size={16} strokeWidth={1.5} />
    </button>
  );
}

export function ConfDot({ q, CONF_LABELS }) {
  return (
    <span
      className="conf-tooltip"
      data-tip={CONF_LABELS[q.confidence] || "Unknown"}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0, cursor: "help" }}
    >
      <span style={{ ...Z.confDot, background: CONF_COLORS[q.confidence] || "#D1D5DB", pointerEvents: "none" }} />
    </span>
  );
}
