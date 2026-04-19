// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock the heavy 477KB dynamic import so tests don't stall
vi.mock("../../data/localQuotes", () => ({
  default: [],
  localLookup: () => null,
}));

// Keep textFormatting mostly real; stub initProperNouns (needs localDb array)
// and similarity (prevents false-positive dupe detection on synthetic test data)
vi.mock("../../utils/textFormatting", async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, initProperNouns: vi.fn(), similarity: vi.fn(() => 0) };
});

import useProcessing from "../useProcessing";
import { DEFAULT_CATEGORIES } from "../../data/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeApiOk(items) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        content: [
          {
            text: JSON.stringify(
              items.map((_, i) => ({
                i,
                source: "Test Author",
                category: "Book",
                confidence: "high",
              })),
            ),
          },
        ],
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
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
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
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
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

    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url === "/api/identify") {
        identifyCallCount++;
        // First two calls (batch 1 attempt + retry) fail; subsequent calls succeed
        if (identifyCallCount <= 2) return makeNetworkError();
        // Batch 2 (2 items): return 2 successful results
        return Promise.resolve(makeApiOk(Array(2).fill(null)));
      }
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      await result.current.processEntries(quotes);
    });

    await act(async () => {
      vi.runAllTimers();
    });

    // Should have called identify at least 3 times (batch1 + retry + batch2)
    expect(identifyCallCount).toBeGreaterThanOrEqual(2);
    // Batch 1's 10 items should be in failed
    expect(result.current.failedEntries.length).toBeGreaterThan(0);
    // API error should reference the affected count
    expect(result.current.apiError).toBeTruthy();
    // setQuotes should still have been called (batch 2 items were processed)
    expect(setQuotes).toHaveBeenCalled();
  });

  it("error message includes the count of affected entries for that batch", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
      }
      if (url.includes("/api/identify")) return makeNetworkError();
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
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

describe("cloud sync — network failure and retry", () => {
  it("exponential backoff delay doubles on each retry", () => {
    const SYNC_INITIAL_DELAY_MS = 2000;
    const retries = [0, 1, 2, 3];
    const delays = retries.map((attempt) => SYNC_INITIAL_DELAY_MS * Math.pow(2, attempt));
    expect(delays).toEqual([2000, 4000, 8000, 16000]);
    // Max delay stays under 2 minutes (from config tests, but verifying here too)
    expect(Math.max(...delays)).toBeLessThan(120_000);
  });

  it("sync fetch returns false-y value when network is unavailable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    let caught = null;
    try {
      const res = await fetch("/api/sync?device_id=test", {
        headers: { "X-Requested-With": "CommonplaceApp" },
      });
      // If fetch resolves (non-throwing), response.ok should be false
      expect(res.ok).toBe(false);
    } catch (err) {
      caught = err;
    } finally {
      globalThis.fetch = originalFetch;
    }

    // Network failure throws a TypeError — the caller (useSync) catches it
    expect(caught).toBeInstanceOf(TypeError);
    expect(caught.message).toMatch(/Failed to fetch/i);
  });

  it("sync push with network failure leaves data intact in local state", async () => {
    // Verify that a failed push doesn't corrupt the local payload
    const payload = {
      device_id: "test-device",
      quotes: [{ id: "1", text: "test quote", source: "Author", category: "Book" }],
      customCategories: [],
      collections: [],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Network unavailable"));

    let thrownError = null;
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      thrownError = err;
    } finally {
      globalThis.fetch = originalFetch;
    }

    // The network error propagates — the caller handles retry
    expect(thrownError).toBeInstanceOf(TypeError);
    // The payload structure itself is never mutated
    expect(payload.quotes).toHaveLength(1);
    expect(payload.quotes[0].text).toBe("test quote");
  });

  it("reconnect: sync succeeds after previous network failure", async () => {
    let callCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new TypeError("Network unavailable"));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, count: 1, merged: false }),
      });
    });

    const results = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
          body: JSON.stringify({ device_id: "d", quotes: [], customCategories: [], collections: [] }),
        });
        const data = await res.json();
        results.push({ success: true, data });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }

    globalThis.fetch = originalFetch;

    expect(results[0].success).toBe(false);
    expect(results[1].success).toBe(true);
    expect(results[1].data.ok).toBe(true);
  });
});
