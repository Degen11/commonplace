import { useEffect, useRef, useState } from "react";
import { styles } from "./styles";
import { Search } from "lucide-react";

export default function CollectionDupeModal({ dupePairs, onClose, onDeleteQuote }) {
  const boxRef = useRef(null);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (dupePairs.length === 0) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    boxRef.current?.focus();
    return () => document.removeEventListener("keydown", h);
  }, [dupePairs.length, onClose]);

  if (dupePairs.length === 0) return null;

  const visible = dupePairs.filter((_, i) => !dismissed.has(i));
  const resolvedCount = dismissed.size;

  if (visible.length === 0) {
    // All resolved — auto-close after a brief moment
    setTimeout(onClose, 300);
    return null;
  }

  return (
    <div style={styles.dupeModalOverlay} role="dialog" aria-modal="true" aria-label="Duplicate scan results" onClick={onClose}>
      <div ref={boxRef} tabIndex={-1} style={{ ...styles.dupeModalBox, maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={styles.dupeModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Search size={22} color="var(--cp-text-secondary)" strokeWidth={1.5} />
            <div style={styles.dupeModalTitle}>Duplicates Found</div>
          </div>
          <div style={styles.dupeModalSub}>
            Found {dupePairs.length} {dupePairs.length === 1 ? "pair" : "pairs"} of similar entries in your collection.
            {resolvedCount > 0 && ` (${resolvedCount} resolved)`}
          </div>
        </div>

        <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {visible.map((pair) => {
            const originalIndex = dupePairs.indexOf(pair);
            return (
              <div key={originalIndex} style={{
                border: "1px solid var(--cp-border)",
                borderRadius: 14,
                marginBottom: 16,
                background: "var(--cp-bg-card)",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}>
                {/* Side-by-side comparison */}
                <div className="dupe-compare" style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid var(--cp-border)",
                }}>
                  <div style={{ padding: 16, borderRight: "1px solid var(--cp-border)" }}>
                    <div style={{ fontSize: 14, color: "var(--cp-text)", lineHeight: 1.5, marginBottom: 6 }}>
                      &ldquo;{pair.a.text}&rdquo;
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                      &mdash; {pair.a.source || "Unknown"}
                    </div>
                    {pair.a.category && pair.a.category !== "Unknown" && (
                      <div style={{ fontSize: 11, color: "var(--cp-text-faint)", marginTop: 4 }}>{pair.a.category}</div>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 14, color: "var(--cp-text)", lineHeight: 1.5, marginBottom: 6 }}>
                      &ldquo;{pair.b.text}&rdquo;
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                      &mdash; {pair.b.source || "Unknown"}
                    </div>
                    {pair.b.category && pair.b.category !== "Unknown" && (
                      <div style={{ fontSize: 11, color: "var(--cp-text-faint)", marginTop: 4 }}>{pair.b.category}</div>
                    )}
                  </div>
                </div>

                {/* Similarity score + actions */}
                <div style={{
                  display: "flex",
                  gap: 2,
                  padding: "8px 16px",
                  borderTop: "1px solid var(--cp-border)",
                  background: "var(--cp-bg-panel)",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, color: "var(--cp-text-faint)" }}>
                    {Math.round(pair.score * 100)}% similar
                  </span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button
                      onClick={() => { onDeleteQuote(pair.b.id); setDismissed(p => new Set([...p, originalIndex])); }}
                      style={{
                        padding: "6px 14px", borderRadius: "20px 0 0 20px", border: "none",
                        background: "#3C5775", color: "white",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        borderRight: "1px solid rgba(255,255,255,0.2)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2D4259"}
                      onMouseLeave={e => e.currentTarget.style.background = "#3C5775"}
                    >
                      Keep left
                    </button>
                    <button
                      onClick={() => { onDeleteQuote(pair.a.id); setDismissed(p => new Set([...p, originalIndex])); }}
                      style={{
                        padding: "6px 14px", borderRadius: 0, border: "none",
                        background: "#3C5775", color: "white",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        borderRight: "1px solid rgba(255,255,255,0.2)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2D4259"}
                      onMouseLeave={e => e.currentTarget.style.background = "#3C5775"}
                    >
                      Keep right
                    </button>
                    <button
                      onClick={() => setDismissed(p => new Set([...p, originalIndex]))}
                      style={{
                        padding: "6px 14px", borderRadius: "0 20px 20px 0", border: "none",
                        background: "var(--cp-bg-card)", color: "var(--cp-text)",
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--cp-bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--cp-bg-card)"}
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderTop: "1px solid var(--cp-border)",
          background: "var(--cp-bg-card)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 13,
            color: "var(--cp-text-secondary)",
            fontWeight: 600,
            background: "rgba(60,87,117,0.1)",
            padding: "4px 14px",
            borderRadius: 30,
          }}>
            {visible.length} {visible.length === 1 ? "pair" : "pairs"} remaining
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "8px 28px",
              borderRadius: 30,
              border: "none",
              background: "#3C5775",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#2D4259"}
            onMouseLeave={e => e.currentTarget.style.background = "#3C5775"}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
