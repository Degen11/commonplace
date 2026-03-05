import { useEffect, useRef } from "react";
import { styles } from "./styles";
import { Search } from "lucide-react";

export default function DupeModal({ pendingDupes, dupeDecisions, setDupeDecisions, onContinue }) {
  const boxRef = useRef(null);

  // ESC to close + trap focus
  useEffect(() => {
    if (pendingDupes.length === 0) return;
    const h = (e) => { if (e.key === "Escape") onContinue(); };
    document.addEventListener("keydown", h);
    // Focus the modal box so screen readers announce it
    boxRef.current?.focus();
    return () => document.removeEventListener("keydown", h);
  }, [pendingDupes.length, onContinue]);

  if (pendingDupes.length === 0) return null;

  const keptCount = Object.values(dupeDecisions).filter(d => d === "keep" || d === "merge").length;

  return (
    <div style={styles.dupeModalOverlay} role="dialog" aria-modal="true" aria-label="Duplicate detection" onClick={onContinue}>
      <div ref={boxRef} tabIndex={-1} style={{ ...styles.dupeModalBox, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={styles.dupeModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Search size={22} color="#3C5775" strokeWidth={1.5} />
            <div style={styles.dupeModalTitle}>Possible Duplicates Detected</div>
          </div>
          <div style={styles.dupeModalSub}>
            We found {pendingDupes.length} {pendingDupes.length === 1 ? "entry" : "entries"} similar to ones already in your collection.
          </div>
        </div>

        <div style={{ ...styles.dupeList, padding: "16px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {pendingDupes.map((dupe, i) => {
            const decision = dupeDecisions[i];
            const isKeep = decision === "keep";
            const isMerge = decision === "merge";
            const isSkip = decision === "skip";

            return (
              <div key={i} style={{
                border: "1px solid var(--cp-border)",
                borderRadius: 14,
                marginBottom: 16,
                background: "var(--cp-bg-card)",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}>
                {/* Comparison header */}
                <div className="dupe-compare" style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid var(--cp-border)",
                  background: "var(--cp-bg-panel)",
                }}>
                  <div style={{
                    padding: "10px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--cp-text-muted)",
                    letterSpacing: 0.5,
                    borderRight: "1px solid var(--cp-border)",
                  }}>
                    EXISTING
                  </div>
                  <div style={{
                    padding: "10px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--cp-text-muted)",
                    letterSpacing: 0.5,
                  }}>
                    NEW
                  </div>
                </div>

                {/* Content */}
                <div className="dupe-compare" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxHeight: 200, overflowY: "auto" }}>
                  <div style={{
                    padding: 16,
                    background: "var(--cp-bg-panel)",
                    borderRight: "1px solid var(--cp-border)",
                  }}>
                    <div style={{ fontSize: 14, color: "var(--cp-text)", lineHeight: 1.5, marginBottom: 6 }}>
                      "{dupe.matchedText}"
                    </div>
                    {dupe.matchedSource && (
                      <div style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                        — {dupe.matchedSource}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 16, background: "var(--cp-bg-card)" }}>
                    <div style={{ fontSize: 14, color: "var(--cp-text)", lineHeight: 1.5, marginBottom: 6 }}>
                      "{dupe.incoming.text}"
                    </div>
                    {dupe.incoming.hint && (
                      <div style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                        — {dupe.incoming.hint}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: "flex",
                  gap: 2,
                  padding: "8px 16px",
                  borderTop: "1px solid var(--cp-border)",
                  background: "var(--cp-bg-panel)",
                  justifyContent: "flex-end",
                }}>
                  <button
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "keep" }))}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "20px 0 0 20px",
                      border: "none",
                      background: isKeep ? "#3C5775" : "var(--cp-bg-card)",
                      color: isKeep ? "white" : "var(--cp-text)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      borderRight: "1px solid var(--cp-border)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => !isKeep && (e.currentTarget.style.background = "rgba(60,87,117,0.1)")}
                    onMouseLeave={e => !isKeep && (e.currentTarget.style.background = "var(--cp-bg-card)")}
                  >
                    ✓ Keep
                  </button>
                  {dupe.matchedSource && dupe.incoming.hint && dupe.matchedSource !== dupe.incoming.hint && (
                    <button
                      onClick={() => setDupeDecisions(p => ({ ...p, [i]: "merge" }))}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 0,
                        border: "none",
                        background: isMerge ? "#059669" : "var(--cp-bg-card)",
                        color: isMerge ? "white" : "var(--cp-text)",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        borderRight: "1px solid var(--cp-border)",
                        transition: "all 0.15s ease",
                      }}
                      className="ui-tip"
                      data-tip="Keep new entry, combine sources"
                      onMouseEnter={e => !isMerge && (e.currentTarget.style.background = "rgba(5,150,105,0.1)")}
                      onMouseLeave={e => !isMerge && (e.currentTarget.style.background = "var(--cp-bg-card)")}
                    >
                      ↻ Merge
                    </button>
                  )}
                  <button
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "skip" }))}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "0 20px 20px 0",
                      border: "none",
                      background: isSkip ? "#9B9A97" : "var(--cp-bg-card)",
                      color: isSkip ? "white" : "var(--cp-text)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => !isSkip && (e.currentTarget.style.background = "rgba(155,154,151,0.1)")}
                    onMouseLeave={e => !isSkip && (e.currentTarget.style.background = "var(--cp-bg-card)")}
                  >
                    ✕ Skip
                  </button>
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
            color: "#3C5775",
            fontWeight: 600,
            background: "rgba(60,87,117,0.1)",
            padding: "4px 14px",
            borderRadius: 30,
          }}>
            {keptCount > 0 ? `${keptCount} will be added` : "All will be skipped"}
          </span>
          <button
            onClick={onContinue}
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
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
