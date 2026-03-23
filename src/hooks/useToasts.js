import { toast } from "sonner";

export default function useToasts() {
  // variant: "info" (default) | "success" | "error"
  const showToast = (message, action, onAction, variant = "info") => {
    const opts = {};
    if (action && onAction) {
      opts.action = { label: action, onClick: onAction };
      opts.duration = 3500; // longer window for undo / action toasts
    }

    if (variant === "success") return toast.success(message, opts);
    if (variant === "error") return toast.error(message, opts);
    return toast.info(message, opts);
  };

  return { showToast };
}
