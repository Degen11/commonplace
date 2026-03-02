import { createContext, useContext } from "react";
import useToasts from "../hooks/useToasts";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toast = useToasts();
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
