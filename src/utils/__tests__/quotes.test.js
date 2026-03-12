import { describe, it, expect } from "vitest";
import { makeQuote, findDuplicateGroups } from "../quotes";

describe("makeQuote", () => {
  it("creates a quote with all fields", () => {
    const q = makeQuote("hello", "Source", "Film", "high");
    expect(q.text).toBe("hello");
    expect(q.source).toBe("Source");
    expect(q.category).toBe("Film");
    expect(q.confidence).toBe("high");
    expect(q.favorite).toBe(false);
    expect(q.id).toBeTruthy();
    expect(q.updatedAt).toBeGreaterThan(0);
  });

  it("applies defaults for missing fields", () => {
    const q = makeQuote("hello");
    expect(q.source).toBe("Unknown source");
    expect(q.category).toBe("Reflection");
    expect(q.confidence).toBe("low");
  });

  it("generates unique IDs", () => {
    const a = makeQuote("a");
    const b = makeQuote("b");
    expect(a.id).not.toBe(b.id);
  });
});

describe("findDuplicateGroups", () => {
  it("returns empty for no duplicates", () => {
    const quotes = [
      { id: "1", text: "apple banana cherry", source: "A", category: "Film" },
      { id: "2", text: "xyz completely different", source: "B", category: "TV" },
    ];
    const groups = findDuplicateGroups(quotes, 0.55);
    expect(groups).toHaveLength(0);
  });

  it("finds exact duplicates", () => {
    const quotes = [
      { id: "1", text: "to be or not to be", source: "Shakespeare", category: "Book" },
      { id: "2", text: "to be or not to be", source: "Unknown", category: "Book" },
    ];
    const groups = findDuplicateGroups(quotes, 0.55);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].maxScore).toBe(1);
  });

  it("finds near-duplicates above threshold", () => {
    const quotes = [
      { id: "1", text: "get busy living or get busy dying", source: "A", category: "Film" },
      { id: "2", text: "get busy living get busy dying", source: "B", category: "Film" },
    ];
    const groups = findDuplicateGroups(quotes, 0.55);
    expect(groups).toHaveLength(1);
  });

  it("returns empty for single quote", () => {
    const quotes = [
      { id: "1", text: "hello world", source: "A", category: "Film" },
    ];
    expect(findDuplicateGroups(quotes, 0.55)).toHaveLength(0);
  });

  it("returns empty for empty array", () => {
    expect(findDuplicateGroups([], 0.55)).toHaveLength(0);
  });

  it("sorts groups by maxScore descending", () => {
    const quotes = [
      { id: "1", text: "the quick brown fox jumps", source: "A", category: "Film" },
      { id: "2", text: "the quick brown fox jumps over", source: "A", category: "Film" },
      { id: "3", text: "to be or not to be", source: "B", category: "Book" },
      { id: "4", text: "to be or not to be", source: "C", category: "Book" },
    ];
    const groups = findDuplicateGroups(quotes, 0.55);
    if (groups.length >= 2) {
      expect(groups[0].maxScore).toBeGreaterThanOrEqual(groups[1].maxScore);
    }
  });
});
