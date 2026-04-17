import { AnimatePresence, motion } from "motion/react";
import { styles, CLR_RED } from "./styles";
import { TriangleAlert, Zap, Bot, Globe, CircleX, RefreshCw, Eye, X } from "lucide-react";

// Shared animation variants for notification bars (slide down in, slide up out)
const barVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
  animate: { opacity: 1, height: "auto", marginTop: 12, marginBottom: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

/**
 * All notification/status bars in the results phase:
 * - Shared view banner
 * - API error bar
 * - Processing stats bar
 * - Attention/review bar
 */
export default function NotificationBars({
  // Shared view
  isSharedView, setIsSharedView, quotesLength,
  // API error
  apiError, failedEntries, retryFailed, dismissApiError,
  // Stats
  stats, dismissStats,
  // Attention bar
  unknownCount, reviewQueue, setReviewQueue, setEditingId,
  sortBy, dismissedAtCount, setDismissedAtCount,
  handleStartReview,
}) {
  // Whether to show the "needs attention" bar (not in review mode)
  const showAttention = unknownCount > 0 && reviewQueue.length === 0
    && sortBy !== "confidence"
    && (dismissedAtCount === null || unknownCount > dismissedAtCount);

  const showReview = unknownCount > 0 && reviewQueue.length > 0;

  return (
    <AnimatePresence initial={false}>
      {isSharedView && (
        <motion.div key="shared" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.shareBanner, margin: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} strokeWidth={1.5} /> You're viewing a shared collection ({quotesLength} entries)</span>
            <button style={styles.shareBannerBtn} onClick={() => { setIsSharedView(false); try { window.history.replaceState(null, "", window.location.pathname); } catch {} }}>Make it yours</button>
          </div>
        </motion.div>
      )}

      {apiError && (
        <motion.div key="error" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.errorBar, margin: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><TriangleAlert size={14} strokeWidth={2} /> {apiError}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {failedEntries.length > 0 && <button style={styles.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
              <button className="dismiss-link" style={{ background: "none", border: "none", color: "var(--cp-error-text)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={dismissApiError}>Dismiss</button>
            </div>
          </div>
        </motion.div>
      )}

      {stats && (
        <motion.div key="stats" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.statsBar, margin: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} strokeWidth={2} /> <strong>{stats.local}</strong> matched locally</span>
            {stats.lookup > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Globe size={13} strokeWidth={2} /> <strong>{stats.lookup}</strong> found online</span></>}
            <span style={styles.statDot} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bot size={13} strokeWidth={2} /> <strong>{stats.api}</strong> identified by AI</span>
            {stats.failed > 0 && <><span style={styles.statDot} /><span style={{ color: CLR_RED, display: "inline-flex", alignItems: "center", gap: 4 }}><CircleX size={13} strokeWidth={2} /> <strong>{stats.failed}</strong> failed</span></>}
            {stats.dupes > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} strokeWidth={2} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
            <button style={styles.statsDismiss} onClick={dismissStats}><X size={14} strokeWidth={2} /></button>
          </div>
        </motion.div>
      )}

      {showReview && (
        <motion.div key="review" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.attentionBar, margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={styles.attentionCount}>{reviewQueue.length}</span>
              <span>{reviewQueue.length === 1 ? "entry" : "entries"} remaining in review</span>
            </div>
            <button style={{ ...styles.attentionBtn, background: "#92400E" }} onClick={() => { setReviewQueue([]); setEditingId(null); }}>Exit review</button>
          </div>
        </motion.div>
      )}

      {showAttention && (
        <motion.div key="attention" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.attentionBar, margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={styles.attentionCount}>{unknownCount}</span>
              <span>{unknownCount === 1 ? "entry needs" : "entries need"} your attention — source or category is missing</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="ui-tip ui-tip-left" data-tip="Step through entries that need attention" style={styles.attentionBtn} onClick={handleStartReview}>Review now &rarr;</button>
              <button className="ui-tip ui-tip-left attention-dismiss" data-tip="Dismiss" style={styles.attentionDismiss} onClick={() => setDismissedAtCount(unknownCount)}>&times;</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
