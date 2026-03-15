import { styles } from "./styles";
import { AlertTriangle, Zap, Bot, Globe, XCircle, RefreshCw, Eye, X } from "lucide-react";

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
  return (
    <>
      {isSharedView && (
        <div style={styles.shareBanner}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} strokeWidth={1.5} /> You're viewing a shared collection ({quotesLength} entries)</span>
          <button style={styles.shareBannerBtn} onClick={() => { setIsSharedView(false); try { window.history.replaceState(null, "", window.location.pathname); } catch {} }}>Make it yours</button>
        </div>
      )}

      {apiError && (
        <div style={styles.errorBar}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} strokeWidth={2} /> {apiError}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {failedEntries.length > 0 && <button style={styles.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
            <button className="dismiss-link" style={{ background: "none", border: "none", color: "var(--cp-error-text)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={dismissApiError}>Dismiss</button>
          </div>
        </div>
      )}

      {stats && (
        <div style={styles.statsBar}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} strokeWidth={2} /> <strong>{stats.local}</strong> matched locally</span>
          {stats.lookup > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Globe size={13} strokeWidth={2} /> <strong>{stats.lookup}</strong> found online</span></>}
          <span style={styles.statDot} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bot size={13} strokeWidth={2} /> <strong>{stats.api}</strong> identified by AI</span>
          {stats.failed > 0 && <><span style={styles.statDot} /><span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={13} strokeWidth={2} /> <strong>{stats.failed}</strong> failed</span></>}
          {stats.dupes > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} strokeWidth={2} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
          <button style={styles.statsDismiss} onClick={dismissStats}><X size={14} strokeWidth={2} /></button>
        </div>
      )}

      {unknownCount > 0 && (reviewQueue.length > 0 ? (
        <div style={styles.attentionBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={styles.attentionCount}>{reviewQueue.length}</span>
            <span>{reviewQueue.length === 1 ? "entry" : "entries"} remaining in review</span>
          </div>
          <button style={{ ...styles.attentionBtn, background: "#92400E" }} onClick={() => { setReviewQueue([]); setEditingId(null); }}>Exit review</button>
        </div>
      ) : sortBy !== "confidence" && (dismissedAtCount === null || unknownCount > dismissedAtCount) && (
        <div style={styles.attentionBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={styles.attentionCount}>{unknownCount}</span>
            <span>{unknownCount === 1 ? "entry needs" : "entries need"} your attention — source or category is missing</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="ui-tip" data-tip="Step through entries that need attention" style={styles.attentionBtn} onClick={handleStartReview}>Review now &rarr;</button>
            <button className="ui-tip attention-dismiss" data-tip="Dismiss" style={styles.attentionDismiss} onClick={() => setDismissedAtCount(unknownCount)}>&times;</button>
          </div>
        </div>
      ))}
    </>
  );
}
