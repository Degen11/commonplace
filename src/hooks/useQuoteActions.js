import { useState, useRef, useCallback, useEffect } from "react";
import { buildValidCats, fallbackCategory, QUOTED_CATS } from "../data/constants";
import { smartSplit } from "../utils/textFormatting";
import { parseKindleClippings, parseReadwiseCSV, parseCSVLine, parseJSONQuotes, parseMarkdownQuotes, parseNotionCSV } from "../utils/parsers";
import { generateShareImage } from "../utils/shareImage";
import { downloadBlob } from "../utils/export";
import { DELETE_ANIM_MS, COPY_PULSE_MS, API_BATCH_SIZE, MAX_IMPORT_FILE_BYTES } from "../config";
import { describeApiError } from "../utils/apiErrors";

export default function useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion, untrackDeletion, cleanCollectionRefs }) {
  const [deletingId, setDeletingId]             = useState(null);
  const [copiedId, setCopiedId]                 = useState(null);
  const [reidentifyingIds, setReidentifyingIds] = useState(new Set());
  const [dragId, setDragId]                     = useState(null);
  const [dragInsert, setDragInsert]             = useState(null);

  const reidentifyAbortRefs  = useRef(new Map());
  const lastDragTarget       = useRef(null);
  const lastDragHalf         = useRef(null);
  const mountedRef           = useRef(true);
  const quotesRef            = useRef(quotes);
  quotesRef.current = quotes;

  // ── Mount guard + abort re-identify controllers on unmount ──
  useEffect(() => {
    mountedRef.current = true;
    const refs = reidentifyAbortRefs.current;
    return () => {
      mountedRef.current = false;
      for (const controller of refs.values()) {
        controller.abort();
      }
      refs.clear();
    };
  }, []);

  // ── Delete ──
  // Undo data is captured directly in the toast callback closure,
  // so multiple rapid deletes each get their own independent undo.
  const handleDelete = useCallback((id) => {
    const deleted = quotesRef.current.find(q => q.id === id);
    const idx = quotesRef.current.findIndex(q => q.id === id);
    setDeletingId(id);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setDeletingId(null);
      setQuotes(p => p.filter(q => q.id !== id));
      trackDeletion([id]);
      if (cleanCollectionRefs) cleanCollectionRefs([id]);
      showToast("Entry deleted", "Undo", () => {
        setQuotes(p => { const n = [...p]; n.splice(Math.min(idx, n.length), 0, deleted); return n; });
        untrackDeletion([id]);
      });
    }, DELETE_ANIM_MS);
  }, [setQuotes, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs]);

  // ── Copy single quote ──
  const copyQuote = useCallback((q) => {
    const text = QUOTED_CATS.has(q.category)
      ? `"${q.text}" \u2014 ${q.source}`
      : `${q.text} \u2014 ${q.source}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(q.id);
        setTimeout(() => { if (mountedRef.current) setCopiedId(prev => prev === q.id ? null : prev); }, COPY_PULSE_MS);
        showToast("Copied!", null, null, "success");
      })
      .catch(() => showToast("Couldn't copy \u2014 try manually selecting the text.", null, null, "error"));
  }, [showToast]);

  // ── Share as image ──
  const shareAsImage = useCallback(async (q) => {
    try {
      const blob = await generateShareImage(q);
      downloadBlob(blob, "commonplace-quote.png");
      showToast("Image saved!", null, null, "success");
    } catch {
      showToast("Couldn't generate image.", null, null, "error");
    }
  }, [showToast]);

  // ── Re-identify ──
  const describeChanges = (oldQ, newSource, newCategory) => {
    const parts = [];
    if (newSource !== oldQ.source) parts.push(`source \u2192 ${newSource}`);
    if (newCategory !== oldQ.category) parts.push(`${oldQ.category} \u2192 ${newCategory}`);
    if (parts.length === 0) return "Re-identified \u2014 no changes";
    return `Re-identified: ${parts.join(", ")}`;
  };

  const reIdentify = useCallback(async (q) => {
    const existing = reidentifyAbortRefs.current.get(q.id);
    if (existing) existing.abort();

    const controller = new AbortController();
    reidentifyAbortRefs.current.set(q.id, controller);

    setReidentifyingIds(prev => new Set(prev).add(q.id));
    const clearId = () => {
      reidentifyAbortRefs.current.delete(q.id);
      setReidentifyingIds(prev => { const s = new Set(prev); s.delete(q.id); return s; });
    };

    try {
      const { localLookup } = await import("../data/localQuotes");
      if (controller.signal.aborted) return;

      const local = localLookup(q.text, null, { exactOnly: true });
      if (local) {
        const snapshot = { ...q };
        setQuotes(prev => prev.map(x => x.id === q.id ? {
          ...x, source: local.source, category: local.category, confidence: local.confidence, updatedAt: Date.now(),
        } : x));
        clearId();
        showToast(describeChanges(q, local.source, local.category), "Undo", () => {
          setQuotes(prev => prev.map(x => x.id === q.id ? snapshot : x));
        });
        return;
      }

      const item = { text: q.text, hint: null };
      const results = await identifyBatch([item], false, controller.signal);
      if (controller.signal.aborted) return;

      if (results.length > 0) {
        const r = results[0];
        const validCats = buildValidCats(allCats);
        const newSource = r.source || "Unknown source";
        const newCategory = fallbackCategory(r.category, allCats);
        const snapshot = { ...q };
        setQuotes(prev => prev.map(x => x.id === q.id ? {
          ...x,
          source: newSource,
          category: newCategory,
          confidence: r.confidence || "low",
          updatedAt: Date.now(),
        } : x));
        showToast(describeChanges(q, newSource, newCategory), "Undo", () => {
          setQuotes(prev => prev.map(x => x.id === q.id ? snapshot : x));
        });
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      showToast(describeApiError(err), null, null, "error");
    }
    clearId();
  }, [setQuotes, allCats, showToast, identifyBatch]);

  // ── Batch re-identify (for selected quotes) ──
  const batchReIdentify = useCallback(async (quoteIds) => {
    const qs = quotesRef.current.filter(q => quoteIds.has(q.id));
    if (qs.length === 0) return;

    const controller = new AbortController();
    const ids = qs.map(q => q.id);
    ids.forEach(id => {
      const existing = reidentifyAbortRefs.current.get(id);
      if (existing) existing.abort();
      reidentifyAbortRefs.current.set(id, controller);
    });
    setReidentifyingIds(prev => {
      const s = new Set(prev);
      ids.forEach(id => s.add(id));
      return s;
    });

    const clearIds = () => {
      ids.forEach(id => reidentifyAbortRefs.current.delete(id));
      setReidentifyingIds(prev => {
        const s = new Set(prev);
        ids.forEach(id => s.delete(id));
        return s;
      });
    };

    try {
      const { localLookup } = await import("../data/localQuotes");
      if (controller.signal.aborted) return;

      const needsApi = [];
      const snapshot = new Map(qs.map(q => [q.id, { ...q }]));
      const validCats = buildValidCats(allCats);
      let localCount = 0;

      // First pass: try local matches
      qs.forEach(q => {
        const local = localLookup(q.text, null, { exactOnly: true });
        if (local) {
          setQuotes(prev => prev.map(x => x.id === q.id ? {
            ...x, source: local.source, category: local.category, confidence: local.confidence, updatedAt: Date.now(),
          } : x));
          localCount++;
        } else {
          needsApi.push(q);
        }
      });

      // Second pass: batch API for remaining
      if (needsApi.length > 0 && !controller.signal.aborted) {
        for (let i = 0; i < needsApi.length; i += API_BATCH_SIZE) {
          if (controller.signal.aborted) break;
          const chunk = needsApi.slice(i, i + API_BATCH_SIZE);
          const items = chunk.map(q => ({ text: q.text, hint: null }));
          try {
            const results = await identifyBatch(items, false, controller.signal);
            if (controller.signal.aborted) break;
            results.forEach(r => {
              const q = chunk[r.i];
              if (!q) return;
              const newSource = r.source || "Unknown source";
              const newCategory = fallbackCategory(r.category, allCats);
              setQuotes(prev => prev.map(x => x.id === q.id ? {
                ...x, source: newSource, category: newCategory,
                confidence: r.confidence || "low", updatedAt: Date.now(),
              } : x));
            });
          } catch (err) {
            if (err.name === "AbortError") break;
            // Continue with remaining batches
          }
        }
      }

      clearIds();
      const total = qs.length;
      showToast(`Re-identified ${total} ${total === 1 ? "entry" : "entries"}`, "Undo", () => {
        setQuotes(prev => prev.map(q => snapshot.has(q.id) ? snapshot.get(q.id) : q));
      }, "success");
    } catch (err) {
      clearIds();
      if (err.name === "AbortError") return;
      showToast(describeApiError(err), null, null, "error");
    }
  }, [setQuotes, allCats, showToast, identifyBatch]);

  // ── Drag reorder ──
  // Use a ref for dragId so handleDragOver always reads the latest value
  // even when called from memoized row components with stale closures.
  const dragIdRef = useRef(null);

  const handleDragStart = useCallback((id) => {
    setDragId(id);
    dragIdRef.current = id;
    lastDragTarget.current = null;
    lastDragHalf.current = null;
  }, []);

  const handleDragOver = useCallback((e, targetId) => {
    e.preventDefault();
    const currentDragId = dragIdRef.current;
    if (!currentDragId || currentDragId === targetId) { setDragInsert(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientY - rect.top) < rect.height / 2 ? "above" : "below";
    if (lastDragTarget.current === targetId && lastDragHalf.current === half) return;
    lastDragHalf.current = half;
    setDragInsert({ id: targetId, pos: half });
    if (lastDragTarget.current === targetId) return;
    lastDragTarget.current = targetId;
    setQuotes(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(q => q.id === currentDragId);
      const toIdx   = arr.findIndex(q => q.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }, [setQuotes]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    dragIdRef.current = null;
    setDragInsert(null);
    lastDragTarget.current = null;
    lastDragHalf.current = null;
  }, []);

  // ── File import ──
  const entriesToContent = (entries) =>
    entries.map(en => en.hint ? `${en.text} \u2014 ${en.hint}` : en.text).join("\n");

  const handleFileImport = useCallback((file, setRawInput, setImportedFileName, onImportCollections) => {
    if (!file) return;

    // Gate: reject files that are too large to process safely in the browser
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`File too large (${sizeMB} MB). Maximum is ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`, null, null, "error");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "csv", "json", "md"].includes(ext)) { showToast("Supported formats: .txt, .csv, .json, .md", null, null, "error"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;
      let formatLabel = null;
      let skippedCount = 0;

      if (ext === "json") {
        const { entries, collections } = parseJSONQuotes(content);
        if (entries.length > 0) {
          content = entriesToContent(entries);
          formatLabel = "JSON";
          if (collections.length > 0 && onImportCollections) {
            onImportCollections(collections);
          }
        } else {
          showToast("Couldn't find quotes in JSON file. Expected an array with text/quote/content fields.", null, null, "error");
          return;
        }
      } else if (ext === "md") {
        const entries = parseMarkdownQuotes(content);
        if (entries.length > 0) {
          content = entriesToContent(entries);
          formatLabel = "Markdown";
        }
        // If no blockquotes found, treat the whole file as plain text (one quote per line)
      } else if (ext === "txt" && content.includes("==========")) {
        const totalClips = content.split("==========").filter(c => c.trim()).length;
        const entries = parseKindleClippings(content);
        if (entries.length > 0) {
          skippedCount = totalClips - entries.length;
          content = entriesToContent(entries);
          formatLabel = "Kindle highlights";
        }
      } else if (ext === "csv") {
        const headerLine = content.split("\n")[0]?.toLowerCase() || "";
        if (headerLine.includes("highlight")) {
          const totalDataLines = content.split("\n").filter((l, i) => i > 0 && l.trim()).length;
          const entries = parseReadwiseCSV(content);
          if (entries.length > 0) {
            skippedCount = totalDataLines - entries.length;
            content = entriesToContent(entries);
            formatLabel = "Readwise";
          }
        } else {
          // Try Notion-style CSV (has source/author columns)
          const notionEntries = parseNotionCSV(content);
          if (notionEntries.length > 0 && notionEntries.some(e => e.hint)) {
            content = entriesToContent(notionEntries);
            formatLabel = "CSV";
          } else {
            // Generic CSV fallback
            const lines = content.split("\n");
            const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, "").trim().toLowerCase());
            const textCol = ["text","quote","quotes","content","entry","name"].reduce((found, key) => {
              const idx = headers.indexOf(key);
              return found >= 0 ? found : idx;
            }, -1);
            const colIdx = textCol >= 0 ? textCol : 0;
            const dataLines = lines.slice(1);
            content = dataLines.map(l => {
              const fields = parseCSVLine(l);
              return fields[colIdx]?.trim() || "";
            }).filter(Boolean).join("\n");
          }
        }
      }

      setRawInput(content);
      setImportedFileName(file.name);
      const count = smartSplit(content).length;
      let msg = formatLabel
        ? `Loaded ${count} entries from ${file.name} (${formatLabel})`
        : `Loaded ${count} entries from ${file.name}`;
      if (skippedCount > 0) msg += ` \u00b7 ${skippedCount} skipped`;
      showToast(msg, null, null, "success");
    };
    reader.onerror = () => showToast("Couldn't read file \u2014 it may be corrupted or inaccessible.", null, null, "error");
    reader.readAsText(file);
  }, [showToast]);

  return {
    deletingId,
    copiedId,
    reidentifyingIds,
    dragId, dragInsert,
    handleDelete, copyQuote, shareAsImage, reIdentify, batchReIdentify,
    handleDragStart, handleDragOver, handleDragEnd,
    handleFileImport,
  };
}
