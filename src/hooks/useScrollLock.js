import { useEffect } from "react";

/**
 * Locks body scroll while the component is mounted.
 * Compensates for scrollbar width to prevent layout shift.
 * Uses a reference count so nested modals don't unlock prematurely.
 */
let lockCount = 0;

export default function useScrollLock() {
  useEffect(() => {
    lockCount++;
    if (lockCount === 1) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, []);
}
