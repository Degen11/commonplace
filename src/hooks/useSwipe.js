import { useRef, useCallback, useState, useEffect } from "react";

const THRESHOLD = 80;  // px to trigger action
const CANCEL_Y = 30;   // vertical movement cancels swipe

export default function useSwipe({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const [offsetX, setOffsetX] = useState(0);
  const tracking = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cancelled = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    tracking.current = true;
    cancelled.current = false;
  }, [enabled]);

  const onTouchMove = useCallback((e) => {
    if (!tracking.current || cancelled.current) return;
    const touch = e.touches[0];
    const dy = Math.abs(touch.clientY - startY.current);
    if (dy > CANCEL_Y) {
      cancelled.current = true;
      setOffsetX(0);
      return;
    }
    const dx = touch.clientX - startX.current;
    // Dampen the offset for a rubber-band feel
    setOffsetX(dx * 0.6);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;
    const dx = offsetX;
    setOffsetX(0);
    if (cancelled.current) return;
    if (dx < -THRESHOLD && onSwipeLeft) onSwipeLeft();
    else if (dx > THRESHOLD && onSwipeRight) onSwipeRight();
  }, [offsetX, onSwipeLeft, onSwipeRight]);

  // Reset if disabled mid-swipe
  useEffect(() => {
    if (!enabled) {
      tracking.current = false;
      setOffsetX(0);
    }
  }, [enabled]);

  return { offsetX, swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
