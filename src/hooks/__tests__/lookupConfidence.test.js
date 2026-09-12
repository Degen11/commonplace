// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the heavy 477KB dynamic import so tests don't stall
vi.mock("../../data/localQuotes", () => ({
  default: [],
  localLookup: () => null,
}));

// Keep textFormatting mostly real; stub initProperNouns (needs localDb array)
// and the similarity fns (prevents false-positive dupe detection on synthetic
// test data).
vi.mock("../../utils/textFormatting", async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, initProperNouns: vi.fn(), similarity: vi.fn(() => 0), similarityFromKeys: vi.fn(() => 0) };
});

import useProcessing from "../useProcessing";
import { DEFAULT_CATEGORIES } from "../../data/constants";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeIdentifyOk(results) {
  return {
    ok: true,
    json: () => Promise.resolve({ content: [{ text: JSON.stringify(results) }] }),
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

// ── Tests ────────────────────────────────────────────────────────────────────
// These cover the confidence-gating fix: a "high" confidence external lookup
// result is trusted outright, but "medium" confidence is only a lead — it must
// be passed to the AI to confirm or correct rather than accepted as final.

describe("external lookup confidence routing", () => {
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

  it("accepts a high-confidence lookup result outright and never calls the AI", async () => {
    let identifyCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [{ i: 0, found: true, source: "Villain Origins (2000)", category: "Film", confidence: "high" }],
          }),
        });
      }
      if (url.includes("/api/identify")) {
        identifyCallCount++;
        return Promise.resolve(makeIdentifyOk([]));
      }
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      result.current.processEntries("some quote text");
    });
    await act(async () => {
      vi.runAllTimers();
    });

    expect(identifyCallCount).toBe(0);
    const finalQuotes = setQuotes.mock.calls.at(-1)[0];
    expect(finalQuotes[0].source).toBe("Villain Origins (2000)");
    expect(finalQuotes[0].category).toBe("Film");
    expect(finalQuotes[0].confidence).toBe("high");
  });

  it("sends a medium-confidence lookup result to the AI as a candidate instead of accepting it outright", async () => {
    let identifyBody = null;
    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === "/api/lookup") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [{ i: 0, found: true, source: "Guessed Movie (1999)", category: "Film", confidence: "medium" }],
          }),
        });
      }
      if (url.includes("/api/identify")) {
        identifyBody = JSON.parse(opts.body);
        return Promise.resolve(makeIdentifyOk([
          { i: 0, source: "Correct Movie (1999)", category: "Film", confidence: "high" },
        ]));
      }
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      result.current.processEntries("some quote text");
    });
    await act(async () => {
      vi.runAllTimers();
    });

    // The AI was actually consulted, and told this is only a candidate to verify
    expect(identifyBody).not.toBeNull();
    expect(identifyBody.messages[0].content).toContain(
      'unverified match found online: "Guessed Movie (1999)" as Film',
    );

    // The AI's (corrected) answer wins, not the raw medium-confidence guess
    const finalQuotes = setQuotes.mock.calls.at(-1)[0];
    expect(finalQuotes[0].source).toBe("Correct Movie (1999)");
    expect(finalQuotes[0].confidence).toBe("high");
  });

  it("falls back to the medium-confidence lookup candidate if the AI batch fails outright", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/lookup") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [{ i: 0, found: true, source: "Guessed Movie (1999)", category: "Film", confidence: "medium" }],
          }),
        });
      }
      if (url.includes("/api/identify")) return makeNetworkError();
      if (url === "/api/cache") return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const { result, setQuotes } = setup();

    await act(async () => {
      result.current.processEntries("some quote text");
    });
    await act(async () => {
      vi.runAllTimers();
    });

    // The candidate isn't silently discarded even though the AI never confirmed it
    const finalQuotes = setQuotes.mock.calls.at(-1)[0];
    expect(finalQuotes[0].source).toBe("Guessed Movie (1999)");
    expect(finalQuotes[0].confidence).toBe("medium");

    // ...but it's still flagged so the user knows to double-check it
    expect(result.current.failedEntries).toHaveLength(1);
  });
});
