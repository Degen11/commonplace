import Logo from "./Logo";
import { styles } from "./styles";
import {
  List, AlignJustify, LayoutGrid,
} from "lucide-react";

const syncPill = {
  fontSize: 11,
  fontWeight: 500,
  padding: "2px 8px",
  borderRadius: 4,
  fontFamily: "'DM Sans', sans-serif",
  letterSpacing: 0.2,
  lineHeight: "16px",
  whiteSpace: "nowrap",
  alignSelf: "center",
};

const syncStyles = {
  syncing: { ...syncPill, color: "#9B9A97", background: "#F1F1EF" },
  synced:  { ...syncPill, color: "#16A34A", background: "#F0FDF4" },
  error:   { ...syncPill, color: "#DC2626", background: "#FEF2F2" },
};

export default function HeaderBar({
  quotes, filtered, topCats, customCats,
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
  getCatColor,
  syncStatus,
}) {
  return (
    <div ref={headerRef} style={styles.header}>
      <div>
        <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={28} /> Commonplace
        </h1>
        <p style={styles.sub}>
          {filtered.length < quotes.length
            ? <>{filtered.length} of {quotes.length} {quotes.length === 1 ? "entry" : "entries"}</>
            : <>{quotes.length} {quotes.length === 1 ? "entry" : "entries"} organized</>
          }
          {filtered.length === quotes.length && topCats.length > 0 && <span style={{ color: "#D3D3D0" }}> · </span>}
          {filtered.length === quotes.length && topCats.map(([c, n], i) => <span key={c} style={{ color: getCatColor(c, customCats).text }}>{i > 0 && <span style={{ color: "#D3D3D0" }}>, </span>}{n} {c}</span>)}
        </p>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {syncStatus === "syncing" && <span style={syncStyles.syncing}>Saving...</span>}
        {syncStatus === "synced" && <span style={syncStyles.synced}>Saved</span>}
        {syncStatus === "error" && <span style={syncStyles.error}>Sync error</span>}
        {!isMobile && (
          <div style={styles.viewTog}>
            <button className="ui-tip ui-tip-below" data-tip="Table view" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
              <List size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below" data-tip="Compact view" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
              <AlignJustify size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below" data-tip="Card view" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={() => setView("cards")}>
              <LayoutGrid size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Collection insights" style={{ ...styles.statsBtn, ...(showStats ? styles.statsBtnActive : {}) }} onClick={() => setShowStats(s => !s)}>
          {showStats ? "Hide stats" : "Stats"}
        </button>
        <div ref={exportRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="Export or share your collection" style={styles.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
          {showExport && headerVisible && exportDropdownContent}
        </div>
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={styles.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
        <button className="ui-tip ui-tip-below hdr-btn new-batch-btn" data-tip="Clear all and start over" style={styles.startOverBtn} onClick={() => setConfirmClear(true)}>New batch</button>
      </div>
    </div>
  );
}
