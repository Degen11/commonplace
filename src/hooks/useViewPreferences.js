import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import useInfiniteScroll from "./useInfiniteScroll";
import { CONF_ORDER } from "../data/constants";
import { LS_FILTERS, SEARCH_DEBOUNCE_MS } from "../config";
import { loadFromStorage } from "../utils/storage";

const FUSE_OPTIONS = {
  keys: ["text", "source"],
  threshold: 0.2,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const LS_VIEW    = "commonplace_view";
const LS_SORT    = "commonplace_sort";

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
      if (window.innerWidth < 640 && _savedView.view === "table") return "cards";
      return _savedView.view;
    }
    return window.innerWidth < 640 ? "cards" : "table";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // ── Persist preferences ──
  useEffect(() => {
    try { localStorage.setItem(LS_VIEW, JSON.stringify({ view, compact })); } catch(e) {}
  }, [view, compact]);

  useEffect(() => {
    try { localStorage.setItem(LS_SORT, sortBy); } catch(e) {}
  }, [sortBy]);

  useEffect(() => {
    try { localStorage.setItem(LS_FILTERS, JSON.stringify({ cat: catFilter, fav: favFilter, search })); } catch(e) {}
  }, [catFilter, favFilter, search]);

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // ── Responsive ──
  useEffect(() => {
    const h = () => {
      const m = window.innerWidth < 640;
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
    const cc = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
    return {
      cc,
      favCount: quotes.filter(q => q.favorite).length,
      unknownCount: quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length,
    };
  }, [quotes]);

  const hasActiveFilters = catFilter !== "All" || favFilter || search;

  const computedStats = useMemo(() => {
    if (quotes.length === 0) return null;
    const srcCount = {}; quotes.forEach(q => { srcCount[q.source] = (srcCount[q.source] || 0) + 1; });
    const topSrcs  = Object.entries(srcCount).filter(([s]) => s !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sorted   = [...quotes].sort((a, b) => a.text.length - b.text.length);
    const avgWords = Math.round(quotes.reduce((s, q) => s + q.text.split(" ").length, 0) / quotes.length);
    return { topSrcs, shortest: sorted[0], longest: sorted[sorted.length - 1], avgWords };
  }, [quotes]);

  return {
    view, setView,
    compact, setCompact,
    sortBy, setSortBy,
    catFilter, setCatFilter,
    favFilter, setFavFilter,
    search, setSearch,
    isMobile,
    filtered, collectionFiltered, visible, hasMore, remaining, loadMore,
    cc, favCount, unknownCount,
    hasActiveFilters, computedStats,
  };
}
