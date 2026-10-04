import { AnimatePresence, motion } from "motion/react";
import { styles } from "./styles";
import { TriangleAlert, Zap, Bot, Globe, CircleX, RefreshCw, Eye, X } from "lucide-react";
import { pluralize } from "../utils/helpers";

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
 *
 * The attention/review notice lives in AttentionNotice below, rendered under
 * the header title rather than above it.
 */
export default function NotificationBars({
  // Shared view
  isSharedView, setIsSharedView, quotesLength,
  // API error
  apiError, failedEntries, retryFailed, dismissApiError,
  // Stats
  stats, dismissStats,
}) {
  return (
    <AnimatePresence initial={false}>
      {isSharedView && (
        <motion.div key="shared" className="notif-bar-wrapper" variants={barVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={{ ...styles.shareBanner, margin: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} strokeWidth={1.5} /> You're viewing a shared collection ({pluralize(quotesLength, "quote")})</span>
            <button style={styles.shareBannerBtn} onClick={() => { setIsSharedView(false); try { window.history.replaceState(null, "", "/"); } catch {} }}>Make it yours</button>
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
            {stats.failed > 0 && <><span style={styles.statDot} /><span style={{ color: "var(--cp-danger)", display: "inline-flex", alignItems: "center", gap: 4 }}><CircleX size={13} strokeWidth={2} /> <strong>{stats.failed}</strong> failed</span></>}
            {stats.dupes > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} strokeWidth={2} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
            <button style={styles.statsDismiss} aria-label="Dismiss processing summary" onClick={dismissStats}><X size={14} strokeWidth={2} /></button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

// Quiet one-line notice for quotes missing a source or category, and the
// in-progress review state. Deliberately low-key: a dot, a sentence and a
// text button, not a colored banner.
const noticeVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: { opacity: 1, height: "auto", marginTop: 10, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

export function AttentionNotice({
  unknownCount, reviewQueue, setReviewQueue, setEditingId,
  sortBy, dismissedAtCount, setDismissedAtCount,
  handleStartReview,
}) {
  // Whether to show the "needs attention" notice (not in review mode)
  const showAttention = unknownCount > 0 && reviewQueue.length === 0
    && sortBy !== "confidence"
    && (dismissedAtCount === null || unknownCount > dismissedAtCount);

  const showReview = unknownCount > 0 && reviewQueue.length > 0;

  return (
    <AnimatePresence initial={false}>
      {showReview && (
        <motion.div key="review" className="notif-bar-wrapper" variants={noticeVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={styles.attentionBar}>
            <span style={styles.attentionDot} />
            <span>{pluralize(reviewQueue.length, "quote")} left to review.</span>
            <button style={styles.attentionLink} onClick={() => { setReviewQueue([]); setEditingId(null); }}>Exit review</button>
          </div>
        </motion.div>
      )}

      {showAttention && (
        <motion.div key="attention" className="notif-bar-wrapper" variants={noticeVariants} initial="initial" animate="animate" exit="exit" style={{ overflow: "hidden" }}>
          <div style={styles.attentionBar}>
            <span style={styles.attentionDot} />
            <span>{pluralize(unknownCount, "quote")} {unknownCount === 1 ? "is" : "are"} missing a source or category.</span>
            <button className="ui-tip" data-tip="Step through quotes that need attention" style={styles.attentionLink} onClick={handleStartReview}>Review</button>
            <button className="ui-tip attention-dismiss" data-tip="Dismiss" aria-label="Dismiss review reminder" style={styles.attentionDismiss} onClick={() => setDismissedAtCount(unknownCount)}><X size={12} strokeWidth={2} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
