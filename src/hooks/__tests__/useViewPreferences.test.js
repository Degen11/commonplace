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
