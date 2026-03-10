import { useState, useRef, useEffect, useCallback } from "react";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
  Search, X, ChevronDown, Copy, MoreHorizontal,
  BarChart3, RefreshCw, Plus, Trash2,
} from "lucide-react";

const pillStyles = syncPillStyles.full;

const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "confidence", label: "Needs attention first" },
  { key: "alpha",      label: "Alphabetical" },
  { key: "category",   label: "By category" },
];

export default function HeaderBar({
  quotes, filtered,
  view, compact, setView, setCompact,
  showStats, setShowStats,
  showExport, setShowExport,
  showAddMore, setShowAddMore,
  isMobile,
  setConfirmClear,
  addMoreRef,
  exportRef,
  headerRef,
  headerVisible,
  exportDropdownContent,
  syncStatus,
  lastSynced,
  onManualSync,
  dark,
  toggleTheme,
  onShowShortcuts,
  // Toolbar props (merged in)
  search, setSearch,
  sortBy, setSortBy,
  showSort, setShowSort,
  sortRef,
  onFindDupes,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const searchInputRef = useRef(null);
  const overflowRef = useRef(null);
  const sortDropRef = useRef(null);
  const [sortFlipLeft, setSortFlipLeft] = useState(false);

  // Open search if there's an existing search term
  useEffect(() => {
    if (search) setSearchOpen(true);
  }, [search]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Close overflow on outside click
  useEffect(() => {
    if (!overflowOpen) return;
    const handler = (e) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) setOverflowOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [overflowOpen]);

  // Flip sort dropdown if clipping right edge
  useEffect(() => {
    if (!showSort) { setSortFlipLeft(false); return; }
    const el = sortDropRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) setSortFlipLeft(true);
  }, [showSort]);

  const toggleSearch = useCallback(() => {
    setSearchOpen(o => {
      if (o) setSearch("");
      return !o;
    });
  }, [setSearch]);

  const sortActive = sortBy !== "default";

  return (
    <div ref={headerRef} style={styles.header}>
      {/* ── Left: Brand ── */}
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} />
        <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Commonplace
          <span style={{ fontSize: 13, fontWeight: 400, color: "var(--cp-text-muted)", fontFamily: "'DM Sans',-apple-system,sans-serif", letterSpacing: 0 }}>
            {filtered.length < quotes.length
              ? <>{filtered.length} of {quotes.length}</>
              : <>{quotes.length} {quotes.length === 1 ? "entry" : "entries"}</>
            }
          </span>
        </span>
      </h1>

      {/* ── Center: Unified control strip ── */}
      <div style={styles.controlStrip}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", ...(searchOpen ? styles.controlSearchOpen : {}) }}>
          <button
            className="ui-tip ui-tip-below"
            data-tip="Search"
            style={styles.controlBtn}
            onClick={toggleSearch}
          >
            <Search size={14} strokeWidth={2} />
          </button>
          {searchOpen && (
            <>
              <input
                ref={searchInputRef}
                data-search-input
                style={styles.controlSearchInput}
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") toggleSearch(); }}
              />
              {search && (
                <button style={styles.controlSearchClear} onClick={() => setSearch("")}>
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>

        <div style={styles.controlSep} />

        {/* Sort */}
        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            className="ui-tip ui-tip-below"
            data-tip={sortActive ? `Sorted: ${SORT_OPTIONS.find(o => o.key === sortBy)?.label}` : "Sort"}
            style={{ ...styles.controlBtn, ...(sortActive ? styles.controlBtnActive : {}) }}
            onClick={() => setShowSort(!showSort)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h12M3 18h6" /></svg>
            {sortActive && <span style={styles.controlLabel}>{SORT_OPTIONS.find(o => o.key === sortBy)?.label}</span>}
          </button>
          <div ref={sortDropRef} style={{
            ...styles.sortDrop,
            ...(sortFlipLeft ? { right: "auto", left: 0 } : {}),
            opacity: showSort ? 1 : 0,
            transform: showSort ? "translateY(0)" : "translateY(-4px)",
            pointerEvents: showSort ? "auto" : "none",
          }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.key} className="dd-opt" style={{ ...styles.sortOpt, ...(sortBy === o.key ? styles.sortOptOn : {}) }} onClick={() => { setSortBy(o.key); setShowSort(false); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duplicates */}
        {onFindDupes && (
          <button className="ui-tip ui-tip-below" data-tip="Find duplicates" style={styles.controlBtn} onClick={onFindDupes}>
            <Copy size={13} strokeWidth={2} />
          </button>
        )}

        {!isMobile && (
          <>
            <div style={styles.controlSep} />
            {/* View toggles */}
            <div style={{ display: "flex", gap: 1 }}>
              <button className="ui-tip ui-tip-below view-btn" data-tip="Table view" style={{ ...styles.controlBtn, ...(view === "table" && !compact ? styles.controlBtnActive : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
                <List size={14} strokeWidth={1.5} />
              </button>
              <button className="ui-tip ui-tip-below view-btn" data-tip="Compact view" style={{ ...styles.controlBtn, ...(view === "table" && compact ? styles.controlBtnActive : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
                <AlignJustify size={14} strokeWidth={1.5} />
              </button>
              <button className="ui-tip ui-tip-below view-btn" data-tip="Card view" style={{ ...styles.controlBtn, ...(view === "cards" ? styles.controlBtnActive : {}) }} onClick={() => setView("cards")}>
                <LayoutGrid size={14} strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />

        {/* Dark mode toggle — always visible */}
        <button className="ui-tip ui-tip-below hdr-btn" data-tip={dark ? "Light mode" : "Dark mode"} style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={toggleTheme}>
          {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>

        {/* Export — always visible */}
        <div ref={exportRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="Export or share your collection" style={styles.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
          {showExport && headerVisible && exportDropdownContent}
        </div>

        {/* Add more — primary CTA */}
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={styles.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>

        {/* Overflow menu */}
        <div ref={overflowRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="More actions" style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={() => setOverflowOpen(!overflowOpen)}>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {overflowOpen && (
            <div style={styles.headerOverflowMenu}>
              <button className="hdr-overflow-item" style={styles.headerOverflowItem} onClick={() => { setShowStats(s => !s); setOverflowOpen(false); }}>
                <BarChart3 size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                {showStats ? "Hide stats" : "Stats"}
              </button>
              <button className="hdr-overflow-item" style={styles.headerOverflowItem} onClick={() => { onManualSync(); setOverflowOpen(false); }}>
                <RefreshCw size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                Sync now
              </button>
              <button className="hdr-overflow-item" style={styles.headerOverflowItem} onClick={() => { onShowShortcuts(); setOverflowOpen(false); }}>
                <HelpCircle size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                Keyboard shortcuts
              </button>
              <div style={styles.overflowMenuDivider} />
              <button className="hdr-overflow-item overflow-menu-item-destructive" style={styles.headerOverflowItemDestructive} onClick={() => { setConfirmClear(true); setOverflowOpen(false); }}>
                <Trash2 size={14} strokeWidth={1.5} style={{ opacity: 0.6 }} />
                New batch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
