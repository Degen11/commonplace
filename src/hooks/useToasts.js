import { toast } from "sonner";

export default function useToasts() {
  // variant: "info" (default) | "success" | "error" | "loading"
  // extra: optional sonner options (e.g. { id } to update an existing toast in place)
  const showToast = (message, action, onAction, variant = "info", extra = {}) => {
    const opts = { ...extra };
    if (action && onAction) {
      opts.action = { label: action, onClick: onAction };
      opts.duration = 3500; // longer window for undo / action toasts
    }

    if (variant === "loading") return toast.loading(message, opts);
    if (variant === "success") return toast.success(message, opts);
    if (variant === "error") return toast.error(message, opts);
    return toast.info(message, opts);
  };

  return { showToast };
}
