import { Z } from "./styles";
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
    <div style={Z.wrap} className={fadeClass}>
      <nav style={Z.nav}>
        <span style={Z.navLogo}>Commonplace</span>
        <div style={Z.navRight}>
          <span style={{ color: "#9A9590", fontSize: 12, fontWeight: 500 }}>Step 2 of 2</span>
        </div>
      </nav>
      <div style={Z.procWrap}>
        {isComplete ? (
          <>
            <div style={{ animation: "fadeUp .3s ease", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CheckCircle size={48} color="#059669" strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <h2 style={{ ...Z.procTitle, color: "#059669" }}>All done!</h2>
              <p style={Z.procSub}>{progress?.total || 0} entries organized and ready to explore</p>
              <button
                className="proc-btn"
                style={{ ...Z.processBtn, marginTop: 16, fontSize: 15, padding: "12px 28px" }}
                onClick={onViewResults}
              >
                View my collection &rarr;
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={Z.procTitle}>Organizing your collection...</h2>
            <p style={Z.procSub}>{progress?.phase === "local" ? "Checking local database..." : "AI is identifying remaining entries..."}</p>
          </>
        )}
        {progress && (
          <div style={Z.procCard}>
            <div style={Z.procTop}>
              <span style={{ fontWeight: 600 }}>{progress.done} of {progress.total}</span>
              <span style={{ color: isComplete ? "#059669" : "#9B9A97" }}>{Math.round((progress.done / progress.total) * 100)}%</span>
            </div>
            <div style={Z.track}><div style={{ ...Z.fill, width: `${(progress.done / progress.total) * 100}%`, ...(isComplete ? { background: "#059669" } : {}) }} /></div>
            {!isComplete && <p style={Z.procCurrent}>{progress.current}</p>}
          </div>
        )}
        {!isComplete && (
          <div style={{ marginTop: 20, borderTop: "1px solid #E3E2DE", paddingTop: 16, width: "100%", maxWidth: 480, textAlign: "center" }}>
            <button
              style={{ ...Z.hdrBtn, padding: "8px 20px", fontSize: 13 }}
              onClick={onCancel}
            >
              {doneCount > 0
                ? `Cancel (keep ${doneCount} identified)`
                : "Cancel"}
            </button>
          </div>
        )}
        {identifiedFeed.length > 0 && !isComplete && (
          <div style={Z.feedWrap}>
            {[...identifiedFeed].reverse().map((item, i) => {
              const col = getCatColor(item.category, customCats);
              return (
                <div key={i} style={Z.feedItem}>
                  <span style={{ ...Z.feedItemTag, background: col.bg, color: col.text }}>{item.category}</span>
                  <span style={Z.feedItemText}>{item.text}</span>
                  <span style={Z.feedItemSrc}>{item.source}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
