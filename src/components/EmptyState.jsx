import { X, Library } from "lucide-react";
import { getCatColor } from "../data/constants";
import { styles } from "./styles";

// Inline SVG illustration — empty collection (open folder with documents)
function EmptyCollectionIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      {/* Folder back */}
      <rect x="10" y="24" width="60" height="42" rx="4" fill="var(--cp-bg-tab)" stroke="var(--cp-border-dim)" strokeWidth="1.5" />
      {/* Folder tab */}
      <path d="M10 28V20a4 4 0 0 1 4-4h14l4 8H10z" fill="var(--cp-bg-tab)" stroke="var(--cp-border-dim)" strokeWidth="1.5" />
      {/* Document 1 (tilted left) */}
      <g transform="translate(24, 18) rotate(-6)">
        <rect width="20" height="28" rx="2" fill="var(--cp-bg-card)" stroke="var(--cp-border)" strokeWidth="1" />
        <line x1="4" y1="8" x2="16" y2="8" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="4" y1="13" x2="13" y2="13" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="4" y1="18" x2="15" y2="18" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </g>
      {/* Document 2 (tilted right) */}
      <g transform="translate(36, 16) rotate(4)">
        <rect width="20" height="28" rx="2" fill="var(--cp-bg-card)" stroke="var(--cp-border)" strokeWidth="1" />
        <line x1="4" y1="8" x2="16" y2="8" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="4" y1="13" x2="14" y2="13" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="4" y1="18" x2="12" y2="18" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </g>
      {/* Dashed arrow hint */}
      <line x1="40" y1="58" x2="40" y2="50" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" opacity="0.4" />
      <polyline points="36,54 40,50 44,54" fill="none" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
}

// Inline SVG illustration — no search results (magnifying glass with X)
function NoResultsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      {/* Search lens circle */}
      <circle cx="34" cy="34" r="18" fill="var(--cp-bg-tab)" stroke="var(--cp-border-dim)" strokeWidth="2" />
      {/* Inner circle highlight */}
      <circle cx="34" cy="34" r="12" fill="var(--cp-bg-card)" stroke="var(--cp-border)" strokeWidth="1" />
      {/* X mark inside lens */}
      <line x1="29" y1="29" x2="39" y2="39" stroke="var(--cp-text-faint)" strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="29" x2="29" y2="39" stroke="var(--cp-text-faint)" strokeWidth="2" strokeLinecap="round" />
      {/* Handle */}
      <line x1="47" y1="47" x2="62" y2="62" stroke="var(--cp-border-dim)" strokeWidth="4" strokeLinecap="round" />
      {/* Scattered lines (dismissed results) */}
      <line x1="56" y1="18" x2="68" y2="18" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      <line x1="58" y1="24" x2="66" y2="24" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" />
      <line x1="14" y1="60" x2="26" y2="60" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <line x1="12" y1="66" x2="22" y2="66" stroke="var(--cp-text-faint)" strokeWidth="1.5" strokeLinecap="round" opacity="0.12" />
    </svg>
  );
}

export default function EmptyState({
  catFilter, setCatFilter,
  favFilter, setFavFilter,
  search, setSearch,
  setSortBy,
  customCats,
  activeCollectionName,
  onBrowseAll,
}) {
  const hasFilters = catFilter !== "All" || search || favFilter;
  const isCollectionEmpty = activeCollectionName && !hasFilters;

  return (
    <div style={{ ...styles.empty, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {isCollectionEmpty ? (
        <>
          <EmptyCollectionIllustration />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--cp-text-muted)", marginBottom: 8 }}>
            "{activeCollectionName}" is empty
          </p>
          <p style={{ fontSize: 13, color: "var(--cp-text-muted)", marginBottom: 16 }}>
            Drag quotes here or select entries and add them via the bulk bar
          </p>
          {onBrowseAll && (
            <button
              className="hdr-btn"
              onClick={onBrowseAll}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 20px", borderRadius: 100,
                border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)",
                color: "var(--cp-accent)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Library size={14} strokeWidth={1.5} />
              Browse all quotes
            </button>
          )}
        </>
      ) : (
        <>
          <NoResultsIllustration />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--cp-text-muted)", marginBottom: 8 }}>
            No results found{activeCollectionName ? ` in "${activeCollectionName}"` : ""}
          </p>
          <p style={{ fontSize: 13, color: "var(--cp-text-muted)", marginBottom: 16 }}>
            Try removing a filter to see more entries
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
            {catFilter !== "All" && (
              <button className="filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)", fontSize: 12, color: getCatColor(catFilter, customCats).text, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                onClick={() => setCatFilter("All")}>{catFilter} <X size={10} strokeWidth={2} /></button>
            )}
            {search && (
              <button className="filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)", fontSize: 12, color: "var(--cp-text-secondary)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                onClick={() => setSearch("")}>"{search}" <X size={10} strokeWidth={2} /></button>
            )}
            {favFilter && (
              <button className="filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid #FDE68A", background: "#FEF3C7", fontSize: 12, color: "#D97706", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                onClick={() => setFavFilter(false)}>&star; Favorites <X size={10} strokeWidth={2} /></button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="reset-btn" style={{
              background: "var(--cp-bg-tab)", border: "none", color: "var(--cp-text-muted)", cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", fontWeight: 500, padding: "8px 20px",
              borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 6,
            }}
              onClick={() => { setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default"); }}>Reset all filters</button>
            {onBrowseAll && (
              <button
                className="hdr-btn"
                onClick={onBrowseAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 20px", borderRadius: 100,
                  border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)",
                  color: "var(--cp-accent)", fontSize: 13, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Library size={14} strokeWidth={1.5} />
                Browse all quotes
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
