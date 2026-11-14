// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock the heavy 477KB dynamic import so tests don't stall
vi.mock("../../data/localQuotes", () => ({
  default: [],
  localLookup: () => null,
}));

// Keep textFormatting mostly real; stub initProperNouns (needs localDb array)
// and the similarity fns (prevents false-positive dupe detection on synthetic
// test data). makeSimilarityKey stays real so seenExact norm keys still work.
vi.mock("../../utils/textFormatting", async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, initProperNouns: vi.fn(), similarity: vi.fn(() => 0), similarityFromKeys: vi.fn(() => 0) };
});

import useProcessing from "../useProcessing";
import { DEFAULT_CATEGORIES } from "../../data/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeApiOk(items) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        results: items.map((_, i) => ({
          i,
          source: "Test Author",
          category: "Book",
          confidence: "high",
        })),
      }),
  };
}

function makeNetworkError() {
  return Promise.reject(new TypeError("Failed to fetch"));
}

function setup() {
  const setQuotes = vi.fn();
  const goPhase = vi.fn();
  const { result } = renderHook(() =>
    useProcessing({ quotes: [], setQuotes, allCats: DEFAULT_CATEGORIES, goPhase }),
  );
  return { result, setQuotes, goPhase };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("API timeout / network failure — batch retry", () => {
  let originalFetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retries a failed batch and succeeds on the second attempt", async () => {
    let identifyCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.includes("/api/identify")) {
        identifyCallCount++;
        if (identifyCallCount === 1) return makeNetworkError();
        // Retry attempt: success
        return Promise.resolve(makeApiOk([{ text: "test quote" }]));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      result.current.processEntries("test quote");
    });

    // Flush the PROCESSING_DONE_MS auto-transition timer
    await act(async () => {
      vi.runAllTimers();
    });

    // The retry should have been called
    expect(identifyCallCount).toBe(2);
    // Quotes should have been set (batch eventually succeeded)
    expect(setQuotes).toHaveBeenCalled();
    // No items should be in failedEntries
    expect(result.current.failedEntries).toHaveLength(0);
  });

  it("marks items as failed after two consecutive failures and sets apiError", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.includes("/api/identify")) return makeNetworkError();
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result } = setup();

    await act(async () => {
      await result.current.processEntries("test quote — some author");
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Both attempts failed — item should be in failedEntries
    expect(result.current.failedEntries).toHaveLength(1);
    // text field contains what smartParse extracted (may include source hint)
    expect(result.current.failedEntries[0].text).toContain("test quote");
    // An API error message should be shown
    expect(result.current.apiError).toBeTruthy();
    expect(result.current.apiError).toMatch(/entry affected/i);
  });

  it("continues processing remaining batches when one batch fails after retry", async () => {
    // 12 items → 2 batches (10 + 2). Batch 1 fails both attempts; batch 2 succeeds.
    const quotes = Array.from({ length: 12 }, (_, i) => `Quote ${i + 1}`).join("\n");
    let identifyCallCount = 0;
    const batchSizes = [];

    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url === "/api/identify") {
        identifyCallCount++;
        const { items } = JSON.parse(opts.body);
        batchSizes.push(items.length);
        // Batch 1 (10 items) fails on both the attempt and the retry
        if (items.length === 10) return makeNetworkError();
        // Batch 2 (2 items): return 2 successful results
        return Promise.resolve(makeApiOk(items));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      await result.current.processEntries(quotes);
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // batch 1 attempt + batch 1 retry + batch 2 — no early exit, no extra calls.
    // Batch 2 runs alongside batch 1, so it starts before batch 1's retry.
    expect(identifyCallCount).toBe(3);
    expect(batchSizes).toEqual([10, 2, 10]);
    // Exactly batch 1's 10 entries are reported as failed
    expect(result.current.failedEntries).toHaveLength(10);
    expect(result.current.failedEntries.map(e => e.text)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Quote ${i + 1}`),
    );
    expect(result.current.apiError).toMatch(/10 entries affected/);
    // Batch 2's two quotes reached the store with the AI's identification
    expect(setQuotes).toHaveBeenCalledTimes(1);
    const saved = setQuotes.mock.calls[0][0];
    const identified = saved.filter(q => q.source === "Test Author");
    expect(identified.map(q => q.text)).toEqual(["Quote 11", "Quote 12"]);
    expect(identified.every(q => q.category === "Book" && q.confidence === "high")).toBe(true);
  });

  it("error message includes the count of affected entries for that batch", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.includes("/api/identify")) return makeNetworkError();
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result } = setup();

    await act(async () => {
      result.current.processEntries("quote one\nquote two\nquote three");
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Should mention entries affected, not just a generic message
    expect(result.current.apiError).toMatch(/entries? affected/i);
  });
});

describe("localStorage quota exceeded", () => {
  it("saveToStorage returns false when quota is exceeded", async () => {
    const { saveToStorage } = await import("../../utils/storage");
    const orig = globalThis.localStorage?.setItem;
    try {
      // Simulate a QuotaExceededError
      Object.defineProperty(globalThis, "localStorage", {
        value: {
          getItem: () => null,
          setItem: () => { throw new DOMException("QuotaExceededError"); },
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });
      expect(saveToStorage("test_key", [1, 2, 3])).toBe(false);
    } finally {
      if (orig !== undefined) {
        Object.defineProperty(globalThis, "localStorage", {
          value: { ...globalThis.localStorage, setItem: orig },
          writable: true,
          configurable: true,
        });
      }
    }
  });

  it("loadFromStorage returns fallback when localStorage.getItem throws", async () => {
    const { loadFromStorage } = await import("../../utils/storage");
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => { throw new Error("SecurityError"); },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      writable: true,
      configurable: true,
    });
    const result = loadFromStorage("any_key", Array.isArray, ["default"]);
    expect(result).toEqual(["default"]);
  });
});
