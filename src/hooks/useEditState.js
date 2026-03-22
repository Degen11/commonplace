import { useState, useRef, useEffect } from "react";
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

  // ── Cancel stale inline/full edits when target quote is deleted ──
  useEffect(() => {
    if (!inlineEdit && !editingId) return;
    const quoteIds = new Set(quotes.map(q => q.id));
    if (inlineEdit && !quoteIds.has(inlineEdit.id)) setInlineEdit(null);
    if (editingId && !quoteIds.has(editingId)) setEditingId(null);
  }, [quotes, inlineEdit, editingId]);

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
  }, [quotes, selected]);

  // ── Filter reviewQueue when quotes change ──
  useEffect(() => {
    if (reviewQueue.length === 0) return;
    const quoteIds = new Set(quotes.map(q => q.id));
    setReviewQueue(prev => {
      const f = prev.filter(id => quoteIds.has(id));
      return f.length !== prev.length ? f : prev;
    });
  }, [quotes, reviewQueue]);

  // ── Selection scope — use a ref so toggleSel always reads the latest
  // scope without needing to be recreated (avoids stale closures). ──
  const selScope = visibleFiltered || filtered;
  const selScopeRef = useRef(selScope);
  useEffect(() => { selScopeRef.current = selScope; }, [selScope]);

  // ── Reset shift-click index when selection scope changes ──
  useEffect(() => {
    lastSelectedIndex.current = null;
  }, [selScope]);

  // ── Helpers ──
  const startEditing = (id) => {
    setEditingId(id);
    setInlineEdit(null);
  };

  const startInlineEdit = (id, field) => {
    setInlineEdit({ id, field });
    setEditingId(null);
  };

  const saveEdit = (id, text, source, category) => {
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
  };

  const saveInlineField = (id, field, value) => {
    setQuotes(p => p.map(q => {
      if (q.id !== id) return q;
      const newVal = field === "source" ? (value.trim() || q.source) : value;
      return { ...q, [field]: newVal, confidence: "high", updatedAt: Date.now() };
    }));
    setInlineEdit(null);
    setSavedPulse({ id, field });
    setTimeout(() => setSavedPulse(prev => prev?.id === id && prev?.field === field ? null : prev), SAVED_PULSE_MS);
  };

  const toggleSel = (id, shiftKey = false) => {
    const scope = selScopeRef.current;
    if (shiftKey && lastSelectedIndex.current !== null) {
      const lastIndex = scope.findIndex(q => q.id === lastSelectedIndex.current);
      const currentIndex = scope.findIndex(q => q.id === id);
      if (lastIndex < 0 || currentIndex < 0) {
        // Anchor no longer visible — fall back to single toggle
        setSelected(p => toggleInSet(p, id));
        lastSelectedIndex.current = id;
        return;
      }
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const rangeIds = scope.slice(start, end + 1).map(q => q.id);
      setSelected(p => addAllToSet(p, rangeIds));
      lastSelectedIndex.current = id;
    } else {
      setSelected(p => toggleInSet(p, id));
      lastSelectedIndex.current = id;
    }
  };

  const selAll = () => {
    const scope = selScopeRef.current;
    if (scope.length === 0) return;
    setSelected(prev => {
      const allSelected = scope.every(q => prev.has(q.id));
      lastSelectedIndex.current = null;
      return allSelected ? new Set() : new Set(scope.map(q => q.id));
    });
  };

  const applyBulk = () => {
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
  };

  const bulkDel = () => {
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
  };

  const startReviewFlow = () => {
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
  };

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
