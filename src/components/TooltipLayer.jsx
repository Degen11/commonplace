import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// The one renderer for `.ui-tip` / `data-tip` tooltips.
//
// Tooltips used to be a CSS ::after pseudo-element on the trigger, which any
// ancestor with overflow:hidden (sidebar rail, notification-bar animation
// wrappers, horizontal scrollers) or its own stacking context (card-grid
// wrappers) clipped or buried. Every such container needed its own escape
// hatch. This layer instead renders a single position:fixed element in a
// portal on <body>, positioned from the trigger's bounding box, so no
// container can clip it.
//
// The markup API is unchanged: `className="ui-tip"` plus `data-tip="…"`, with
// `ui-tip-below`, `ui-tip-left` (above, right-aligned) or `ui-tip-right`
// (beside, to the right) for placement. Mounted once, in App.
//
// Behaviour kept from the CSS version: mouse hover only (touch devices get no
// tooltips), a short show delay, hidden on press, and hidden while the
// trigger's own menu/popover is open.

const SHOW_DELAY_MS = 200;
const GAP = 6;
const EDGE = 8;

const placementOf = (el) =>
  el.classList.contains("ui-tip-below") ? "below"
  : el.classList.contains("ui-tip-right") ? "right"
  : el.classList.contains("ui-tip-left") ? "left"
  : "above";

const popupOpen = (el) =>
  el.hasAttribute("data-popup-open")
  || (el.hasAttribute("aria-haspopup") && el.getAttribute("aria-expanded") === "true");

// Where the tooltip goes for a trigger rect and tooltip size, kept on screen.
export function tooltipPosition(place, r, w, h, vw, vh) {
  let top, left;
  if (place === "right") {
    left = r.right + GAP;
    top = r.top + r.height / 2 - h / 2;
  } else {
    top = place === "below" ? r.bottom + GAP : r.top - GAP - h;
    left = place === "left" ? r.right - w : r.left + r.width / 2 - w / 2;
    // No room above: flip below (and vice versa)
    if (place !== "below" && top < EDGE) top = r.bottom + GAP;
    else if (place === "below" && top + h > vh - EDGE) top = r.top - GAP - h;
  }
  left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - EDGE - w));
  top = Math.min(Math.max(top, EDGE), Math.max(EDGE, vh - EDGE - h));
  return { top: Math.round(top), left: Math.round(left) };
}

export default function TooltipLayer() {
  const [tip, setTip] = useState(null); // { el, text, place }
  const nodeRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia?.("(hover: hover)").matches) return;
    let current = null;
    let timer = null;

    const hide = () => {
      clearTimeout(timer);
      current = null;
      setTip(null);
    };
    const show = (el) => {
      const text = el.getAttribute("data-tip");
      if (!text || popupOpen(el)) return;
      setTip({ el, text, place: placementOf(el) });
    };

    const onOver = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const el = e.target.closest?.(".ui-tip[data-tip]");
      if (el === current) return;
      hide();
      if (!el) return;
      current = el;
      timer = setTimeout(() => show(el), SHOW_DELAY_MS);
    };
    const onOut = (e) => {
      if (!current) return;
      if (e.relatedTarget && current.contains(e.relatedTarget)) return;
      hide();
    };

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("blur", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  // While shown, follow the trigger: a changed data-tip (e.g. "Copy" → "Copied")
  // updates the text, an opened menu or a removed trigger hides it.
  useEffect(() => {
    if (!tip) return;
    const { el } = tip;
    const sync = () => {
      if (!el.isConnected || popupOpen(el) || !el.getAttribute("data-tip")) {
        setTip(null);
        return;
      }
      const text = el.getAttribute("data-tip");
      setTip(t => (t && t.el === el && t.text !== text ? { ...t, text } : t));
    };
    const attrs = new MutationObserver(sync);
    attrs.observe(el, { attributes: true, attributeFilter: ["data-tip", "aria-expanded", "data-popup-open"] });
    const tree = new MutationObserver(sync);
    tree.observe(document.body, { childList: true, subtree: true });
    return () => { attrs.disconnect(); tree.disconnect(); };
  }, [tip]);

  // Position after render, once the tooltip's own size is known
  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!tip || !node) return;
    const { top, left } = tooltipPosition(
      tip.place, tip.el.getBoundingClientRect(), node.offsetWidth, node.offsetHeight,
      window.innerWidth, window.innerHeight,
    );
    node.style.transform = `translate(${left}px, ${top}px)`;
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div ref={nodeRef} className="ui-tip-layer" aria-hidden="true">
      {tip.text}
    </div>,
    document.body,
  );
}
