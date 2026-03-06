import { useRef, useCallback, useEffect } from "react";

// Long-press hook for mobile selection
export default function useLongPress(onLongPress, ms = 400) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    movedRef.current = false;
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) {
        onLongPress();
      }
    }, ms);
  }, [onLongPress, ms]);

  const onTouchMove = useCallback((e) => {
    if (timerRef.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPos.current.x);
      const dy = Math.abs(touch.clientY - startPos.current.y);
      if (dx > 10 || dy > 10) {
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

  // Clean up timer if component unmounts during a long press
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
