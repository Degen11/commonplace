import { Z } from "./styles";

export default function DupeModal({ pendingDupes, dupeDecisions, setDupeDecisions, onContinue }) {
  if (pendingDupes.length === 0) return null;

  const keptCount = Object.values(dupeDecisions).filter(d => d === "keep" || d === "merge").length;

  return (
    <div style={Z.dupeModalOverlay} onClick={onContinue}>
      <div style={Z.dupeModalBox} onClick={e => e.stopPropagation()}>
        <div style={Z.dupeModalHeader}>
          <div style={Z.dupeModalTitle}>Possible Duplicates Detected</div>
          <div style={Z.dupeModalSub}>
            We found {pendingDupes.length} {pendingDupes.length === 1 ? "entry" : "entries"} similar to ones already in your collection. Review each one:
          </div>
        </div>

        <div style={Z.dupeList}>
          {pendingDupes.map((dupe, i) => {
            const decision = dupeDecisions[i];
            return (
              <div key={i} style={Z.dupeCard}>
                <div style={Z.dupePair}>
                  <div style={Z.dupeExisting}>
                    <div style={Z.dupeSideLabel}>Existing Entry</div>
                    <div style={Z.dupeSideText}>{dupe.matchedText}</div>
                    {dupe.matchedSource && (
                      <div style={Z.dupeSideSource}>Source: {dupe.matchedSource}</div>
                    )}
                  </div>
                  <div style={Z.dupeIncoming}>
                    <div style={Z.dupeSideLabel}>New Entry</div>
                    <div style={Z.dupeSideText}>{dupe.incoming.text}</div>
                    {dupe.incoming.hint && (
                      <div style={Z.dupeSideSource}>Source: {dupe.incoming.hint}</div>
                    )}
                  </div>
                </div>
                <div style={Z.dupeActions}>
                  <button
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "keep" }))}
                    style={{
                      ...Z.dupeKeepBtn,
                      ...(decision === "keep" ? { opacity: 1 } : { opacity: 0.5 }),
                    }}
                  >
                    Keep new
                  </button>
                  {dupe.matchedSource && dupe.incoming.hint && dupe.matchedSource !== dupe.incoming.hint && (
                    <button
                      onClick={() => setDupeDecisions(p => ({ ...p, [i]: "merge" }))}
                      style={{
                        ...Z.dupeMergeBtn,
                        ...(decision === "merge" ? { opacity: 1 } : { opacity: 0.5 }),
                      }}
                      title="Keep the new entry but combine both sources"
                    >
                      Merge sources
                    </button>
                  )}
                  <button
                    onClick={() => setDupeDecisions(p => ({ ...p, [i]: "skip" }))}
                    style={{
                      ...Z.dupeSkipBtn,
                      ...(decision === "skip" ? { opacity: 1 } : { opacity: 0.5 }),
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={Z.dupeModalFooter}>
          <span style={Z.dupeKeptCount}>
            {keptCount > 0 ? `${keptCount} will be added` : "All will be skipped"}
          </span>
          <button style={Z.dupeContinueBtn} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}