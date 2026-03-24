import { styles, FONT_SANS, CP_ACCENT } from "./styles";
import { getCatColor } from "../data/constants";
import { CheckCircle, Database, Globe, Sparkles } from "lucide-react";
import Logo from "./Logo";
import { pluralize } from "../utils/helpers";
import AnimatedNumber from "./AnimatedNumber";

const RING_SIZE = 88;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressRing({ pct, isComplete }) {
  const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
  return (
    <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, marginBottom: 20 }}>
      <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
          fill="none" stroke="var(--cp-border)" strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
          fill="none"
          stroke={isComplete ? "#059669" : CP_ACCENT}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease" }}
        />
      </svg>
      <span style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 700, fontFamily: FONT_SANS, color: isComplete ? "#059669" : "var(--cp-text-secondary)",
        letterSpacing: "-0.02em",
      }}>
        {pct}%
      </span>
    </div>
  );
}

const statChipStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "5px 12px", borderRadius: 6,
  background: "var(--cp-bg-panel)", border: "1px solid var(--cp-border-light)",
  fontSize: 12, color: "var(--cp-text-secondary)", fontWeight: 500,
  fontFamily: FONT_SANS,
};

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
  stats,
}) {
  const doneCount = progress?.done || 0;
  const total = progress?.total || 0;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isComplete = processingDone || progress?.phase === "complete";
  const reversedFeed = [...identifiedFeed].reverse();

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
              <CheckCircle size={56} color="#059669" strokeWidth={1.5} style={{ marginBottom: 16, animation: "completePop .4s ease both" }} />
              <h2 style={{ ...styles.procTitle, color: "#059669", fontSize: 28, animation: "fadeUp .25s .15s ease both" }}>All done!</h2>
              <p style={{ ...styles.procSub, animation: "fadeUp .25s .25s ease both" }}>{total} entries organized and ready to explore</p>
            </div>
            {stats && (
              <div style={{
                display: "flex", gap: 12, marginTop: 12, justifyContent: "center",
                flexWrap: "wrap", animation: "fadeUp .35s .35s ease both",
              }}>
                {stats.local > 0 && (
                  <div style={statChipStyle}>
                    <Database size={13} strokeWidth={1.5} color="#059669" />
                    {pluralize(stats.local, "match", "matches")} from local DB
                  </div>
                )}
                {stats.lookup > 0 && (
                  <div style={statChipStyle}>
                    <Globe size={13} strokeWidth={1.5} color="#2563EB" />
                    {stats.lookup} found online
                  </div>
                )}
                {stats.api > 0 && (
                  <div style={statChipStyle}>
                    <Sparkles size={13} strokeWidth={1.5} color="#7C3AED" />
                    {stats.api} identified by AI
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {total > 0 && <ProgressRing pct={pct} isComplete={false} />}
            <h2 style={styles.procTitle}>Organizing your collection...</h2>
            <p style={styles.procSub}>{phaseSubtitle(progress, doneCount, total)}</p>
          </>
        )}
        {progress && (
          <div style={styles.procCard}>
            <div style={styles.procTop}>
              <span style={{ fontWeight: 600 }}><AnimatedNumber value={doneCount} /> of {total}</span>
              <span style={{ color: isComplete ? "#059669" : "var(--cp-text-muted)" }}><AnimatedNumber value={pct} />%</span>
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
