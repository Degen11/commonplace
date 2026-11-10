import { useState } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import Wordmark from "./Wordmark";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";
import { headerStyles } from "./headerBarStyles";
import { pluralize } from "../utils/helpers";
import { ViewToggle, HeaderOverflowMenu, HeaderOverflowItems } from "./HeaderControls";

import { Ellipsis, Plus, ChevronDown } from "lucide-react";

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
  onOpenCollections,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleAddMore = () => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); };
  const addMoreActive = showAddMore ? headerStyles.addMoreBtnActive : {};

  return (
    <div ref={headerRef} style={headerStyles.header}>
      <div style={headerStyles.headerTop}>
      <motion.h1 layoutId="app-logo" style={{ ...headerStyles.title, display: "flex", alignItems: "center", gap: 8 }} transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}>
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

        {/* Mobile: export as an icon (Add lives in a floating button, see ResultsPhase) */}
        {isMobile && exportDropdownContent}

        {/* Overflow / hamburger menu — serves both mobile and desktop */}
        <HeaderOverflowMenu
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          triggerTip="More actions"
          triggerStyle={isMobile ? styles.hdrIconBtn : headerStyles.hdrGhostBtn}
          trigger={<Ellipsis size={isMobile ? 19 : 16} strokeWidth={1.75} />}
        >
          <HeaderOverflowItems
            isMobile={isMobile}
            dark={dark} themeMode={themeMode} toggleTheme={toggleTheme}
            view={view} compact={compact} setView={setView} setCompact={setCompact}
            showStats={showStats} onToggleStats={() => setShowStats(s => !s)}
            showConfidence={showConfidence} setShowConfidence={setShowConfidence}
            onShowShortcuts={onShowShortcuts}
            setConfirmClear={setConfirmClear}
          />
        </HeaderOverflowMenu>
      </div>
      </div>
      <div style={headerStyles.collectionHead}>
        {isMobile && onOpenCollections
          ? (
            <h2 style={headerStyles.collectionTitle}>
              <button style={{ ...headerStyles.collectionSwitch, font: "inherit", letterSpacing: "inherit" }} onClick={onOpenCollections} aria-label={`${collectionTitle}, switch collection`}>
                {collectionTitle} <ChevronDown size={20} strokeWidth={2} aria-hidden="true" style={{ color: "var(--cp-text-muted)", flexShrink: 0 }} />
              </button>
            </h2>
          )
          : <h2 style={headerStyles.collectionTitle}>{collectionTitle}</h2>}
        <span style={headerStyles.collectionMeta}>
          {pluralize(quoteCount, "quote")}
          {sourceCount > 0 && <> · {pluralize(sourceCount, "source")}</>}
        </span>
      </div>
      {notice}
    </div>
  );
}
