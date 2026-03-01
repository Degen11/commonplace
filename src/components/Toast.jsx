import { useState, useEffect, useCallback } from "react";
import { Z } from "./styles";

export default function Toast({ message, action, onAction, onDismiss }) {
  const duration = action ? 5000 : 2500;
  const [exiting, setExiting] = useState(false);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDismiss, 180);
  }, [onDismiss, exiting]);

  useEffect(() => {
    const t = setTimeout(triggerExit, duration);
    return () => clearTimeout(t);
  }, [triggerExit, duration]);

  return (
    <div style={{ ...Z.toast, animation: exiting ? "toastOut .18s ease forwards" : "toastIn .2s ease" }}>
      <div style={Z.toastContent}>
        <span style={{
          maxWidth: 280,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>{message}</span>
        {action && <button style={Z.toastAction} onClick={onAction}>{action}</button>}
        <span className="toast-bar" style={{ "--toast-duration": `${duration}ms` }} />
      </div>
    </div>
  );
}
