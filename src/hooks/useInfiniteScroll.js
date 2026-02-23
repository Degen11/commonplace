import { useState, useEffect } from "react";

const PAGE_SIZE = 100;
const SCROLL_THRESHOLD = 600;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset to first page when the list changes (filter, sort, new quotes)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  // Load more when user scrolls near the bottom of the page
  useEffect(() => {
    if (visibleCount >= filtered.length) return;

    const handleScroll = () => {
      const scrollBottom =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;

      if (scrollBottom < SCROLL_THRESHOLD) {
        setVisibleCount((prev) => {
          const next = prev + PAGE_SIZE;
          return next >= filtered.length ? filtered.length : next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check immediately in case already near bottom
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return { visible, hasMore, remaining };
}