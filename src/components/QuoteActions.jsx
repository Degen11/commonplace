import { Z } from "./styles";

export function FavBtn({ q, onFav }) {
  return (
    <button
      className="act-btn"
      style={Z.actBtn}
      onClick={e => { e.stopPropagation(); onFav(q.id); }}
      title={q.favorite ? "Unfavorite" : "Favorite"}
    >
      {q.favorite ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2.5l1.545 3.131 3.455.503-2.5 2.438.59 3.428L8 10.131 4.91 12l.59-3.428-2.5-2.438 3.455-.503L8 2.5z" 
                fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2.5l1.545 3.131 3.455.503-2.5 2.438.59 3.428L8 10.131 4.91 12l.59-3.428-2.5-2.438 3.455-.503L8 2.5z" 
                stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
        </svg>
      )}
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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="5.5" y="5.5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M3.5 10.5h-1a1 1 0 01-1-1v-7a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
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
      onMouseEnter={e => !loading && (e.currentTarget.style.color = "#7C3AED")}
      onMouseLeave={e => !loading && (e.currentTarget.style.color = "#6B6764")}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ 
        animation: loading ? "spin 1s linear infinite" : "none",
      }}>
        <path d="M13.5 8a5.5 5.5 0 11-1.293-3.536" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M13.5 3.5v4.5h-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 4.5h11M6.5 4.5v-2a1 1 0 011-1h1a1 1 0 011 1v2M5.5 6.5v5M7.5 6.5v5M9.5 6.5v5" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3.5 4.5h9v8a1 1 0 01-1 1h-7a1 1 0 01-1-1v-8z" 
              stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
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