import { useCallback } from "react";
import { toast } from "sonner";

export default function useToasts() {
  // variant: "info" (default) | "success" | "error"
  const showToast = useCallback((message, action, onAction, variant = "info") => {
    const opts = {};
    if (action && onAction) {
      opts.action = { label: action, onClick: onAction };
    }

    if (variant === "success") return toast.success(message, opts);
    if (variant === "error") return toast.error(message, opts);
    return toast(message, opts);
  }, []);

  return { showToast };
}
