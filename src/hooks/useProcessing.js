import { useReducer, useRef, useEffect } from "react";
import useLatestRef from "./useLatestRef";
import { buildValidCats, fallbackCategory, UNKNOWN_SOURCE } from "../data/constants";
import {
  normalize, similarity, smartParse, smartSplit, basicFormat,
  initProperNouns,
} from "../utils/textFormatting";
import { initNlp } from "../utils/smartRestore";
import { makeQuote } from "../utils/quotes";
import { removeFromStorage } from "../utils/storage";
import { fetchWithTimeout, API_HEADERS } from "../utils/api";
import { describeApiError } from "../utils/apiErrors";
import {
  API_TIMEOUT_MS, AUTO_GROUP_TIMEOUT_MS, API_BATCH_SIZE,
  PROCESSING_DONE_MS, DUPE_SIMILARITY_THRESHOLD, LS_DRAFT,
} from "../config";

// Strip outer ** wrapping that the AI sometimes adds to cleanText
const stripOuterBold = t => t && t.startsWith("**") && t.endsWith("**") ? t.slice(2, -2) : t;

// ── State machine ──
// idle → dupes → processing → done → idle
//                    ↓
//                  error (partial)

export const INITIAL_STATE = {
  isProcessing: false,
  processingDone: false,
  progress: null,
  identifiedFeed: [],
  apiError: null,
  failedEntries: [],
  pendingDupes: [],
  dupeDecisions: {},
  formattingEnabled: false,
  stats: null,
};

export function processingReducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        ...state,
        isProcessing: true,
        processingDone: false,
        progress: null,
        identifiedFeed: [],
        apiError: null,
        failedEntries: [],
        stats: { dupes: action.dupes ?? 0, total: action.total ?? 0 },
      };
    case "PROGRESS":
      return { ...state, progress: action.progress };
    case "FEED":
      return { ...state, identifiedFeed: action.feed };
    case "FEED_APPEND":
      return { ...state, identifiedFeed: [...state.identifiedFeed, ...action.items] };
    case "API_ERROR":
      return { ...state, apiError: action.error };
    case "FAILED_ENTRIES":
      return { ...state, failedEntries: action.entries };
    case "DONE":
      return {
        ...state,
        processingDone: true,
        progress: { total: action.total, done: action.total, current: "Done!", phase: "complete" },
        stats: { ...(state.stats || {}), ...action.stats },
      };
    case "FINISH":
      return { ...state, isProcessing: false, processingDone: false, progress: null };
    case "CANCEL":
      return { ...state, isProcessing: false, processingDone: false, progress: null };
    case "SHOW_DUPES":
      return { ...state, pendingDupes: action.dupes, dupeDecisions: action.decisions };
    case "SET_DUPE_DECISION":
      return { ...state, dupeDecisions: { ...state.dupeDecisions, [action.index]: action.decision } };
    case "CLEAR_DUPES":
      return { ...state, pendingDupes: [], dupeDecisions: {} };
    case "DISMISS_ERROR":
      return { ...state, apiError: null };
    case "DISMISS_STATS":
      return { ...state, stats: null };
    case "SET_FORMATTING":
      return { ...state, formattingEnabled: action.enabled };
    case "RESET":
      return { ...INITIAL_STATE, formattingEnabled: state.formattingEnabled };
    default:
      return state;
  }
}

export default function useProcessing({ quotes, setQuotes, allCats, goPhase }) {
  const [state, dispatch] = useReducer(processingReducer, INITIAL_STATE);
  const autoTransitionRef = useRef(null);
  const pendingContinuationRef = useRef(null);
  const abortRef = useRef(null);
  const appendModeRef = useRef(false);

  // Abort in-flight requests and clear timers on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (autoTransitionRef.current) clearTimeout(autoTransitionRef.current);
    };
  }, []);

  // Refs for latest values — so callbacks never read stale closures
  const quotesRef = useLatestRef(quotes);
  const stateRef = useLatestRef(state);

  // ── API: batch identification ──
  const identifyBatch = async (items, withFormatting = false, externalSignal) => {
    if (items.length === 0) return [];
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");

    const r = await fetchWithTimeout("/api/identify", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({
        formatting: withFormatting,
        messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
      }),
    }, API_TIMEOUT_MS, externalSignal);

    if (!r.ok) throw new Error(`API returned ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "API error");
    if (!d.content || !Array.isArray(d.content)) throw new Error("Invalid API response structure");
    const t = d.content.map(x => x.text || "").join("");
    const raw = t.replace(/```json|```/g, "").trim();
    if (!raw) return [];
    const jsonStr = raw.startsWith("[") ? raw : "[" + raw;
    let parsed;
    try { parsed = JSON.parse(jsonStr); } catch { throw new Error("API returned malformed JSON"); }
    return Array.isArray(parsed) ? parsed : [];
  };

  // ── Processing pipeline — sub-functions ──

  // Phase 1: Match entries against the local quote database
  const handleLocalLookup = async (unique, useFormatting) => {
    const { default: localDb, localLookup } = await import("../data/localQuotes");
    initProperNouns(localDb);

    const localMatches = [];
    const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    if (localMatches.length > 0) {
      dispatch({ type: "FEED", feed: localMatches.map(m => ({
        text: useFormatting ? basicFormat(m.text) : m.text,
        source: m.result.source, category: m.result.category,
      })) });
    }
    dispatch({ type: "PROGRESS", progress: { total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need lookup...`, phase: "local" } });

    return { localMatches, needsApi };
  };

  // Phase 2: Check external sources (Wikiquote, Open Library, server cache)
  const handleExternalLookup = async (unique, needsApi, localCount, signal) => {
    const lookupResults = new Map();
    if (needsApi.length === 0) return { lookupResults, stillNeedsApi: [] };

    try {
      dispatch({ type: "PROGRESS", progress: { total: unique.length, done: localCount, current: "Checking online databases...", phase: "lookup" } });
      const lookupBody = needsApi.map(p => ({ text: p.text, hint: p.hint || null }));
      const lr = await fetch("/api/lookup", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ quotes: lookupBody }),
        signal,
      });
      if (lr.ok) {
        const { results: lResults } = await lr.json();
        if (Array.isArray(lResults)) {
          lResults.forEach(r => {
            if (r.found) {
              const item = needsApi[r.i];
              if (item) lookupResults.set(item.idx, r);
            }
          });
        }
      }
    } catch (err) {
      if (err.name === "AbortError") throw err;
      // Lookup failure is non-critical — fall through to AI
    }

    const stillNeedsApi = needsApi.filter(p => !lookupResults.has(p.idx));
    if (lookupResults.size > 0) {
      dispatch({ type: "FEED_APPEND", items: [...lookupResults.values()].map(r => {
        const item = needsApi[r.i];
        return { text: item?.text || "", source: r.source, category: r.category };
      }) });
      dispatch({ type: "PROGRESS", progress: { total: unique.length, done: localCount + lookupResults.size, current: `${lookupResults.size} found online, ${stillNeedsApi.length} need AI...`, phase: "lookup" } });
    }

    return { lookupResults, stillNeedsApi };
  };

  // Phase 3: Send remaining entries to Claude for AI identification in batches
  // Uses prefetching: starts the next batch API call while processing current batch results
  const handleApiBatch = async (unique, stillNeedsApi, preAiDone, useFormatting, signal) => {
    const apiResults = new Map();
    let apiFailed = false;
    const failed = [];
    const totalBatches = Math.ceil(stillNeedsApi.length / API_BATCH_SIZE);

    // Build all batch chunks upfront
    const batches = [];
    for (let i = 0; i < stillNeedsApi.length; i += API_BATCH_SIZE) {
      batches.push(stillNeedsApi.slice(i, i + API_BATCH_SIZE));
    }

    // Start first batch
    let pendingFetch = null;
    if (batches.length > 0) {
      dispatch({ type: "PROGRESS", progress: { total: unique.length, done: preAiDone, current: `AI identifying batch 1/${totalBatches}...`, phase: "api" } });
      pendingFetch = identifyBatch(batches[0], useFormatting, signal);
    }

    for (let b = 0; b < batches.length; b++) {
      if (signal.aborted) return { apiResults, apiFailed, failed };
      const chunk = batches[b];

      let results;
      try {
        // Await the already-started fetch for this batch
        results = await pendingFetch;
        if (signal.aborted) return { apiResults, apiFailed, failed };

        // Prefetch next batch while we process current results
        if (b + 1 < batches.length) {
          dispatch({ type: "PROGRESS", progress: { total: unique.length, done: preAiDone + (b + 1) * API_BATCH_SIZE, current: `AI identifying batch ${b + 2}/${totalBatches}...`, phase: "api" } });
          pendingFetch = identifyBatch(batches[b + 1], useFormatting, signal);
        }
      } catch (err) {
        if (err.name === "AbortError") return { apiResults, apiFailed: true, failed };

        // Retry this batch once before marking items as failed
        let didRetry = false;
        if (!signal.aborted) {
          try {
            results = await identifyBatch(chunk, useFormatting, signal);
            didRetry = true;
          } catch (retryErr) {
            if (retryErr.name === "AbortError") return { apiResults, apiFailed: true, failed };
            // Both attempts failed — mark only these items as failed, then continue
            apiFailed = true;
            chunk.forEach(c => failed.push(c));
            const n = chunk.length;
            dispatch({ type: "API_ERROR", error: describeApiError(retryErr) + ` (${n} ${n === 1 ? "entry" : "entries"} affected)` });
          }
        }

        // Start next batch fetch even after retry failure so remaining batches proceed
        if (b + 1 < batches.length && !signal.aborted) {
          dispatch({ type: "PROGRESS", progress: { total: unique.length, done: preAiDone + (b + 1) * API_BATCH_SIZE, current: `AI identifying batch ${b + 2}/${totalBatches}...`, phase: "api" } });
          pendingFetch = identifyBatch(batches[b + 1], useFormatting, signal);
        }

        if (!didRetry) continue;
      }

      // Process current batch results
      results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
      dispatch({ type: "FEED_APPEND", items: results.map(r => {
        const item = chunk[r.i];
        return { text: (useFormatting && r.cleanText) ? stripOuterBold(r.cleanText) : (item?.text || ""), source: r.source || UNKNOWN_SOURCE, category: fallbackCategory(r.category, allCats) };
      }) });
      // Cache AI results with known sources (fire-and-forget)
      const cacheItems = results
        .filter(r => r.source && r.source !== UNKNOWN_SOURCE && chunk[r.i] && (r.confidence === "high" || r.confidence === "medium"))
        .map(r => ({
          text: chunk[r.i].text, hint: null,
          source: r.source, category: r.category, confidence: r.confidence,
        }));
      if (cacheItems.length > 0) {
        fetch("/api/cache", {
          method: "POST",
          headers: API_HEADERS,
          body: JSON.stringify({ items: cacheItems }),
        }).catch(() => {});
      }
    }

    return { apiResults, apiFailed, failed };
  };

  // ── Processing pipeline — orchestrator ──
  const runProcessing = async (unique, appendMode, useFormatting = false) => {
    appendModeRef.current = appendMode;
    if (abortRef.current) abortRef.current.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    const signal = abortController.signal;

    // Kick off the compromise (NLP) load in parallel with the local-DB import.
    // Only formatting paths need it, so only block on it when useFormatting is set.
    const nlpReady = initNlp();
    if (useFormatting) await nlpReady;

    const { localMatches, needsApi } = await handleLocalLookup(unique, useFormatting);
    if (signal.aborted) return;

    const { lookupResults, stillNeedsApi } = await handleExternalLookup(unique, needsApi, localMatches.length, signal);
    if (signal.aborted) return;

    const preAiDone = localMatches.length + lookupResults.size;
    let apiResults = new Map(), apiFailed = false, failed = [];
    if (stillNeedsApi.length > 0) {
      ({ apiResults, apiFailed, failed } = await handleApiBatch(unique, stillNeedsApi, preAiDone, useFormatting, signal));
    }
    if (signal.aborted) return;
    if (failed.length > 0) dispatch({ type: "FAILED_ENTRIES", entries: failed });

    const localByIdx = new Map(localMatches.map(m => [m.idx, m]));
    const fmt = (t) => useFormatting ? basicFormat(t) : t;
    const newQuotes = unique.map((p, i) => {
      const local = localByIdx.get(i);
      if (local) return makeQuote(fmt(p.text), local.result.source, local.result.category, local.result.confidence);
      const lookup = lookupResults.get(i);
      if (lookup) return makeQuote(fmt(p.text), lookup.source, fallbackCategory(lookup.category, allCats), lookup.confidence || "medium");
      const api = apiResults.get(i);
      if (api) return makeQuote((useFormatting && api.cleanText) ? stripOuterBold(api.cleanText) : p.text, api.source || p.hint, fallbackCategory(api.category, allCats), api.confidence);
      return makeQuote(fmt(p.text), p.hint);
    });

    if (signal.aborted) return;
    const validQuotes = newQuotes.filter(q => q.text && q.text.trim());
    appendMode ? setQuotes(prev => [...prev, ...validQuotes]) : setQuotes(validQuotes);
    dispatch({ type: "DONE", total: unique.length, stats: { local: localMatches.length, lookup: lookupResults.size, api: apiResults.size, failed: apiFailed ? stillNeedsApi.length - apiResults.size : 0, total: unique.length } });
    removeFromStorage(LS_DRAFT);
    // Auto-transition after processing completes
    if (autoTransitionRef.current) clearTimeout(autoTransitionRef.current);
    autoTransitionRef.current = setTimeout(() => {
      if (abortRef.current?.signal?.aborted) return;
      autoTransitionRef.current = null;
      dispatch({ type: "FINISH" });
      goPhase("results");
    }, PROCESSING_DONE_MS);
  };

  const processEntries = async (inputText, appendMode = false, useFormatting = false, preSplitLines = null) => {
    const lines = preSplitLines || smartSplit(inputText.trim());
    if (!lines.length) return;

    const parsed = lines.map(l => smartParse(l));

    const unique = [];
    const seen = [];
    const seenExact = new Map();
    const addSeen = (entry) => { seen.push(entry); seenExact.set(entry.norm, entry); };
    if (appendMode) {
      for (const q of quotesRef.current) addSeen({ norm: normalize(q.text), text: q.text, source: q.source });
    }
    if (appendMode && pendingContinuationRef.current) {
      for (const p of pendingContinuationRef.current.unique) {
        addSeen({ norm: normalize(p.text), text: p.text, source: p.hint });
      }
    }
    const nearDupes = [];

    parsed.forEach(p => {
      const norm = normalize(p.text);
      let match = seenExact.get(norm);
      if (!match) {
        match = seen.find(s => similarity(s.norm, norm) > DUPE_SIMILARITY_THRESHOLD);
      }

      if (match) {
        nearDupes.push({
          incoming: p,
          matchedText: match.text || match.norm,
          matchedSource: match.source || null
        });
      } else {
        unique.push(p);
        addSeen({ norm, text: p.text, source: p.hint });
      }
    });

    if (nearDupes.length > 0) {
      dispatch({ type: "SHOW_DUPES", dupes: nearDupes, decisions: Object.fromEntries(nearDupes.map((_, i) => [i, "skip"])) });
      pendingContinuationRef.current = { unique, seen, appendMode, totalParsed: parsed.length, useFormatting };
      return;
    }

    dispatch({ type: "START", dupes: 0, total: unique.length });
    goPhase("processing");
    await runProcessing(unique, appendMode, useFormatting);
  };

  const handleDupesContinue = async () => {
    if (!pendingContinuationRef.current) return;
    const { unique, appendMode, useFormatting } = pendingContinuationRef.current;
    const finalUnique = [...unique];
    let keptCount = 0;

    const currentState = stateRef.current;
    currentState.pendingDupes.forEach((dupe, i) => {
      const decision = currentState.dupeDecisions[i];

      if (decision === "keep") {
        finalUnique.push(dupe.incoming);
        keptCount++;
      } else if (decision === "merge") {
        const mergedSource = dupe.matchedSource && dupe.incoming.hint
          ? `${dupe.incoming.hint} / ${dupe.matchedSource}`
          : dupe.incoming.hint || dupe.matchedSource || "Unknown";
        finalUnique.push({ ...dupe.incoming, hint: mergedSource });
        keptCount++;
      }
    });

    const dupes = currentState.pendingDupes.length - keptCount;
    dispatch({ type: "CLEAR_DUPES" });
    pendingContinuationRef.current = null;

    dispatch({ type: "START", dupes, total: finalUnique.length });
    goPhase("processing");
    await runProcessing(finalUnique, appendMode, useFormatting);
  };

  const retryFailed = async () => {
    const currentState = stateRef.current;
    if (!currentState.failedEntries.length) return;
    dispatch({ type: "API_ERROR", error: null });

    const entriesToRetry = [...currentState.failedEntries];
    const text = entriesToRetry.map(e => `${e.text}${e.hint ? ` \u2014 ${e.hint}` : ""}`).join("\n");

    try {
      await processEntries(text, true, currentState.formattingEnabled);
      dispatch({ type: "FAILED_ENTRIES", entries: [] });
    } catch (error) {
      dispatch({ type: "API_ERROR", error: "Retry failed. You can try again or edit manually." });
    }
  };

  // Skip the auto-transition timer and go directly to results
  const skipToResults = () => {
    if (autoTransitionRef.current) {
      clearTimeout(autoTransitionRef.current);
      autoTransitionRef.current = null;
    }
    dispatch({ type: "FINISH" });
    goPhase("results");
  };

  // Cancel processing: abort in-flight requests and flush already-identified quotes
  const cancelProcessing = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (autoTransitionRef.current) {
      clearTimeout(autoTransitionRef.current);
      autoTransitionRef.current = null;
    }
    // Flush any partially-identified quotes from the feed into the store
    const feed = stateRef.current.identifiedFeed;
    if (feed.length > 0) {
      const partialQuotes = feed
        .filter(item => item.text && item.text.trim())
        .map(item => makeQuote(item.text, item.source, item.category, "medium"));
      if (partialQuotes.length > 0) {
        if (appendModeRef.current) {
          setQuotes(prev => [...prev, ...partialQuotes]);
        } else {
          setQuotes(partialQuotes);
        }
      }
    }
    dispatch({ type: "CANCEL" });
    const hasQuotes = quotesRef.current.length > 0;
    goPhase(hasQuotes ? "results" : "input");
  };

  // Reset processing-specific state (called by handleClear in App)
  const resetProcessingState = () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    if (autoTransitionRef.current) { clearTimeout(autoTransitionRef.current); autoTransitionRef.current = null; }
    dispatch({ type: "RESET" });
    pendingContinuationRef.current = null;
  };

  // ── AI auto-group: find quotes matching a theme ──
  const autoGroup = async (theme, quotesList, externalSignal) => {
    if (!theme || quotesList.length === 0) return [];

    const quoteTexts = quotesList.map(q => q.text);
    const r = await fetchWithTimeout("/api/auto-group", {
      method: "POST",
      headers: API_HEADERS,
      body: JSON.stringify({ theme, quotes: quoteTexts }),
    }, AUTO_GROUP_TIMEOUT_MS, externalSignal);

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || `API returned ${r.status}`);
    }

    const { indices } = await r.json();
    return indices.map(i => quotesList[i]?.id).filter(Boolean);
  };

  // Expose setters for individual fields still needed by App.jsx
  const setDupeDecision = (index, decision) => {
    dispatch({ type: "SET_DUPE_DECISION", index, decision });
  };

  const setFormattingEnabled = (enabled) => {
    dispatch({ type: "SET_FORMATTING", enabled });
  };

  const dismissApiError = () => {
    dispatch({ type: "DISMISS_ERROR" });
  };

  const dismissStats = () => {
    dispatch({ type: "DISMISS_STATS" });
  };

  const actions = {
    identifyBatch, autoGroup,
    processEntries, handleDupesContinue, retryFailed,
    skipToResults, cancelProcessing, resetProcessingState,
    setDupeDecision, setFormattingEnabled,
    dismissApiError, dismissStats,
  };

  return { ...state, ...actions };
}
