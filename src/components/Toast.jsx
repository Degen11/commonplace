import { useEffect } from "react";
import { Z } from "./styles";

export default function Toast({ message, action, onAction, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, action ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [onDismiss, action]);

  return (
    <div style={Z.toast}>
      <div style={Z.toastContent}>
        <span>{message}</span>
        {action && <button style={Z.toastAction} onClick={onAction}>{action}</button>}
      </div>
    </div>
  );
}