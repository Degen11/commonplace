import Logo from "./Logo";
import { styles, syncPillStyles } from "./styles";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
} from "lucide-react";

const syncStyles = syncPillStyles.full;

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
  dark,
  toggleTheme,
  onShowShortcuts,
}) {
  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} /> Commonplace
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--cp-text-muted)", fontFamily: "'DM Sans',-apple-system,sans-serif", letterSpacing: 0 }}>
          {filtered.length < quotes.length
            ? <>{filtered.length} of {quotes.length}</>
            : <>{quotes.length} {quotes.length === 1 ? "entry" : "entries"}</>
          }
        </span>
      </h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {syncStatus === "syncing" && <span style={syncStyles.syncing}>Saving...</span>}
        {syncStatus === "synced" && <span style={syncStyles.synced}>Saved</span>}
        {syncStatus === "error" && <span style={syncStyles.error}>Sync error</span>}
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Keyboard shortcuts" style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={onShowShortcuts}>
          <HelpCircle size={16} strokeWidth={1.5} />
        </button>
        <button className="ui-tip ui-tip-below hdr-btn" data-tip={dark ? "Light mode" : "Dark mode"} style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={toggleTheme}>
          {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
        </button>
        {!isMobile && (
          <div style={styles.viewTog}>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Table view" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
              <List size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Compact view" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
              <AlignJustify size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below view-btn" data-tip="Card view" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={() => setView("cards")}>
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
