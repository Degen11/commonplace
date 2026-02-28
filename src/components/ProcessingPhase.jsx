import { baseCSS, Z } from "./styles";
import { getCatColor } from "../data/constants";

export default function ProcessingPhase({
  fadeClass,
  progress,
  identifiedFeed,
  customCats,
  onCancel,
}) {
  const doneCount = progress?.done || 0;

  return (
    <div style={Z.wrap} className={fadeClass}>
      <style>{baseCSS}</style>
      <nav style={Z.nav}>
        <span style={Z.navLogo}>Commonplace</span>
        <div style={Z.navRight}>
          <span style={{ color: "#9A9590", fontSize: 12, fontWeight: 500 }}>Step 2 of 2</span>
        </div>
      </nav>
      <div style={Z.procWrap}>
        <h2 style={Z.procTitle}>Organizing your collection...</h2>
        <p style={Z.procSub}>{progress?.phase === "local" ? "Checking local database..." : "AI is identifying remaining entries..."}</p>
        {progress && (
          <div style={Z.procCard}>
            <div style={Z.procTop}>
              <span style={{ fontWeight: 600 }}>{progress.done} of {progress.total}</span>
              <span style={{ color: "#9B9A97" }}>{Math.round((progress.done / progress.total) * 100)}%</span>
            </div>
            <div style={Z.track}><div style={{ ...Z.fill, width: `${(progress.done / progress.total) * 100}%` }} /></div>
            <p style={Z.procCurrent}>{progress.current}</p>
          </div>
        )}
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
        {identifiedFeed.length > 0 && (
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
