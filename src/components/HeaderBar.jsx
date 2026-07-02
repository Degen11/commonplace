import { useState } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import {
  ThemeToggleButton, ThemeMenuItem, ViewToggle, ViewMenuItems,
  HeaderOverflowMenu, OverflowSection, OverflowDivider,
  StatsMenuItem, ConfidenceMenuItem, ShortcutsMenuItem, NewBatchMenuItem,
} from "./HeaderControls";

import { Ellipsis, MenuIcon, Plus } from "lucide-react";

const pillStyles = syncPillStyles.full;

export default function HeaderBar({
  view, compact, setView, setCompact,
  showStats, setShowStats,
  showAddMore, setShowAddMore,
  isMobile,
  setConfirmClear,
  addMoreRef,
  headerRef,
  exportDropdownContent,
  syncStatus,
  lastSynced,
  onManualSync,
  dark,
  toggleTheme,
  themeMode,
  showConfidence,
  setShowConfidence,
  onShowShortcuts,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleAddMore = () => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); };
  const addMoreActive = showAddMore ? { background: "var(--cp-bg-tab)", color: "var(--cp-accent)", borderColor: "var(--cp-accent)" } : {};

  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <motion.h1 layoutId="app-logo" style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }} transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}>
        <Logo size={28} />
        Commonplace
      </motion.h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />

        {/* Desktop: show all buttons inline */}
        {!isMobile && (
          <>
            <ThemeToggleButton dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />
            <ViewToggle view={view} compact={compact} setView={setView} setCompact={setCompact} />
            {exportDropdownContent}
            <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={{ ...styles.addMoreBtn, ...addMoreActive }} onClick={toggleAddMore}>+ Add more</button>
          </>
        )}

        {/* Mobile: add button + hamburger */}
        {isMobile && (
          <button
            className="hdr-btn"
            style={{ ...styles.addMoreBtn, padding: "7px 14px", fontSize: 13, minHeight: 40, display: "inline-flex", alignItems: "center", gap: 4, ...addMoreActive }}
            onClick={toggleAddMore}
          >
            <Plus size={15} strokeWidth={2} /> Add
          </button>
        )}

        {/* Overflow / hamburger menu — serves both mobile and desktop */}
        <HeaderOverflowMenu
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          triggerTip="More actions"
          triggerStyle={{ ...styles.statsBtn, padding: isMobile ? "7px 10px" : "5px 8px" }}
          trigger={isMobile ? <MenuIcon size={18} strokeWidth={1.5} /> : <Ellipsis size={16} strokeWidth={1.5} />}
        >
          {/* Mobile-only: theme + view grouped here */}
          {isMobile && (
            <>
              <OverflowSection>Actions</OverflowSection>
              <ThemeMenuItem dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />
              <OverflowDivider />
              <OverflowSection>Layout</OverflowSection>
              <ViewMenuItems view={view} compact={compact} setView={setView} setCompact={setCompact} />
              <OverflowDivider />
            </>
          )}
          <OverflowSection>View</OverflowSection>
          <StatsMenuItem showStats={showStats} onClick={() => setShowStats(s => !s)} />
          <ConfidenceMenuItem showConfidence={showConfidence} setShowConfidence={setShowConfidence} />
          <OverflowDivider />
          <OverflowSection>Preferences</OverflowSection>
          <ShortcutsMenuItem onShowShortcuts={onShowShortcuts} />
          <OverflowDivider />
          <OverflowSection>Data</OverflowSection>
          <NewBatchMenuItem setConfirmClear={setConfirmClear} />
        </HeaderOverflowMenu>

        {/* Mobile-only export dropdown (desktop renders it inline in the toolbar above) */}
        {isMobile && exportDropdownContent}
      </div>
    </div>
  );
}
