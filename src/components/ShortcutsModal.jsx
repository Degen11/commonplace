import { useEffect } from "react";
import { X } from "lucide-react";
import useScrollLock from "../hooks/useScrollLock";
import { styles } from "./styles";

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = IS_MAC ? "\u2318" : "Ctrl";

const SHORTCUTS = [
  { keys: ["Esc"], desc: "Close modal / clear selection / clear search (cascading)" },
  { keys: [`${MOD}+A`], desc: "Select all visible quotes" },
  { keys: ["Shift+Click"], desc: "Range select in table view" },
  { keys: ["Enter"], desc: "Save inline edit" },
  { keys: ["Esc"], desc: "Cancel inline edit" },
  { keys: ["Long press"], desc: "Select quote on mobile" },
];

export default function ShortcutsModal({ onClose }) {
  useScrollLock();

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      style={styles.modalOverlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--cp-bg-card)", borderRadius: 12, padding: 0,
        maxWidth: 420, width: "100%", overflow: "hidden",
        animation: "slideIn .2s ease",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px 12px", borderBottom: "1px solid var(--cp-border)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--cp-text-secondary)", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
            Keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4, borderRadius: 4 }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0",
              borderBottom: i < SHORTCUTS.length - 1 ? "1px solid var(--cp-border-light)" : "none",
            }}>
              <span style={{ fontSize: 13, color: "var(--cp-text-secondary)" }}>{s.desc}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {s.keys.map((k, j) => (
                  <kbd key={j} style={{
                    display: "inline-block",
                    padding: "2px 7px",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'DM Mono',monospace",
                    color: "var(--cp-text-secondary)",
                    background: "var(--cp-bg-tab)",
                    border: "1px solid var(--cp-border)",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}>
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
