import { List, AlignJustify, LayoutGrid, Moon, Sun } from "lucide-react";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import ExportDropdown from "./ExportDropdown";
import { styles, syncPillStyles } from "./styles";

const pillStyles = syncPillStyles.mini;

export default function MiniHeader({
  view, setView, compact, setCompact,
  showStats, setShowStats,
  showExport, setShowExport,
  showAddMore, setShowAddMore,
  addMoreRef, miniExportRef,
  preserveScroll,
  quotes, filtered, selected, hasActiveFilters,
  showToast, collections,
  syncStatus,
  lastSynced,
  onManualSync,
  dark,
  toggleTheme,
}) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--cp-mini-bg)", borderBottom: "1px solid var(--cp-border)",
      backdropFilter: "blur(8px)", animation: "slideD .15s ease",
    }}>
      <div style={{ maxWidth: 1120, width: "100%", padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Logo size={16} />
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700, color: "var(--cp-text-secondary)" }}>Commonplace</span>
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />
          <div style={styles.viewTog}>
            <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={() => { preserveScroll(); setView("table"); setCompact(false); }}>
              <List size={14} strokeWidth={1.5} />
            </button>
            <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={() => { preserveScroll(); setView("table"); setCompact(true); }}>
              <AlignJustify size={14} strokeWidth={1.5} />
            </button>
            <button className="view-btn" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={() => { preserveScroll(); setView("cards"); }}>
              <LayoutGrid size={14} strokeWidth={1.5} />
            </button>
          </div>
          <button className="hdr-btn" style={{ ...styles.statsBtn, fontSize: 11, padding: "4px 10px", ...(showStats ? styles.statsBtnActive : {}) }} onClick={() => { preserveScroll(); setShowStats(s => !s); }}>Stats</button>
          <div ref={miniExportRef} style={{ position: "relative" }}>
            <button className="hdr-btn" style={{ ...styles.exportBtn, fontSize: 11, padding: "4px 10px" }} onClick={() => setShowExport(!showExport)}>Export &darr;</button>
            {showExport && (
              <ExportDropdown
                quotes={quotes}
                filtered={filtered}
                selected={selected}
                hasActiveFilters={hasActiveFilters}
                showToast={showToast}
                setShowExport={setShowExport}
                collections={collections}
              />
            )}
          </div>
          <button className="hdr-btn" style={{ ...styles.statsBtn, fontSize: 11, padding: "4px 8px" }} onClick={toggleTheme}>
            {dark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
          </button>
          <button className="hdr-btn" style={{ ...styles.addMoreBtn, fontSize: 11, padding: "4px 10px" }} onClick={() => { preserveScroll(); setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
