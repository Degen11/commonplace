// ── Theme toggle (icon button) ──
// Split out of HeaderControls.jsx, which imports Base UI's Menu: the landing
// page renders this button, and importing it from there put the whole Base UI
// chunk on the landing page's critical path.

import { Moon, Sun, Monitor } from "lucide-react";
import { styles } from "./styles";

// Icon for the current theme state (auto → monitor, dark → sun, light → moon)
export function themeIcon(themeMode, dark, size, color) {
  const props = color ? { size, strokeWidth: 1.5, color } : { size, strokeWidth: 1.5 };
  return themeMode === "auto" ? <Monitor {...props} /> : dark ? <Sun {...props} /> : <Moon {...props} />;
}

// Tooltip label shows the current mode
const themeTipLabel = (themeMode, dark) =>
  themeMode === "auto" ? "Auto (system)" : dark ? "Dark mode" : "Light mode";

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
