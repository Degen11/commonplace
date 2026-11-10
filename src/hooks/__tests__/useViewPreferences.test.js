// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useViewPreferences from "../useViewPreferences";
import { LS_FILTERS } from "../../config";

const q = (id, text, extra = {}) => ({
  id, text, source: "S", category: "Reflection", confidence: "high", favorite: false, ...extra,
});

beforeEach(() => localStorage.clear());

describe("useViewPreferences — filters", () => {
  it("counts the favorites filter as active and clearFilters resets everything", () => {
    const quotes = [q("1", "a"), q("2", "b", { favorite: true })];
    const { result } = renderHook(() => useViewPreferences(quotes));
    expect(result.current.hasActiveFilters).toBeFalsy();

    act(() => result.current.setFavFilter(true));
    expect(result.current.hasActiveFilters).toBeTruthy();

    act(() => { result.current.setCatFilter("Reflection"); result.current.setSortBy("alpha"); });
    act(() => result.current.clearFilters());
    expect(result.current.favFilter).toBe(false);
    expect(result.current.catFilter).toBe("All");
    expect(result.current.sortBy).toBe("default");
    expect(result.current.hasActiveFilterOrSort).toBeFalsy();
  });
});

describe("useViewPreferences — getComputedStats", () => {
  it("returns null for an empty collection", () => {
    const { result } = renderHook(() => useViewPreferences([]));
    expect(result.current.getComputedStats()).toBeNull();
  });

  it("computes shortest/longest/avgWords and top sources on demand", () => {
    const quotes = [
      q("1", "short", { source: "Seneca" }),                        // 1 word
      q("2", "a", { source: "Seneca" }),                            // shortest, 1 word
      q("3", "this is a much longer quote here", { source: "Marcus" }), // longest, 7 words
    ];
    const { result } = renderHook(() => useViewPreferences(quotes));
    const stats = result.current.getComputedStats();
    expect(stats.shortest.text).toBe("a");
    expect(stats.longest.text).toBe("this is a much longer quote here");
    expect(stats.avgWords).toBe(Math.round((1 + 1 + 7) / 3)); // 3
    expect(stats.topSrcs[0]).toEqual(["Seneca", 2]); // most-frequent source first
  });
});

describe("useViewPreferences — persistence", () => {
  it("persists filters on the debounced search, not on every keystroke", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useViewPreferences([q("1", "a")]));
      // Mount wrote the initial filters with an empty search.
      expect(JSON.parse(localStorage.getItem(LS_FILTERS)).search).toBe("");

      act(() => result.current.setSearch("abc"));
      // Immediately after typing, storage must NOT yet carry the new term.
      expect(JSON.parse(localStorage.getItem(LS_FILTERS)).search).toBe("");

      act(() => vi.advanceTimersByTime(300)); // SEARCH_DEBOUNCE_MS
      expect(JSON.parse(localStorage.getItem(LS_FILTERS)).search).toBe("abc");
    } finally {
      vi.useRealTimers();
    }
  });
});

// Filtering and sorting run through the hook's real `filtered` list — these
// replace copies of the filter/sort logic that used to live in ResultsPhase.test.jsx.
describe("useViewPreferences — filtering", () => {
  const quotes = [
    q("q1", "To be or not to be", { source: "Shakespeare", category: "Book", favorite: true }),
    q("q2", "I think therefore I am", { source: "Descartes", category: "Philosophical" }),
    q("q3", "Carpe diem", { source: "Horace", category: "Speech", favorite: true }),
    q("q4", "The unexamined life is not worth living", { source: "Socrates", category: "Philosophical" }),
  ];
  const ids = (list) => list.map(x => x.id);

  it("returns every quote, in store order, with no filters", () => {
    const { result } = renderHook(() => useViewPreferences(quotes));
    expect(ids(result.current.filtered)).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("catFilter keeps only that category", () => {
    const { result } = renderHook(() => useViewPreferences(quotes));
    act(() => result.current.setCatFilter("Philosophical"));
    expect(ids(result.current.filtered)).toEqual(["q2", "q4"]);
    act(() => result.current.setCatFilter("All"));
    expect(ids(result.current.filtered)).toHaveLength(4);
  });

  it("favFilter keeps only favorites", () => {
    const { result } = renderHook(() => useViewPreferences(quotes));
    act(() => result.current.setFavFilter(true));
    expect(ids(result.current.filtered)).toEqual(["q1", "q3"]);
  });

  it("catFilter and favFilter combine", () => {
    const { result } = renderHook(() => useViewPreferences(quotes));
    act(() => { result.current.setCatFilter("Speech"); result.current.setFavFilter(true); });
    expect(ids(result.current.filtered)).toEqual(["q3"]);
    act(() => result.current.setCatFilter("Philosophical"));
    expect(result.current.filtered).toEqual([]);
  });

  it("search filters by text or source once the debounce settles", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useViewPreferences(quotes));
      act(() => result.current.setSearch("Socrates"));
      expect(result.current.filtered).toHaveLength(4); // not applied until debounced
      act(() => vi.advanceTimersByTime(300));
      expect(ids(result.current.filtered)).toEqual(["q4"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("scopes to the active collection", () => {
    const collections = [{ id: "c1", name: "Mine", quoteIds: ["q2", "q3"] }];
    const { result } = renderHook(() => useViewPreferences(quotes, { activeCollectionId: "c1", collections }));
    expect(ids(result.current.filtered)).toHaveLength(4);
    expect(ids(result.current.collectionFiltered)).toEqual(["q2", "q3"]);
  });

  it("counts quotes per category, favorites and quotes needing attention", () => {
    const withLow = [...quotes, q("q5", "Hmm", { category: "Unknown", confidence: "low" })];
    const { result } = renderHook(() => useViewPreferences(withLow));
    expect(result.current.cc).toEqual({ Book: 1, Philosophical: 2, Speech: 1, Unknown: 1 });
    expect(result.current.favCount).toBe(2);
    expect(result.current.unknownCount).toBe(1);
  });
});

describe("useViewPreferences — sorting", () => {
  const quotes = [
    q("a", "Zebra facts are interesting", { category: "Speech", confidence: "high" }),
    q("b", "“Apples are sweet fruit", { category: "Book", confidence: "low" }),
    q("c", "moon lights the night sky tonight", { category: "Poetry", confidence: "medium" }),
  ];
  const sortedIds = (sortBy) => {
    const { result } = renderHook(() => useViewPreferences(quotes));
    act(() => result.current.setSortBy(sortBy));
    return result.current.filtered.map(x => x.id);
  };

  it("default keeps store order", () => {
    expect(sortedIds("default")).toEqual(["a", "b", "c"]);
  });

  it("alpha ignores leading punctuation and case", () => {
    expect(sortedIds("alpha")).toEqual(["b", "c", "a"]);
  });

  it("confidence puts low, then medium, then high", () => {
    expect(sortedIds("confidence")).toEqual(["b", "c", "a"]);
  });

  it("category sorts by category name", () => {
    expect(sortedIds("category")).toEqual(["b", "c", "a"]);
  });

  it("shortest and longest sort by text length", () => {
    // lengths: b 23, a 27, c 33
    expect(sortedIds("shortest")).toEqual(["b", "a", "c"]);
    expect(sortedIds("longest")).toEqual(["c", "a", "b"]);
  });

  it("sorting does not reorder the caller's array", () => {
    sortedIds("alpha");
    expect(quotes.map(x => x.id)).toEqual(["a", "b", "c"]);
  });
});
