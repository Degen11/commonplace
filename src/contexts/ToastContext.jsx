import { createContext, useContext, useMemo } from "react";
import { Toaster } from "sonner";
import useToasts from "../hooks/useToasts";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { showToast } = useToasts();
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--cp-toast-bg)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
            border: "none",
          },
          actionButtonStyle: {
            background: "none",
            border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 4,
            color: "#fff",
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 600,
          },
        }}
        duration={2500}
      />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
