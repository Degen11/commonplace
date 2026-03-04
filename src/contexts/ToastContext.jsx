import { createContext, useContext, useMemo } from "react";
import useToasts from "../hooks/useToasts";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { toasts, showToast, dismissToast } = useToasts();
  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
