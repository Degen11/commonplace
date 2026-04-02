import { useState } from "react";
import { motion } from "motion/react";
import { Menu } from "@base-ui/react/menu";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";

import {
  List, AlignJustify, LayoutGrid, Moon, Sun, Monitor, CircleQuestionMark,
  Ellipsis, ChartColumn, Trash2, Gauge, MenuIcon, Plus,
} from "lucide-react";

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
            <button className="ui-tip ui-tip-below hdr-btn" data-tip={themeMode === "auto" ? "Auto (system)" : dark ? "Dark mode" : "Light mode"} style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={toggleTheme}>
              {themeMode === "auto" ? <Monitor size={16} strokeWidth={1.5} /> : dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            </button>
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
            {exportDropdownContent}
            <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={{ ...styles.addMoreBtn, ...(showAddMore ? { background: "var(--cp-bg-tab)", color: "var(--cp-accent)", borderColor: "var(--cp-accent)" } : {}) }} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
          </>
        )}

        {/* Mobile: add button + hamburger */}
        {isMobile && (
          <>
            <button
              className="hdr-btn"
              style={{ ...styles.addMoreBtn, padding: "7px 14px", fontSize: 13, minHeight: 40, display: "inline-flex", alignItems: "center", gap: 4, ...(showAddMore ? { background: "var(--cp-bg-tab)", color: "var(--cp-accent)", borderColor: "var(--cp-accent)" } : {}) }}
              onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}
            >
              <Plus size={15} strokeWidth={2} /> Add
            </button>
          </>
        )}

        {/* Overflow / hamburger menu — serves both mobile and desktop */}
        <Menu.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <Menu.Trigger className="ui-tip ui-tip-below hdr-btn" data-tip="More actions" style={{ ...styles.statsBtn, padding: isMobile ? "7px 10px" : "5px 8px" }}>
            {isMobile ? <MenuIcon size={18} strokeWidth={1.5} /> : <Ellipsis size={16} strokeWidth={1.5} />}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
              <Menu.Popup style={{
                background: "var(--cp-bg-card)", borderRadius: 6,
                boxShadow: "var(--cp-shadow-md)", border: "1px solid var(--cp-border)",
                minWidth: 200, padding: 4, animation: "menuIn .14s ease",
              }}>
                {/* Mobile-only: theme + view + export grouped here */}
                {isMobile && (
                  <>
                    <div style={styles.hdrOverflowSectionLabel}>Actions</div>
                    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={toggleTheme}>
                      {themeMode === "auto" ? <Monitor size={15} strokeWidth={1.5} color="var(--cp-text-muted)" /> : dark ? <Sun size={15} strokeWidth={1.5} color="var(--cp-text-muted)" /> : <Moon size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />}
                      {themeMode === "auto" ? "Auto (system)" : dark ? "Light mode" : "Dark mode"}
                    </Menu.Item>
                    <Menu.Separator style={styles.hdrOverflowDivider} />
                    <div style={styles.hdrOverflowSectionLabel}>Layout</div>
                    <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "table" && !compact ? { fontWeight: 600, color: "var(--cp-text)" } : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
                      <List size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                      Table view
                    </Menu.Item>
                    <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "table" && compact ? { fontWeight: 600, color: "var(--cp-text)" } : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
                      <AlignJustify size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                      Compact view
                    </Menu.Item>
                    <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "cards" ? { fontWeight: 600, color: "var(--cp-text)" } : {}) }} onClick={() => setView("cards")}>
                      <LayoutGrid size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                      Card view
                    </Menu.Item>
                    <Menu.Separator style={styles.hdrOverflowDivider} />
                  </>
                )}
                <div style={styles.hdrOverflowSectionLabel}>View</div>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowStats(s => !s)}>
                  <ChartColumn size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                  {showStats ? "Hide full stats" : "Full stats"}
                </Menu.Item>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowConfidence(v => !v)}>
                  <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
                  {showConfidence ? "Hide confidence" : "Show confidence"}
                </Menu.Item>
                <Menu.Separator style={styles.hdrOverflowDivider} />
                <div style={styles.hdrOverflowSectionLabel}>Preferences</div>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => onShowShortcuts()}>
                  <CircleQuestionMark size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                  Keyboard shortcuts
                </Menu.Item>
                <Menu.Separator style={styles.hdrOverflowDivider} />
                <div style={styles.hdrOverflowSectionLabel}>Data</div>
                <Menu.Item className="hdr-overflow-destructive" style={styles.hdrOverflowDestructive} onClick={() => setConfirmClear(true)}>
                  <Trash2 size={15} strokeWidth={1.5} />
                  New batch
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        {/* Desktop-only export dropdown (mobile gets it via hamburger) */}
        {isMobile && exportDropdownContent}
      </div>
    </div>
  );
}
