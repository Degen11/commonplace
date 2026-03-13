import { useMemo } from "react";
import { styles } from "./styles";
import { getCatColor } from "../data/constants";
import { CheckCircle } from "lucide-react";
import Logo from "./Logo";

const PHASE_LABELS = {
  local:  "Matching known quotes\u2026",
  lookup: "Looking up sources\u2026",
  api:    "Identifying remaining entries\u2026",
};

export default function ProcessingPhase({
  fadeClass,
  progress,
  identifiedFeed,
  customCats,
  onCancel,
  processingDone,
}) {
  const doneCount = progress?.done || 0;
  const total = progress?.total || 0;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isComplete = processingDone || progress?.phase === "complete";
  const reversedFeed = useMemo(() => [...identifiedFeed].reverse(), [identifiedFeed]);

  return (
    <div style={styles.wrap} className={fadeClass}>
      <nav style={styles.nav}>
        <span style={{ ...styles.navLogo, display: "flex", alignItems: "center", gap: 8 }}><Logo size={22} />Commonplace</span>
        <div style={styles.navRight}>
          <span style={{ color: "var(--cp-text-muted)", fontSize: 12, fontWeight: 500 }}>Step 2 of 2</span>
        </div>
      </nav>
      <div style={styles.procWrap}>
        {isComplete ? (
          <>
            <div style={{ animation: "fadeUp .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CheckCircle size={48} color="#059669" strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <h2 style={{ ...styles.procTitle, color: "#059669" }}>All done!</h2>
              <p style={styles.procSub}>{total} entries organized and ready to explore</p>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.procTitle}>Organizing your collection...</h2>
            <p style={styles.procSub}>{PHASE_LABELS[progress?.phase] || PHASE_LABELS.api}</p>
          </>
        )}
        {progress && (
          <div style={styles.procCard}>
            <div style={styles.procTop}>
              <span style={{ fontWeight: 600 }}>{doneCount} of {total}</span>
              <span style={{ color: isComplete ? "#059669" : "var(--cp-text-muted)" }}>{pct}%</span>
            </div>
            <div style={styles.track}><div style={{ ...styles.fill, width: `${pct}%`, ...(isComplete ? { background: "#059669" } : {}) }} /></div>
            {!isComplete && <p style={styles.procCurrent}>{progress.current}</p>}
          </div>
        )}
        {!isComplete && (
          <div style={{ marginTop: 20, borderTop: "1px solid var(--cp-border)", paddingTop: 16, width: "100%", maxWidth: 480, textAlign: "center" }}>
            <button
              style={{ ...styles.hdrBtn, padding: "8px 20px", fontSize: 13 }}
              onClick={onCancel}
            >
              {doneCount > 0
                ? `Cancel (keep ${doneCount} identified)`
                : "Cancel"}
            </button>
          </div>
        )}
        {identifiedFeed.length > 0 && !isComplete && (
          <div style={styles.feedWrap}>
            {reversedFeed.map((item, i) => {
              const col = getCatColor(item.category, customCats);
              return (
                <div key={`${reversedFeed.length - 1 - i}`} style={styles.feedItem}>
                  <span style={{ ...styles.feedItemTag, background: col.bg, color: col.text }}>{item.category}</span>
                  <span style={styles.feedItemText}>{item.text}</span>
                  <span style={styles.feedItemSrc}>{item.source}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
