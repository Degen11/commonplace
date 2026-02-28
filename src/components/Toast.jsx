import { useEffect } from "react";
import { Z } from "./styles";

export default function Toast({ message, action, onAction, onDismiss }) {
  const duration = action ? 5000 : 2500;

  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div style={Z.toast}>
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
