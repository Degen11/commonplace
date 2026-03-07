import { useState, useEffect, useCallback, useRef } from "react";
import { styles } from "./styles";
import { TOAST_DURATION_MS, TOAST_ACTION_DURATION_MS, TOAST_EXIT_MS } from "../config";

export default function Toast({ id, message, action, onAction, onDismiss }) {
  const duration = action ? TOAST_ACTION_DURATION_MS : TOAST_DURATION_MS;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onDismiss(id), TOAST_EXIT_MS);
  }, [onDismiss, exiting, id]);

  useEffect(() => {
    timerRef.current = setTimeout(triggerExit, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [triggerExit, duration]);

  const handleAction = useCallback(() => {
    // Clear auto-dismiss so it doesn't interfere
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onAction) onAction();
    // Dismiss this specific toast immediately
    setExiting(true);
    setTimeout(() => onDismiss(id), TOAST_EXIT_MS);
  }, [onAction, onDismiss, id]);

  return (
    <div style={{ ...styles.toast, animation: exiting ? "toastOut .18s ease forwards" : "toastIn .2s ease" }}>
      <div style={styles.toastContent}>
        <span style={{
          maxWidth: 280,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>{message}</span>
        {action && <button style={styles.toastAction} onClick={handleAction}>{action}</button>}
        <span className="toast-bar" style={{ "--toast-duration": `${duration}ms` }} />
      </div>
    </div>
  );
}
