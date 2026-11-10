// @vitest-environment jsdom
// Duplicate-detection pre-pass in useProcessing.processEntries and the
// handleDupesContinue decision handling. textFormatting (smartSplit,
// smartParse, makeSimilarityKey, similarityFromKeys) is left REAL so the
// fuzzy matching actually runs; only the 477KB local DB and the network are stubbed.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const localLookup = vi.hoisted(() => vi.fn(() => null));
vi.mock("../../data/localQuotes", () => ({ default: [], localLookup }));

import useProcessing from "../useProcessing";
import { DEFAULT_CATEGORIES } from "../../data/constants";
import { makeSimilarityKey } from "../../utils/textFormatting";

const JOBS = "The only way to do great work is to love what you do";
const JOBS_NEAR = "The only way to do really great work is to love what you do";
const DAVINCI = "Simplicity is the ultimate sophistication";

let identifyCalls;

function installFetch() {
  identifyCalls = [];
  globalThis.fetch = vi.fn((url, opts) => {
    if (url === "/api/lookup") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) });
    }
    if (url === "/api/identify") {
      const { items } = JSON.parse(opts.body);
      identifyCalls.push(items);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          results: items.map((it, i) => ({ i, source: it.hint || "AI Author", category: "Book", confidence: "high" })),
        }),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

function setup(quotes = []) {
  const setQuotes = vi.fn();
  const goPhase = vi.fn();
  const { result } = renderHook(() =>
    useProcessing({ quotes, setQuotes, allCats: DEFAULT_CATEGORIES, goPhase }),
  );
  return { result, setQuotes, goPhase };
}

async function flushTimers() {
  await act(async () => { vi.runAllTimers(); });
}

let originalFetch;
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  originalFetch = globalThis.fetch;
  installFetch();
  localLookup.mockReset();
  localLookup.mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
});

describe("useProcessing — duplicate pre-pass", () => {
  it("the near-duplicate fixture is fuzzy, not an exact normalized match", () => {
    // Guards the tests below: they must exercise similarityFromKeys, not seenExact
    expect(makeSimilarityKey(JOBS).norm).not.toBe(makeSimilarityKey(JOBS_NEAR).norm);
  });

  it("flags a near-identical entry within the same paste and pauses before processing", async () => {
    const { result, goPhase, setQuotes } = setup();

    await act(async () => {
      await result.current.processEntries(`${JOBS} — Steve Jobs\n${JOBS_NEAR} — S. Jobs\n${DAVINCI} — Leonardo da Vinci`);
    });

    expect(result.current.pendingDupes).toHaveLength(1);
    expect(result.current.pendingDupes[0]).toEqual({
      incoming: { text: JOBS_NEAR, hint: "S. Jobs" },
      matchedText: JOBS,
      matchedSource: "Steve Jobs",
    });
    // Every dupe defaults to "skip"
    expect(result.current.dupeDecisions).toEqual({ 0: "skip" });
    // Nothing has started yet — waiting on the user's decisions
    expect(result.current.isProcessing).toBe(false);
    expect(goPhase).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(setQuotes).not.toHaveBeenCalled();
  });

  it("does not flag clearly different entries", async () => {
    const { result, goPhase } = setup();

    await act(async () => {
      await result.current.processEntries(`${JOBS} — Steve Jobs\n${DAVINCI} — Leonardo da Vinci`);
    });

    expect(result.current.pendingDupes).toEqual([]);
    expect(goPhase).toHaveBeenCalledWith("processing");
    expect(identifyCalls).toHaveLength(1);
    expect(identifyCalls[0].map(i => i.text)).toEqual([JOBS, DAVINCI]);
  });

  it("in append mode, flags an entry that matches a quote already in the collection", async () => {
    const existing = [{ id: "q1", text: JOBS, source: "Steve Jobs", category: "Speech", confidence: "high" }];
    const { result } = setup(existing);

    await act(async () => {
      await result.current.processEntries(`${JOBS_NEAR}\n${DAVINCI}`, true);
    });

    expect(result.current.pendingDupes).toHaveLength(1);
    expect(result.current.pendingDupes[0].incoming.text).toBe(JOBS_NEAR);
    expect(result.current.pendingDupes[0].matchedText).toBe(JOBS);
    expect(result.current.pendingDupes[0].matchedSource).toBe("Steve Jobs");
  });

  it("outside append mode, existing quotes are not compared against", async () => {
    const existing = [{ id: "q1", text: JOBS, source: "Steve Jobs", category: "Speech", confidence: "high" }];
    const { result } = setup(existing);

    await act(async () => {
      await result.current.processEntries(JOBS_NEAR, false);
    });

    expect(result.current.pendingDupes).toEqual([]);
    expect(identifyCalls).toHaveLength(1);
  });
});

describe("useProcessing — handleDupesContinue", () => {
  const PASTE = `${JOBS} — Steve Jobs\n${JOBS_NEAR} — S. Jobs\n${DAVINCI} — Leonardo da Vinci`;

  async function pauseOnDupes(quotes = [], text = PASTE, append = false) {
    const ctx = setup(quotes);
    await act(async () => { await ctx.result.current.processEntries(text, append); });
    expect(ctx.result.current.pendingDupes).toHaveLength(1);
    return ctx;
  }

  it("skip (the default) drops the duplicate and processes the rest", async () => {
    const { result, goPhase, setQuotes } = await pauseOnDupes();

    await act(async () => { await result.current.handleDupesContinue(); });
    await flushTimers();

    expect(identifyCalls).toHaveLength(1);
    expect(identifyCalls[0].map(i => i.text)).toEqual([JOBS, DAVINCI]);
    expect(result.current.pendingDupes).toEqual([]);
    expect(result.current.dupeDecisions).toEqual({});
    expect(result.current.stats).toMatchObject({ dupes: 1, total: 2 });
    expect(goPhase).toHaveBeenNthCalledWith(1, "processing");
    expect(goPhase).toHaveBeenLastCalledWith("results");
    const saved = setQuotes.mock.calls[0][0];
    expect(saved.map(q => q.text)).toEqual([JOBS, DAVINCI]);
  });

  it("keep sends the duplicate on for identification too", async () => {
    const { result, setQuotes } = await pauseOnDupes();

    act(() => { result.current.setDupeDecision(0, "keep"); });
    await act(async () => { await result.current.handleDupesContinue(); });
    await flushTimers();

    expect(identifyCalls[0].map(i => i.text)).toEqual([JOBS, DAVINCI, JOBS_NEAR]);
    expect(identifyCalls[0][2].hint).toBe("S. Jobs");
    expect(result.current.stats).toMatchObject({ dupes: 0, total: 3 });
    expect(setQuotes.mock.calls[0][0]).toHaveLength(3);
  });

  it("merge keeps the duplicate with both sources as its hint", async () => {
    const { result } = await pauseOnDupes();

    act(() => { result.current.setDupeDecision(0, "merge"); });
    await act(async () => { await result.current.handleDupesContinue(); });
    await flushTimers();

    expect(identifyCalls[0][2]).toMatchObject({ text: JOBS_NEAR, hint: "S. Jobs / Steve Jobs" });
    expect(result.current.stats).toMatchObject({ dupes: 0, total: 3 });
  });

  it("append mode: skipped dupes are dropped and new quotes are appended to existing ones", async () => {
    const existing = [{ id: "q1", text: JOBS, source: "Steve Jobs", category: "Speech", confidence: "high" }];
    const { result, setQuotes } = await pauseOnDupes(existing, `${JOBS_NEAR}\n${DAVINCI}`, true);

    await act(async () => { await result.current.handleDupesContinue(); });
    await flushTimers();

    expect(identifyCalls[0].map(i => i.text)).toEqual([DAVINCI]);
    // Append mode uses a functional updater that keeps what's already there
    const updater = setQuotes.mock.calls[0][0];
    expect(typeof updater).toBe("function");
    const next = updater(existing);
    expect(next.map(q => q.text)).toEqual([JOBS, DAVINCI]);
  });

  it("is a no-op when there is nothing pending", async () => {
    const { result, goPhase } = setup();
    await act(async () => { await result.current.handleDupesContinue(); });
    expect(goPhase).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("useProcessing — local lookup match", () => {
  it("uses the local DB result and skips the network for a matched entry", async () => {
    localLookup.mockImplementation((text) =>
      text === JOBS ? { source: "Stanford Commencement Address - Steve Jobs", category: "Speech", confidence: "high" } : null,
    );
    const { result, setQuotes } = setup();

    await act(async () => {
      await result.current.processEntries(`${JOBS}\n${DAVINCI}`);
    });
    await flushTimers();

    expect(localLookup).toHaveBeenCalledWith(JOBS, null);
    // Only the unmatched entry went to lookup / AI
    const lookupBody = JSON.parse(globalThis.fetch.mock.calls.find(([u]) => u === "/api/lookup")[1].body);
    expect(lookupBody.quotes.map(q => q.text)).toEqual([DAVINCI]);
    expect(identifyCalls).toHaveLength(1);
    expect(identifyCalls[0].map(i => i.text)).toEqual([DAVINCI]);

    const saved = setQuotes.mock.calls[0][0];
    expect(saved[0]).toMatchObject({
      text: JOBS, source: "Stanford Commencement Address - Steve Jobs", category: "Speech", confidence: "high",
    });
    expect(saved[1]).toMatchObject({ text: DAVINCI, source: "AI Author" });
    expect(result.current.stats).toMatchObject({ local: 1, api: 1, total: 2 });
  });

  it("makes no network calls when every entry matches locally", async () => {
    localLookup.mockReturnValue({ source: "Someone", category: "Book", confidence: "high" });
    const { result, setQuotes } = setup();

    await act(async () => {
      await result.current.processEntries(`${JOBS}\n${DAVINCI}`);
    });
    await flushTimers();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(setQuotes.mock.calls[0][0]).toHaveLength(2);
    expect(result.current.stats).toMatchObject({ local: 2, lookup: 0, api: 0 });
  });
});
