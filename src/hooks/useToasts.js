import { useState, useRef, useCallback } from "react";

export default function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // variant: "info" (default) | "success" | "error"
  const showToast = useCallback((message, action, onAction, variant = "info") => {
    toastIdRef.current += 1;
    setToasts(prev => [...prev, { id: toastIdRef.current, message, action, onAction, variant }]);
  }, []);

  const dismissToast = useCallback((id) => {
    if (id != null) {
      setToasts(prev => prev.filter(t => t.id !== id));
    } else {
      setToasts(prev => prev.slice(1));
    }
  }, []);

  return { toasts, showToast, dismissToast };
}
