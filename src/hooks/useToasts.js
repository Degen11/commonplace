import { useCallback } from "react";
import { toast } from "sonner";

const BAR_COLORS = { info: "#2383E2", success: "#059669", error: "#DC2626" };

export default function useToasts() {
  // variant: "info" (default) | "success" | "error"
  const showToast = useCallback((message, action, onAction, variant = "info") => {
    const hasAction = action && onAction;
    const duration = hasAction ? 3500 : 2500;
    const opts = {
      duration,
      style: {
        "--toast-duration": `${duration}ms`,
        "--toast-bar-color": BAR_COLORS[variant] || BAR_COLORS.info,
      },
    };
    if (hasAction) {
      opts.action = { label: action, onClick: onAction };
    }

    if (variant === "success") return toast.success(message, opts);
    if (variant === "error") return toast.error(message, opts);
    return toast(message, opts);
  }, []);

  return { showToast };
}
