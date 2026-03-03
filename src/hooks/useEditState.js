import { useState, useRef, useCallback, useEffect } from "react";
import { CONF_ORDER } from "../data/constants";

export default function useEditState({ quotes, setQuotes, filtered, showToast, trackDeletion }) {
  const [editingId, setEditingId]           = useState(null);
  const [inlineEdit, setInlineEdit]         = useState(null);
  const [selected, setSelected]             = useState(new Set());
  const [bulkEditCat, setBulkEditCat]       = useState("");
  const [bulkEditSource, setBulkEditSource] = useState("");
  const [reviewQueue, setReviewQueue]       = useState([]);
  const [confirmBulkDel, setConfirmBulkDel] = useState(false);
  const [savedPulse, setSavedPulse]         = useState(null);

  const lastSelectedIndex = useRef(null);
  const undoRef           = useRef(null);

  // ── Clean ghost IDs in selection ──
  useEffect(() => {
    if (selected.size === 0) return;
    const quoteIds = new Set(quotes.map(q => q.id));
    setSelected(prev => {
      const cleaned = new Set();
      let changed = false;
      for (const id of prev) {
        if (quoteIds.has(id)) {
          cleaned.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? cleaned : prev;
    });
  }, [quotes, selected.size]);

  // ── Filter reviewQueue when quotes change ──
  useEffect(() => {
    if (reviewQueue.length === 0) return;
    const quoteIds = new Set(quotes.map(q => q.id));
    setReviewQueue(prev => {
      const f = prev.filter(id => quoteIds.has(id));
      return f.length !== prev.length ? f : prev;
    });
  }, [quotes, reviewQueue.length]);

  // ── Reset shift-click index when filters change ──
  // (catFilter/favFilter/search/sortBy changes are reflected via `filtered` identity)
  useEffect(() => {
    lastSelectedIndex.current = null;
  }, [filtered]);

  // ── Helpers ──
  const startEditing = useCallback((id) => {
    setEditingId(id);
    setInlineEdit(null);
  }, []);

  const startInlineEdit = useCallback((id, field) => {
    setInlineEdit({ id, field });
    setEditingId(null);
  }, []);

  const saveEdit = useCallback((id, text, source, category) => {
    setQuotes(p => p.map(q => q.id === id ? { ...q, text, source, category, confidence: "high", updatedAt: Date.now() } : q));
    setEditingId(null);
    if (reviewQueue.length > 0) {
      const remaining = reviewQueue.filter(rid => rid !== id);
      setReviewQueue(remaining);
      if (remaining.length > 0) {
        setTimeout(() => {
          setEditingId(remaining[0]);
          const el = document.querySelector(`[data-id="${remaining[0]}"]`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      } else {
        showToast("Review complete \u2014 all entries updated!");
      }
    }
  }, [setQuotes, reviewQueue, showToast]);

  const saveInlineField = useCallback((id, field, value) => {
    setQuotes(p => p.map(q => {
      if (q.id !== id) return q;
      const newVal = field === "source" ? (value.trim() || q.source) : value;
      return { ...q, [field]: newVal, confidence: "high", updatedAt: Date.now() };
    }));
    setInlineEdit(null);
    setSavedPulse({ id, field });
    setTimeout(() => setSavedPulse(prev => prev?.id === id && prev?.field === field ? null : prev), 600);
    // First-use inline edit tip
    try {
      if (!localStorage.getItem("commonplace_inline_tip")) {
        localStorage.setItem("commonplace_inline_tip", "1");
        showToast("Tip: Click any source or category to quickly edit inline");
      }
    } catch(e) { /* ignore */ }
  }, [setQuotes, showToast]);

  const toggleSel = useCallback((id, shiftKey = false) => {
    if (shiftKey && lastSelectedIndex.current !== null) {
      const currentIndex = filtered.findIndex(q => q.id === id);
      const lastIndex = lastSelectedIndex.current;
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const rangeIds = filtered.slice(start, end + 1).map(q => q.id);
      setSelected(p => {
        const n = new Set(p);
        rangeIds.forEach(rangeId => n.add(rangeId));
        return n;
      });
      lastSelectedIndex.current = currentIndex;
    } else {
      setSelected(p => {
        const n = new Set(p);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
      lastSelectedIndex.current = filtered.findIndex(q => q.id === id);
    }
  }, [filtered]);

  const selAll = useCallback(() => {
    if (filtered.length === 0) return;
    const allSelected = filtered.every(q => selected.has(q.id));
    if (allSelected) {
      setSelected(new Set());
      lastSelectedIndex.current = null;
    } else {
      setSelected(new Set(filtered.map(q => q.id)));
      lastSelectedIndex.current = null;
    }
  }, [filtered, selected]);

  const applyBulk = useCallback(() => {
    const affectedIds = new Set(selected);
    const snapshot = quotes.filter(q => affectedIds.has(q.id)).map(q => ({ ...q }));
    setQuotes(p => p.map(q => {
      if (!selected.has(q.id)) return q;
      const u = { ...q, updatedAt: Date.now() };
      if (bulkEditCat) u.category = bulkEditCat;
      if (bulkEditSource.trim()) u.source = bulkEditSource.trim();
      if (bulkEditCat || bulkEditSource.trim()) u.confidence = "high";
      return u;
    }));
    const count = selected.size;
    setSelected(new Set()); setBulkEditCat(""); setBulkEditSource("");
    undoRef.current = { bulkSnapshot: snapshot };
    showToast(`${count} entries updated`, "Undo", () => {
      if (undoRef.current?.bulkSnapshot) {
        const snap = undoRef.current.bulkSnapshot;
        const snapMap = new Map(snap.map(q => [q.id, q]));
        setQuotes(p => p.map(q => snapMap.has(q.id) ? snapMap.get(q.id) : q));
        undoRef.current = null;
      }
    });
  }, [quotes, selected, bulkEditCat, bulkEditSource, setQuotes, showToast]);

  const bulkDel = useCallback(() => {
    setConfirmBulkDel(false);
    const deletedQuotes = quotes.filter(q => selected.has(q.id));
    const deletedIds = new Set(selected);
    setQuotes(p => p.filter(q => !deletedIds.has(q.id)));
    trackDeletion([...deletedIds]);
    setSelected(new Set());
    showToast(`${deletedQuotes.length} entries deleted`, "Undo", () => {
      setQuotes(p => {
        const restored = [...p];
        deletedQuotes.forEach(dq => {
          const origIdx = quotes.findIndex(q => q.id === dq.id);
          restored.splice(Math.min(origIdx, restored.length), 0, dq);
        });
        return restored;
      });
    });
  }, [quotes, selected, setQuotes, showToast, trackDeletion]);

  const startReviewFlow = useCallback(() => {
    const attentionIds = quotes
      .filter(q => q.confidence === "low" || q.category === "Unknown")
      .sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0))
      .map(q => q.id);
    setReviewQueue(attentionIds);
    if (attentionIds.length > 0) {
      setTimeout(() => {
        setEditingId(attentionIds[0]);
        const el = document.querySelector(`[data-id="${attentionIds[0]}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
    return attentionIds;
  }, [quotes]);

  return {
    editingId, setEditingId,
    inlineEdit, setInlineEdit,
    selected, setSelected,
    bulkEditCat, setBulkEditCat,
    bulkEditSource, setBulkEditSource,
    reviewQueue, setReviewQueue,
    confirmBulkDel, setConfirmBulkDel,
    savedPulse,
    lastSelectedIndex,
    startEditing, startInlineEdit,
    saveEdit, saveInlineField,
    toggleSel, selAll,
    applyBulk, bulkDel,
    startReviewFlow,
  };
}
