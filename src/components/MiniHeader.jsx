import { List, AlignJustify, LayoutGrid } from "lucide-react";
import Logo from "./Logo";
import ExportDropdown from "./ExportDropdown";
import { Z } from "./styles";

const syncPill = {
  fontSize: 10,
  fontWeight: 500,
  padding: "1px 6px",
  borderRadius: 4,
  fontFamily: "'DM Sans', sans-serif",
  letterSpacing: 0.2,
  lineHeight: "14px",
  whiteSpace: "nowrap",
  alignSelf: "center",
};

const syncStyles = {
  syncing: { ...syncPill, color: "#9B9A97", background: "#F1F1EF" },
  synced:  { ...syncPill, color: "#16A34A", background: "#F0FDF4" },
  error:   { ...syncPill, color: "#DC2626", background: "#FEF2F2" },
};

export default function MiniHeader({
  view, setView, compact, setCompact,
  showStats, setShowStats,
  showExport, setShowExport,
  showAddMore, setShowAddMore,
  addMoreRef, miniExportRef,
  preserveScroll,
  quotes, filtered, selected, hasActiveFilters,
  showToast,
  syncStatus,
}) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(250,248,244,0.95)", borderBottom: "1px solid #E3E2DE",
      backdropFilter: "blur(8px)", animation: "slideD .15s ease",
    }}>
      <div style={{ maxWidth: 1120, width: "100%", padding: "8px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Logo size={16} />
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700, color: "#37352F" }}>Commonplace</span>
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {syncStatus === "syncing" && <span style={syncStyles.syncing}>Saving...</span>}
          {syncStatus === "synced" && <span style={syncStyles.synced}>Saved</span>}
          {syncStatus === "error" && <span style={syncStyles.error}>Sync error</span>}
          <div style={Z.viewTog}>
            <button style={{ ...Z.viewBtn, ...(view === "table" && !compact ? Z.viewOn : {}) }} onClick={() => { preserveScroll(); setView("table"); setCompact(false); }}>
              <List size={14} strokeWidth={1.5} />
            </button>
            <button style={{ ...Z.viewBtn, ...(view === "table" && compact ? Z.viewOn : {}) }} onClick={() => { preserveScroll(); setView("table"); setCompact(true); }}>
              <AlignJustify size={14} strokeWidth={1.5} />
            </button>
            <button style={{ ...Z.viewBtn, ...(view === "cards" ? Z.viewOn : {}) }} onClick={() => { preserveScroll(); setView("cards"); }}>
              <LayoutGrid size={14} strokeWidth={1.5} />
            </button>
          </div>
          <button className="hdr-btn" style={{ ...Z.statsBtn, fontSize: 11, padding: "4px 10px", ...(showStats ? Z.statsBtnActive : {}) }} onClick={() => { preserveScroll(); setShowStats(s => !s); }}>Stats</button>
          <div ref={miniExportRef} style={{ position: "relative" }}>
            <button className="hdr-btn" style={{ ...Z.exportBtn, fontSize: 11, padding: "4px 10px" }} onClick={() => setShowExport(!showExport)}>Export &darr;</button>
            {showExport && (
              <ExportDropdown
                quotes={quotes}
                filtered={filtered}
                selected={selected}
                hasActiveFilters={hasActiveFilters}
                showToast={showToast}
                setShowExport={setShowExport}
              />
            )}
          </div>
          <button className="hdr-btn" style={{ ...Z.addMoreBtn, fontSize: 11, padding: "4px 10px" }} onClick={() => { preserveScroll(); setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
