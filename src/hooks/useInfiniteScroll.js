import { useState, useEffect, useRef, useCallback } from "react";

const PAGE_SIZE = 100;
const SCROLL_THRESHOLD = 800;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Refs so the scroll handler always sees current values
  // without needing to re-register the listener
  const visibleCountRef = useRef(visibleCount);
  const filteredLenRef = useRef(filtered.length);
  visibleCountRef.current = visibleCount;
  filteredLenRef.current = filtered.length;

  // Reset when the filtered list changes (new quotes, filter, sort)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  // Single scroll listener — registered once, never re-registers
  useEffect(() => {
    const handleScroll = () => {
      if (visibleCountRef.current >= filteredLenRef.current) return;

      const scrollBottom =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;

      if (scrollBottom < SCROLL_THRESHOLD) {
        setVisibleCount((prev) => {
          const next = prev + PAGE_SIZE;
          return next >= filteredLenRef.current
            ? filteredLenRef.current
            : next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Manual fallback in case scroll doesn't trigger
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = prev + PAGE_SIZE;
      return next >= filteredLenRef.current
        ? filteredLenRef.current
        : next;
    });
  }, []);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return { visible, hasMore, remaining, loadMore };
}