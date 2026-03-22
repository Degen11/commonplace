import { createContext, useContext } from "react";
import { Toaster } from "sonner";
import useToasts from "../hooks/useToasts";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { showToast } = useToasts();
  const value = { showToast };
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
            boxShadow: "0 8px 32px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.12)",
            border: "none",
            borderLeft: "3px solid rgba(255,255,255,0.15)",
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
