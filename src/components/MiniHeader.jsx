import { Menu } from "@base-ui/react/menu";
import { List, AlignJustify, LayoutGrid, Moon, Sun, MoreHorizontal, BarChart3, HelpCircle, Trash2, Gauge } from "lucide-react";
import Logo from "./Logo";
import SyncPill from "./SyncPill";
import { styles, syncPillStyles } from "./styles";

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
  dark,
  toggleTheme,
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
          <SyncPill syncStatus={syncStatus} lastSynced={lastSynced} onManualSync={onManualSync} pillStyles={pillStyles} />
          {!isMobile && (
            <button className="hdr-btn" style={{ ...styles.statsBtn, fontSize: 11, padding: "4px 8px" }} onClick={toggleTheme}>
              {dark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
            </button>
          )}
          {!isMobile && (
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
          )}
          {!isMobile && exportDropdownContent}
          <button className="hdr-btn" style={{ ...styles.addMoreBtn, fontSize: 11, padding: isMobile ? "6px 12px" : "4px 10px", display: "inline-flex", alignItems: "center", gap: 3 }} onClick={() => { preserveScroll(); setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add</button>
          {/* Overflow menu */}
          <Menu.Root>
            <Menu.Trigger className="hdr-btn" style={{ ...styles.statsBtn, fontSize: 11, padding: isMobile ? "6px 8px" : "4px 8px" }}>
              <MoreHorizontal size={14} strokeWidth={1.5} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
                <Menu.Popup style={{
                  background: "var(--cp-bg-card)", borderRadius: 6,
                  boxShadow: "var(--cp-shadow-md)", border: "1px solid var(--cp-border)",
                  minWidth: 200, padding: 4, animation: "menuIn .14s ease",
                }}>
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
                  <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => { preserveScroll(); setShowStats(s => !s); }}>
                    <BarChart3 size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                    {showStats ? "Hide full stats" : "Full stats"}
                  </Menu.Item>
                  <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowConfidence(v => !v)}>
                    <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
                    {showConfidence ? "Hide confidence" : "Show confidence"}
                  </Menu.Item>
                  {isMobile && exportDropdownContent && (
                    <>
                      <Menu.Separator style={styles.hdrOverflowDivider} />
                      <div style={styles.hdrOverflowSectionLabel}>Export</div>
                      {exportDropdownContent}
                    </>
                  )}
                  {!isMobile && (
                    <>
                      <Menu.Separator style={styles.hdrOverflowDivider} />
                      <div style={styles.hdrOverflowSectionLabel}>Preferences</div>
                      <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => onShowShortcuts()}>
                        <HelpCircle size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
                        Keyboard shortcuts
                      </Menu.Item>
                    </>
                  )}
                  {setConfirmClear && (
                    <>
                      <Menu.Separator style={styles.hdrOverflowDivider} />
                      <div style={styles.hdrOverflowSectionLabel}>Data</div>
                      <Menu.Item className="hdr-overflow-destructive" style={styles.hdrOverflowDestructive} onClick={() => setConfirmClear(true)}>
                        <Trash2 size={15} strokeWidth={1.5} />
                        New batch
                      </Menu.Item>
                    </>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </div>
  );
}
