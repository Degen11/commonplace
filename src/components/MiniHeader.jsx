import { Ellipsis } from "lucide-react";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import {
  ThemeToggleButton, ThemeMenuItem, ViewToggle,
  HeaderOverflowMenu, OverflowSection, OverflowDivider,
  StatsMenuItem, ConfidenceMenuItem, ShortcutsMenuItem, NewBatchMenuItem,
} from "./HeaderControls";

const pillStyles = syncPillStyles.mini;

export default function MiniHeader({
  view, setView, compact, setCompact,
  showStats, setShowStats,
  showAddMore, setShowAddMore,
  addMoreRef,
  exportDropdownContent,
  preserveScroll,
  syncStatus,
  lastSynced,
  onManualSync,
  onOpenSync,
  dark,
  toggleTheme,
  themeMode,
  showConfidence,
  setShowConfidence,
  setConfirmClear,
  onShowShortcuts,
  isMobile,
}) {
  return (
    <div className="mini-header-glass" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--cp-mini-bg)", borderBottom: "1px solid var(--cp-border)",
      backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)",
      boxShadow: "0 1px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.3s ease",
      animation: "miniHeaderIn .4s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      <div style={{ maxWidth: 1120, width: "100%", padding: isMobile ? "8px 16px" : "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Logo size={16} />
          {!isMobile && <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700, color: "var(--cp-text-secondary)" }}>Commonplace</span>}
        </span>
        <div style={{ display: "flex", gap: isMobile ? 4 : 6, alignItems: "center" }}>
          <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} onOpenSync={onOpenSync} pillStyles={pillStyles} />
          {!isMobile && (
            <ThemeToggleButton dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} withTip={false} iconSize={14} style={{ fontSize: 11, padding: "4px 8px" }} />
          )}
          {!isMobile && (
            <ViewToggle view={view} compact={compact} setView={setView} setCompact={setCompact} iconSize={14} withTips={false} onSwitch={preserveScroll} />
          )}
          {!isMobile && exportDropdownContent}
          <button className="hdr-btn" style={{ ...styles.addMoreBtn, fontSize: 11, padding: isMobile ? "6px 12px" : "4px 10px", display: "inline-flex", alignItems: "center", gap: 3 }} onClick={() => { preserveScroll(); setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add</button>
          {/* Overflow menu */}
          <HeaderOverflowMenu
            triggerStyle={{ ...styles.statsBtn, fontSize: 11, padding: isMobile ? "6px 8px" : "4px 8px" }}
            trigger={<Ellipsis size={14} strokeWidth={1.5} />}
          >
            {isMobile && (
              <>
                <OverflowSection>Actions</OverflowSection>
                <ThemeMenuItem dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />
                <OverflowDivider />
              </>
            )}
            <OverflowSection>View</OverflowSection>
            <StatsMenuItem showStats={showStats} onClick={() => { preserveScroll(); setShowStats(s => !s); }} />
            <ConfidenceMenuItem showConfidence={showConfidence} setShowConfidence={setShowConfidence} />
            {isMobile && exportDropdownContent && (
              <>
                <OverflowDivider />
                <OverflowSection>Export</OverflowSection>
                {exportDropdownContent}
              </>
            )}
            {!isMobile && (
              <>
                <OverflowDivider />
                <OverflowSection>Preferences</OverflowSection>
                <ShortcutsMenuItem onShowShortcuts={onShowShortcuts} />
              </>
            )}
            {setConfirmClear && (
              <>
                <OverflowDivider />
                <OverflowSection>Data</OverflowSection>
                <NewBatchMenuItem setConfirmClear={setConfirmClear} />
              </>
            )}
          </HeaderOverflowMenu>
        </div>
      </div>
    </div>
  );
}
