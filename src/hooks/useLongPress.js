import { useRef, useCallback, useEffect } from "react";
import { LONG_PRESS_MS, LONG_PRESS_MOVE_PX } from "../config";

// Long-press hook for mobile selection.
// Uses raw touch events to avoid handler collisions with useSwipe's
// @use-gesture/react bindings (both are spread onto the same element).
// Enhanced with velocity-based cancellation: fast initial movement
// cancels immediately, improving scroll vs press conflict handling.
const VELOCITY_CANCEL_THRESHOLD = 0.4; // px/ms — fast swipe cancels long-press

export default function useLongPress(onLongPress, ms = LONG_PRESS_MS) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  const onTouchStart = useCallback((e) => {
    movedRef.current = false;
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    startTime.current = performance.now();
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) {
        navigator.vibrate?.(10);
        onLongPress();
      }
    }, ms);
  }, [onLongPress, ms]);

  const onTouchMove = useCallback((e) => {
    if (timerRef.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPos.current.x);
      const dy = Math.abs(touch.clientY - startPos.current.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Cancel on distance threshold
      if (dx > LONG_PRESS_MOVE_PX || dy > LONG_PRESS_MOVE_PX) {
        movedRef.current = true;
        clearTimeout(timerRef.current);
        timerRef.current = null;
        return;
      }

      // Cancel on high velocity (fast scroll gesture)
      const elapsed = performance.now() - startTime.current;
      if (elapsed > 0 && distance / elapsed > VELOCITY_CANCEL_THRESHOLD) {
        movedRef.current = true;
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
