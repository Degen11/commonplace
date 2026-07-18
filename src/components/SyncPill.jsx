import { useState } from "react";
import { RefreshCw } from "lucide-react";

function formatRelativeTime(date) {
  if (!date) return null;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function SyncPill({ syncStatus, lastSynced, onManualSync, onOpenSync, pillStyles }) {
  const [hovered, setHovered] = useState(false);

  if (syncStatus === "idle") return null;

  const isError = syncStatus === "error";
  const isSyncing = syncStatus === "syncing";
  const isSynced = syncStatus === "synced";

  // Clicking the pill opens the sync panel (device linking + retry) when available;
  // otherwise the error pill falls back to an immediate retry.
  const onClick = onOpenSync || (isError ? onManualSync : undefined);
  const interactive = !!onClick;

  const baseStyle = isSyncing ? pillStyles.syncing
    : isSynced ? pillStyles.synced
    : pillStyles.error;

  const style = {
    ...baseStyle,
    ...(interactive ? { cursor: "pointer" } : {}),
    ...(isError ? { border: "none" } : {}),
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  };

  const label = isSyncing ? "Saving..."
    : isError ? "Sync error"
    : "Saved";

  const tooltip = onOpenSync
    ? (isError ? "Sync failed — open sync options" : "Cloud sync — link a device")
    : isError
    ? "Click to retry"
    : isSyncing
    ? "Saving changes\u2026"
    : lastSynced
    ? `Last saved ${formatRelativeTime(lastSynced)}`
    : null;

  // Interactive states render a real <button> so the action is reachable by
  // keyboard and announced by screen readers; otherwise stay a plain <span>.
  const Pill = interactive ? "button" : "span";
  const ariaLabel = onOpenSync
    ? (isError ? "Sync failed — open cloud sync options" : "Cloud sync options")
    : "Sync failed — retry";

  return (
    <Pill
      style={style}
      aria-live="polite"
      aria-atomic="true"
      {...(interactive ? { type: "button", "aria-label": ariaLabel } : {})}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {isError && <RefreshCw size={10} strokeWidth={2} />}
      {label}
      {hovered && tooltip && (
        <span style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: 11,
          fontWeight: 500,
          color: "#fff",
          background: "var(--cp-toast-bg)",
          padding: "4px 10px",
          borderRadius: 6,
          zIndex: 200,
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          {tooltip}
        </span>
      )}
    </Pill>
  );
}
