import { useRef, useEffect, useState } from "react";
import { styles } from "./styles";
import { X, Search, ArrowUpDown, AlertTriangle } from "lucide-react";

const SORT_OPTIONS = [
  { key: "default",    label: "Default order",        badge: null },
  { key: "confidence", label: "Needs attention first", badge: "alert" },
  { key: "alpha",      label: "Alphabetical",         badge: "A-Z" },
  { key: "category",   label: "By category",          badge: "Cat" },
  { key: "shortest",   label: "Shortest first",       badge: "Len" },
  { key: "longest",    label: "Longest first",        badge: "Len" },
];

export default function ToolbarSection({
  catFilter, setCatFilter,
  favFilter, setFavFilter,
  favCount,
  allCats, customCats, cc, quotes,
  showNewCat, setShowNewCat,
  newCatName, setNewCatName,
  addCat, remCat,
  toolbarRef,
  catScrollRef, updateCatFade, catFade,
  getCatColor,
  search, setSearch,
  sortBy, setSortBy,
  showSort, setShowSort,
  sortRef,
}) {
  const searchInputRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keep search open when there's a value
  useEffect(() => {
    if (search) setSearchOpen(true);
  }, [search]);

  // Focus input when opening
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  return (
    <>
      <div ref={toolbarRef} style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--cp-bg)", borderBottom: "1px solid var(--cp-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Category pills — scrollable area */}
          <div className="cat-scroll" ref={catScrollRef} onScroll={updateCatFade}
            style={{ ...styles.cats, position: "static", top: "auto", zIndex: "auto", borderBottom: "none", flex: 1, minWidth: 0 }}>
            <button className="cat-pill" onClick={() => setCatFilter("All")} style={{ ...styles.catPill, ...(catFilter === "All" && !favFilter ? styles.catOn : {}) }}>All</button>
            {favCount > 0 && (
              <button className="cat-pill" onClick={() => setFavFilter(!favFilter)} style={{ ...styles.catPill, ...(favFilter ? { background: "rgba(217,119,6,0.14)", color: "#D97706", borderColor: "rgba(217,119,6,0.25)" } : {}) }}>
                ★ Favorites <span style={{ opacity: .5, fontSize: 11, marginLeft: 2 }}>{favCount}</span>
              </button>
            )}
            {allCats.filter(c => cc[c] || customCats.includes(c)).map(c => {
              const col = getCatColor(c, customCats); const on = catFilter === c;
              const count = cc[c];
              const attCount = quotes.filter(q => q.category === c && (q.confidence === "low" || q.category === "Unknown")).length;
              return <button key={c} className="cat-pill" onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...styles.catPill, ...(on ? { background: col.bg, color: col.text, borderColor: col.bg } : {}), ...(!count ? { opacity: .6 } : {}), position: "relative" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}
                {count ? <span style={{ opacity: .5, fontSize: 11 }}>{count}</span> : <span style={{ opacity: .4, fontSize: 10 }}>0</span>}
                {attCount > 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EA580C", position: "absolute", top: 2, right: 2 }} />}
                {customCats.includes(c) && <span title="Remove category" style={{ opacity: .4, cursor: "pointer", display: "inline-flex" }} onClick={e => { e.stopPropagation(); remCat(c); }}><X size={10} strokeWidth={2} /></span>}
              </button>;
            })}
            {showNewCat ? (
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                <input style={styles.newCatIn} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Name" autoFocus onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); } }} />
                <button style={styles.newCatSv} onClick={addCat}>Add</button>
              </div>
            ) : <button title="Add custom category" style={styles.addCatBtn} onClick={() => setShowNewCat(true)}>+</button>}
          </div>
          {/* Fade overlays for category scroll */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 24, background: "linear-gradient(to right, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.left ? 1 : 0, transition: "opacity .15s" }} />

          {/* Search + Sort — pinned right */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingRight: 2, paddingLeft: 8 }}>
            {searchOpen ? (
              <div style={{
                display: "flex", alignItems: "center",
                border: "1px solid var(--cp-border)", borderRadius: 6,
                background: "var(--cp-bg-card)", overflow: "hidden",
                width: 180, transition: "width .15s ease",
              }}>
                <Search size={13} strokeWidth={2} style={{ marginLeft: 8, flexShrink: 0, opacity: 0.4 }} />
                <input
                  ref={searchInputRef}
                  data-search-input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Escape") {
                      if (search) { setSearch(""); } else { setSearchOpen(false); }
                    }
                  }}
                  onBlur={() => { if (!search) setSearchOpen(false); }}
                  placeholder="Search..."
                  style={{
                    flex: 1, padding: "5px 6px", fontSize: 12, fontFamily: "inherit",
                    border: "none", outline: "none", background: "transparent",
                    color: "var(--cp-text)", minWidth: 0,
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      background: "transparent", border: "none",
                      color: "var(--cp-text-muted)", padding: "4px 6px",
                      cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
                    }}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            ) : (
              <button
                className="ui-tip ui-tip-below"
                data-tip="Search (/) "
                onClick={() => setSearchOpen(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--cp-text-muted)", padding: "6px",
                  display: "flex", alignItems: "center", borderRadius: 6,
                }}
              >
                <Search size={15} strokeWidth={2} />
              </button>
            )}
            <div ref={sortRef} style={{ position: "relative" }}>
              <button
                className="ui-tip ui-tip-below"
                data-tip="Sort order"
                onClick={() => setShowSort(!showSort)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: sortBy !== "default" ? "#2563EB" : "var(--cp-text-muted)",
                  padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, borderRadius: 6,
                  fontWeight: sortBy !== "default" ? 600 : 400,
                  fontSize: 11,
                }}
              >
                <ArrowUpDown size={14} strokeWidth={2} />
                {sortBy !== "default" && (
                  <span style={{ letterSpacing: sortBy === "alpha" ? 0.5 : 0, display: "inline-flex", alignItems: "center" }}>
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.badge === "alert"
                      ? <AlertTriangle size={12} strokeWidth={2} />
                      : SORT_OPTIONS.find(o => o.key === sortBy)?.badge}
                  </span>
                )}
              </button>
              <div style={{
                ...styles.sortDrop, right: 0, left: "auto", minWidth: 200,
                opacity: showSort ? 1 : 0,
                transform: showSort ? "translateY(0)" : "translateY(-4px)",
                pointerEvents: showSort ? "auto" : "none",
              }}>
                {SORT_OPTIONS.map(o => (
                  <button key={o.key} className="dd-opt" style={{ ...styles.sortOpt, ...(sortBy === o.key ? styles.sortOptOn : {}) }}
                    onClick={() => { setSortBy(o.key); setShowSort(false); }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Right fade for category scroll — placed before search/sort area */}
        <div style={{ position: "absolute", right: 80, top: 0, bottom: 0, width: 24, background: "linear-gradient(to left, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.right ? 1 : 0, transition: "opacity .15s" }} />
      </div>
    </>
  );
}
