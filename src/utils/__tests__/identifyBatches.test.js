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
    const identifyBatch = vi.fn()
      .mockRejectedValueOnce(err)   // batch 0
      .mockRejectedValueOnce(err)   // batch 0 retry
      .mockImplementation(ok);      // batch 1
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

  it("stops without retrying on AbortError", async () => {
    const identifyBatch = vi.fn().mockRejectedValue(abortError());
    const onFailed = vi.fn();
    const out = await identifyInBatches(items(4), identifyBatch, { batchSize: 2, onFailed });
    expect(out.aborted).toBe(true);
    expect(identifyBatch).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("does nothing for an empty list", async () => {
    const identifyBatch = vi.fn();
    expect(await identifyInBatches([], identifyBatch)).toEqual({ failed: [], aborted: false });
    expect(identifyBatch).not.toHaveBeenCalled();
  });
});
