import { Z } from "./styles";

export default function DupeModal({ pendingDupes, dupeDecisions, setDupeDecisions, onContinue }) {
  if (pendingDupes.length === 0) return null;

  const keptCount = Object.values(dupeDecisions).filter(d => d === "keep").length;

  return (
    <div style={Z.dupeModalOverlay}>
      <div style={Z.dupeModalBox}>
        <div style={Z.dupeModalHeader}>
          <p style={Z.dupeModalTitle}>Similar entries found</p>
          <p style={Z.dupeModalSub}>
            {pendingDupes.length} of your entries look similar to ones already in the collection. Choose what to do with each.
          </p>
        </div>

        <div style={Z.dupeList}>
          {pendingDupes.map((dupe, i) => {
            const decision = dupeDecisions[i] || "skip";
            return (
              <div key={i} style={{ ...Z.dupeCard, opacity: decision === "skip" ? 0.6 : 1, transition: "opacity .15s" }}>
                <div style={Z.dupePair}>
                  <div style={{ ...Z.dupeSide, ...Z.dupeExisting }}>
                    <div style={Z.dupeSideLabel}>Already in collection</div>
                    <div style={Z.dupeSideText}>{dupe.matchedText}</div>
                    {dupe.matchedSource && <div style={Z.dupeSideSource}>{dupe.matchedSource}</div>}
                  </div>
                  <div style={{ ...Z.dupeSide, ...Z.dupeIncoming }}>
                    <div style={Z.dupeSideLabel}>New entry</div>
                    <div style={Z.dupeSideText}>{dupe.incoming.text}</div>
                    {dupe.incoming.hint && <div style={Z.dupeSideSource}>{dupe.incoming.hint}</div>}
                  </div>
                </div>
                <div style={Z.dupeActions}>
                  <button
                    style={{ ...Z.dupeSkipBtn, ...(decision === "skip" ? { background: "#F1F1EF", fontWeight: 600, color: "#37352F" } : {}) }}
                    onClick={() => setDupeDecisions(prev => ({ ...prev, [i]: "skip" }))}
                  >
                    Skip
                  </button>
                  <button
                    style={{ ...Z.dupeKeepBtn, ...(decision === "keep" ? { background: "#16A34A" } : {}) }}
                    onClick={() => setDupeDecisions(prev => ({ ...prev, [i]: "keep" }))}
                  >
                    Keep both
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={Z.dupeModalFooter}>
          <span style={Z.dupeKeptCount}>
            {keptCount > 0 ? `${keptCount} will be added` : `All ${pendingDupes.length} will be skipped`}
          </span>
          <button style={Z.dupeContinueBtn} onClick={onContinue}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
