import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchWikiquote, searchOpenLibrary, inferCategory } from "../lookup.js";

function mockWikiquoteResponse(results) {
  return {
    ok: true,
    json: () => Promise.resolve({ query: { search: results } }),
  };
}

function mockOpenLibraryResponse(docs) {
  return {
    ok: true,
    json: () => Promise.resolve({ docs }),
  };
}

// The real misattribution this whole pipeline change was built around: a long
// paraphrase-friendly quote from The Secret Life of Walter Mitty (2013) that
// shares generic words ("life," "purpose," "find," "feel") with tons of
// unrelated Wikiquote pages.
const WALTER_MITTY_QUOTE =
  "To see the world, things dangerous to come to, to see behind walls, draw closer, to find each other, and to feel. That is the purpose of life";

describe("inferCategory", () => {
  it("is certain for an explicit film annotation", () => {
    expect(inferCategory("Some Movie (2008 film)")).toEqual({ category: "Film", certain: true });
    expect(inferCategory("Some Movie (film)")).toEqual({ category: "Film", certain: true });
  });

  it("is certain for explicit TV/game/book/music annotations", () => {
    expect(inferCategory("Some Show (TV series)")).toEqual({ category: "TV", certain: true });
    expect(inferCategory("Some Game (video game)")).toEqual({ category: "Game", certain: true });
    expect(inferCategory("Some Novel (novel)")).toEqual({ category: "Book", certain: true });
    expect(inferCategory("Some Song (song)")).toEqual({ category: "Music", certain: true });
  });

  it("treats a bare year as an uncertain Film guess, not a confirmed type", () => {
    expect(inferCategory("Some Title (1980)")).toEqual({ category: "Film", certain: false });
  });

  it("falls back to an uncertain Reflection when nothing matches, including a year range", () => {
    expect(inferCategory("Just A Title")).toEqual({ category: "Reflection", certain: false });
    expect(inferCategory(null)).toEqual({ category: "Reflection", certain: false });
    // A birth-death range isn't a bare "(YYYY)" so it doesn't even hit the Film guess
    expect(inferCategory("Some Person (1926-2022)")).toEqual({ category: "Reflection", certain: false });
  });
});

describe("searchWikiquote", () => {
  let originalFetch;
  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

  it("returns null when there are no search results", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockWikiquoteResponse([]));
    expect(await searchWikiquote("some quote")).toBeNull();
  });

  it("returns null when the top result has no year in its title", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockWikiquoteResponse([
      { title: "Consciousness", snippet: WALTER_MITTY_QUOTE },
    ]));
    expect(await searchWikiquote(WALTER_MITTY_QUOTE)).toBeNull();
  });

  it("rejects a coincidental match on generic shared words alone (the original bug)", async () => {
    // Shares only "find," "feel," "purpose," "life" with the real quote —
    // exactly the kind of accidental overlap that used to slip through.
    globalThis.fetch = vi.fn().mockResolvedValue(mockWikiquoteResponse([
      {
        title: "Unrelated Person (1920-1990)",
        snippet: "Life has its own purpose, and to find that purpose you must feel your way through it.",
      },
    ]));
    expect(await searchWikiquote(WALTER_MITTY_QUOTE)).toBeNull();
  });

  it("accepts a real strong overlap but caps confidence at medium when the category is a guess", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockWikiquoteResponse([
      {
        title: "The Secret Life of Walter Mitty (2013)",
        snippet: WALTER_MITTY_QUOTE,
      },
    ]));
    const result = await searchWikiquote(WALTER_MITTY_QUOTE);
    expect(result).not.toBeNull();
    expect(result.source).toBe("The Secret Life of Walter Mitty (2013)");
    // Bare "(2013)" with no explicit type tag is a guess — never "high" on its own
    expect(result.confidence).toBe("medium");
  });

  it("returns high confidence when overlap is strong and the type is explicit", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockWikiquoteResponse([
      {
        title: "The Secret Life of Walter Mitty (2013 film)",
        snippet: WALTER_MITTY_QUOTE,
      },
    ]));
    const result = await searchWikiquote(WALTER_MITTY_QUOTE);
    expect(result.confidence).toBe("high");
    expect(result.category).toBe("Film");
  });
});

describe("searchOpenLibrary", () => {
  let originalFetch;
  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = originalFetch; vi.restoreAllMocks(); });

  it("returns null without a hint", async () => {
    expect(await searchOpenLibrary(null)).toBeNull();
  });

  it("rejects a top hit that doesn't actually match the hint", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockOpenLibraryResponse([
      { title: "Completely Different Title", author_name: ["Some Author"], first_publish_year: 1990 },
    ]));
    expect(await searchOpenLibrary("The Great Gatsby")).toBeNull();
  });

  it("accepts a real title match but never returns high confidence", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockOpenLibraryResponse([
      { title: "The Great Gatsby", author_name: ["F. Scott Fitzgerald"], first_publish_year: 1925 },
    ]));
    const result = await searchOpenLibrary("The Great Gatsby");
    expect(result.source).toBe("The Great Gatsby (1925) - F. Scott Fitzgerald");
    // Open Library can't confirm the exact quote is in the book, so it's
    // always a lead for the AI to confirm, never a confident match on its own
    expect(result.confidence).toBe("medium");
  });
});
