import { useState, useEffect } from "react";
import { INFINITE_SCROLL_PAGE } from "../config";

const PAGE_SIZE = INFINITE_SCROLL_PAGE;

export default function useInfiniteScroll(filtered, resetKey) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination when filter criteria change
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setVisibleCount(PAGE_SIZE);
  }

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
  };

  const visible = filtered.slice(0, visibleCount);

  return {
    visible,
    hasMore: visibleCount < filtered.length,
    remaining: filtered.length - Math.min(visibleCount, filtered.length),
    loadMore,
  };
}