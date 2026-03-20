import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";

import {
  List, AlignJustify, LayoutGrid, Moon, Sun, HelpCircle,
  MoreHorizontal, BarChart3, Trash2, Gauge, MenuIcon, Plus,
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
  showConfidence,
  setShowConfidence,
  onShowShortcuts,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div ref={headerRef} style={{ ...styles.header, alignItems: "center" }}>
      <h1 style={{ ...styles.title, display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={28} />
        Commonplace
      </h1>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />

        {/* Desktop: show all buttons inline */}
        {!isMobile && (
          <>
            <button className="ui-tip ui-tip-below hdr-btn" data-tip={dark ? "Light mode" : "Dark mode"} style={{ ...styles.statsBtn, padding: "5px 8px" }} onClick={toggleTheme}>
              {dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
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
            <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={styles.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
          </>
        )}

        {/* Mobile: add button + hamburger */}
        {isMobile && (
          <>
            <button
              className="hdr-btn"
              style={{ ...styles.addMoreBtn, padding: "5px 10px" }}
              onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}
            >
              <Plus size={14} strokeWidth={2} />
            </button>
          </>
        )}

        {/* Overflow / hamburger menu — serves both mobile and desktop */}
        <Menu.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <Menu.Trigger className="ui-tip ui-tip-below hdr-btn" data-tip="More actions" style={{ ...styles.statsBtn, padding: "5px 8px" }}>
            {isMobile ? <MenuIcon size={16} strokeWidth={1.5} /> : <MoreHorizontal size={16} strokeWidth={1.5} />}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
              <Menu.Popup style={{
                background: "var(--cp-bg-card)", borderRadius: 6,
                boxShadow: "var(--cp-shadow-md)", border: "1px solid var(--cp-border)",
                minWidth: 200, padding: 4, animation: "menuIn .14s ease",
              }}>
                {/* Mobile-only: theme + export grouped here */}
                {isMobile && (
                  <>
                    <div style={styles.hdrOverflowSectionLabel}>Actions</div>
                    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={toggleTheme}>
                      {dark ? <Sun size={15} strokeWidth={1.5} color="var(--cp-text-muted)" /> : <Moon size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />}
                      {dark ? "Light mode" : "Dark mode"}
                    </Menu.Item>
                    <Menu.Separator style={styles.hdrOverflowDivider} />
                  </>
                )}
                <div style={styles.hdrOverflowSectionLabel}>View</div>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowStats(s => !s)}>
                  <BarChart3 size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                  {showStats ? "Hide full stats" : "Full stats"}
                </Menu.Item>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowConfidence(v => !v)}>
                  <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
                  {showConfidence ? "Hide confidence" : "Show confidence"}
                </Menu.Item>
                <Menu.Separator style={styles.hdrOverflowDivider} />
                <div style={styles.hdrOverflowSectionLabel}>Preferences</div>
                <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => onShowShortcuts()}>
                  <HelpCircle size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
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
