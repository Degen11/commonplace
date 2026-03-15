// ── Tooltip — @floating-ui powered, viewport-aware ──
// Replaces CSS ::after tooltips (.ui-tip / .conf-tooltip) with proper
// positioning, flip/shift, portal rendering, and accessibility.

import { useState, cloneElement, isValidElement } from "react";
import {
  useFloating, useHover, useInteractions, useDismiss, useRole,
  offset, flip, shift, autoUpdate, FloatingPortal,
} from "@floating-ui/react";

const TOOLTIP_STYLE = {
  background: "var(--cp-toast-bg)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 500,
  padding: "4px 8px",
  borderRadius: 4,
  lineHeight: 1.3,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  zIndex: 200,
  letterSpacing: "0.01em",
  opacity: 0,
  transition: "opacity .12s ease",
};

const VISIBLE_STYLE = { opacity: 1 };

export default function Tooltip({ tip, placement = "top", children }) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { delay: { open: 200, close: 0 } });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss, role]);

  // If the child is a valid React element, clone it with ref + props.
  // Otherwise wrap in a span.
  const refProps = getReferenceProps();
  const child = isValidElement(children)
    ? cloneElement(children, { ref: refs.setReference, ...refProps })
    : <span ref={refs.setReference} {...refProps} style={{ display: "inline-flex", alignItems: "center" }}>{children}</span>;

  return (
    <>
      {child}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...TOOLTIP_STYLE, ...floatingStyles, ...(open ? VISIBLE_STYLE : {}) }}
            {...getFloatingProps()}
          >
            {tip}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
