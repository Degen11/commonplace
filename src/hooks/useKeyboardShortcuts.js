import { useEffect } from "react";
import useLatestRef from "./useLatestRef";

/**
 * Keyboard shortcuts for the results phase.
 * Extracted from App.jsx to reduce the god-component's complexity.
 *
 * All state is read via a ref to avoid re-registering the listener
 * on every state change.
 */
export default function useKeyboardShortcuts({
  phase,
  search, editingId, inlineEdit,
  selected, setSelected,
  confirmClear, setConfirmClear,
  confirmBulkDel, setConfirmBulkDel,
  showExport, setShowExport,
  showSort, setShowSort,
  showShortcuts, setShowShortcuts,
  showStats, showAddMore,
  showQuickInput, setShowQuickInput,
  reviewQueue, setReviewQueue,
  selAll,
  visible, filtered, hasMore, loadMore,
  onFav, handleDelete, bulkDel,
  setEditingId, setSearch,
  lastSelectedIndex,
  showToast,
}) {
  // Pack all readable state into a single ref — avoids re-registering the
  // keydown listener on every state change while keeping reads fresh.
  const stateRef = useLatestRef({
    phase, search, editingId, inlineEdit,
    selected, confirmClear, confirmBulkDel,
    showExport, showSort, showShortcuts, showStats, showAddMore, showQuickInput,
    reviewQueue, selAll, visible, filtered, hasMore, loadMore, onFav, handleDelete, bulkDel,
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.target.matches("input, textarea, select")) return;
      const s = stateRef.current;

      // Block all shortcuts except Escape when not in results phase
      if (s.phase !== "results" && e.key !== "Escape") return;

      // Block navigation/action shortcuts when modals or inline edits are active
      const modalOpen = s.showShortcuts || s.showStats || s.showAddMore || s.confirmClear || s.confirmBulkDel || s.showExport || s.showSort;
      const isEditing = s.editingId || s.inlineEdit;

      if (e.key === "Escape") {
        if (s.showQuickInput) { setShowQuickInput(false); return; }
        if (s.confirmClear) { setConfirmClear(false); return; }
        if (s.confirmBulkDel) { setConfirmBulkDel(false); return; }
        if (s.showExport) { setShowExport(false); return; }
        if (s.showSort) { setShowSort(false); return; }
        if (s.selected.size > 0) {
          setSelected(new Set());
          lastSelectedIndex.current = null;
          return;
        }
        if (s.editingId) {
          setEditingId(null);
          if (s.reviewQueue.length > 0) { setReviewQueue([]); showToast("Review paused"); }
          return;
        }
        if (s.search) {
          setSearch("");
          return;
        }
      }

      if (e.key === "?") {
        setShowShortcuts(prev => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        s.selAll();
        return;
      }

      // Skip action/navigation shortcuts when modals or editing are active
      if (modalOpen || isEditing) return;

      if (e.key === "n") {
        e.preventDefault();
        setShowQuickInput(true);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector("[data-search-input]");
        if (searchInput) searchInput.focus();
        return;
      }

      if (e.key === "j" || e.key === "k") {
        const list = s.visible;
        if (!list || list.length === 0) return;
        let curIdx = -1;
        if (s.selected.size > 0) {
          const lastId = [...s.selected].pop();
          curIdx = list.findIndex(q => q.id === lastId);
        }
        let nextIdx = e.key === "j" ? curIdx + 1 : curIdx - 1;
        // Load more items when navigating past the current page
        if (e.key === "j" && nextIdx >= list.length && s.hasMore) {
          s.loadMore();
          // Select from the full filtered list — the item will render after loadMore
          const fullIdx = s.filtered.findIndex(q => q.id === list[list.length - 1]?.id);
          const nextItem = s.filtered[fullIdx + 1];
          if (nextItem) {
            setSelected(new Set([nextItem.id]));
            requestAnimationFrame(() => {
              const el = document.querySelector(`[data-id="${nextItem.id}"]`);
              if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
          }
          return;
        }
        nextIdx = Math.max(0, Math.min(nextIdx, list.length - 1));
        setSelected(new Set([list[nextIdx].id]));
        const el = document.querySelector(`[data-id="${list[nextIdx].id}"]`);
        if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return;
      }

      if (e.key === "f") {
        if (s.selected.size === 0) return;
        for (const id of s.selected) s.onFav(id);
        return;
      }

      if (e.key === "d" || e.key === "Delete" || e.key === "Backspace") {
        if (s.selected.size === 0) return;
        e.preventDefault();
        if (s.selected.size === 1) {
          s.handleDelete([...s.selected][0]);
        } else {
          s.bulkDel();
        }
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [stateRef, showToast, setEditingId, setSelected, setReviewQueue, setSearch,
      setConfirmBulkDel, setConfirmClear, setShowExport, setShowSort,
      setShowShortcuts, setShowQuickInput, lastSelectedIndex]);
}
