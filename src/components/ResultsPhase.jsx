import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import useViewPreferences from "../hooks/useViewPreferences";
import useEditState from "../hooks/useEditState";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import useDndQuotes from "../hooks/useDndQuotes";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesStore } from "../stores/quotesStore";
import { ResultsProvider, useResultsContext } from "../contexts/ResultsContext";

import { getCatColor, sanitizeName, DEFAULT_CATEGORIES, UNKNOWN_SOURCE, FALLBACK_CATEGORY } from "../data/constants";
import { similarity } from "../utils/textFormatting";
import { generateId } from "../utils/uuid";
import { findDuplicateGroups } from "../utils/quotes";
import {
  DUPE_SIMILARITY_THRESHOLD,
  LS_QUOTES, LS_CATS, LS_FILTERS, LS_DRAFT, LS_SIDEBAR, LS_KB_HINT,
} from "../config";
import { pluralize } from "../utils/helpers";
import { loadString, saveString, removeFromStorage } from "../utils/storage";
import { displayText, exportJSON } from "../utils/export";

import ResultsModals from "./ResultsModals";
import NotificationBars from "./NotificationBars";
import TableView from "./TableView";
import CardItem from "./CardItem";
import Footer from "./Footer";
import HeaderBar from "./HeaderBar";
import ToolbarSection from "./ToolbarSection";
import BulkBar from "./BulkBar";
import SectionErrorBoundary from "./SectionErrorBoundary";
import MiniHeader from "./MiniHeader";
import StatsOverlay from "./StatsOverlay";
import AddMorePanel from "./AddMorePanel";
import ExportDropdown from "./ExportDropdown";
import EmptyState from "./EmptyState";
import CollectionsSidebar from "./CollectionsSidebar";
import QuickAddBar from "./QuickAddBar";
import MobileSheet from "./MobileSheet";
import DeviceLinkModal from "./DeviceLinkModal";
import ScrollTopButton from "./ScrollTopButton";
import { styles } from "./styles";

import { X, CircleQuestionMark, Library } from "lucide-react";

const CARD_HEIGHT_ESTIMATE = 160;
const CARD_VIRTUALIZER_OVERSCAN = 8;

// Virtualized card list for mobile — single column, window-scrolled
function MobileCardList({ visible, overDragId, activeDragId }) {
  // Opt out of React Compiler memoization — same reason as TableView: the
  // TanStack virtualizer is a stable mutable instance and compiler-cached
  // getVirtualItems() results go stale on remount-after-view-switch.
  "use no memo";
  const {
    selected, editingId, inlineEdit, deletingId, savedPulse,
    showConfidence, sortBy, allCats, customCats,
    actionProps, toggleSel, startEditing, startInlineEdit,
    saveEdit, saveInlineField, setInlineEdit, setEditingId,
    searchTerm, newQuoteHighlight,
  } = useResultsContext();
  const listRef = useRef(null);
  const outerRef = useRef(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Stagger-in animation on initial mount
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    el.classList.add("stagger-in");
    const t = setTimeout(() => el.classList.remove("stagger-in"), 600);
    return () => clearTimeout(t);
  }, []);

  // Detect list changes and trigger shuffle animation
  const cardFingerprint = visible.slice(0, 8).map(q => q.id).join(",");
  const prevCardFingerprintRef = useRef(cardFingerprint);
  useEffect(() => {
    if (prevCardFingerprintRef.current === cardFingerprint) return;
    prevCardFingerprintRef.current = cardFingerprint;
    const el = outerRef.current;
    if (!el) return;
    el.classList.remove("list-shuffle");
    void el.offsetWidth;
    el.classList.add("list-shuffle");
    const t = setTimeout(() => el.classList.remove("list-shuffle"), 500);
    return () => clearTimeout(t);
  }, [cardFingerprint]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => setScrollMargin(el.offsetTop);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: visible.length,
    estimateSize: () => CARD_HEIGHT_ESTIMATE,
    overscan: CARD_VIRTUALIZER_OVERSCAN,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const topPad = virtualItems.length > 0
    ? virtualItems[0].start - (virtualizer.options.scrollMargin ?? 0)
    : 0;
  const bottomPad = virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <div ref={outerRef} style={{ paddingTop: 8 }}>
      <div ref={listRef}>
      {topPad > 0 && <div style={{ height: topPad }} />}
      {virtualItems.map(virtualRow => {
        const q = visible[virtualRow.index];
        const col = getCatColor(q.category, customCats);
        const isSel = selected.has(q.id);
        const isEd = editingId === q.id;
        const needsAtt = q.confidence === "low" || q.category === "Unknown";
        const isInlineEditing = inlineEdit?.id === q.id;
        const inlineEditField = isInlineEditing ? inlineEdit.field : null;
        const isDeleting = deletingId === q.id;
        const isSavedPulse = savedPulse?.id === q.id;
        const savedPulseField = isSavedPulse ? savedPulse.field : null;
        const isOverTarget = overDragId === q.id && activeDragId && activeDragId !== q.id;
        return (
          <div key={q.id} data-index={virtualRow.index} ref={virtualizer.measureElement} style={{ paddingBottom: 12 }}>
            <CardItem
              q={q}
              col={col}
              isSel={isSel}
              isEd={isEd}
              needsAtt={needsAtt}
              showConfidence={showConfidence}
              sortBy={sortBy}
              isMobile={true}
              isInlineEditing={isInlineEditing}
              inlineEditField={inlineEditField}
              isSavedPulse={isSavedPulse}
              savedPulseField={savedPulseField}
              allCats={allCats}
              customCats={customCats}
              actionProps={actionProps}
              toggleSel={toggleSel}
              startEditing={startEditing}
              startInlineEdit={startInlineEdit}
              saveEdit={saveEdit}
              saveInlineField={saveInlineField}
              setInlineEdit={setInlineEdit}
              setEditingId={setEditingId}
              isDeleting={isDeleting}
              searchTerm={searchTerm}
              isOverTarget={isOverTarget}
              isNewQuote={newQuoteHighlight === q.id}
            />
          </div>
        );
      })}
      {bottomPad > 0 && <div style={{ height: bottomPad }} />}
      </div>
    </div>
  );
}

export default function ResultsPhase({
  // From useProcessing (stays in App.jsx)
  apiError, failedEntries, stats,
  retryFailed, dismissApiError, dismissStats,
  processEntries, autoGroup,
  // From useQuoteActions (stays in App.jsx)
  deletingId, copiedId, reidentifyingIds,
  handleDelete, copyQuote, reIdentify, batchReIdentify,
  handleFileImport,
  // From useTheme (stays in App.jsx)
  dark, toggleTheme, themeMode,
  // Callbacks from App.jsx
  importCollections, onClearReset,
}) {
  const { showToast } = useToastContext();

  // Direct Zustand subscriptions — selective re-renders per slice
  const quotes = useQuotesStore(s => s.quotes);
  const setQuotes = useQuotesStore(s => s.setQuotes);
  const customCats = useQuotesStore(s => s.customCats);
  const setCustomCats = useQuotesStore(s => s.setCustomCats);
  const columnOrder = useQuotesStore(s => s.columnOrder);
  const setColumnOrder = useQuotesStore(s => s.setColumnOrder);
  const isSharedView = useQuotesStore(s => s.isSharedView);
  const setIsSharedView = useQuotesStore(s => s.setIsSharedView);
  const syncStatus = useQuotesStore(s => s.syncStatus);
  const lastSynced = useQuotesStore(s => s.lastSynced);
  const trackDeletion = useQuotesStore(s => s.trackDeletion);
  const untrackDeletion = useQuotesStore(s => s.untrackDeletion);
  const collections = useQuotesStore(s => s.collections);
  const activeCollectionId = useQuotesStore(s => s.activeCollectionId);
  const setActiveCollectionId = useQuotesStore(s => s.setActiveCollectionId);
  const createCollection = useQuotesStore(s => s.createCollection);
  const deleteCollection = useQuotesStore(s => s.deleteCollection);
  const restoreCollection = useQuotesStore(s => s.restoreCollection);
  const renameCollection = useQuotesStore(s => s.renameCollection);
  const addToCollection = useQuotesStore(s => s.addToCollection);
  const removeFromCollection = useQuotesStore(s => s.removeFromCollection);
  const updateCollectionIcon = useQuotesStore(s => s.updateCollectionIcon);
  const cleanCollectionRefs = useQuotesStore(s => s.cleanCollectionRefs);
  const initialLoading = useQuotesStore(s => s.initialLoading);
  const manualPush = useQuotesStore(s => s.manualPush);
  const allCats = [...DEFAULT_CATEGORIES, ...customCats];

  // ── Hooks owned by ResultsPhase ──

  const {
    view, setView,
    compact, setCompact,
    showConfidence, setShowConfidence,
    sortBy, setSortBy,
    catFilter, setCatFilter,
    favFilter, setFavFilter,
    search, setSearch,
    isMobile,
    filtered, collectionFiltered, visible, hasMore, remaining, loadMore, paginationKey,
    cc, favCount, unknownCount,
    hasActiveFilters, hasActiveFilterOrSort, clearFilters, computedStats,
  } = useViewPreferences(quotes, { activeCollectionId, collections });

  const {
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
  } = useEditState({ quotes, setQuotes, filtered, visibleFiltered: collectionFiltered, filterKey: paginationKey, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs, collections, addToCollection });

  const {
    sensors, activeDragId, overDragId,
    collisionDetection, handleDndStart, handleDndOver, handleDndEnd, anchorToCursor,
    dndReorderRef,
  } = useDndQuotes({ selected, collections, addToCollection, removeFromCollection, showToast, setQuotes });

  // ── Local state ──

  const [showExport, setShowExport]           = useState(false);
  const [showSort, setShowSort]               = useState(false);
  const [showStats, setShowStats]             = useState(false);
  const [showAddMore, setShowAddMore]         = useState(false);
  const [addMoreInput, setAddMoreInput]       = useState("");
  const [addMoreFormatting, setAddMoreFormatting] = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [newCatName, setNewCatName]           = useState("");
  const [showNewCat, setShowNewCat]           = useState(false);
  const [headerVisible, setHeaderVisible]     = useState(true);
  const [catFade, setCatFade]                 = useState({ left: false, right: false });
  const [dismissedAtCount, setDismissedAtCount] = useState(null);
  const [showShortcuts, setShowShortcuts]       = useState(false);
  const [showQuickInput, setShowQuickInput]     = useState(false);
  const [collectionDupes, setCollectionDupes]   = useState([]);
  const [shareImageQuote, setShareImageQuote]   = useState(null);
  const [showMobileCollections, setShowMobileCollections] = useState(false);
  const [showSync, setShowSync]                 = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadString(LS_SIDEBAR) === "1");
  const [showKbHint, setShowKbHint] = useState(() => !loadString(LS_KB_HINT));
  const [newQuoteHighlight, setNewQuoteHighlight] = useState(null);

  // ── Refs ──

  const addMoreRef          = useRef(null);
  const toolbarRef          = useRef(null);
  const pendingScrollAdjust = useRef(null);
  const catScrollRef        = useRef(null);
  const headerObsRef        = useRef(null);
  const headerRef           = (node) => {
    if (headerObsRef.current) { headerObsRef.current.disconnect(); headerObsRef.current = null; }
    if (node) {
      const obs = new IntersectionObserver(([entry]) => {
        setHeaderVisible(entry.isIntersecting);
        // Close dropdowns when scrolling between main/mini header
        setShowExport(false);
        setShowSort(false);
      }, { threshold: 0 });
      obs.observe(node);
      headerObsRef.current = obs;
    }
  };
  const [toolbarHeight, setToolbarHeight] = useState(44);

  // ── Effects ──

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setToolbarHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preserve scroll position when toggling panels via mini-header
  const preserveScroll = () => {
    if (toolbarRef.current && !headerVisible) {
      pendingScrollAdjust.current = toolbarRef.current.getBoundingClientRect().top;
    }
  };

  useLayoutEffect(() => {
    if (pendingScrollAdjust.current != null && toolbarRef.current) {
      const prevTop = pendingScrollAdjust.current;
      const newTop = toolbarRef.current.getBoundingClientRect().top;
      const diff = newTop - prevTop;
      if (diff !== 0) {
        window.scrollBy({ top: diff, behavior: "instant" });
      }
    }
    pendingScrollAdjust.current = null;
  }, [showStats, showAddMore, view, compact]);

  const updateCatFade = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCatFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  };

  useEffect(() => {
    const t = setTimeout(updateCatFade, 100);
    window.addEventListener("resize", updateCatFade);
    return () => { clearTimeout(t); window.removeEventListener("resize", updateCatFade); };
  }, []);

  useEffect(() => { updateCatFade(); }, [quotes.length, customCats.length, catFilter]);

  useEffect(() => {
    const h = e => {
      if (editingId) {
        const clickedInside = e.target.closest('.qrow, .qcard, textarea, input, button, select');
        if (!clickedInside) {
          setEditingId(null);
        }
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editingId, setEditingId]);

  // Persist sidebar collapsed state
  useEffect(() => {
    // saveString (not saveToStorage): the initializer reads this raw with === "1",
    // so the value must be stored unquoted
    saveString(LS_SIDEBAR, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const dismissKbHint = () => {
    setShowKbHint(false);
    saveString(LS_KB_HINT, "1");
  };

  // ── Handlers ──

  const onFav = id => setQuotes(p => p.map(x => x.id === id ? { ...x, favorite: !x.favorite, updatedAt: Date.now() } : x));

  const handleAddMore = () => {
    if (!addMoreInput.trim()) return;
    processEntries(addMoreInput, true, addMoreFormatting);
    setAddMoreInput("");
    setShowAddMore(false);
  };

  const handleQuickAdd = (text, source, category, { skipDupeCheck } = {}) => {
    if (!text || !text.trim()) return;
    const addQuote = () => {
      const newQuote = {
        id: generateId(),
        text,
        source: source || UNKNOWN_SOURCE,
        category: category || FALLBACK_CATEGORY,
        confidence: "high",
        favorite: false,
        updatedAt: Date.now(),
      };
      setQuotes(p => [newQuote, ...p]);
      setShowAddMore(false);
      showToast("Quote added", null, null, "success");
      setNewQuoteHighlight(newQuote.id);
      setTimeout(() => setNewQuoteHighlight(prev => prev === newQuote.id ? null : prev), 1000);
    };

    if (!skipDupeCheck) {
      const match = quotes.find(q => similarity(q.text, text) > DUPE_SIMILARITY_THRESHOLD);
      if (match) {
        const preview = match.text.length > 60 ? match.text.slice(0, 60) + "…" : match.text;
        showToast(`Similar entry exists: "${preview}"`, "Add anyway", addQuote, "error");
        return;
      }
    }
    addQuote();
  };

  // Export a JSON backup before clearing — offered as the "Export first" action
  // in the confirm modal. Keeps the modal open so the user still confirms the clear.
  const handleExportBeforeClear = () => {
    if (quotes.length === 0) return;
    exportJSON(quotes, collections);
    showToast("Backup exported — safe to clear now.", null, null, "success");
  };

  const handleClear = () => {
    // Snapshot for undo. Clear-all previously had no undo AND tombstoned every
    // quote (deleting the cloud copy too), so a misclick was unrecoverable.
    const quotesSnapshot = quotes;
    const catsSnapshot = customCats;
    const clearedIds = quotes.map(q => q.id);
    if (clearedIds.length > 0) trackDeletion(clearedIds);
    try { window.history.replaceState(null, "", window.location.pathname); } catch {}
    setIsSharedView(false);
    removeFromStorage(LS_QUOTES, LS_CATS, LS_FILTERS, LS_DRAFT);
    setQuotes([]);
    setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default");
    setConfirmClear(false); setShowAddMore(false); setShowStats(false);
    setCustomCats([]); setActiveCollectionId(null);
    onClearReset();
    if (quotesSnapshot.length > 0) {
      showToast(
        `Cleared ${pluralize(quotesSnapshot.length, "entry", "entries")}`,
        "Undo",
        () => {
          setQuotes(quotesSnapshot);
          setCustomCats(catsSnapshot);
          untrackDeletion(clearedIds);
        },
      );
    }
  };

  const handleStartReview = () => {
    setSortBy("confidence");
    setCatFilter("All");
    setFavFilter(false);
    setSearch("");
    startReviewFlow();
  };

  const handleFindDupes = () => {
    // Use full collection scope (not filtered by search/category/favorites)
    // so dupe detection covers all quotes in the target
    let target = quotes;
    if (activeCollectionId && collections) {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col) {
        const idSet = new Set(col.quoteIds);
        target = quotes.filter(q => idSet.has(q.id));
      }
    }
    if (target.length < 2) {
      showToast("Need at least 2 entries to scan for duplicates.", null, null, "error");
      return;
    }
    const groups = findDuplicateGroups(target, DUPE_SIMILARITY_THRESHOLD);
    if (groups.length === 0) {
      showToast("No duplicates found!", null, null, "success");
      return;
    }
    setCollectionDupes(groups);
  };

  const handleDupeDeleteBatch = (quoteIds) => {
    const snapshot = quotes.filter(q => quoteIds.includes(q.id));
    const idToIdx = new Map(quotes.map((q, i) => [q.id, i]));
    const indices = snapshot.map(q => ({ quote: q, idx: idToIdx.get(q.id) ?? -1 }));
    trackDeletion(quoteIds);
    const idSet = new Set(quoteIds);
    setQuotes(prev => prev.filter(q => !idSet.has(q.id)));
    cleanCollectionRefs(quoteIds);
    showToast(
      `Removed ${pluralize(quoteIds.length, "duplicate")}`,
      "Undo",
      () => {
        setQuotes(prev => {
          const restored = [...prev];
          indices
            .sort((a, b) => a.idx - b.idx)
            .forEach(({ quote, idx }) => restored.splice(Math.min(idx, restored.length), 0, quote));
          return restored;
        });
        untrackDeletion(quoteIds);
      },
    );
  };

  const addCat = () => {
    const sanitized = sanitizeName(newCatName);
    if (!sanitized || allCats.some(c => c.toLowerCase() === sanitized.toLowerCase())) {
      showToast("Invalid or duplicate category name", null, null, "error");
      return;
    }
    setCustomCats(p => [...p, sanitized]);
    setNewCatName("");
    setShowNewCat(false);
  };
  const remCat = c => { setCustomCats(p => p.filter(x => x !== c)); setQuotes(p => p.map(q => q.category === c ? { ...q, category: FALLBACK_CATEGORY, updatedAt: Date.now() } : q)); if (catFilter === c) setCatFilter("All"); };

  // AI auto-group: create a collection from a theme
  const handleAutoGroup = async (theme) => {
    if (quotes.length === 0) throw new Error("No quotes to group");
    const matchedIds = await autoGroup(theme, quotes);
    if (matchedIds.length === 0) throw new Error("No quotes matched that theme");
    const name = theme.charAt(0).toUpperCase() + theme.slice(1);
    const col = createCollection(name);
    if (!col || col.error) throw new Error(`Collection "${name}" already exists`);
    addToCollection(col.id, matchedIds);
    setActiveCollectionId(col.id);
    showToast(`Created "${col.name}" with ${pluralize(matchedIds.length, "quote")}`, null, null, "success");
  };

  // Compute per-collection quote counts for sidebar
  const quoteCounts = (() => {
    const quoteIdSet = new Set(quotes.map(q => q.id));
    const counts = {};
    for (const c of collections) {
      counts[c.id] = c.quoteIds.filter(id => quoteIdSet.has(id)).length;
    }
    return counts;
  })();

  const handleDeleteCollection = (id) => {
    const col = collections.find(c => c.id === id);
    const count = quoteCounts[id] || 0;
    const snapshot = col ? { ...col, quoteIds: [...col.quoteIds] } : null;
    const wasActive = activeCollectionId === id;
    deleteCollection(id);
    if (col) {
      showToast(
        count > 0
          ? `Deleted "${col.name}" \u2014 ${pluralize(count, "quote")} ${count === 1 ? "stays" : "stay"} in All Quotes`
          : `Deleted "${col.name}"`,
        "Undo",
        () => {
          if (snapshot) {
            restoreCollection(snapshot);
            if (wasActive) setActiveCollectionId(snapshot.id);
          }
        },
      );
    }
  };

  const handleRemoveFromCollection = (collectionId, quoteIds) => {
    removeFromCollection(collectionId, quoteIds);
    const col = collections.find(c => c.id === collectionId);
    showToast(
      `Removed ${pluralize(quoteIds.length, "quote")} from "${col?.name || "collection"}"`,
      "Undo",
      () => addToCollection(collectionId, quoteIds),
    );
  };

  const handleAddToCollection = (collectionId, quoteIds) => {
    const { added, skipped } = addToCollection(collectionId, quoteIds);
    const col = collections.find(c => c.id === collectionId);
    const name = col?.name || "collection";
    const parts = [];
    if (skipped > 0) parts.push(`${pluralize(skipped, "quote")} already in "${name}"`);
    if (added > 0) parts.push(`${added} added`);
    const msg = skipped > 0 && added === 0
      ? `${pluralize(skipped, "quote")} already in "${name}"`
      : skipped > 0
        ? `${parts.join(", ")}`
        : `Added ${pluralize(added, "quote")} to "${name}"`;
    showToast(
      msg,
      added > 0 ? "Undo" : undefined,
      added > 0 ? () => removeFromCollection(collectionId, quoteIds) : undefined,
    );
  };

  const handleBulkCopy = () => {
    const selectedQuotes = quotes.filter(q => selected.has(q.id));
    const text = selectedQuotes.map(q => `${displayText(q)} — ${q.source}`).join("\n\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast(`Copied ${pluralize(selectedQuotes.length, "quote")}`, null, null, "success"))
      .catch(() => showToast("Couldn’t copy — try manually.", null, null, "error"));
  };

  const showBulkBar = selected.size > 0;

  const actionProps = {
    onFav,
    onDelete:      handleDelete,
    onCopy:        copyQuote,
    onReidentify:  reIdentify,
    onShareImage:  setShareImageQuote,
    copiedId,
    reidentifying: reidentifyingIds,
    collections,
    onAddToCollection: handleAddToCollection,
    onRemoveFromCollection: handleRemoveFromCollection,
    activeCollectionId,
  };

  const makeExportDropdown = (triggerStyle, triggerClassName, triggerTip) => (
    <ExportDropdown
      quotes={quotes}
      filtered={filtered}
      selected={selected}
      hasActiveFilters={hasActiveFilters}
      showToast={showToast}
      open={showExport}
      onOpenChange={setShowExport}
      collections={collections}
      triggerStyle={triggerStyle}
      triggerClassName={triggerClassName}
      triggerTip={triggerTip}
    />
  );

  // ── Keyboard shortcuts ──

  useKeyboardShortcuts({
    phase: "results",
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
    visible, filtered: collectionFiltered, hasMore, loadMore,
    onFav, handleDelete, bulkDel,
    setEditingId, setSearch,
    lastSelectedIndex,
    showToast,
  });

  // ── Context value for child components ──

  const resultsCtx = {
    // Edit state
    editingId, setEditingId,
    inlineEdit, setInlineEdit,
    selected, setSelected,
    savedPulse,
    toggleSel, selAll,
    startEditing, startInlineEdit,
    saveEdit, saveInlineField,
    bulkEditCat, setBulkEditCat,
    bulkEditSource, setBulkEditSource,
    applyBulk, bulkDel,
    // Action props
    actionProps,
    deletingId, copiedId, reidentifyingIds,
    onFav,
    onAddToCollection: handleAddToCollection,
    onRemoveFromCollection: handleRemoveFromCollection,
    onBulkCopy: handleBulkCopy,
    batchReIdentify,
    // View preferences
    showConfidence, sortBy, compact, view,
    searchTerm: search,
    isMobile,
    // Common data
    allCats, customCats,
    columnOrder, setColumnOrder,
    collections, activeCollectionId,
    // Highlight
    newQuoteHighlight,
  };

  // ── Render ──

  return (
    <ResultsProvider value={resultsCtx}>
      <ResultsModals
        showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts}
        shareImageQuote={shareImageQuote} setShareImageQuote={setShareImageQuote} showToast={showToast}
        confirmClear={confirmClear} setConfirmClear={setConfirmClear} handleClear={handleClear} quotesLength={quotes.length} onExportBeforeClear={handleExportBeforeClear}
        confirmBulkDel={confirmBulkDel} setConfirmBulkDel={setConfirmBulkDel} bulkDel={bulkDel} selectedSize={selected.size}
        collectionDupes={collectionDupes} setCollectionDupes={setCollectionDupes} handleDupeDeleteBatch={handleDupeDeleteBatch}
      />

      {showSync && (
        <DeviceLinkModal
          onClose={() => setShowSync(false)}
          syncStatus={syncStatus}
          onRetry={manualPush}
          showToast={showToast}
        />
      )}

      <div className="cp-wrap" style={styles.wrap}>

          <NotificationBars
            isSharedView={isSharedView} setIsSharedView={setIsSharedView} quotesLength={quotes.length}
            apiError={apiError} failedEntries={failedEntries} retryFailed={retryFailed} dismissApiError={dismissApiError}
            stats={stats} dismissStats={dismissStats}
            unknownCount={unknownCount} reviewQueue={reviewQueue} setReviewQueue={setReviewQueue} setEditingId={setEditingId}
            sortBy={sortBy} dismissedAtCount={dismissedAtCount} setDismissedAtCount={setDismissedAtCount}
            handleStartReview={handleStartReview}
          />

          <SectionErrorBoundary name="Header">
            <HeaderBar
              view={view}
              compact={compact}
              setView={setView}
              setCompact={setCompact}
              showStats={showStats}
              setShowStats={setShowStats}
              showAddMore={showAddMore}
              setShowAddMore={setShowAddMore}
              isMobile={isMobile}
              setConfirmClear={setConfirmClear}
              addMoreRef={addMoreRef}
              headerRef={headerRef}
              exportDropdownContent={makeExportDropdown(styles.exportBtn, "ui-tip ui-tip-below hdr-btn", "Export or share your collection")}
              syncStatus={syncStatus}
              lastSynced={lastSynced}
              onManualSync={manualPush}
              onOpenSync={() => setShowSync(true)}
              dark={dark}
              toggleTheme={toggleTheme}
              themeMode={themeMode}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              onShowShortcuts={() => { setShowShortcuts(true); dismissKbHint(); }}
            />
          </SectionErrorBoundary>

          {/* Sticky mini-header when main header scrolls out */}
          {!headerVisible && (
            <MiniHeader
              view={view} setView={setView}
              compact={compact} setCompact={setCompact}
              showStats={showStats} setShowStats={setShowStats}
              showAddMore={showAddMore} setShowAddMore={setShowAddMore}
              addMoreRef={addMoreRef}
              exportDropdownContent={makeExportDropdown({ ...styles.exportBtn, fontSize: 11, padding: "4px 10px" }, "hdr-btn")}
              preserveScroll={preserveScroll}
              syncStatus={syncStatus}
              lastSynced={lastSynced}
              onManualSync={manualPush}
              onOpenSync={() => setShowSync(true)}
              dark={dark}
              toggleTheme={toggleTheme}
              themeMode={themeMode}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              setConfirmClear={setConfirmClear}
              onShowShortcuts={() => { setShowShortcuts(true); dismissKbHint(); }}
              isMobile={isMobile}
            />
          )}

          <AnimatePresence>
          {showStats && (
            <StatsOverlay
              quotes={quotes}
              computedStats={computedStats}
              cc={cc}
              customCats={customCats}
              headerVisible={headerVisible}
              preserveScroll={preserveScroll}
              onClose={() => setShowStats(false)}
            />
          )}
          </AnimatePresence>

          <AnimatePresence>
          {showAddMore && (
            headerVisible ? (
              <motion.div
                key="add-more-inline"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", transition: { duration: 0.25, ease: "easeOut" } }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.15, ease: "easeIn" } }}
                style={{ overflow: "hidden" }}
              >
                <div style={styles.addMorePanel}>
                  <AddMorePanel
                    addMoreInput={addMoreInput} setAddMoreInput={setAddMoreInput}
                    addMoreFormatting={addMoreFormatting} setAddMoreFormatting={setAddMoreFormatting}
                    addMoreRef={addMoreRef}
                    onAddMore={handleAddMore}
                    onQuickAdd={handleQuickAdd}
                    onCancel={() => { setShowAddMore(false); setAddMoreInput(""); }}
                    allCats={allCats}
                    onFileImport={(file, setter, nameSetter) => handleFileImport(file, setter, nameSetter, importCollections)}
                    existingCount={quotes.length}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="add-more-fixed"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } }}
                style={{
                  position: "fixed", top: 49, left: 0, right: 0,
                  zIndex: 59, background: "var(--cp-mini-bg)",
                  backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  padding: isMobile ? "12px 16px" : "12px 32px", borderBottom: "1px solid var(--cp-border)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                  <AddMorePanel
                    addMoreInput={addMoreInput} setAddMoreInput={setAddMoreInput}
                    addMoreFormatting={addMoreFormatting} setAddMoreFormatting={setAddMoreFormatting}
                    addMoreRef={addMoreRef}
                    onAddMore={handleAddMore}
                    onQuickAdd={handleQuickAdd}
                    onCancel={() => { setShowAddMore(false); setAddMoreInput(""); }}
                    onFileImport={(file, setter, nameSetter) => handleFileImport(file, setter, nameSetter, importCollections)}
                    existingCount={quotes.length}
                  />
                </div>
              </motion.div>
            )
          )}
          </AnimatePresence>

          <AnimatePresence>
          {showBulkBar && (
            <motion.div
              key="bulk-bar"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.8 } }}
              exit={{ opacity: 0, y: "100%", transition: { duration: 0.15, ease: "easeIn" } }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500 }}
            >
            <BulkBar
              onDelete={() => selected.size > 3 ? setConfirmBulkDel(true) : bulkDel()}
              onBatchReIdentify={() => batchReIdentify(selected)}
            />
            </motion.div>
          )}
          </AnimatePresence>

          <SectionErrorBoundary name="Toolbar">
            <ToolbarSection
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              favFilter={favFilter}
              setFavFilter={setFavFilter}
              favCount={favCount}
              allCats={allCats}
              customCats={customCats}
              cc={cc}
              quotes={quotes}
              showNewCat={showNewCat}
              setShowNewCat={setShowNewCat}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              addCat={addCat}
              remCat={remCat}
              toolbarRef={toolbarRef}
              catScrollRef={catScrollRef}
              updateCatFade={updateCatFade}
              catFade={catFade}
              getCatColor={getCatColor}
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showSort={showSort}
              setShowSort={setShowSort}
              hasActiveFilters={hasActiveFilterOrSort}
              clearFilters={clearFilters}
              resultCount={collectionFiltered.length}
              totalCount={quotes.length}
              isMobile={isMobile}
            />
          </SectionErrorBoundary>

          <AnimatePresence>
          {showKbHint && !isMobile && quotes.length > 0 && (
            <motion.div
              key="kb-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transition: { duration: 0.25, ease: "easeOut" } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15, ease: "easeIn" } }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "6px 14px", fontSize: 12, color: "var(--cp-text-muted)",
              }}>
                <span>Press <kbd style={{ padding: "1px 5px", border: "1px solid var(--cp-border)", borderRadius: 4, fontSize: 11, fontFamily: "inherit", background: "var(--cp-bg-card)" }}>?</kbd> for keyboard shortcuts</span>
                <button onClick={dismissKbHint} style={{ background: "none", border: "none", color: "var(--cp-text-faint)", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Main content area with optional sidebar */}
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDndStart} onDragOver={handleDndOver} onDragEnd={handleDndEnd}>
          <div style={{ display: "flex", gap: 0 }}>
            {!isMobile ? (
            <CollectionsSidebar
                collections={collections}
                activeCollectionId={activeCollectionId}
                setActiveCollectionId={setActiveCollectionId}
                createCollection={createCollection}
                deleteCollection={handleDeleteCollection}
                renameCollection={renameCollection}
                updateCollectionIcon={updateCollectionIcon}
                quoteCounts={quoteCounts}
                totalQuotes={quotes.length}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                onAutoGroup={handleAutoGroup}
                onFindDupes={handleFindDupes}
                uniqueSources={computedStats ? new Set(quotes.map(q => q.source).filter(Boolean)).size : 0}
                favCount={favCount}
                toolbarHeight={toolbarHeight}
            />
            ) : (
            <MobileSheet
              isOpen={showMobileCollections}
              onClose={() => setShowMobileCollections(false)}
            >
              <CollectionsSidebar
                collections={collections}
                activeCollectionId={activeCollectionId}
                setActiveCollectionId={(id) => { setActiveCollectionId(id); setShowMobileCollections(false); }}
                createCollection={createCollection}
                deleteCollection={handleDeleteCollection}
                renameCollection={renameCollection}
                updateCollectionIcon={updateCollectionIcon}
                quoteCounts={quoteCounts}
                totalQuotes={quotes.length}
                collapsed={false}
                setCollapsed={() => {}}
                onAutoGroup={handleAutoGroup}
                onFindDupes={handleFindDupes}
                uniqueSources={computedStats ? new Set(quotes.map(q => q.source).filter(Boolean)).size : 0}
                favCount={favCount}
                toolbarHeight={0}
                isMobileSheet
              />
            </MobileSheet>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>

          <AnimatePresence>
          {showQuickInput && (
            <motion.div
              key="quick-add"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transition: { duration: 0.2, ease: "easeOut" } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15, ease: "easeIn" } }}
              style={{ overflow: "hidden" }}
            >
            <QuickAddBar
              onAdd={(text, source, category, opts) => { handleQuickAdd(text, source, category, opts); setShowQuickInput(false); }}
              onClose={() => setShowQuickInput(false)}
              allCats={allCats}
              customCats={customCats}
              quotes={quotes}
              isMobile={isMobile}
            />
            </motion.div>
          )}
          </AnimatePresence>

          {/* Skeleton rows during initial cloud pull */}
          {initialLoading && quotes.length === 0 && (
            <div style={{ paddingTop: 8 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.1 }}>
                  <div style={{ width: 20 }} />
                  <div style={{ width: 16, height: 16 }} className="skeleton-bar" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, padding: "0 16px" }}>
                    <div className="skeleton-bar" style={{ height: 12, width: `${70 + (i % 3) * 10}%`, borderRadius: 4 }} />
                    <div className="skeleton-bar" style={{ height: 10, width: `${40 + (i % 2) * 20}%`, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 120, display: "flex", alignItems: "center", paddingLeft: 10, borderLeft: "1px solid var(--cp-border-light)" }}>
                    <div className="skeleton-bar" style={{ height: 10, width: "80%", borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 80, display: "flex", alignItems: "center", paddingLeft: 10, borderLeft: "1px solid var(--cp-border-light)" }}>
                    <div className="skeleton-bar" style={{ height: 20, width: "70%", borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE / CARD VIEW — cross-fade on switch */}
          <AnimatePresence mode="wait" initial={false}>
          {view === "table" && (
            <motion.div key="table-view" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <SectionErrorBoundary name="Table view">
              <SortableContext items={visible.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <TableView
                filtered={visible}
                toolbarHeight={toolbarHeight}
                dndReorderRef={dndReorderRef}
              />
              </SortableContext>
            </SectionErrorBoundary>
            </motion.div>
          )}

          {view === "cards" && (
            <motion.div key="card-view" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <SectionErrorBoundary name="Card view">
              <SortableContext items={visible.map(q => q.id)} strategy={rectSortingStrategy}>
              {isMobile ? (
                <MobileCardList
                  visible={visible}
                  overDragId={overDragId}
                  activeDragId={activeDragId}
                />
              ) : (
              <div style={{ columns: "280px auto", columnGap: 12, paddingTop: 8 }}>
                {visible.map((q, i) => {
                  const col = getCatColor(q.category, customCats);
                  const isSel = selected.has(q.id);
                  const isEd  = editingId === q.id;
                  const needsAtt = q.confidence === "low" || q.category === "Unknown";
                  const isInlineEditing = inlineEdit?.id === q.id;
                  const inlineEditField = isInlineEditing ? inlineEdit.field : null;
                  const isDeleting = deletingId === q.id;
                  const isSavedPulse = savedPulse?.id === q.id;
                  const savedPulseField = isSavedPulse ? savedPulse.field : null;
                  const isOverTarget = overDragId === q.id && activeDragId && activeDragId !== q.id;
                  return (
                    <motion.div key={q.id} className="qcard-wrap" style={{ breakInside: "avoid", marginBottom: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.6) }}>
                    <CardItem
                      q={q}
                      col={col}
                      isSel={isSel}
                      isEd={isEd}
                      needsAtt={needsAtt}
                      showConfidence={showConfidence}
                      sortBy={sortBy}
                      isMobile={false}
                      isInlineEditing={isInlineEditing}
                      inlineEditField={inlineEditField}
                      isSavedPulse={isSavedPulse}
                      savedPulseField={savedPulseField}
                      allCats={allCats}
                      customCats={customCats}
                      actionProps={actionProps}
                      toggleSel={toggleSel}
                      startEditing={startEditing}
                      startInlineEdit={startInlineEdit}
                      saveEdit={saveEdit}
                      saveInlineField={saveInlineField}
                      setInlineEdit={setInlineEdit}
                      setEditingId={setEditingId}
                      isDeleting={isDeleting}
                      searchTerm={search}
                      isOverTarget={isOverTarget}
                      isNewQuote={newQuoteHighlight === q.id}
                    />
                    </motion.div>
                  );
                })}
              </div>
              )}
              </SortableContext>
            </SectionErrorBoundary>
            </motion.div>
          )}
          </AnimatePresence>
{hasMore && (
  <button
    className="load-more-btn"
    onClick={loadMore}
    style={{
      display: "block",
      margin: "20px auto",
      padding: "10px 24px",
      fontSize: 13,
      color: "var(--cp-accent)",
      background: "none",
      border: "1px solid var(--cp-border)",
      borderRadius: 6,
      cursor: "pointer",
      fontFamily: "inherit",
      animation: "fadeUp .25s ease",
    }}
  >
    Load more ({remaining} remaining)
  </button>
)}
          <AnimatePresence>
          {collectionFiltered.length === 0 && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
            >
            <EmptyState
              catFilter={catFilter} setCatFilter={setCatFilter}
              favFilter={favFilter} setFavFilter={setFavFilter}
              search={search} setSearch={setSearch}
              setSortBy={setSortBy}
              customCats={customCats}
              totalCount={quotes.length}
              activeCollectionName={activeCollectionId ? collections.find(c => c.id === activeCollectionId)?.name : null}
              onBrowseAll={activeCollectionId ? () => setActiveCollectionId(null) : null}
            />
            </motion.div>
          )}
          </AnimatePresence>

          <Footer styles={styles} />

          {showBulkBar && <div style={{ height: 64 }} />}

            </div>{/* end flex main content */}
          </div>{/* end flex container with sidebar */}

          {/* Persistent help trigger — floating ? button (desktop only) */}
          {!isMobile && (
          <button
            className="ui-tip ui-tip-left hdr-btn"
            data-tip="Help & shortcuts"
            onClick={() => { setShowShortcuts(true); dismissKbHint(); }}
            style={{
              position: "fixed", bottom: showBulkBar ? 72 : 20, right: 20,
              width: 36, height: 36, borderRadius: "50%",
              border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)",
              boxShadow: "var(--cp-shadow-card)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--cp-text-muted)", zIndex: 59,
              transition: "bottom .2s ease, box-shadow .15s ease",
            }}
          >
            <CircleQuestionMark size={16} strokeWidth={1.5} />
          </button>
          )}
          {/* Scroll-to-top — fades in past ~600px (bottom-left to clear right-side controls) */}
          <ScrollTopButton isMobile={isMobile} bottomOffset={showBulkBar ? 72 : 20} />
          {/* Mobile collections FAB */}
          {isMobile && (
          <button
            className="mobile-fab"
            onClick={() => setShowMobileCollections(true)}
            style={{
              position: "fixed",
              // env() folds in the home-bar inset; kept inline (not a stylesheet
              // !important rule) so the bulk-bar offset can still win.
              bottom: `calc(${showBulkBar ? 72 : 20}px + env(safe-area-inset-bottom))`,
              right: 16,
              width: 44, height: 44, borderRadius: "50%",
              border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)",
              boxShadow: "var(--cp-shadow-md)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: activeCollectionId ? "var(--cp-accent)" : "var(--cp-text-muted)",
              zIndex: 59,
              transition: "bottom .2s ease",
            }}
          >
            <Library size={18} strokeWidth={1.5} />
            {activeCollectionId && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--cp-accent)",
              }} />
            )}
          </button>
          )}
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }} modifiers={[anchorToCursor]}>
            {activeDragId ? (() => {
              const q = quotes.find(x => x.id === activeDragId);
              if (!q) return null;
              const count = selected.has(activeDragId) && selected.size > 1 ? selected.size : 1;
              const preview = q.text.length > 60 ? q.text.slice(0, 60) + "\u2026" : q.text;
              return (
                <div style={{
                  position: "relative",
                  transform: "scale(1.04) rotate(-2deg)",
                  transition: "transform .2s cubic-bezier(0.16, 1, 0.3, 1)",
                  filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.18)) drop-shadow(0 4px 10px rgba(0,0,0,0.1))",
                }}>
                  {count > 1 && (
                    <span style={{
                      position: "absolute", top: -10, left: -10, zIndex: 1,
                      background: "var(--cp-accent)", color: "#fff",
                      fontSize: 11, fontWeight: 700, lineHeight: 1,
                      padding: "4px 8px", borderRadius: 6,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
                      animation: "completePop .3s cubic-bezier(0.16, 1, 0.3, 1) both",
                    }}>{count}</span>
                  )}
                  <div style={{
                    background: "var(--cp-bg-card)",
                    border: "1px solid var(--cp-accent)",
                    borderRadius: 6, padding: "10px 16px", fontSize: 13,
                    boxShadow: "0 0 0 2px rgba(60,87,117,0.1)",
                    maxWidth: 320,
                    color: "var(--cp-text)",
                  }}>
                    {preview}
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
          </DndContext>
        </div>
    </ResultsProvider>
  );
}
