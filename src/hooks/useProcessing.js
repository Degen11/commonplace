import { useReducer, useRef, useCallback, useEffect, useMemo } from "react";
import { buildValidCats, fallbackCategory } from "../data/constants";
import {
  normalize, similarity, smartParse, smartSplit, basicFormat,
  initProperNouns,
} from "../utils/textFormatting";
import { makeQuote } from "../utils/quotes";
import { fetchWithTimeout, API_HEADERS } from "../utils/api";
import { describeApiError } from "../utils/apiErrors";
import {
  API_TIMEOUT_MS, AUTO_GROUP_TIMEOUT_MS, API_BATCH_SIZE,
  PROCESSING_DONE_MS, DUPE_SIMILARITY_THRESHOLD,
} from "../config";

// ── State machine ──
// idle → dupes → processing → done → idle
//                    ↓
//                  error (partial)

const INITIAL_STATE = {
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

function processingReducer(state, action) {
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

  // Guard state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Refs for latest values — so callbacks never read stale closures
  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;
  const stateRef = useRef(state);
  stateRef.current = state;

  // Single safe dispatch — replaces 7 safeSet* wrappers
  const safeDispatch = useCallback((action) => {
    if (mountedRef.current) dispatch(action);
  }, []);

  // ── API: batch identification ──
  const identifyBatch = useCallback(async (items, withFormatting = false, externalSignal) => {
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
  }, []);

  // ── Processing pipeline ──
  const runProcessing = useCallback(async (unique, appendMode, useFormatting = false) => {
    const { default: localDb, localLookup } = await import("../data/localQuotes");
    initProperNouns(localDb);

    const localMatches = []; const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    if (!mountedRef.current) return;

    if (localMatches.length > 0) {
      safeDispatch({ type: "FEED", feed: localMatches.map(m => ({
        text: useFormatting ? basicFormat(m.text) : m.text,
        source: m.result.source, category: m.result.category,
      })) });
    }

    safeDispatch({ type: "PROGRESS", progress: { total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need lookup...`, phase: "local" } });

    // ── External lookup (Wikiquote, Open Library, cache) ──
    const lookupResults = new Map();
    if (needsApi.length > 0) {
      try {
        safeDispatch({ type: "PROGRESS", progress: { total: unique.length, done: localMatches.length, current: "Checking online databases...", phase: "lookup" } });
        const lookupBody = needsApi.map(p => ({ text: p.text, hint: p.hint || null }));
        const lr = await fetch("/api/lookup", {
          method: "POST",
          headers: API_HEADERS,
          body: JSON.stringify({ quotes: lookupBody }),
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
      } catch {
        // Lookup failure is non-critical — fall through to AI
      }
    }

    if (!mountedRef.current) return;

    const stillNeedsApi = needsApi.filter(p => !lookupResults.has(p.idx));
    if (lookupResults.size > 0) {
      safeDispatch({ type: "FEED_APPEND", items: [...lookupResults.values()].map(r => {
        const item = needsApi[r.i];
        return { text: item?.text || "", source: r.source, category: r.category };
      }) });
      safeDispatch({ type: "PROGRESS", progress: { total: unique.length, done: localMatches.length + lookupResults.size, current: `${lookupResults.size} found online, ${stillNeedsApi.length} need AI...`, phase: "lookup" } });
    }

    const preAiDone = localMatches.length + lookupResults.size;
    const apiResults = new Map(); let apiFailed = false; const failed = [];
    if (stillNeedsApi.length > 0) {
      for (let i = 0; i < stillNeedsApi.length; i += API_BATCH_SIZE) {
        if (!mountedRef.current) return;
        const chunk = stillNeedsApi.slice(i, i + API_BATCH_SIZE);
        safeDispatch({ type: "PROGRESS", progress: { total: unique.length, done: preAiDone + i, current: `AI identifying batch ${Math.floor(i / API_BATCH_SIZE) + 1}/${Math.ceil(stillNeedsApi.length / API_BATCH_SIZE)}...`, phase: "api" } });
        try {
          const results = await identifyBatch(chunk, useFormatting);
          if (!mountedRef.current) return;
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
          safeDispatch({ type: "FEED_APPEND", items: results.map(r => {
            const item = chunk[r.i];
            return { text: (useFormatting && r.cleanText) ? r.cleanText : (item?.text || ""), source: r.source || "Unknown source", category: fallbackCategory(r.category, allCats) };
          }) });
          // Cache only high-confidence AI results (fire-and-forget)
          const cacheItems = results
            .filter(r => r.source && chunk[r.i] && r.confidence === "high")
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
        } catch (err) {
          apiFailed = true; chunk.forEach(c => failed.push(c));
          safeDispatch({ type: "API_ERROR", error: describeApiError(err) + ` (${stillNeedsApi.length - i} entries affected)` });
          break;
        }
      }
    }
    if (!mountedRef.current) return;
    if (failed.length > 0) safeDispatch({ type: "FAILED_ENTRIES", entries: failed });

    const localByIdx = new Map(localMatches.map(m => [m.idx, m]));
    const fmt = (t) => useFormatting ? basicFormat(t) : t;
    const newQuotes = unique.map((p, i) => {
      const local = localByIdx.get(i);
      if (local) return makeQuote(fmt(p.text), local.result.source, local.result.category, local.result.confidence);
      const lookup = lookupResults.get(i);
      if (lookup) return makeQuote(fmt(p.text), lookup.source, fallbackCategory(lookup.category, allCats), lookup.confidence || "medium");
      const api = apiResults.get(i);
      if (api) return makeQuote((useFormatting && api.cleanText) ? api.cleanText : p.text, api.source || p.hint, fallbackCategory(api.category, allCats), api.confidence);
      return makeQuote(fmt(p.text), p.hint);
    });

    if (!mountedRef.current) return;
    const validQuotes = newQuotes.filter(q => q.text && q.text.trim());
    appendMode ? setQuotes(prev => [...prev, ...validQuotes]) : setQuotes(validQuotes);
    safeDispatch({ type: "DONE", total: unique.length, stats: { local: localMatches.length, lookup: lookupResults.size, api: apiResults.size, failed: apiFailed ? stillNeedsApi.length - apiResults.size : 0, total: unique.length } });
    try { localStorage.removeItem("commonplace_draft"); } catch(e) {}
    // Auto-transition after processing completes
    if (autoTransitionRef.current) clearTimeout(autoTransitionRef.current);
    autoTransitionRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      autoTransitionRef.current = null;
      safeDispatch({ type: "FINISH" });
      goPhase("results");
    }, PROCESSING_DONE_MS);
  }, [safeDispatch, identifyBatch, allCats, setQuotes, goPhase]);

  const processEntries = useCallback(async (inputText, appendMode = false, useFormatting = false) => {
    const lines = smartSplit(inputText.trim());
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

    safeDispatch({ type: "START", dupes: 0, total: unique.length });
    goPhase("processing");
    await runProcessing(unique, appendMode, useFormatting);
  }, [safeDispatch, goPhase, runProcessing]);

  const handleDupesContinue = useCallback(async () => {
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

    safeDispatch({ type: "START", dupes, total: finalUnique.length });
    goPhase("processing");
    await runProcessing(finalUnique, appendMode, useFormatting);
  }, [safeDispatch, goPhase, runProcessing]);

  const retryFailed = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState.failedEntries.length) return;
    safeDispatch({ type: "API_ERROR", error: null });

    const entriesToRetry = [...currentState.failedEntries];
    const text = entriesToRetry.map(e => `${e.text}${e.hint ? ` \u2014 ${e.hint}` : ""}`).join("\n");

    try {
      await processEntries(text, true, currentState.formattingEnabled);
      safeDispatch({ type: "FAILED_ENTRIES", entries: [] });
    } catch (error) {
      safeDispatch({ type: "API_ERROR", error: "Retry failed. You can try again or edit manually." });
    }
  }, [safeDispatch, processEntries]);

  // Skip the auto-transition timer and go directly to results
  const skipToResults = useCallback(() => {
    if (autoTransitionRef.current) {
      clearTimeout(autoTransitionRef.current);
      autoTransitionRef.current = null;
    }
    safeDispatch({ type: "FINISH" });
    goPhase("results");
  }, [goPhase, safeDispatch]);

  // Cancel processing and return to input
  const cancelProcessing = useCallback(() => {
    safeDispatch({ type: "CANCEL" });
    goPhase("input");
  }, [goPhase, safeDispatch]);

  // Reset processing-specific state (called by handleClear in App)
  const resetProcessingState = useCallback(() => {
    if (autoTransitionRef.current) { clearTimeout(autoTransitionRef.current); autoTransitionRef.current = null; }
    dispatch({ type: "RESET" });
    pendingContinuationRef.current = null;
  }, []);

  // ── AI auto-group: find quotes matching a theme ──
  const autoGroup = useCallback(async (theme, quotesList, externalSignal) => {
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
  }, []);

  // Expose setters for individual fields still needed by App.jsx
  const setDupeDecision = useCallback((index, decision) => {
    dispatch({ type: "SET_DUPE_DECISION", index, decision });
  }, []);

  const setFormattingEnabled = useCallback((enabled) => {
    dispatch({ type: "SET_FORMATTING", enabled });
  }, []);

  const dismissApiError = useCallback(() => {
    dispatch({ type: "DISMISS_ERROR" });
  }, []);

  const dismissStats = useCallback(() => {
    dispatch({ type: "DISMISS_STATS" });
  }, []);

  // Memoize return to prevent unnecessary re-renders in consumers
  const actions = useMemo(() => ({
    identifyBatch, autoGroup,
    processEntries, handleDupesContinue, retryFailed,
    skipToResults, cancelProcessing, resetProcessingState,
    setDupeDecision, setFormattingEnabled,
    dismissApiError, dismissStats,
  }), [identifyBatch, autoGroup, processEntries, handleDupesContinue, retryFailed, skipToResults, cancelProcessing, resetProcessingState, setDupeDecision, setFormattingEnabled, dismissApiError, dismissStats]);

  return { ...state, ...actions };
}
