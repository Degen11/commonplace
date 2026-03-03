import { useState, useRef, useCallback, useEffect } from "react";
import { VIBE_TAGS } from "../data/constants";
import {
  normalize, similarity, smartParse, smartSplit, basicFormat,
  initProperNouns,
} from "../utils/helpers";

const LS_DRAFT = "commonplace_draft";

export default function useProcessing({ quotes, setQuotes, allCats, goPhase }) {
  const [isProcessing, setIsProcessing]       = useState(false);
  const [processingDone, setProcessingDone]   = useState(false);
  const [progress, setProgress]               = useState(null);
  const [identifiedFeed, setIdentifiedFeed]   = useState([]);
  const [apiError, setApiError]               = useState(null);
  const [failedEntries, setFailedEntries]     = useState([]);
  const [pendingDupes, setPendingDupes]       = useState([]);
  const [dupeDecisions, setDupeDecisions]     = useState({});
  const [formattingEnabled, setFormattingEnabled] = useState(false);
  const [stats, setStats]                     = useState(null);

  const pendingContinuationRef = useRef(null);

  // FIX: Guard state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Safe state setters — no-op if unmounted
  const safeSetIsProcessing   = useCallback((v) => { if (mountedRef.current) setIsProcessing(v); }, []);
  const safeSetProcessingDone = useCallback((v) => { if (mountedRef.current) setProcessingDone(v); }, []);
  const safeSetProgress       = useCallback((v) => { if (mountedRef.current) setProgress(v); }, []);
  const safeSetIdentifiedFeed = useCallback((v) => { if (mountedRef.current) setIdentifiedFeed(v); }, []);
  const safeSetApiError       = useCallback((v) => { if (mountedRef.current) setApiError(v); }, []);
  const safeSetFailedEntries  = useCallback((v) => { if (mountedRef.current) setFailedEntries(v); }, []);
  const safeSetStats          = useCallback((v) => { if (mountedRef.current) setStats(v); }, []);

  // ── API: batch identification ──
  // Accepts an optional external AbortSignal for cancellation by callers (e.g. reIdentify)
  const identifyBatch = useCallback(async (items, withFormatting = false, externalSignal) => {
    if (items.length === 0) return [];
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // If an external signal is provided, abort our controller when it fires
    if (externalSignal) {
      if (externalSignal.aborted) { clearTimeout(timeoutId); throw new DOMException("Aborted", "AbortError"); }
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      const r = await fetch("/api/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "CommonplaceApp",
        },
        body: JSON.stringify({
          formatting: withFormatting,
          messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
        }),
        signal: controller.signal,
      });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || "API error");
      const t = d.content.map(x => x.text || "").join("");
      const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
      return Array.isArray(parsed) ? parsed : [];
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // ── Processing pipeline ──
  const runProcessing = async (unique, appendMode, useFormatting = false) => {
    // Lazy-load the local DB only when processing actually starts
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
      safeSetIdentifiedFeed(localMatches.map(m => ({
        text: useFormatting ? basicFormat(m.text) : m.text,
        source: m.result.source, category: m.result.category,
      })));
    }

    safeSetProgress({ total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need AI...`, phase: "local" });

    const apiResults = new Map(); let apiFailed = false; const failed = []; const BATCH_SIZE = 20;
    if (needsApi.length > 0) {
      for (let i = 0; i < needsApi.length; i += BATCH_SIZE) {
        if (!mountedRef.current) return;
        const chunk = needsApi.slice(i, i + BATCH_SIZE);
        safeSetProgress({ total: unique.length, done: localMatches.length + i, current: `AI identifying batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsApi.length / BATCH_SIZE)}...`, phase: "api" });
        try {
          const results = await identifyBatch(chunk, useFormatting);
          if (!mountedRef.current) return;
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
          safeSetIdentifiedFeed(prev => [...prev, ...results.map(r => {
            const item = chunk[r.i];
            return { text: (useFormatting && r.cleanText) ? r.cleanText : (item?.text || ""), source: r.source || "Unknown", category: r.category || "Unknown" };
          })]);
        } catch {
          apiFailed = true; chunk.forEach(c => failed.push(c));
          safeSetApiError(`AI identification failed for ${needsApi.length - i} entries. You can edit them manually or retry.`);
          break;
        }
      }
    }
    if (!mountedRef.current) return;
    if (failed.length > 0) safeSetFailedEntries(failed);

    const validCats = new Set([...allCats, ...VIBE_TAGS]);
    const newQuotes = unique.map((p, i) => {
      const local = localMatches.find(m => m.idx === i);
      if (local) {
        const text = useFormatting ? basicFormat(p.text) : p.text;
        return { id: crypto.randomUUID(), text, source: local.result.source, category: local.result.category, confidence: local.result.confidence, favorite: false, updatedAt: Date.now() };
      }
      const api = apiResults.get(i);
      if (api) {
        const text = (useFormatting && api.cleanText) ? api.cleanText : p.text;
        return { id: crypto.randomUUID(), text, source: api.source || p.hint || "Unknown", category: validCats.has(api.category) ? api.category : "Unknown", confidence: api.confidence || "low", favorite: false, updatedAt: Date.now() };
      }
      const text = useFormatting ? basicFormat(p.text) : p.text;
      return { id: crypto.randomUUID(), text, source: p.hint || "Unknown", category: "Unknown", confidence: "low", favorite: false, updatedAt: Date.now() };
    });

    if (!mountedRef.current) return;
    appendMode ? setQuotes(prev => [...prev, ...newQuotes]) : setQuotes(newQuotes);
    safeSetStats(prev => ({ ...(prev || {}), local: localMatches.length, api: apiResults.size, failed: apiFailed ? needsApi.length - apiResults.size : 0, total: unique.length }));
    safeSetProcessingDone(true);
    safeSetProgress({ total: unique.length, done: unique.length, current: "Done!", phase: "complete" });
    try { localStorage.removeItem(LS_DRAFT); } catch(e) {}
    setTimeout(() => {
      if (!mountedRef.current) return;
      safeSetProgress(null); safeSetIsProcessing(false); safeSetProcessingDone(false); goPhase("results");
    }, 1200);
  };

  const processEntries = async (inputText, appendMode = false, useFormatting = false) => {
    const lines = smartSplit(inputText.trim());
    if (!lines.length) return;

    const parsed = lines.map(l => smartParse(l));
    const existingTexts = appendMode ? quotes.map(q => normalize(q.text)) : [];

    const unique = [];
    const seen = new Map(existingTexts.map(t => {
      const q = quotes.find(q => normalize(q.text) === t);
      return [t, q];
    }));
    const nearDupes = [];

    parsed.forEach(p => {
      const norm = normalize(p.text);
      const matchedNorm = [...seen.keys()].find(s => similarity(s, norm) > 0.55);

      if (matchedNorm) {
        const matchedQuote = seen.get(matchedNorm);
        nearDupes.push({
          incoming: p,
          matchedText: matchedQuote?.text || matchedNorm,
          matchedSource: matchedQuote?.source || null
        });
      } else {
        unique.push(p);
        seen.set(norm, { text: p.text, source: p.hint });
      }
    });

    if (nearDupes.length > 0) {
      setPendingDupes(nearDupes);
      setDupeDecisions(Object.fromEntries(nearDupes.map((_, i) => [i, "skip"])));
      pendingContinuationRef.current = { unique, seen, appendMode, totalParsed: parsed.length, useFormatting };
      return;
    }

    safeSetIsProcessing(true); safeSetFailedEntries([]); safeSetIdentifiedFeed([]); goPhase("processing"); safeSetApiError(null);
    safeSetStats({ dupes: 0, total: unique.length });
    await runProcessing(unique, appendMode, useFormatting);
  };

  const handleDupesContinue = async () => {
    const { unique, appendMode, useFormatting } = pendingContinuationRef.current;
    // Clone unique to avoid mutating the ref's array
    const finalUnique = [...unique];
    let keptCount = 0;

    pendingDupes.forEach((dupe, i) => {
      const decision = dupeDecisions[i];

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

    const dupes = pendingDupes.length - keptCount;
    setPendingDupes([]);
    setDupeDecisions({});
    pendingContinuationRef.current = null;

    safeSetIsProcessing(true);
    safeSetFailedEntries([]);
    safeSetIdentifiedFeed([]);
    goPhase("processing");
    safeSetApiError(null);
    safeSetStats({ dupes, total: finalUnique.length });
    await runProcessing(finalUnique, appendMode, useFormatting);
  };

  const retryFailed = async () => {
    if (!failedEntries.length) return;
    safeSetApiError(null);

    const entriesToRetry = [...failedEntries];
    const text = entriesToRetry.map(e => `${e.text}${e.hint ? ` \u2014 ${e.hint}` : ""}`).join("\n");

    try {
      await processEntries(text, true, formattingEnabled);
      safeSetFailedEntries([]);
    } catch (error) {
      safeSetApiError(`Retry failed. You can try again or edit manually.`);
    }
  };

  // Reset processing-specific state (called by handleClear in App)
  const resetProcessingState = () => {
    setStats(null);
    setApiError(null);
    setFailedEntries([]);
    setPendingDupes([]);
    setDupeDecisions({});
    pendingContinuationRef.current = null;
  };

  return {
    isProcessing, setIsProcessing,
    processingDone, setProcessingDone,
    progress, setProgress,
    identifiedFeed,
    apiError, setApiError,
    failedEntries,
    stats, setStats,
    pendingDupes, dupeDecisions, setDupeDecisions,
    formattingEnabled, setFormattingEnabled,
    identifyBatch,
    processEntries, handleDupesContinue, retryFailed,
    resetProcessingState,
  };
}
