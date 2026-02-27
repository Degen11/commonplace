import { Search, Check, X, RefreshCw } from "lucide-react";
import { Z } from "./styles";

export default function DupeModal({ pendingDupes, dupeDecisions, setDupeDecisions, onContinue }) {
  if (pendingDupes.length === 0) return null;

  const keptCount = Object.values(dupeDecisions).filter(d => d === "keep" || d === "merge").length;

  return (
    <div style={Z.dupeModalOverlay} onClick={onContinue}>
      <div style={{ ...Z.dupeModalBox, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={Z.dupeModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Search size={22} color="#3C5775" />
            <div style={Z.dupeModalTitle}>Possible Duplicates Detected</div>
          </div>
          <div style={Z.dupeModalSub}>
            We found {pendingDupes.length} {pendingDupes.length === 1 ? "entry" : "entries"} similar to ones already in your collection.
          </div>
        </div>

        <div style={{ ...Z.dupeList, padding: "16px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {pendingDupes.map((dupe, i) => {
            const decision = dupeDecisions[i];
            const isKeep = decision === "keep";
            const isMerge = decision === "merge";
            const isSkip = decision === "skip";

            return (
              <div key={i} style={{
                border: "1px solid #F1F1EF",
                borderRadius: 14,
                marginBottom: 16,
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}>
                {/* Comparison header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  borderBottom: "1px solid #F1F1EF",
                  background: "#FAFAFA",
                }}>
                  <div style={{
                    padding: "10px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9B9A97",
                    letterSpacing: 0.5,
                    borderRight: "1px solid #F1F1EF",
                  }}>
                    EXISTING
                  </div>
                  <div style={{
                    padding: "10px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9B9A97",
                    letterSpacing: 0.5,
                  }}>
                    NEW
                  </div>
                </div>

                {/* Content */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxHeight: 200, overflowY: "auto" }}>
                  <div style={{
                    padding: 16,
                    background: "#FAFAFA",
                    borderRight: "1px solid #F1F1EF",
                  }}>
                    <div style={{ fontSize: 14, color: "#1A1814", lineHeight: 1.5, marginBottom: 6 }}>
                      "{dupe.matchedText}"
                    </div>
                    {dupe.matchedSource && (
                      <div style={{ fontSize: 12, color: "#9B9A97" }}>
                        — {dupe.matchedSource}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 16, background: "#fff" }}>
                    <div style={{ fontSize: 14, color: "#1A1814", lineHeight: 1.5, marginBottom: 6 }}>
                      "{dupe.incoming.text}"
                    </div>
                    {dupe.incoming.hint && (
                      <div style={{ fontSize: 12, color: "#9B9A97" }}>
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
                  borderTop: "1px solid #F1F1EF",
                  background: "#FAFAFA",
                  justifyContent: "flex-end",
                }}>
                  <button
                    className={`dupe-keep-btn${isKeep ? " active" : ""}`}
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "keep" }))}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "20px 0 0 20px",
                      border: "none",
                      background: isKeep ? "#3C5775" : "white",
                      color: isKeep ? "white" : "#1A1814",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      borderRight: "1px solid #F1F1EF",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Check size={13} style={{ marginRight: 3 }} /> Keep
                  </button>
                  {dupe.matchedSource && dupe.incoming.hint && dupe.matchedSource !== dupe.incoming.hint && (
                    <button
                      className={`dupe-merge-btn${isMerge ? " active" : ""}`}
                      onClick={() => setDupeDecisions(p => ({ ...p, [i]: "merge" }))}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 0,
                        border: "none",
                        background: isMerge ? "#059669" : "white",
                        color: isMerge ? "white" : "#1A1814",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        borderRight: "1px solid #F1F1EF",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      title="Keep the new entry but combine both sources"
                    >
                      <RefreshCw size={12} style={{ marginRight: 3 }} /> Merge
                    </button>
                  )}
                  <button
                    className={`dupe-skip-btn${isSkip ? " active" : ""}`}
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "skip" }))}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "0 20px 20px 0",
                      border: "none",
                      background: isSkip ? "#9B9A97" : "white",
                      color: isSkip ? "white" : "#1A1814",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={13} style={{ marginRight: 3 }} /> Skip
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
          borderTop: "1px solid #F1F1EF",
          background: "white",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setDupeDecisions(Object.fromEntries(pendingDupes.map((_, i) => [i, "keep"])))} style={{ background: "none", border: "none", color: "#3C5775", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Keep all</button>
            <button onClick={() => setDupeDecisions(Object.fromEntries(pendingDupes.map((_, i) => [i, "skip"])))} style={{ background: "none", border: "none", color: "#9B9A97", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>Skip all</button>
            <span style={{ width: 1, height: 16, background: "#E3E2DE" }} />
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
          </div>
          <button
            className="dupe-continue-btn"
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
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
