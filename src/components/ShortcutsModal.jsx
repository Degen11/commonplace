import { X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { FONT_SANS } from "./styles";

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = IS_MAC ? "\u2318" : "Ctrl";

const SHORTCUTS = [
  { section: "Navigation" },
  { keys: ["J"], desc: "Select next quote" },
  { keys: ["K"], desc: "Select previous quote" },
  { keys: ["/"], desc: "Focus search" },
  { keys: ["?"], desc: "Toggle this panel" },
  { section: "Actions" },
  { keys: ["N"], desc: "Quick add a quote" },
  { keys: ["F"], desc: "Toggle favorite on selected" },
  { keys: ["D"], desc: "Delete selected" },
  { keys: [`${MOD}+A`], desc: "Select all visible quotes" },
  { keys: ["Shift+Click"], desc: "Range select in table view" },
  { section: "Editing" },
  { keys: ["Enter"], desc: "Save inline edit" },
  { keys: ["Esc"], desc: "Close / clear selection / clear search" },
  { keys: ["Long press"], desc: "Select quote on mobile" },
];

export default function ShortcutsModal({ onClose }) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: "fixed", inset: 0,
            background: "var(--cp-overlay)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            animation: "backdropBlurIn .2s ease-out",
          }}
        />
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
          pointerEvents: "none",
          animation: "modalScaleIn .2s ease-out",
        }}>
          <Dialog.Popup style={{
            background: "var(--cp-bg-card)", borderRadius: 6, padding: 0,
            maxWidth: "min(90vw, 420px)", width: "100%", overflow: "hidden",
            pointerEvents: "auto",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px 12px", borderBottom: "1px solid var(--cp-border)",
            }}>
              <Dialog.Title render={<h2 />} style={{ fontSize: 16, fontWeight: 700, color: "var(--cp-text-secondary)", fontFamily: FONT_SANS }}>
                Keyboard shortcuts
              </Dialog.Title>
              <Dialog.Close
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4, borderRadius: 4 }}
              >
                <X size={16} strokeWidth={2} />
              </Dialog.Close>
            </div>
            <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
              {SHORTCUTS.map((s, i) => s.section ? (
                <div key={i} style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "var(--cp-text-muted)", padding: i === 0 ? "0 0 6px" : "12px 0 6px",
                }}>
                  {s.section}
                </div>
              ) : (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0",
                  borderBottom: i < SHORTCUTS.length - 1 && !SHORTCUTS[i + 1].section ? "1px solid var(--cp-border-light)" : "none",
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
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
