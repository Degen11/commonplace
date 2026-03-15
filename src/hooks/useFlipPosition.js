import { useState, useEffect } from "react";

/**
 * Viewport-aware flip positioning for dropdowns and popups.
 * Measures the element on mount and flips its direction if it would overflow.
 *
 * @param {React.RefObject} ref - the element to measure
 * @param {number} [margin=8] - minimum distance from viewport edge in px
 * @returns {{ flipUp: boolean, flipLeft: boolean }}
 */
export default function useFlipPosition(ref, margin = 8) {
  const [flipUp, setFlipUp] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - margin) setFlipUp(true);
    if (rect.right > window.innerWidth - margin) setFlipLeft(true);
  }, [ref, margin]);

  return { flipUp, flipLeft };
}
