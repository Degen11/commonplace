import { describe, it, expect } from "vitest";
import { makeQuote, findDuplicateGroups, splitSource, isUnknownSource } from "../quotes";

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

describe("splitSource", () => {
  it("splits author and work at a comma", () => {
    expect(splitSource("J.R.R. Tolkien, The Fellowship of the Ring")).toEqual({ primary: "J.R.R. Tolkien", secondary: "The Fellowship of the Ring" });
  });

  it("splits at a spaced hyphen or dash", () => {
    expect(splitSource("Cosmos (1980) - Carl Sagan")).toEqual({ primary: "Cosmos (1980)", secondary: "Carl Sagan" });
    expect(splitSource("Friedrich Nietzsche \u2014 Twilight of the Idols")).toEqual({ primary: "Friedrich Nietzsche", secondary: "Twilight of the Idols" });
  });

  it("splits only once", () => {
    expect(splitSource("A, B, C")).toEqual({ primary: "A", secondary: "B, C" });
  });

  it("keeps single sources whole", () => {
    expect(splitSource("Socrates")).toEqual({ primary: "Socrates", secondary: "" });
    expect(splitSource("Jean-Paul Sartre")).toEqual({ primary: "Jean-Paul Sartre", secondary: "" });
  });

  it("does not split inside parentheses", () => {
    const s = "Attributed to various sources (popularized in self-help, literature)";
    expect(splitSource(s)).toEqual({ primary: s, secondary: "" });
  });

  it("keeps name suffixes with the name", () => {
    expect(splitSource("Martin Luther King, Jr.")).toEqual({ primary: "Martin Luther King, Jr.", secondary: "" });
    expect(splitSource("Martin Luther King, Jr., I Have a Dream")).toEqual({ primary: "Martin Luther King, Jr.", secondary: "I Have a Dream" });
  });

  it("handles empty input", () => {
    expect(splitSource("")).toEqual({ primary: "", secondary: "" });
    expect(splitSource(undefined)).toEqual({ primary: "", secondary: "" });
  });
});

describe("isUnknownSource", () => {
  it("treats the unknown marker and blanks as unknown", () => {
    expect(isUnknownSource("Unknown source")).toBe(true);
    expect(isUnknownSource("")).toBe(true);
    expect(isUnknownSource("   ")).toBe(true);
    expect(isUnknownSource("Socrates")).toBe(false);
  });
});
