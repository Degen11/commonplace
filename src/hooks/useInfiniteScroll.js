import { useState, useEffect, useRef, useCallback } from "react";

const PAGE_SIZE = 100;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Reset to first page when the list changes (filter, sort, new quotes)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  // Observe sentinel — reconnect whenever visibleCount changes so that
  // if the sentinel is *still* in view after a batch loads, we load more.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => {
            const next = prev + PAGE_SIZE;
            return next >= filtered.length ? filtered.length : next;
          });
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return { visible, hasMore, remaining, sentinelRef };
}