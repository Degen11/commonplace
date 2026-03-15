// ── useDropdownPosition — @floating-ui hook for dropdown/popover positioning ──
// Replaces manual getBoundingClientRect + flipLeft/flipUp viewport detection
// and custom click-outside handlers with @floating-ui middleware.

import {
  useFloating, useInteractions, useDismiss,
  offset, flip, shift, autoUpdate,
} from "@floating-ui/react";

export default function useDropdownPosition({ open, onClose, placement = "bottom-end" }) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (nextOpen) => { if (!nextOpen) onClose(); },
    placement,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    strategy: "fixed",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  return { refs, floatingStyles, getFloatingProps };
}
