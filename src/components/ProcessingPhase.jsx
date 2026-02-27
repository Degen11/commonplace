import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { baseCSS, Z } from "./styles";
import { getCatColor } from "../data/constants";

export default function ProcessingPhase({
  fadeClass,
  progress,
  identifiedFeed,
  customCats,
  onCancel,
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return (
    <div style={Z.wrap} className={fadeClass}>
      <style>{baseCSS}</style>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button
            className="cancel-proc"
            style={{ background: "none", border: "1px solid #E3E2DE", borderRadius: 8, padding: "8px 20px", fontSize: 13, color: "#9B9A97", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setShowCancelConfirm(true)}
          >
            <XIcon size={14} /> Cancel
          </button>
          {showCancelConfirm && (
            <div style={{ padding: "10px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#991B1B", animation: "slideD .15s ease", textAlign: "center", maxWidth: 320 }}>
              <p style={{ marginBottom: 8 }}>Cancel processing? Progress from the current batch will be lost.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #DC2626", background: "#fff", color: "#DC2626", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }} onClick={onCancel}>Yes, cancel</button>
                <button style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #E3E2DE", background: "#fff", color: "#37352F", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }} onClick={() => setShowCancelConfirm(false)}>Continue processing</button>
              </div>
            </div>
          )}
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
