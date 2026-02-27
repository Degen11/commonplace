import { useState, useRef, useCallback } from "react";

export default function useToasts() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, action, onAction) => {
    toastIdRef.current += 1;
    setToasts(prev => [...prev, { id: toastIdRef.current, message, action, onAction }]);
  }, []);

  const dismissToast = useCallback(() => {
    setToasts(prev => prev.slice(1));
  }, []);

  return { toasts, showToast, dismissToast };
}
