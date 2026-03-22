import { useEffect } from "react";

/**
 * Locks body scroll while the component is mounted.
 * Compensates for scrollbar width to prevent layout shift.
 * Uses a reference count so nested modals don't unlock prematurely.
 * Handles iOS Safari scroll bounce via position:fixed + scroll offset.
 */
let lockCount = 0;
let scrollY = 0;

export default function useScrollLock() {
  useEffect(() => {
    lockCount++;
    if (lockCount === 1) {
      scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      // iOS Safari: position:fixed prevents background scroll bounce
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    }
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        window.scrollTo(0, scrollY);
      }
    };
  }, []);
}
