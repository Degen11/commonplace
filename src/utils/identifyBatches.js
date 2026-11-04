import { API_BATCH_SIZE } from "../config";

// Run `identifyBatch` over `items` in API_BATCH_SIZE chunks — the one batch loop
// shared by the processing pipeline and bulk re-identify, so both get the same
// retry and failure reporting.
//
// - Pipelined: the next chunk's request starts while the current chunk's
//   results are handled.
// - Each failed chunk is retried once. A chunk that fails twice is reported via
//   `onFailed` and its items are returned in `failed`; the remaining chunks
//   still run (one bad batch never blocks the rest).
// - An AbortError (or an aborted `signal`) stops the loop and returns
//   `aborted: true`.
//
// Callbacks (all optional):
//   onBatchStart(index, total)   — a chunk's request is about to start
//   onResults(chunk, results)    — a chunk succeeded (results[i].i indexes chunk)
//   onFailed(chunk, error)       — a chunk failed on both attempts
export async function identifyInBatches(items, identifyBatch, {
  withFormatting = false, signal, batchSize = API_BATCH_SIZE,
  onBatchStart, onResults, onFailed,
} = {}) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));

  const failed = [];
  const isAbort = (err) => err?.name === "AbortError" || signal?.aborted;
  const start = (b) => {
    onBatchStart?.(b, batches.length);
    return identifyBatch(batches[b], withFormatting, signal);
  };

  let pending = batches.length > 0 ? start(0) : null;

  for (let b = 0; b < batches.length; b++) {
    if (signal?.aborted) return { failed, aborted: true };
    const chunk = batches[b];

    let results = null;
    try {
      results = await pending;
    } catch (err) {
      if (isAbort(err)) return { failed, aborted: true };
      // Retry this chunk once before reporting it as failed
      try {
        results = await identifyBatch(chunk, withFormatting, signal);
      } catch (retryErr) {
        if (isAbort(retryErr)) return { failed, aborted: true };
        failed.push(...chunk);
        onFailed?.(chunk, retryErr);
      }
    }
    if (signal?.aborted) return { failed, aborted: true };

    // Start the next chunk before handling this one's results
    if (b + 1 < batches.length) pending = start(b + 1);

    if (results) onResults?.(chunk, results);
  }

  return { failed, aborted: false };
}
