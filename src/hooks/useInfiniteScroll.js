import { useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 100;

export default function useInfiniteScroll(filtered) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filtered]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  return {
    visible: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    remaining: filtered.length - Math.min(visibleCount, filtered.length),
    loadMore,
  };
}