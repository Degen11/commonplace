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
      {q.favorite ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3l1.736 3.519 3.882.564-2.809 2.738.663 3.857L9 12.096l-3.472 1.582.663-3.857-2.809-2.738 3.882-.564L9 3z" 
                fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3l1.736 3.519 3.882.564-2.809 2.738.663 3.857L9 12.096l-3.472 1.582.663-3.857-2.809-2.738 3.882-.564L9 3z" 
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
      onMouseEnter={e => !loading && (e.currentTarget.style.color = "#059669")}
      onMouseLeave={e => !loading && (e.currentTarget.style.color = "#6B6764")}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ 
        animation: loading ? "spin 1s linear infinite" : "none",
      }}>
        <path d="M14 8a1 1 0 00-1 1 5.33 5.33 0 11-1.48-3.67h-1.6a1 1 0 000 1.34h3.02a1 1 0 001-.67V2a1 1 0 00-1.34 0v1.18A6.67 6.67 0 1014.67 8 1 1 0 0014 8z" 
              fill="currentColor"/>
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