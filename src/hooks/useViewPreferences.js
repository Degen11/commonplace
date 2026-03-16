import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import useInfiniteScroll from "./useInfiniteScroll";
import { CONF_ORDER } from "../data/constants";
import { LS_FILTERS, LS_VIEW, LS_SORT, LS_SHOW_CONF, SEARCH_DEBOUNCE_MS, MOBILE_BREAKPOINT_PX } from "../config";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { countBy } from "../utils/helpers";

const FUSE_OPTIONS = {
  keys: ["text", "source"],
  threshold: 0.2,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const _savedView = loadFromStorage(LS_VIEW, v => v && typeof v === "object", {});
const _initFilters = loadFromStorage(LS_FILTERS, v => v && typeof v === "object", {});

export const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "confidence", label: "Needs attention first" },
  { key: "alpha",      label: "Alphabetical" },
  { key: "category",   label: "By category" },
  { key: "shortest",   label: "Shortest first" },
  { key: "longest",    label: "Longest first" },
];

export default function useViewPreferences(quotes, { activeCollectionId, collections } = {}) {
  const [view, setView] = useState(() => {
    if (_savedView.view) {
      if (window.innerWidth < MOBILE_BREAKPOINT_PX && _savedView.view === "table") return "cards";
      return _savedView.view;
    }
    return window.innerWidth < MOBILE_BREAKPOINT_PX ? "cards" : "table";
  });
  const [compact, setCompact] = useState(() =>
    typeof _savedView.compact === "boolean" ? _savedView.compact : false
  );
  const [catFilter, setCatFilter]             = useState(_initFilters.cat || "All");
  const [favFilter, setFavFilter]             = useState(!!_initFilters.fav);
  const [search, setSearch]                   = useState(_initFilters.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(_initFilters.search || "");
  const [sortBy, setSortBy] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SORT);
      if (saved && SORT_OPTIONS.some(o => o.key === saved)) return saved;
    } catch { /* ignore */ }
    return "default";
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT_PX);
  const [showConfidence, setShowConfidence] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SHOW_CONF);
      if (saved !== null) return saved === "true";
    } catch { /* ignore */ }
    return true;
  });

  // ── Persist preferences ──
  useEffect(() => {
    saveToStorage(LS_VIEW, { view, compact });
  }, [view, compact]);

  useEffect(() => {
    try { localStorage.setItem(LS_SORT, sortBy); } catch { /* ignore */ }
  }, [sortBy]);

  useEffect(() => {
    try { localStorage.setItem(LS_SHOW_CONF, String(showConfidence)); } catch { /* ignore */ }
  }, [showConfidence]);

  useEffect(() => {
    saveToStorage(LS_FILTERS, { cat: catFilter, fav: favFilter, search });
  }, [catFilter, favFilter, search]);

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // ── Responsive ──
  useEffect(() => {
    const h = () => {
      const m = window.innerWidth < MOBILE_BREAKPOINT_PX;
      setIsMobile(m);
      if (m && view === "table") setView("cards");
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [view]);

  // ── Fuse.js index for fuzzy search ──
  const fuseIndex = useMemo(() => new Fuse(quotes, FUSE_OPTIONS), [quotes]);

  // ── Filtering & sorting ──
  const filtered = useMemo(() => {
    // When searching, use Fuse.js for fuzzy matching
    let searchMatchIds = null;
    if (debouncedSearch) {
      searchMatchIds = new Set(fuseIndex.search(debouncedSearch).map(r => r.item.id));
    }

    const result = quotes.filter(q => {
      if (catFilter !== "All" && q.category !== catFilter) return false;
      if (favFilter && !q.favorite) return false;
      if (searchMatchIds && !searchMatchIds.has(q.id)) return false;
      return true;
    });
    if (sortBy === "confidence") result.sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0));
    else if (sortBy === "alpha") {
      const strip = s => s.replace(/^[^\p{L}\p{N}]+/u, "");
      result.sort((a, b) => strip(a.text).localeCompare(strip(b.text), undefined, { sensitivity: "base" }));
    }
    else if (sortBy === "category") result.sort((a, b) => a.category.localeCompare(b.category, undefined, { sensitivity: "base" }));
    else if (sortBy === "shortest") result.sort((a, b) => a.text.length - b.text.length);
    else if (sortBy === "longest") result.sort((a, b) => b.text.length - a.text.length);
    return result;
  }, [quotes, catFilter, favFilter, debouncedSearch, sortBy, fuseIndex]);

  // Apply collection scoping before pagination so hasMore/remaining counts are accurate
  const collectionFiltered = useMemo(() => {
    if (!activeCollectionId || !collections) return filtered;
    const col = collections.find(c => c.id === activeCollectionId);
    if (!col) return filtered;
    const idSet = new Set(col.quoteIds);
    return filtered.filter(q => idSet.has(q.id));
  }, [filtered, activeCollectionId, collections]);

  const paginationKey = `${catFilter}-${favFilter}-${debouncedSearch}-${sortBy}-${activeCollectionId || "all"}`;
  const { visible, hasMore, remaining, loadMore } = useInfiniteScroll(collectionFiltered, paginationKey);

  // ── Computed stats ──
  const { cc, favCount, unknownCount } = useMemo(() => {
    return {
      cc: countBy(quotes, "category"),
      favCount: quotes.filter(q => q.favorite).length,
      unknownCount: quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length,
    };
  }, [quotes]);

  const hasActiveFilters = catFilter !== "All" || search;
  const hasActiveFilterOrSort = hasActiveFilters || sortBy !== "default";

  const clearFilters = useCallback(() => {
    setCatFilter("All");
    setSearch("");
    setSortBy("default");
  }, []);

  const computedStats = useMemo(() => {
    if (quotes.length === 0) return null;
    const srcCount = countBy(quotes, "source");
    const topSrcs  = Object.entries(srcCount).filter(([s]) => s !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sorted   = [...quotes].sort((a, b) => a.text.length - b.text.length);
    const avgWords = Math.round(quotes.reduce((s, q) => s + q.text.split(" ").length, 0) / quotes.length);
    return { topSrcs, shortest: sorted[0], longest: sorted[sorted.length - 1], avgWords };
  }, [quotes]);

  return {
    view, setView,
    compact, setCompact,
    showConfidence, setShowConfidence,
    sortBy, setSortBy,
    catFilter, setCatFilter,
    favFilter, setFavFilter,
    search, setSearch,
    isMobile,
    filtered, collectionFiltered, visible, hasMore, remaining, loadMore,
    cc, favCount, unknownCount,
    hasActiveFilters, hasActiveFilterOrSort, clearFilters, computedStats,
  };
}
