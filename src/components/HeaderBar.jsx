import { useState } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import Wordmark from "./Wordmark";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import { pluralize } from "../utils/helpers";
import {
  ThemeMenuItem, ViewToggle, ViewMenuItems,
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
  onOpenSync,
  dark,
  toggleTheme,
  themeMode,
  showConfidence,
  setShowConfidence,
  onShowShortcuts,
  collectionTitle,
  quoteCount,
  sourceCount,
  notice,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleAddMore = () => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); };
  const addMoreActive = showAddMore ? styles.addMoreBtnActive : {};

  return (
    <div ref={headerRef} style={styles.header}>
      <div style={styles.headerTop}>
      <motion.h1 layoutId="app-logo" style={{ ...styles.title, display: "flex", alignItems: "center", gap: 8 }} transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}>
        <Logo size={22} />
        <Wordmark height={20} color="var(--cp-text-secondary)" />
      </motion.h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} onOpenSync={onOpenSync} pillStyles={pillStyles} />

        {/* Desktop: show all buttons inline */}
        {!isMobile && (
          <>
            <ViewToggle view={view} compact={compact} setView={setView} setCompact={setCompact} />
            {exportDropdownContent}
            <button className="hdr-btn hdr-primary" aria-expanded={showAddMore} style={{ ...styles.addMoreBtn, ...addMoreActive }} onClick={toggleAddMore}><Plus size={14} strokeWidth={2} /> Add quotes</button>
          </>
        )}

        {/* Mobile: add button + hamburger */}
        {isMobile && (
          <button
            className="hdr-btn hdr-primary"
            aria-expanded={showAddMore}
            style={{ ...styles.addMoreBtn, padding: "7px 14px", fontSize: 13, minHeight: 40, ...addMoreActive }}
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
          triggerStyle={isMobile ? { ...styles.statsBtn, padding: "7px 10px" } : styles.hdrGhostBtn}
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
          {!isMobile && <ThemeMenuItem dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />}
          <ShortcutsMenuItem onShowShortcuts={onShowShortcuts} />
          <OverflowDivider />
          <OverflowSection>Data</OverflowSection>
          <NewBatchMenuItem setConfirmClear={setConfirmClear} />
        </HeaderOverflowMenu>

        {/* Mobile-only export dropdown (desktop renders it inline in the toolbar above) */}
        {isMobile && exportDropdownContent}
      </div>
      </div>
      <div style={styles.collectionHead}>
        <h2 style={styles.collectionTitle}>{collectionTitle}</h2>
        <span style={styles.collectionMeta}>
          {pluralize(quoteCount, "quote")}
          {sourceCount > 0 && <> · {pluralize(sourceCount, "source")}</>}
        </span>
      </div>
      {notice}
    </div>
  );
}
