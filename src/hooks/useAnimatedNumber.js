import { useState, useEffect, useRef } from "react";

/**
 * Animates a number smoothly from its previous value to the target.
 * Uses requestAnimationFrame for 60fps interpolation.
 *
 * @param {number} target - The target number to animate to
 * @param {number} [duration=300] - Animation duration in ms
 * @returns {number} The current animated value (rounded to integer)
 */
export default function useAnimatedNumber(target, duration = 300) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(target);
  const initialMount = useRef(true);

  useEffect(() => {
    // Skip animation on initial mount — show the number immediately
    if (initialMount.current) {
      initialMount.current = false;
      fromRef.current = target;
      setDisplay(target);
      return;
    }

    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) return;

    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + diff * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // When interrupted, snap fromRef so next animation starts from current position
      fromRef.current = target;
    };
  }, [target, duration]);

  return display;
}
