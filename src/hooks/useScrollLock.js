import { useEffect } from "react";

/**
 * Locks body scroll while the component is mounted.
 * Uses a reference count so nested modals don't unlock prematurely.
 * On touch devices, uses position:fixed to prevent iOS Safari scroll bounce.
 * On desktop, plain overflow:hidden suffices.
 */
let lockCount = 0;
let scrollY = 0;
const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export default function useScrollLock() {
  useEffect(() => {
    lockCount++;
    if (lockCount === 1) {
      scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      if (isTouchDevice) {
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
      }
    }
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
        if (isTouchDevice) {
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.left = "";
          document.body.style.right = "";
          window.scrollTo(0, scrollY);
        }
      }
    };
  }, []);
}
