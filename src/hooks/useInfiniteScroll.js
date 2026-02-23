import { useState, useEffect, useRef } from "react";

const PAGE_SIZE = 100;
const SCROLL_THRESHOLD = 600;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadingRef = useRef(false);
  const rafRef = useRef(null);

  // Reset to first page when the list identity changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    loadingRef.current = false;
  }, [filtered]);

  useEffect(() => {
    if (visibleCount >= filtered.length) return;

    const handleScroll = () => {
      if (loadingRef.current) return;
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const scrollBottom =
          document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight;

        if (scrollBottom < SCROLL_THRESHOLD) {
          loadingRef.current = true;
          setVisibleCount((prev) => {
            const next = prev + PAGE_SIZE;
            return next >= filtered.length ? filtered.length : next;
          });
          // Release the guard after a frame so the DOM can settle
          requestAnimationFrame(() => {
            loadingRef.current = false;
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return { visible, hasMore, remaining };
}