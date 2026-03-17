import { useState, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import { SWIPE_THRESHOLD_PX, SWIPE_CANCEL_Y_PX } from "../config";

export default function useSwipe({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const [offsetX, setOffsetX] = useState(0);
  // Refs to avoid stale closures in the gesture callback
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  const bind = useDrag(
    ({ movement: [mx, my], last, cancel, memo = false }) => {
      // If vertical movement exceeds threshold, cancel the gesture
      if (!memo && Math.abs(my) > SWIPE_CANCEL_Y_PX) {
        cancel();
        setOffsetX(0);
        return true; // memo = cancelled
      }
      if (memo) return true; // already cancelled

      // Dampen the offset for a rubber-band feel
      const dampened = mx * 0.6;

      if (last) {
        setOffsetX(0);
        if (dampened < -SWIPE_THRESHOLD_PX && onSwipeLeftRef.current) onSwipeLeftRef.current();
        else if (dampened > SWIPE_THRESHOLD_PX && onSwipeRightRef.current) onSwipeRightRef.current();
      } else {
        setOffsetX(dampened);
      }
      return memo;
    },
    {
      enabled,
      axis: "lock",
      filterTaps: true,
      pointer: { touch: true },
    },
  );

  return { offsetX, swipeHandlers: enabled ? bind() : {} };
}
