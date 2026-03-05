import { styles } from "./styles";
import { getCatColor } from "../data/constants";
import { CheckCircle } from "lucide-react";

export default function ProcessingPhase({
  fadeClass,
  progress,
  identifiedFeed,
  customCats,
  onCancel,
  onViewResults,
  processingDone,
}) {
  const doneCount = progress?.done || 0;
  const isComplete = processingDone || progress?.phase === "complete";

  return (
    <div style={styles.wrap} className={fadeClass}>
      <nav style={styles.nav}>
        <span style={styles.navLogo}>Commonplace</span>
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
              <p style={styles.procSub}>{progress?.total || 0} entries organized and ready to explore</p>
              <button
                className="proc-btn"
                style={{ ...styles.processBtn, marginTop: 16, fontSize: 15, padding: "12px 28px" }}
                onClick={onViewResults}
              >
                View my collection &rarr;
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.procTitle}>Organizing your collection...</h2>
            <p style={styles.procSub}>{progress?.phase === "local" ? "Checking local database..." : "AI is identifying remaining entries..."}</p>
          </>
        )}
        {progress && (
          <div style={styles.procCard}>
            <div style={styles.procTop}>
              <span style={{ fontWeight: 600 }}>{progress.done} of {progress.total}</span>
              <span style={{ color: isComplete ? "#059669" : "#9B9A97" }}>{progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%</span>
            </div>
            <div style={styles.track}><div style={{ ...styles.fill, width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, ...(isComplete ? { background: "#059669" } : {}) }} /></div>
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
            {[...identifiedFeed].reverse().map((item, i, arr) => {
              const col = getCatColor(item.category, customCats);
              return (
                <div key={`${arr.length - 1 - i}`} style={styles.feedItem}>
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
