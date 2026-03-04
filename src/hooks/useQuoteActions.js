import { useState, useRef, useCallback, useEffect } from "react";
import { VIBE_TAGS, QUOTED_CATS } from "../data/constants";
import { smartSplit } from "../utils/textFormatting";
import { parseKindleClippings, parseReadwiseCSV, parseCSVLine } from "../utils/parsers";
import { generateShareImage } from "../utils/shareImage";

export default function useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion }) {
  const [deletingId, setDeletingId]             = useState(null);
  const [copiedId, setCopiedId]                 = useState(null);
  const [reidentifyingIds, setReidentifyingIds] = useState(new Set());
  const [dragId, setDragId]                     = useState(null);
  const [dragInsert, setDragInsert]             = useState(null);

  const undoRef              = useRef(null);
  const reidentifyAbortRefs  = useRef(new Map());
  const lastDragTarget       = useRef(null);
  const lastDragHalf         = useRef(null);

  // ── Abort re-identify controllers on unmount ──
  useEffect(() => {
    const refs = reidentifyAbortRefs.current;
    return () => {
      for (const controller of refs.values()) {
        controller.abort();
      }
      refs.clear();
    };
  }, []);

  // ── Delete ──
  const handleDelete = useCallback((id) => {
    const deleted = quotes.find(q => q.id === id);
    const idx = quotes.findIndex(q => q.id === id);
    setDeletingId(id);
    setTimeout(() => {
      setDeletingId(null);
      setQuotes(p => p.filter(q => q.id !== id));
      trackDeletion([id]);
      undoRef.current = { quote: deleted, index: idx };
      showToast("Entry deleted", "Undo", () => {
        if (undoRef.current) {
          const { quote, index } = undoRef.current;
          setQuotes(p => { const n = [...p]; n.splice(Math.min(index, n.length), 0, quote); return n; });
          undoRef.current = null;
        }
      });
    }, 200);
  }, [quotes, setQuotes, showToast, trackDeletion]);

  // ── Copy single quote ──
  const copyQuote = useCallback((q) => {
    const text = QUOTED_CATS.has(q.category)
      ? `"${q.text}" \u2014 ${q.source}`
      : `${q.text} \u2014 ${q.source}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(q.id);
        setTimeout(() => setCopiedId(prev => prev === q.id ? null : prev), 1200);
        showToast("Copied!");
      })
      .catch(() => showToast("Couldn't copy \u2014 try manually selecting the text."));
  }, [showToast]);

  // ── Share as image ──
  const shareAsImage = useCallback(async (q) => {
    try {
      const blob = await generateShareImage(q);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "commonplace-quote.png";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Image saved!");
    } catch {
      showToast("Couldn't generate image.");
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
        const validCats = new Set([...allCats, ...VIBE_TAGS]);
        const newSource = r.source || "Unknown";
        const newCategory = validCats.has(r.category) ? r.category : "Unknown";
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
      showToast("Couldn't reach AI. Try again.");
    }
    clearId();
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
  const handleFileImport = useCallback((file, setRawInput, setImportedFileName) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "csv"].includes(ext)) { showToast("Only .txt and .csv files are supported"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;
      let formatLabel = null;
      let skippedCount = 0;

      if (ext === "txt" && content.includes("==========")) {
        const totalClips = content.split("==========").filter(c => c.trim()).length;
        const entries = parseKindleClippings(content);
        if (entries.length > 0) {
          skippedCount = totalClips - entries.length;
          content = entries.map(en => en.hint ? `${en.text} \u2014 ${en.hint}` : en.text).join("\n");
          formatLabel = "Kindle highlights";
        }
      } else if (ext === "csv") {
        const headerLine = content.split("\n")[0]?.toLowerCase() || "";
        if (headerLine.includes("highlight")) {
          const totalDataLines = content.split("\n").filter((l, i) => i > 0 && l.trim()).length;
          const entries = parseReadwiseCSV(content);
          if (entries.length > 0) {
            skippedCount = totalDataLines - entries.length;
            content = entries.map(en => en.hint ? `${en.text} \u2014 ${en.hint}` : en.text).join("\n");
            formatLabel = "Readwise";
          }
        } else {
          const lines = content.split("\n");
          const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, "").trim().toLowerCase());
          const textCol = ["text","quote","quotes","content","entry"].reduce((found, key) => {
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

      setRawInput(content);
      setImportedFileName(file.name);
      const count = smartSplit(content).length;
      let msg = formatLabel
        ? `Loaded ${count} entries from ${file.name} (${formatLabel})`
        : `Loaded ${count} entries from ${file.name}`;
      if (skippedCount > 0) msg += ` \u00b7 ${skippedCount} skipped`;
      showToast(msg);
    };
    reader.onerror = () => showToast("Couldn't read file \u2014 it may be corrupted or inaccessible.");
    reader.readAsText(file);
  }, [showToast]);

  return {
    deletingId,
    copiedId,
    reidentifyingIds,
    dragId, dragInsert,
    undoRef,
    handleDelete, copyQuote, shareAsImage, reIdentify,
    handleDragStart, handleDragOver, handleDragEnd,
    handleFileImport,
  };
}
