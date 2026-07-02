// ── Shared header controls ──
// Single source for the theme toggle, view toggle, and overflow-menu pieces
// that were previously duplicated across HeaderBar, MiniHeader, and InputPhase.
// HeaderBar and MiniHeader compose their menus from these building blocks —
// which sections appear (and in what order) intentionally differs between them.

import { Menu } from "@base-ui/react/menu";
import {
  List, AlignJustify, LayoutGrid, Moon, Sun, Monitor,
  ChartColumn, CircleQuestionMark, Trash2, Gauge,
} from "lucide-react";
import { styles } from "./styles";
import { Z } from "../data/constants";

// Icon for the current theme state (auto → monitor, dark → sun, light → moon)
function themeIcon(themeMode, dark, size, color) {
  const props = color ? { size, strokeWidth: 1.5, color } : { size, strokeWidth: 1.5 };
  return themeMode === "auto" ? <Monitor {...props} /> : dark ? <Sun {...props} /> : <Moon {...props} />;
}

// Tooltip label shows the current mode
const themeTipLabel = (themeMode, dark) =>
  themeMode === "auto" ? "Auto (system)" : dark ? "Dark mode" : "Light mode";

// ── Theme toggle (icon button variant) ──
export function ThemeToggleButton({ dark, themeMode, toggleTheme, iconSize = 16, withTip = true, style }) {
  const label = themeTipLabel(themeMode, dark);
  return (
    <button
      className={withTip ? "ui-tip ui-tip-below hdr-btn" : "hdr-btn"}
      data-tip={withTip ? label : undefined}
      aria-label={label}
      style={{ ...styles.statsBtn, padding: "5px 8px", ...style }}
      onClick={toggleTheme}
    >
      {themeIcon(themeMode, dark, iconSize)}
    </button>
  );
}

// ── Theme toggle (overflow menu item variant) ──
// Label shows the mode a click switches to (except auto, which shows state)
export function ThemeMenuItem({ dark, themeMode, toggleTheme }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={toggleTheme}>
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
    <div style={styles.viewTog}>
      <button className={btnClass} data-tip={withTips ? "Table view" : undefined} aria-label="Table view" style={{ ...styles.viewBtn, ...(view === "table" && !compact ? styles.viewOn : {}) }} onClick={change(() => { setView("table"); setCompact(false); })}>
        <List size={iconSize} strokeWidth={1.5} />
      </button>
      <button className={btnClass} data-tip={withTips ? "Compact view" : undefined} aria-label="Compact view" style={{ ...styles.viewBtn, ...(view === "table" && compact ? styles.viewOn : {}) }} onClick={change(() => { setView("table"); setCompact(true); })}>
        <AlignJustify size={iconSize} strokeWidth={1.5} />
      </button>
      <button className={btnClass} data-tip={withTips ? "Card view" : undefined} aria-label="Card view" style={{ ...styles.viewBtn, ...(view === "cards" ? styles.viewOn : {}) }} onClick={change(() => setView("cards"))}>
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
  return <div style={styles.hdrOverflowSectionLabel}>{children}</div>;
}

export function OverflowDivider() {
  return <Menu.Separator style={styles.hdrOverflowDivider} />;
}

// View items for the mobile "Layout" section (active mode rendered bold)
export function ViewMenuItems({ view, compact, setView, setCompact }) {
  const active = { fontWeight: 600, color: "var(--cp-text)" };
  return (
    <>
      <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "table" && !compact ? active : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
        <List size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Table view
      </Menu.Item>
      <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "table" && compact ? active : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
        <AlignJustify size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Compact view
      </Menu.Item>
      <Menu.Item className="hdr-overflow-item" style={{ ...styles.hdrOverflowItem, ...(view === "cards" ? active : {}) }} onClick={() => setView("cards")}>
        <LayoutGrid size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
        Card view
      </Menu.Item>
    </>
  );
}

export function StatsMenuItem({ showStats, onClick }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={onClick}>
      <ChartColumn size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
      {showStats ? "Hide full stats" : "Full stats"}
    </Menu.Item>
  );
}

export function ConfidenceMenuItem({ showConfidence, setShowConfidence }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => setShowConfidence(v => !v)}>
      <Gauge size={15} strokeWidth={1.5} color={showConfidence ? "var(--cp-conf-medium)" : "var(--cp-text-muted)"} />
      {showConfidence ? "Hide confidence" : "Show confidence"}
    </Menu.Item>
  );
}

export function ShortcutsMenuItem({ onShowShortcuts }) {
  return (
    <Menu.Item className="hdr-overflow-item" style={styles.hdrOverflowItem} onClick={() => onShowShortcuts()}>
      <CircleQuestionMark size={15} strokeWidth={1.5} color="var(--cp-text-muted)" />
      Keyboard shortcuts
    </Menu.Item>
  );
}

export function NewBatchMenuItem({ setConfirmClear }) {
  return (
    <Menu.Item className="hdr-overflow-destructive" style={styles.hdrOverflowDestructive} onClick={() => setConfirmClear(true)}>
      <Trash2 size={15} strokeWidth={1.5} />
      New batch
    </Menu.Item>
  );
}
