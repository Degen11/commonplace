import { useMemo } from "react";
import { styles } from "./styles";
import { getCatColor } from "../data/constants";
import { CheckCircle } from "lucide-react";
import Logo from "./Logo";

function phaseSubtitle(progress, doneCount, total) {
  if (!progress) return "Preparing\u2026";
  const remaining = total - doneCount;
  switch (progress.phase) {
    case "local":
      return `Matching ${total} ${total === 1 ? "entry" : "entries"} against known quotes\u2026`;
    case "lookup":
      return doneCount > 0
        ? `${doneCount} matched \u2014 checking online sources for ${remaining} more\u2026`
        : `Looking up sources for ${total} ${total === 1 ? "entry" : "entries"}\u2026`;
    case "api":
      return doneCount > 0
        ? `${doneCount} found \u2014 AI identifying ${remaining} remaining\u2026`
        : `AI identifying ${total} ${total === 1 ? "entry" : "entries"}\u2026`;
    default:
      return "Identifying entries\u2026";
  }
}

export default function ProcessingPhase({
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
    <div style={styles.wrap}>
      <nav style={styles.nav}>
        <span style={{ ...styles.navLogo, display: "flex", alignItems: "center", gap: 8 }}><Logo size={22} />Commonplace</span>
        <div style={styles.navRight}>
          <span style={{ color: "var(--cp-text-muted)", fontSize: 12, fontWeight: 500 }}>Step 2 of 2</span>
        </div>
      </nav>
      <div style={styles.procWrap}>
        {isComplete ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CheckCircle size={48} color="#059669" strokeWidth={1.5} style={{ marginBottom: 16, animation: "completePop .4s ease both" }} />
              <h2 style={{ ...styles.procTitle, color: "#059669", animation: "fadeUp .25s .15s ease both" }}>All done!</h2>
              <p style={{ ...styles.procSub, animation: "fadeUp .25s .25s ease both" }}>{total} entries organized and ready to explore</p>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.procTitle}>Organizing your collection...</h2>
            <p style={styles.procSub}>{phaseSubtitle(progress, doneCount, total)}</p>
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
