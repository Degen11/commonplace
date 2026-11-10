// ── Shared header controls ──
// Single source for the theme toggle, view toggle, and overflow-menu pieces
// that were previously duplicated across HeaderBar, MiniHeader, and InputPhase.
// HeaderBar and MiniHeader compose their menus from these building blocks —
// which sections appear (and in what order) intentionally differs between them.

import { Menu } from "@base-ui/react/menu";
import {
  List, AlignJustify, LayoutGrid,
  ChartColumn, CircleQuestionMark, Trash2, Gauge,
} from "lucide-react";
import { styles } from "./styles";
import { controlStyles } from "./headerControlsStyles";
import { Z } from "../data/constants";
import { ThemeToggleButton, themeIcon } from "./ThemeToggleButton";

// The icon-button theme toggle lives in its own module (no Base UI import) so
// the landing page can use it without loading the Menu chunk; re-exported here
// so the header code keeps one import site.
export { ThemeToggleButton };

// ── Theme toggle (overflow menu item variant) ──
// Label shows the mode a click switches to (except auto, which shows state)
export function ThemeMenuItem({ dark, themeMode, toggleTheme }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={controlStyles.hdrOverflowItem} onClick={toggleTheme}>
      {themeIcon(themeMode, dark, 15, "var(--cp-text-muted)")}
      {themeMode === "auto" ? "Auto (system)" : dark ? "Light mode" : "Dark mode"}
    </Menu.Item>
  );
}

// ── Table / compact / cards toggle group ──
// onSwitch runs before any view change (MiniHeader passes preserveScroll)
export function ViewToggle({ view, compact, setView, setCompact, iconSize = 16, withTips = true, onSwitch }) {
  const btnClass = withTips ? "ui-tip ui-tip-below view-btn" : "view-btn";
  const change = (apply) => () => { onSwitch?.(); apply(); };
  return (
    <div style={controlStyles.viewTog}>
      <button className={btnClass} data-tip={withTips ? "Table view" : undefined} aria-label="Table view" style={{ ...controlStyles.viewBtn, ...(view === "table" && !compact ? controlStyles.viewOn : {}) }} onClick={change(() => { setView("table"); setCompact(false); })}>
        <List size={iconSize} strokeWidth={1.5} />
      </button>
      <button className={btnClass} data-tip={withTips ? "Compact view" : undefined} aria-label="Compact view" style={{ ...controlStyles.viewBtn, ...(view === "table" && compact ? controlStyles.viewOn : {}) }} onClick={change(() => { setView("table"); setCompact(true); })}>
        <AlignJustify size={iconSize} strokeWidth={1.5} />
      </button>
      <button className={btnClass} data-tip={withTips ? "Card view" : undefined} aria-label="Card view" style={{ ...controlStyles.viewBtn, ...(view === "cards" ? controlStyles.viewOn : {}) }} onClick={change(() => setView("cards"))}>
        <LayoutGrid size={iconSize} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── Overflow menu shell: trigger + portal/positioner/popup boilerplate ──
// Pass open/onOpenChange for a controlled menu; omit for uncontrolled.
const menuPopupStyle = {
  background: "var(--cp-bg-card)", borderRadius: 6,
  boxShadow: "var(--cp-shadow-md)", border: "1px solid var(--cp-border)",
  minWidth: 200, padding: 4, animation: "menuIn .14s ease",
};

export function HeaderOverflowMenu({ open, onOpenChange, trigger, triggerTip, triggerStyle, children }) {
  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger
        className={triggerTip ? "ui-tip ui-tip-below hdr-btn" : "hdr-btn"}
        data-tip={triggerTip}
        aria-label={triggerTip || "More actions"}
        style={triggerStyle}
      >
        {trigger}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: Z.DROPDOWN }}>
          <Menu.Popup style={menuPopupStyle}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// ── Overflow menu building blocks ──
export function OverflowSection({ children }) {
  return <div style={controlStyles.hdrOverflowSectionLabel}>{children}</div>;
}

export function OverflowDivider() {
  return <Menu.Separator style={controlStyles.hdrOverflowDivider} />;
}

// View items for the mobile "Layout" section (active mode rendered bold)
export function ViewMenuItems({ view, compact, setView, setCompact, onSwitch }) {
  const active = { fontWeight: 600, color: "var(--cp-text)" };
  const pick = (nextView, nextCompact) => {
    onSwitch?.();
    setView(nextView);
    if (nextCompact !== undefined) setCompact(nextCompact);
  };
  return (
    <>
      <Menu.Item className="hdr-overflow-item" style={{ ...controlStyles.hdrOverflowItem, ...(view === "table" && !compact ? active : {}) }} onClick={() => pick("table", false)}>
        <List size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Table view
      </Menu.Item>
      <Menu.Item className="hdr-overflow-item" style={{ ...controlStyles.hdrOverflowItem, ...(view === "table" && compact ? active : {}) }} onClick={() => pick("table", true)}>
        <AlignJustify size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Compact view
      </Menu.Item>
      <Menu.Item className="hdr-overflow-item" style={{ ...controlStyles.hdrOverflowItem, ...(view === "cards" ? active : {}) }} onClick={() => pick("cards")}>
        <LayoutGrid size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Card view
      </Menu.Item>
    </>
  );
}

export function StatsMenuItem({ showStats, onClick }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={controlStyles.hdrOverflowItem} onClick={onClick}>
      <ChartColumn size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
      {showStats ? "Hide full stats" : "Full stats"}
    </Menu.Item>
  );
}

export function ConfidenceMenuItem({ showConfidence, setShowConfidence }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={controlStyles.hdrOverflowItem} onClick={() => setShowConfidence(v => !v)}>
      <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
      {showConfidence ? "Hide confidence" : "Show confidence"}
    </Menu.Item>
  );
}

export function ShortcutsMenuItem({ onShowShortcuts }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={controlStyles.hdrOverflowItem} onClick={() => onShowShortcuts()}>
      <CircleQuestionMark size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
      Keyboard shortcuts
    </Menu.Item>
  );
}

export function NewBatchMenuItem({ setConfirmClear }) {
  return (
    <Menu.Item className="hdr-overflow-destructive" style={controlStyles.hdrOverflowDestructive} onClick={() => setConfirmClear(true)}>
      <Trash2 size={15} strokeWidth={1.5} />
      New batch
    </Menu.Item>
  );
}

// The overflow menu's contents, shared by HeaderBar and the sticky MiniHeader
// so the two can't drift apart (they did once: the mobile redesign added a
// Layout section to HeaderBar only, which left the mini header with no way to
// switch views on mobile).
//
// - mobileExport: on mobile the mini header has no room for the export icon,
//   so it passes its export menu here to render as an Export section.
// - themeInline: the bar already shows a theme toggle button, so the menu
//   skips its desktop theme item.
// - onLayoutChange: called before a view switch (MiniHeader preserves scroll).
export function HeaderOverflowItems({
  isMobile,
  dark, themeMode, toggleTheme, themeInline = false,
  view, compact, setView, setCompact, onLayoutChange,
  showStats, onToggleStats,
  showConfidence, setShowConfidence,
  onShowShortcuts,
  setConfirmClear,
  mobileExport,
}) {
  return (
    <>
      {isMobile && (
        <>
          <OverflowSection>Actions</OverflowSection>
          <ThemeMenuItem dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />
          <OverflowDivider />
          <OverflowSection>Layout</OverflowSection>
          <ViewMenuItems view={view} compact={compact} setView={setView} setCompact={setCompact} onSwitch={onLayoutChange} />
          <OverflowDivider />
        </>
      )}
      <OverflowSection>View</OverflowSection>
      <StatsMenuItem showStats={showStats} onClick={onToggleStats} />
      <ConfidenceMenuItem showConfidence={showConfidence} setShowConfidence={setShowConfidence} />
      {isMobile && mobileExport && (
        <>
          <OverflowDivider />
          <OverflowSection>Export</OverflowSection>
          {mobileExport}
        </>
      )}
      {(!isMobile && !themeInline) || onShowShortcuts ? (
        <>
          <OverflowDivider />
          <OverflowSection>Preferences</OverflowSection>
          {!isMobile && !themeInline && <ThemeMenuItem dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />}
          {onShowShortcuts && <ShortcutsMenuItem onShowShortcuts={onShowShortcuts} />}
        </>
      ) : null}
      {setConfirmClear && (
        <>
          <OverflowDivider />
          <OverflowSection>Data</OverflowSection>
          <NewBatchMenuItem setConfirmClear={setConfirmClear} />
        </>
      )}
    </>
  );
}
