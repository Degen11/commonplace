import { useState, useEffect, useRef } from "react";

const PAGE_SIZE = 100;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Reset to first page when the list changes (filter, sort, new quotes)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  // Auto-load more when sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

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
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return { visible, hasMore, remaining, sentinelRef };
}
