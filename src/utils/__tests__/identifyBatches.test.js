import { describe, it, expect, vi } from "vitest";
import { identifyInBatches } from "../identifyBatches";

const items = (n) => Array.from({ length: n }, (_, i) => ({ text: `entry ${i}` }));
const ok = (chunk) => Promise.resolve(chunk.map((_, i) => ({ i, source: "S" })));
const abortError = () => Object.assign(new Error("aborted"), { name: "AbortError" });

describe("identifyInBatches", () => {
  it("splits items into batches and reports each batch's results", async () => {
    const identifyBatch = vi.fn(ok);
    const onResults = vi.fn();
    const onBatchStart = vi.fn();

    const out = await identifyInBatches(items(5), identifyBatch, { batchSize: 2, onResults, onBatchStart });

    expect(out).toEqual({ failed: [], aborted: false });
    expect(identifyBatch).toHaveBeenCalledTimes(3);
    expect(onResults.mock.calls.map(([chunk]) => chunk.length)).toEqual([2, 2, 1]);
    expect(onBatchStart.mock.calls).toEqual([[0, 3], [1, 3], [2, 3]]);
  });

  it("passes formatting and signal through", async () => {
    const identifyBatch = vi.fn(ok);
    const signal = new AbortController().signal;
    await identifyInBatches(items(1), identifyBatch, { withFormatting: true, signal });
    expect(identifyBatch).toHaveBeenCalledWith(expect.any(Array), true, signal);
  });

  it("retries a failed batch once and uses the retry's results", async () => {
    const identifyBatch = vi.fn()
      .mockRejectedValueOnce(new Error("API returned 500"))
      .mockImplementation(ok);
    const onResults = vi.fn();
    const onFailed = vi.fn();

    const out = await identifyInBatches(items(3), identifyBatch, { batchSize: 3, onResults, onFailed });

    expect(identifyBatch).toHaveBeenCalledTimes(2);
    expect(onResults).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();
    expect(out.failed).toEqual([]);
  });

  it("reports a batch that fails twice and still runs the remaining batches", async () => {
    const err = new Error("API returned 503");
    // Batch 0 fails on both attempts; batch 1 (already in flight) succeeds
    const identifyBatch = vi.fn((chunk) => chunk[0].text === "entry 0" ? Promise.reject(err) : ok(chunk));
    const onResults = vi.fn();
    const onFailed = vi.fn();
    const all = items(4);

    const out = await identifyInBatches(all, identifyBatch, { batchSize: 2, onResults, onFailed });

    expect(onFailed).toHaveBeenCalledWith(all.slice(0, 2), err);
    expect(out.failed).toEqual(all.slice(0, 2));
    expect(onResults).toHaveBeenCalledTimes(1);
    expect(onResults.mock.calls[0][0]).toEqual(all.slice(2));
    expect(out.aborted).toBe(false);
  });

  it("reports every batch when all fail", async () => {
    const identifyBatch = vi.fn().mockRejectedValue(new Error("API returned 429"));
    const onFailed = vi.fn();
    const all = items(3);
    const out = await identifyInBatches(all, identifyBatch, { batchSize: 1, onFailed });
    expect(onFailed).toHaveBeenCalledTimes(3);
    expect(out.failed).toEqual(all);
  });

  it("doesn't retry a batch the server refused with a 4xx (e.g. the daily AI cap)", async () => {
    const refusal = Object.assign(new Error("Daily AI limit reached"), { status: 429 });
    const identifyBatch = vi.fn().mockRejectedValueOnce(refusal).mockImplementation(ok);
    const onFailed = vi.fn();
    const out = await identifyInBatches(items(3), identifyBatch, { batchSize: 2, onFailed });
    // First batch: one call, no retry. Second batch still runs.
    expect(identifyBatch).toHaveBeenCalledTimes(2);
    expect(out.failed).toHaveLength(2);
    expect(onFailed).toHaveBeenCalledWith(expect.any(Array), refusal);
  });

  it("still retries a 5xx failure once", async () => {
    const serverErr = Object.assign(new Error("AI service temporarily unavailable"), { status: 502 });
    const identifyBatch = vi.fn().mockRejectedValueOnce(serverErr).mockImplementation(ok);
    const out = await identifyInBatches(items(1), identifyBatch);
    expect(identifyBatch).toHaveBeenCalledTimes(2);
    expect(out.failed).toEqual([]);
  });

  it("stops without retrying on AbortError", async () => {
    const identifyBatch = vi.fn().mockRejectedValue(abortError());
    const onFailed = vi.fn();
    const out = await identifyInBatches(items(4), identifyBatch, { batchSize: 2, onFailed });
    expect(out.aborted).toBe(true);
    // Both batches were already in flight; neither is retried
    expect(identifyBatch).toHaveBeenCalledTimes(2);
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("does nothing for an empty list", async () => {
    const identifyBatch = vi.fn();
    expect(await identifyInBatches([], identifyBatch)).toEqual({ failed: [], aborted: false });
    expect(identifyBatch).not.toHaveBeenCalled();
  });

  it("keeps up to `concurrency` batches in flight at once", async () => {
    let active = 0, peak = 0;
    const identifyBatch = vi.fn(async (chunk) => {
      active++; peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, 5));
      active--;
      return chunk.map((_, i) => ({ i }));
    });
    await identifyInBatches(items(10), identifyBatch, { batchSize: 1, concurrency: 3 });
    expect(identifyBatch).toHaveBeenCalledTimes(10);
    expect(peak).toBe(3);
  });

  it("hands results back in batch order even when a later batch finishes first", async () => {
    const delays = [30, 5, 15];
    const identifyBatch = vi.fn(async (chunk) => {
      const n = Number(chunk[0].text.split(" ")[1]);
      await new Promise(r => setTimeout(r, delays[n]));
      return [{ i: 0 }];
    });
    const onResults = vi.fn();
    const all = items(3);
    await identifyInBatches(all, identifyBatch, { batchSize: 1, onResults });
    expect(onResults.mock.calls.map(([chunk]) => chunk[0])).toEqual(all);
  });

  it("runs one batch at a time with concurrency 1", async () => {
    let active = 0, peak = 0;
    const identifyBatch = vi.fn(async (chunk) => {
      active++; peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return chunk.map((_, i) => ({ i }));
    });
    await identifyInBatches(items(4), identifyBatch, { batchSize: 1, concurrency: 1 });
    expect(peak).toBe(1);
  });
});
