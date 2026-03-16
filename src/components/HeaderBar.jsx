import { useState, useRef } from "react";
import useClickOutside from "../hooks/useClickOutside";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
  MoreHorizontal, BarChart3, Trash2, Gauge,
} from "lucide-react";

const pillStyles = syncPillStyles.full;

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
  showConfidence,
  setShowConfidence,
  onShowShortcuts,
}) {
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef(null);

  useClickOutside(overflowRef, showOverflow, () => setShowOverflow(false));

  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} />
        Commonplace
      </h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />
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
        <div ref={exportRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="Export or share your collection" style={styles.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
          {showExport && headerVisible && exportDropdownContent}
        </div>
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={styles.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
        {/* Overflow menu */}
        <div ref={overflowRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="More actions" style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={() => setShowOverflow(!showOverflow)}>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {showOverflow && (
            <div style={styles.hdrOverflowMenu}>
              <div style={styles.hdrOverflowSectionLabel}>View</div>
              <button className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => { setShowStats(s => !s); setShowOverflow(false); }}>
                <BarChart3 size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                {showStats ? "Hide full stats" : "Full stats"}
              </button>
              <button className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => { setShowConfidence(v => !v); setShowOverflow(false); }}>
                <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
                {showConfidence ? "Hide confidence" : "Show confidence"}
              </button>
              <div style={styles.hdrOverflowDivider} />
              <div style={styles.hdrOverflowSectionLabel}>Preferences</div>
              <button className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => { onShowShortcuts(); setShowOverflow(false); }}>
                <HelpCircle size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                Keyboard shortcuts
              </button>
              <div style={styles.hdrOverflowDivider} />
              <div style={styles.hdrOverflowSectionLabel}>Data</div>
              <button className="hdr-overflow-destructive" style={styles.hdrOverflowDestructive} onClick={() => { setConfirmClear(true); setShowOverflow(false); }}>
                <Trash2 size={15} strokeWidth={1.5} />
                New batch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
