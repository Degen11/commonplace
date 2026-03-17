import { Dialog } from "@base-ui/react/dialog";
import { styles } from "./styles";
import { Search } from "lucide-react";

export default function DupeModal(props) {
  if (props.pendingDupes.length === 0) return null;
  return <DupeModalInner {...props} />;
}

function DupeModalInner({ pendingDupes, dupeDecisions, setDupeDecision, onContinue }) {
  const keptCount = Object.values(dupeDecisions).filter(d => d === "keep" || d === "merge").length;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onContinue(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 1000,
            animation: "overlayFade .15s ease-out",
          }}
        />
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
          pointerEvents: "none",
          animation: "fadeUp .15s ease-out",
        }}>
          <Dialog.Popup style={{ ...styles.dupeModalBox, maxHeight: "85vh", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
            <div style={styles.dupeModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Search size={22} color="var(--cp-text-secondary)" strokeWidth={1.5} />
                <Dialog.Title render={<div />} style={styles.dupeModalTitle}>Possible Duplicates Detected</Dialog.Title>
              </div>
              <Dialog.Description style={styles.dupeModalSub}>
                We found {pendingDupes.length} {pendingDupes.length === 1 ? "entry" : "entries"} similar to ones already in your collection.
              </Dialog.Description>
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
                    borderRadius: 6,
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
                        onClick={() => setDupeDecision(i, "keep")}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "6px 0 0 6px",
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
                          onClick={() => setDupeDecision(i, "merge")}
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
                        onClick={() => setDupeDecision(i, "skip")}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "0 6px 6px 0",
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
                color: "var(--cp-text-secondary)",
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
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
