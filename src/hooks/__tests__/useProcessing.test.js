import { describe, it, expect } from "vitest";
import { processingReducer, INITIAL_STATE } from "../useProcessing";

describe("processingReducer", () => {
  it("has correct initial state", () => {
    expect(INITIAL_STATE.isProcessing).toBe(false);
    expect(INITIAL_STATE.processingDone).toBe(false);
    expect(INITIAL_STATE.progress).toBe(null);
    expect(INITIAL_STATE.identifiedFeed).toEqual([]);
    expect(INITIAL_STATE.apiError).toBe(null);
    expect(INITIAL_STATE.failedEntries).toEqual([]);
    expect(INITIAL_STATE.pendingDupes).toEqual([]);
    expect(INITIAL_STATE.dupeDecisions).toEqual({});
    expect(INITIAL_STATE.formattingEnabled).toBe(false);
    expect(INITIAL_STATE.stats).toBe(null);
  });

  describe("START", () => {
    it("sets isProcessing and resets transient state", () => {
      const state = { ...INITIAL_STATE, apiError: "old error", failedEntries: [{ text: "x" }] };
      const next = processingReducer(state, { type: "START", dupes: 2, total: 10 });
      expect(next.isProcessing).toBe(true);
      expect(next.processingDone).toBe(false);
      expect(next.progress).toBe(null);
      expect(next.identifiedFeed).toEqual([]);
      expect(next.apiError).toBe(null);
      expect(next.failedEntries).toEqual([]);
      expect(next.stats).toEqual({ dupes: 2, total: 10 });
    });
  });

  describe("PROGRESS", () => {
    it("updates progress", () => {
      const progress = { total: 10, done: 3, current: "Batch 1...", phase: "api" };
      const next = processingReducer(INITIAL_STATE, { type: "PROGRESS", progress });
      expect(next.progress).toEqual(progress);
    });
  });

  describe("FEED", () => {
    it("replaces identifiedFeed", () => {
      const feed = [{ text: "a", source: "s1" }];
      const next = processingReducer(INITIAL_STATE, { type: "FEED", feed });
      expect(next.identifiedFeed).toEqual(feed);
    });
  });

  describe("FEED_APPEND", () => {
    it("appends to existing feed", () => {
      const state = { ...INITIAL_STATE, identifiedFeed: [{ text: "a" }] };
      const next = processingReducer(state, { type: "FEED_APPEND", items: [{ text: "b" }] });
      expect(next.identifiedFeed).toHaveLength(2);
      expect(next.identifiedFeed[1].text).toBe("b");
    });
  });

  describe("API_ERROR", () => {
    it("sets api error", () => {
      const next = processingReducer(INITIAL_STATE, { type: "API_ERROR", error: "timeout" });
      expect(next.apiError).toBe("timeout");
    });
  });

  describe("FAILED_ENTRIES", () => {
    it("sets failed entries", () => {
      const entries = [{ text: "x" }, { text: "y" }];
      const next = processingReducer(INITIAL_STATE, { type: "FAILED_ENTRIES", entries });
      expect(next.failedEntries).toEqual(entries);
    });
  });

  describe("DONE", () => {
    it("sets processingDone and final progress", () => {
      const state = { ...INITIAL_STATE, isProcessing: true, stats: { dupes: 0, total: 5 } };
      const stats = { local: 3, lookup: 1, api: 1, failed: 0, total: 5 };
      const next = processingReducer(state, { type: "DONE", total: 5, stats });
      expect(next.processingDone).toBe(true);
      expect(next.progress.done).toBe(5);
      expect(next.progress.phase).toBe("complete");
      expect(next.stats.local).toBe(3);
      expect(next.stats.total).toBe(5);
    });
  });

  describe("FINISH", () => {
    it("clears processing state", () => {
      const state = { ...INITIAL_STATE, isProcessing: true, processingDone: true, progress: { total: 5, done: 5 } };
      const next = processingReducer(state, { type: "FINISH" });
      expect(next.isProcessing).toBe(false);
      expect(next.processingDone).toBe(false);
      expect(next.progress).toBe(null);
    });
  });

  describe("CANCEL", () => {
    it("clears processing state like FINISH", () => {
      const state = { ...INITIAL_STATE, isProcessing: true, progress: { total: 10, done: 3 } };
      const next = processingReducer(state, { type: "CANCEL" });
      expect(next.isProcessing).toBe(false);
      expect(next.processingDone).toBe(false);
      expect(next.progress).toBe(null);
    });
  });

  describe("SHOW_DUPES", () => {
    it("sets pending dupes and decisions", () => {
      const dupes = [{ incoming: { text: "a" }, matchedText: "a" }];
      const decisions = { 0: "skip" };
      const next = processingReducer(INITIAL_STATE, { type: "SHOW_DUPES", dupes, decisions });
      expect(next.pendingDupes).toEqual(dupes);
      expect(next.dupeDecisions).toEqual(decisions);
    });
  });

  describe("SET_DUPE_DECISION", () => {
    it("updates a single dupe decision", () => {
      const state = { ...INITIAL_STATE, dupeDecisions: { 0: "skip", 1: "skip" } };
      const next = processingReducer(state, { type: "SET_DUPE_DECISION", index: 1, decision: "keep" });
      expect(next.dupeDecisions[0]).toBe("skip");
      expect(next.dupeDecisions[1]).toBe("keep");
    });
  });

  describe("CLEAR_DUPES", () => {
    it("clears dupes and decisions", () => {
      const state = { ...INITIAL_STATE, pendingDupes: [{ incoming: { text: "a" } }], dupeDecisions: { 0: "keep" } };
      const next = processingReducer(state, { type: "CLEAR_DUPES" });
      expect(next.pendingDupes).toEqual([]);
      expect(next.dupeDecisions).toEqual({});
    });
  });

  describe("DISMISS_ERROR", () => {
    it("clears api error", () => {
      const state = { ...INITIAL_STATE, apiError: "something" };
      const next = processingReducer(state, { type: "DISMISS_ERROR" });
      expect(next.apiError).toBe(null);
    });
  });

  describe("DISMISS_STATS", () => {
    it("clears stats", () => {
      const state = { ...INITIAL_STATE, stats: { local: 3, total: 5 } };
      const next = processingReducer(state, { type: "DISMISS_STATS" });
      expect(next.stats).toBe(null);
    });
  });

  describe("SET_FORMATTING", () => {
    it("toggles formatting enabled", () => {
      const next = processingReducer(INITIAL_STATE, { type: "SET_FORMATTING", enabled: true });
      expect(next.formattingEnabled).toBe(true);
    });
  });

  describe("RESET", () => {
    it("resets to initial state but preserves formattingEnabled", () => {
      const state = {
        ...INITIAL_STATE,
        isProcessing: true,
        apiError: "err",
        formattingEnabled: true,
        identifiedFeed: [{ text: "a" }],
      };
      const next = processingReducer(state, { type: "RESET" });
      expect(next.isProcessing).toBe(false);
      expect(next.apiError).toBe(null);
      expect(next.identifiedFeed).toEqual([]);
      expect(next.formattingEnabled).toBe(true);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged", () => {
      const state = { ...INITIAL_STATE, isProcessing: true };
      const next = processingReducer(state, { type: "UNKNOWN" });
      expect(next).toBe(state);
    });
  });

  describe("state machine transitions", () => {
    it("follows idle → START → PROGRESS → DONE → FINISH flow", () => {
      let state = INITIAL_STATE;

      state = processingReducer(state, { type: "START", dupes: 0, total: 5 });
      expect(state.isProcessing).toBe(true);

      state = processingReducer(state, { type: "PROGRESS", progress: { total: 5, done: 2, current: "Batch 1...", phase: "api" } });
      expect(state.progress.done).toBe(2);

      state = processingReducer(state, { type: "DONE", total: 5, stats: { local: 2, lookup: 1, api: 2, failed: 0, total: 5 } });
      expect(state.processingDone).toBe(true);
      expect(state.isProcessing).toBe(true);

      state = processingReducer(state, { type: "FINISH" });
      expect(state.isProcessing).toBe(false);
      expect(state.processingDone).toBe(false);
    });

    it("follows idle → START → API_ERROR → CANCEL flow", () => {
      let state = INITIAL_STATE;

      state = processingReducer(state, { type: "START", dupes: 0, total: 5 });
      state = processingReducer(state, { type: "API_ERROR", error: "Network error" });
      expect(state.apiError).toBe("Network error");

      state = processingReducer(state, { type: "CANCEL" });
      expect(state.isProcessing).toBe(false);
    });

    it("handles dupe flow: SHOW_DUPES → SET_DUPE_DECISION → CLEAR_DUPES → START", () => {
      let state = INITIAL_STATE;

      const dupes = [{ incoming: { text: "dup" }, matchedText: "dup" }];
      state = processingReducer(state, { type: "SHOW_DUPES", dupes, decisions: { 0: "skip" } });
      expect(state.pendingDupes).toHaveLength(1);

      state = processingReducer(state, { type: "SET_DUPE_DECISION", index: 0, decision: "keep" });
      expect(state.dupeDecisions[0]).toBe("keep");

      state = processingReducer(state, { type: "CLEAR_DUPES" });
      expect(state.pendingDupes).toEqual([]);

      state = processingReducer(state, { type: "START", dupes: 0, total: 1 });
      expect(state.isProcessing).toBe(true);
    });
  });
});
