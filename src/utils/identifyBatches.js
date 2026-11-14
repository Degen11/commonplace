import { API_BATCH_SIZE, API_BATCH_CONCURRENCY } from "../config";

// Run `identifyBatch` over `items` in API_BATCH_SIZE chunks — the one batch loop
// shared by the processing pipeline and bulk re-identify, so both get the same
// retry and failure reporting.
//
// - Concurrent: up to `concurrency` chunks are in flight at once, but results
//   are still handed to onResults in chunk order, so callers see the same
//   sequence as a serial loop. A new chunk starts as each one is handled.
// - Each failed chunk is retried once. A chunk that fails twice is reported via
//   `onFailed` and its items are returned in `failed`; the remaining chunks
//   still run (one bad batch never blocks the rest). A 4xx refusal (bad input,
//   rate limit, daily AI cap) isn't retried, since sending it again can't
//   succeed and only spends more of the caller's limit.
// - An AbortError (or an aborted `signal`) stops the loop and returns
//   `aborted: true`.
//
// Callbacks (all optional):
//   onBatchStart(index, total)   — a chunk's request is about to start (chunks
//                                  start ahead of the one being handled)
//   onResults(chunk, results)    — a chunk succeeded (results[i].i indexes chunk)
//   onFailed(chunk, error)       — a chunk failed on both attempts
export async function identifyInBatches(items, identifyBatch, {
  withFormatting = false, signal, batchSize = API_BATCH_SIZE,
  concurrency = API_BATCH_CONCURRENCY,
  onBatchStart, onResults, onFailed,
} = {}) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));

  const failed = [];
  const isAbort = (err) => err?.name === "AbortError" || signal?.aborted;
  const isClientRefusal = (err) => Number.isInteger(err?.status) && err.status >= 400 && err.status < 500;

  const inFlight = new Map();
  const launch = (b) => {
    if (b >= batches.length || signal?.aborted) return;
    onBatchStart?.(b, batches.length);
    const request = identifyBatch(batches[b], withFormatting, signal);
    // Awaited later, in order. Until then, a rejection here isn't "unhandled".
    request.catch(() => {});
    inFlight.set(b, request);
  };
  for (let b = 0; b < Math.max(1, concurrency); b++) launch(b);

  for (let b = 0; b < batches.length; b++) {
    if (signal?.aborted) return { failed, aborted: true };
    const chunk = batches[b];

    let results = null;
    try {
      results = await inFlight.get(b);
    } catch (err) {
      if (isAbort(err)) return { failed, aborted: true };
      if (isClientRefusal(err)) {
        failed.push(...chunk);
        onFailed?.(chunk, err);
      } else {
        // Retry this chunk once before reporting it as failed
        try {
          results = await identifyBatch(chunk, withFormatting, signal);
        } catch (retryErr) {
          if (isAbort(retryErr)) return { failed, aborted: true };
          failed.push(...chunk);
          onFailed?.(chunk, retryErr);
        }
      }
    }
    inFlight.delete(b);
    if (signal?.aborted) return { failed, aborted: true };

    // Refill the window before handling this chunk's results
    launch(b + Math.max(1, concurrency));

    if (results) onResults?.(chunk, results);
  }

  return { failed, aborted: false };
}
