import { useState } from "react";
import { X, Loader, Download } from "lucide-react";
import { generateShareImage, IMAGE_STYLES } from "../utils/shareImage";
import { downloadBlob } from "../utils/export";
import { Dialog } from "@base-ui/react/dialog";
import { FONT_SANS } from "./styles";

const STYLE_KEYS = Object.keys(IMAGE_STYLES);

export default function ShareImageModal({ quote, onClose, showToast }) {
  const [generating, setGenerating] = useState(null);

  const handleSelect = async (styleKey) => {
    setGenerating(styleKey);
    try {
      const blob = await generateShareImage(quote, styleKey);
      downloadBlob(blob, `commonplace-quote-${styleKey}.png`);
      showToast("Image saved!", null, null, "success");
      onClose();
    } catch {
      showToast("Couldn't generate image.", null, null, "error");
    } finally {
      setGenerating(null);
    }
  };

  const previewText = (quote.text || "").length > 60
    ? quote.text.slice(0, 60) + "\u2026"
    : (quote.text || "");

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: "fixed", inset: 0,
            background: "var(--cp-overlay)",
            zIndex: 1000,
            animation: "overlayFade .15s ease-out",
          }}
        />
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
          pointerEvents: "none",
        }}>
          <Dialog.Popup style={{
            background: "var(--cp-bg-card)", borderRadius: 6, padding: 0,
            maxWidth: "min(90vw, 480px)", width: "100%", overflow: "hidden",
            animation: "slideIn .2s ease",
            pointerEvents: "auto",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px 12px", borderBottom: "1px solid var(--cp-border)",
            }}>
              <Dialog.Title render={<h2 />} style={{ fontSize: 16, fontWeight: 700, color: "var(--cp-text-secondary)", fontFamily: FONT_SANS }}>
                Share as image
              </Dialog.Title>
              <Dialog.Close
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4, borderRadius: 4 }}
              >
                <X size={16} strokeWidth={2} />
              </Dialog.Close>
            </div>
            <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {STYLE_KEYS.map(key => {
                const theme = IMAGE_STYLES[key];
                const isGenerating = generating === key;
                return (
                  <button
                    key={key}
                    onClick={() => !generating && handleSelect(key)}
                    disabled={!!generating}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", borderRadius: 6,
                      border: "1px solid var(--cp-border)",
                      background: "var(--cp-bg-card)",
                      cursor: generating ? "wait" : "pointer",
                      opacity: generating && !isGenerating ? 0.5 : 1,
                      transition: "all .15s ease",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    className="dd-opt"
                  >
                    {/* Mini preview swatch */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 6, flexShrink: 0,
                      background: theme.bg, border: `1px solid ${theme.border}`,
                      display: "flex", flexDirection: "column", justifyContent: "center",
                      padding: "8px 10px", overflow: "hidden", position: "relative",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 3,
                        background: theme.accent,
                      }} />
                      {isGenerating && (
                        <div style={{
                          position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 4,
                        }}>
                          <Loader size={20} strokeWidth={2} color="#fff" className="spin" />
                        </div>
                      )}
                      <div style={{
                        fontSize: 8, fontStyle: "italic", color: theme.text,
                        lineHeight: 1.4, overflow: "hidden",
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}>
                        {previewText}
                      </div>
                      <div style={{
                        fontSize: 6, color: theme.attr, marginTop: 3,
                        fontFamily: FONT_SANS,
                      }}>
                        — {quote.source || "Unknown"}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cp-text-secondary)" }}>
                        {theme.label}
                      </div>
                      {isGenerating && (
                        <div style={{ fontSize: 11, color: "var(--cp-text-muted)", marginTop: 2 }}>
                          Generating image...
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, color: "var(--cp-text-muted)" }}>
                      {isGenerating
                        ? <Loader size={16} strokeWidth={2} className="spin" />
                        : <Download size={16} strokeWidth={1.5} />
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
