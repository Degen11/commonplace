import { useState } from "react";
import useDropdownPosition from "../hooks/useDropdownPosition";
import { FloatingPortal } from "@floating-ui/react";
import Tooltip from "./Tooltip";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
  MoreHorizontal, BarChart3, Trash2,
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
  headerRef,
  headerVisible,
  exportDropdownContent,
  syncStatus,
  lastSynced,
  onManualSync,
  dark,
  toggleTheme,
  onShowShortcuts,
}) {
  const [showOverflow, setShowOverflow] = useState(false);

  const overflow = useDropdownPosition({ open: showOverflow, onClose: () => setShowOverflow(false) });
  const exportDrop = useDropdownPosition({ open: showExport && headerVisible, onClose: () => setShowExport(false) });

  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} />
        Commonplace
      </h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />
        <Tooltip tip={dark ? "Light mode" : "Dark mode"} placement="bottom">
          <button className="hdr-btn" style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={toggleTheme}>
            {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>
        </Tooltip>
        {!isMobile && (
          <div style={styles.viewTog}>
            <Tooltip tip="Table view" placement="bottom">
              <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
                <List size={16} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip tip="Compact view" placement="bottom">
              <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
                <AlignJustify size={16} strokeWidth={1.5} />
              </button>
            </Tooltip>
            <Tooltip tip="Card view" placement="bottom">
              <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={() => setView("cards")}>
                <LayoutGrid size={16} strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        )}
        <Tooltip tip="Export or share your collection" placement="bottom">
          <button ref={exportDrop.refs.setReference} className="hdr-btn" style={styles.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
        </Tooltip>
        {showExport && headerVisible && (
          <FloatingPortal>
            <div ref={exportDrop.refs.setFloating} style={{ ...exportDrop.floatingStyles, ...styles.expDrop }} {...exportDrop.getFloatingProps()}>
              {exportDropdownContent}
            </div>
          </FloatingPortal>
        )}
        <Tooltip tip="Add more quotes" placement="bottom">
          <button className="hdr-btn" style={styles.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
        </Tooltip>
        {/* Overflow menu */}
        <Tooltip tip="More actions" placement="bottom">
          <button ref={overflow.refs.setReference} className="hdr-btn" style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={() => setShowOverflow(!showOverflow)}>
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        {showOverflow && (
          <FloatingPortal>
            <div ref={overflow.refs.setFloating} style={{ ...overflow.floatingStyles, ...styles.hdrOverflowMenu }} {...overflow.getFloatingProps()}>
              <div style={styles.hdrOverflowSectionLabel}>View</div>
              <button className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => { setShowStats(s => !s); setShowOverflow(false); }}>
                <BarChart3 size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                {showStats ? "Hide full stats" : "Full stats"}
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
          </FloatingPortal>
        )}
      </div>
    </div>
  );
}
