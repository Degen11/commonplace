import { useState, useRef, useCallback, useEffect } from "react";
import { CONF_ORDER } from "../data/constants";
import { SAVED_PULSE_MS } from "../config";
import { toggleInSet, addAllToSet } from "../utils/helpers";

export default function useEditState({ quotes, setQuotes, filtered, visibleFiltered, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs, collections, addToCollection }) {
  const [editingId, setEditingId]           = useState(null);
  const [inlineEdit, setInlineEdit]         = useState(null);
  const [selected, setSelected]             = useState(new Set());
  const [bulkEditCat, setBulkEditCat]       = useState("");
  const [bulkEditSource, setBulkEditSource] = useState("");
  const [reviewQueue, setReviewQueue]       = useState([]);
  const [confirmBulkDel, setConfirmBulkDel] = useState(false);
  const [savedPulse, setSavedPulse]         = useState(null);

  const lastSelectedIndex = useRef(null);

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
    if (!text || !text.trim()) return;
    setQuotes(p => p.map(q => q.id === id ? { ...q, text, source, category, confidence: "high", updatedAt: Date.now() } : q));
    setEditingId(null);
    if (reviewQueue.length > 0) {
      const remaining = reviewQueue.filter(rid => rid !== id);
      setReviewQueue(remaining);
      if (remaining.length > 0) {
        setTimeout(() => {
          setEditingId(remaining[0]);
          const el = document.querySelector(`[data-id="${remaining[0]}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            showToast(`${remaining.length} left to review — clear filters to continue`);
          }
        }, 150);
      } else {
        showToast("Review complete \u2014 all entries updated!", null, null, "success");
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
    setTimeout(() => setSavedPulse(prev => prev?.id === id && prev?.field === field ? null : prev), SAVED_PULSE_MS);
  }, [setQuotes]);

  const selScope = visibleFiltered || filtered;

  const toggleSel = useCallback((id, shiftKey = false) => {
    if (shiftKey && lastSelectedIndex.current !== null) {
      const lastIndex = selScope.findIndex(q => q.id === lastSelectedIndex.current);
      const currentIndex = selScope.findIndex(q => q.id === id);
      if (lastIndex < 0 || currentIndex < 0) {
        // Anchor no longer visible — fall back to single toggle
        setSelected(p => toggleInSet(p, id));
        lastSelectedIndex.current = id;
        return;
      }
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const rangeIds = selScope.slice(start, end + 1).map(q => q.id);
      setSelected(p => addAllToSet(p, rangeIds));
      lastSelectedIndex.current = id;
    } else {
      setSelected(p => toggleInSet(p, id));
      lastSelectedIndex.current = id;
    }
  }, [selScope]);

  const selAll = useCallback(() => {
    if (selScope.length === 0) return;
    const allSelected = selScope.every(q => selected.has(q.id));
    if (allSelected) {
      setSelected(new Set());
      lastSelectedIndex.current = null;
    } else {
      setSelected(new Set(selScope.map(q => q.id)));
      lastSelectedIndex.current = null;
    }
  }, [selScope, selected]);

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
    const changes = [bulkEditCat && `category \u2192 ${bulkEditCat}`, bulkEditSource.trim() && `source \u2192 ${bulkEditSource.trim()}`].filter(Boolean);
    setSelected(new Set()); setBulkEditCat(""); setBulkEditSource("");
    const snapMap = new Map(snapshot.map(q => [q.id, q]));
    const msg = changes.length > 0
      ? `Updated ${count} ${count === 1 ? "entry" : "entries"}: ${changes.join(", ")}`
      : `${count} ${count === 1 ? "entry" : "entries"} updated`;
    showToast(msg, "Undo", () => {
      setQuotes(p => p.map(q => snapMap.has(q.id) ? snapMap.get(q.id) : q));
    });
  }, [quotes, selected, bulkEditCat, bulkEditSource, setQuotes, showToast]);

  const bulkDel = useCallback(() => {
    setConfirmBulkDel(false);
    const deletedQuotes = quotes.filter(q => selected.has(q.id));
    const deletedIds = new Set(selected);
    const count = deletedQuotes.length;
    // Snapshot original indices for undo restore
    const originalIndices = deletedQuotes.map(dq => ({
      quote: dq,
      idx: quotes.findIndex(q => q.id === dq.id),
    }));
    // Snapshot collection memberships so undo can restore them
    const collectionSnapshot = collections
      ?.filter(c => c.quoteIds.some(id => deletedIds.has(id)))
      .map(c => ({ id: c.id, quoteIds: c.quoteIds.filter(id => deletedIds.has(id)) }))
      || [];
    setQuotes(p => p.filter(q => !deletedIds.has(q.id)));
    trackDeletion([...deletedIds]);
    if (cleanCollectionRefs) cleanCollectionRefs([...deletedIds]);
    setSelected(new Set());
    showToast(`${count} ${count === 1 ? "entry" : "entries"} deleted`, "Undo", () => {
      setQuotes(p => {
        const restored = [...p];
        // Re-insert in original order (sort by index to avoid shifting issues)
        originalIndices
          .sort((a, b) => a.idx - b.idx)
          .forEach(({ quote, idx }) => {
            restored.splice(Math.min(idx, restored.length), 0, quote);
          });
        return restored;
      });
      untrackDeletion([...deletedIds]);
      // Restore collection memberships
      collectionSnapshot.forEach(({ id, quoteIds }) => addToCollection(id, quoteIds));
    });
  }, [quotes, selected, setQuotes, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs, collections, addToCollection]);

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
