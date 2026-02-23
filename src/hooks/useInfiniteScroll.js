import { useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 100;

export default function useInfiniteScroll(filtered, resetKey) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Only reset when the actual filter criteria change, not on every render
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [resetKey]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  return {
    visible: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    remaining: filtered.length - Math.min(visibleCount, filtered.length),
    loadMore,
  };
}