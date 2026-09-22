import { useRef, useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { styles, CP_ACCENT, CLR_AMBER, CLR_ORANGE, CLR_BLUE } from "./styles";
import { X, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import { pluralize } from "../utils/helpers";
import { Z } from "../data/constants";
import { TOP_CATEGORY_PILLS } from "../config";
import AnimatedNumber from "./AnimatedNumber";

// `short` is what the trigger shows once a sort is active — always a real word,
// never a bare icon or an ambiguous abbreviation (previously "Cat", "Short", a
// lone triangle icon). `label` is the full text shown in the menu itself.
const SORT_OPTIONS = [
  { key: "default",    label: "Default order",        short: null },
  { key: "confidence", label: "Needs attention first", short: "Needs attention" },
  { key: "alpha",      label: "Alphabetical",         short: "A–Z" },
  { key: "category",   label: "By category",          short: "By category" },
  { key: "shortest",   label: "Shortest first",       short: "Shortest" },
  { key: "longest",    label: "Longest first",        short: "Longest" },
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
  hasActiveFilters,
  clearFilters,
  resultCount,
  totalCount,
  isMobile,
}) {
  const searchInputRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(() => !!search);

  // ── Category overflow ("More") — pin the most-used categories inline,
  // tuck the rest behind a searchable dropdown so the row doesn't need to
  // scroll through 15+ same-weight pills to find one.
  const [catOverflowOpen, setCatOverflowOpen] = useState(false);
  const [catOverflowQuery, setCatOverflowQuery] = useState("");
  const [moreRect, setMoreRect] = useState(null);
  const moreBtnRef = useRef(null);
  const catOverflowPanelRef = useRef(null);

  const countedCats = allCats.filter(c => cc[c] || customCats.includes(c));
  const byCountDesc = [...countedCats].sort((a, b) => (cc[b] || 0) - (cc[a] || 0));
  const pinnedNames = new Set(byCountDesc.slice(0, TOP_CATEGORY_PILLS));
  // Keep the active filter visible even if it fell out of the top N by count.
  if (catFilter !== "All" && countedCats.includes(catFilter)) pinnedNames.add(catFilter);
  const pinnedCats = byCountDesc.filter(c => pinnedNames.has(c));
  const overflowCats = byCountDesc.filter(c => !pinnedNames.has(c));
  const overflowVisible = catOverflowQuery
    ? overflowCats.filter(c => c.toLowerCase().includes(catOverflowQuery.toLowerCase()))
    : overflowCats;

  const toggleCatOverflow = () => {
    if (catOverflowOpen) { setCatOverflowOpen(false); return; }
    const r = moreBtnRef.current?.getBoundingClientRect();
    if (r) setMoreRect({ top: r.bottom + 4, left: r.left });
    setCatOverflowOpen(true);
  };

  // position:fixed (recomputed on open) so the panel escapes the pill row's
  // overflowY:hidden scroll container instead of getting clipped.
  useEffect(() => {
    if (!catOverflowOpen) return;
    const close = () => setCatOverflowOpen(false);
    const onMouseDown = (e) => {
      if (catOverflowPanelRef.current?.contains(e.target)) return;
      if (moreBtnRef.current?.contains(e.target)) return;
      close();
    };
    const onKeyDown = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [catOverflowOpen]);

  // Keep search open when there's a value — use setState-during-render pattern
  if (search && !searchOpen) {
    setSearchOpen(true);
  }

  // Focus input when opening
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  // The "/" keyboard shortcut lives in useKeyboardShortcuts, which can't focus the
  // search input while it's collapsed (unmounted). It dispatches this event instead;
  // opening mounts the input and the focus effect above then focuses it.
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener("cp:focus-search", open);
    return () => window.removeEventListener("cp:focus-search", open);
  }, []);

  return (
    <>
      <div ref={toolbarRef} style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--cp-bg)", borderBottom: "1px solid var(--cp-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {/* Category pills — scrollable area with fade overlays */}
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <div className="cat-scroll" ref={catScrollRef} onScroll={updateCatFade}
              style={{ ...styles.cats, position: "static", top: "auto", zIndex: "auto", borderBottom: "none" }}>
              <button className="cat-pill" aria-pressed={catFilter === "All" && !favFilter} onClick={() => setCatFilter("All")} style={{ ...styles.catPill, borderColor: catFilter === "All" && !favFilter ? CP_ACCENT : "var(--cp-border)", ...(catFilter === "All" && !favFilter ? styles.catOn : {}) }}>All</button>
              {favCount > 0 && (
                <button className="cat-pill" aria-pressed={favFilter} onClick={() => setFavFilter(!favFilter)} style={{ ...styles.catPill, borderColor: favFilter ? "rgba(217,119,6,0.25)" : "var(--cp-border)", ...(favFilter ? { background: "rgba(217,119,6,0.14)", color: CLR_AMBER } : {}) }}>
                  ★ Favorites <span style={{ opacity: .5, fontSize: 11, marginLeft: 2 }}><AnimatedNumber value={favCount} /></span>
                </button>
              )}
              {pinnedCats.map(c => {
                const col = getCatColor(c, customCats); const on = catFilter === c;
                const count = cc[c];
                const attCount = quotes.filter(q => q.category === c && (q.confidence === "low" || q.category === "Unknown")).length;
                return <button key={c} className="cat-pill" aria-pressed={on} onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...styles.catPill, borderColor: on ? col.bg : "var(--cp-border)", ...(on ? { background: col.bg, color: col.text } : {}), ...(!count ? { opacity: .6 } : {}), position: "relative" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}
                  {count ? <span style={{ opacity: .5, fontSize: 11 }}><AnimatedNumber value={count} /></span> : <span style={{ opacity: .4, fontSize: 10 }}>0</span>}
                  {attCount > 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: CLR_ORANGE, position: "absolute", top: 2, right: 2 }} />}
                  {/* native title (not .ui-tip): inside the .cat-scroll clip container, a custom tooltip would be cut off */}
                  {customCats.includes(c) && <span title="Remove category" aria-label={`Remove ${c} category`} role="button" style={{ opacity: .4, cursor: "pointer", display: "inline-flex" }} onClick={e => { e.stopPropagation(); remCat(c); }}><X size={10} strokeWidth={2} /></span>}
                </button>;
              })}
              {overflowCats.length > 0 && (
                <button
                  ref={moreBtnRef}
                  type="button"
                  className="cat-pill"
                  aria-haspopup="true"
                  aria-expanded={catOverflowOpen}
                  onClick={toggleCatOverflow}
                  style={{ ...styles.catPill, ...(catOverflowOpen || overflowCats.includes(catFilter) ? { borderColor: CP_ACCENT, color: CP_ACCENT } : {}) }}
                >
                  More <span style={{ opacity: .5, fontSize: 11 }}>{overflowCats.length}</span>
                  <ChevronDown size={11} strokeWidth={2} style={{ transform: catOverflowOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                </button>
              )}
              {showNewCat ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <input style={styles.newCatIn} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Name" autoFocus onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); } }} />
                  <button style={styles.newCatSv} onClick={addCat}>Add</button>
                </div>
              ) : <button className="add-cat-btn" title="Add custom category" aria-label="Add custom category" style={styles.addCatBtn} onClick={() => setShowNewCat(true)}>+</button>}
            </div>
            {/* Fade overlays — scoped to scroll container */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 24, background: "linear-gradient(to right, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.left ? 1 : 0, transition: "opacity .15s" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 24, background: "linear-gradient(to left, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.right ? 1 : 0, transition: "opacity .15s" }} />
            {/* Fixed positioning (not absolute-in-scroll-container) so the panel escapes .cats' overflowY:hidden */}
            {catOverflowOpen && moreRect && (
              <div
                ref={catOverflowPanelRef}
                style={{
                  position: "fixed", top: moreRect.top, left: moreRect.left, width: 240,
                  background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 6,
                  boxShadow: "var(--cp-shadow-md)", padding: 6, zIndex: Z.DROPDOWN, animation: "menuIn .14s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--cp-border)", borderRadius: 4, padding: "5px 8px", marginBottom: 4 }}>
                  <Search size={12} strokeWidth={2} style={{ opacity: .4, flexShrink: 0 }} />
                  <input
                    autoFocus
                    value={catOverflowQuery}
                    onChange={e => setCatOverflowQuery(e.target.value)}
                    placeholder="Filter categories..."
                    aria-label="Filter categories"
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, fontFamily: "inherit", color: "var(--cp-text)", minWidth: 0 }}
                  />
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {overflowVisible.length === 0 && (
                    <div style={{ padding: "8px 6px", fontSize: 12, color: "var(--cp-text-faint)" }}>No matches</div>
                  )}
                  {overflowVisible.map(c => {
                    const col = getCatColor(c, customCats);
                    const count = cc[c];
                    const attCount = quotes.filter(q => q.category === c && (q.confidence === "low" || q.category === "Unknown")).length;
                    return (
                      <button
                        key={c}
                        type="button"
                        className="dd-opt"
                        onClick={() => { setCatFilter(c); setFavFilter(false); setCatOverflowOpen(false); setCatOverflowQuery(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "7px 8px", borderRadius: 4, fontSize: 12, color: "var(--cp-text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{c}</span>
                        {attCount > 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: CLR_ORANGE, flexShrink: 0 }} />}
                        <span style={{ opacity: .5, fontSize: 11 }}>{count || 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search + Sort — pinned right. Search stays mounted on desktop
              (no click-to-reveal icon) since there's room for it; mobile
              keeps the collapse-behind-an-icon behavior. */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingRight: 2, paddingLeft: 8 }}>
            {(!isMobile || searchOpen) && (
              <div style={{
                display: "flex", alignItems: "center",
                border: "1px solid var(--cp-border)", borderRadius: 6,
                background: "var(--cp-bg-card)", overflow: "hidden",
                width: isMobile ? 160 : 220, transition: "width .15s ease",
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
                    flex: 1, padding: isMobile ? "8px 6px" : "5px 6px",
                    fontSize: isMobile ? 14 : 12, fontFamily: "inherit",
                    border: "none", outline: "none", background: "transparent",
                    color: "var(--cp-text)", minWidth: 0,
                  }}
                />
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "transparent", border: "none",
                    color: "var(--cp-text-muted)", padding: isMobile ? "8px" : "4px 6px",
                    cursor: search ? "pointer" : "default",
                    display: "flex", alignItems: "center", flexShrink: 0,
                    opacity: search ? 1 : 0, pointerEvents: search ? "auto" : "none",
                    transition: "opacity .15s ease",
                  }}
                  tabIndex={search ? 0 : -1}
                  aria-label="Clear search"
                >
                  <X size={12} strokeWidth={2} />
                </button>
                {search && resultCount != null && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "var(--cp-text-muted)",
                    padding: "2px 7px", marginRight: 4, flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    {resultCount === totalCount ? `${resultCount}` : `${resultCount}/${totalCount}`}
                  </span>
                )}
              </div>
            )}
            {isMobile && !searchOpen && (
              <button
                className="ui-tip ui-tip-below"
                data-tip="Search (/)"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--cp-text-muted)", padding: isMobile ? "8px" : "6px",
                  display: "flex", alignItems: "center", borderRadius: 6,
                  minHeight: isMobile ? 40 : undefined,
                }}
              >
                <Search size={isMobile ? 18 : 15} strokeWidth={2} />
              </button>
            )}
            {hasActiveFilters && !(search && catFilter === "All" && !favFilter && sortBy === "default") && (
              <button
                className="reset-btn"
                onClick={() => { clearFilters(); setShowSort(false); document.activeElement?.blur(); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--cp-text-muted)", padding: "4px 8px",
                  fontSize: 11, fontWeight: 500, fontFamily: "inherit",
                  borderRadius: 6, whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <X size={11} strokeWidth={2.5} />
                Clear
              </button>
            )}
            {/* Base UI Menu — gives keyboard nav, focus return, Escape/outside-click,
                aria-expanded/haspopup, and unmounting (options aren't focusable when closed). */}
            <Menu.Root open={showSort} onOpenChange={setShowSort}>
              <Menu.Trigger
                className="ui-tip ui-tip-below"
                data-tip="Sort order"
                aria-label="Sort order"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: sortBy !== "default" ? CLR_BLUE : "var(--cp-text-muted)",
                  padding: isMobile ? "8px" : "4px 6px", display: "flex", alignItems: "center", gap: 3, borderRadius: 6,
                  fontWeight: sortBy !== "default" ? 600 : 400,
                  fontSize: 11,
                  minHeight: isMobile ? 40 : undefined,
                }}
              >
                <ArrowUpDown size={14} strokeWidth={2} />
                {sortBy !== "default" && (
                  <span style={{ whiteSpace: "nowrap" }}>{SORT_OPTIONS.find(o => o.key === sortBy)?.short}</span>
                )}
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: Z.DROPDOWN }}>
                  <Menu.Popup style={{ background: "var(--cp-bg-card)", borderRadius: 6, boxShadow: "var(--cp-shadow-md)", border: "1px solid var(--cp-border)", minWidth: 200, padding: 4, animation: "menuIn .14s ease" }}>
                    {SORT_OPTIONS.map(o => (
                      <Menu.Item key={o.key} className="dd-opt" style={{ ...styles.sortOpt, ...(sortBy === o.key ? styles.sortOptOn : {}) }}
                        onClick={() => setSortBy(o.key)}>
                        {o.label}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </div>
      </div>
    </>
  );
}
