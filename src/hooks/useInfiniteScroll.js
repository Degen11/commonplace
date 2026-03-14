import { useState, useEffect, useCallback, useMemo } from "react";
import { INFINITE_SCROLL_PAGE } from "../config";

const PAGE_SIZE = INFINITE_SCROLL_PAGE;

export default function useInfiniteScroll(filtered, resetKey) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Only reset when the actual filter criteria change, not on every render
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [resetKey]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return {
    visible,
    hasMore: visibleCount < filtered.length,
    remaining: filtered.length - Math.min(visibleCount, filtered.length),
    loadMore,
  };
}