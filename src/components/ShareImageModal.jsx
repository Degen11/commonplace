import { useState, useEffect } from "react";
import { X, Loader, Download } from "lucide-react";
import { generateShareImage, IMAGE_STYLES } from "../utils/shareImage";
import { downloadBlob } from "../utils/export";
import useScrollLock from "../hooks/useScrollLock";
import { styles } from "./styles";

const STYLE_KEYS = Object.keys(IMAGE_STYLES);

export default function ShareImageModal({ quote, onClose, showToast }) {
  useScrollLock();
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSelect = async (styleKey) => {
    setGenerating(styleKey);
    try {
      const blob = await generateShareImage(quote, styleKey);
      downloadBlob(blob, `commonplace-quote-${styleKey}.png`);
      showToast("Image saved!");
      onClose();
    } catch {
      showToast("Couldn't generate image.");
    } finally {
      setGenerating(null);
    }
  };

  const previewText = (quote.text || "").length > 60
    ? quote.text.slice(0, 60) + "\u2026"
    : (quote.text || "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share as image"
      style={styles.modalOverlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--cp-bg-card)", borderRadius: 12, padding: 0,
        maxWidth: 480, width: "100%", overflow: "hidden",
        animation: "slideIn .2s ease",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px 12px", borderBottom: "1px solid var(--cp-border)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--cp-text-secondary)", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
            Share as image
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4, borderRadius: 4 }}
          >
            <X size={16} strokeWidth={2} />
          </button>
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
                  padding: "12px 14px", borderRadius: 8,
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
                  <div style={{
                    fontSize: 8, fontStyle: "italic", color: theme.text,
                    lineHeight: 1.4, overflow: "hidden",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}>
                    {previewText}
                  </div>
                  <div style={{
                    fontSize: 6, color: theme.attr, marginTop: 3,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    — {quote.source || "Unknown"}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cp-text-secondary)" }}>
                    {theme.label}
                  </div>
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
      </div>
    </div>
  );
}
