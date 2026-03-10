import { useEffect } from "react";

/**
 * Locks body scroll while the component is mounted.
 * Compensates for scrollbar width to prevent layout shift.
 */
export default function useScrollLock() {
  useEffect(() => {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);
}
