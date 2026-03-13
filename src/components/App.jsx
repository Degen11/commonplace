import { useState, useRef, useCallback, useMemo, useEffect, useLayoutEffect } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useProcessing from "../hooks/useProcessing";
import useViewPreferences from "../hooks/useViewPreferences";
import useQuoteActions from "../hooks/useQuoteActions";
import useEditState from "../hooks/useEditState";
import useTheme from "../hooks/useTheme";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesContext } from "../contexts/QuotesContext";

import { getCatColor, sanitizeName } from "../data/constants";
import { similarity } from "../utils/textFormatting";
import { generateId } from "../utils/uuid";
import { findDuplicateGroups } from "../utils/quotes";
import {
  DUPE_SIMILARITY_THRESHOLD, DRAFT_SAVE_DEBOUNCE_MS, PHASE_TRANSITION_MS,
  LS_QUOTES, LS_CATS, LS_FILTERS, LS_DRAFT,
} from "../config";

import DupeModal from "./DupeModal";
import CollectionDupeModal from "./CollectionDupeModal";
import InputPhase from "./InputPhase";
import ProcessingPhase from "./ProcessingPhase";
import TableView from "./TableView";
import CardItem from "./CardItem";
import Footer from "./Footer";
import HeaderBar from "./HeaderBar";
import ToolbarSection from "./ToolbarSection";
import BulkBar from "./BulkBar";
import SectionErrorBoundary from "./SectionErrorBoundary";
import MiniHeader from "./MiniHeader";
import ConfirmModal from "./ConfirmModal";
import StatsOverlay from "./StatsOverlay";
import AddMorePanel from "./AddMorePanel";
import ExportDropdown from "./ExportDropdown";
import EmptyState from "./EmptyState";
import ShortcutsModal from "./ShortcutsModal";
import ShareImageModal from "./ShareImageModal";
import CollectionsSidebar from "./CollectionsSidebar";
import { styles } from "./styles";

import {
  AlertTriangle, Zap, Bot, Globe, XCircle, RefreshCw, Eye, Trash2, X, Plus,
} from "lucide-react";

function QuickAddBar({ onAdd, onClose, allCats, quotes }) {
  const textRef = useRef(null);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [dupeMatch, setDupeMatch] = useState(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const doAdd = () => {
    onAdd(text.trim(), source.trim() || undefined, undefined);
    setText("");
    setSource("");
    setDupeMatch(null);
    textRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const match = quotes.find(q => similarity(q.text, text.trim()) > DUPE_SIMILARITY_THRESHOLD);
    if (match) {
      setDupeMatch(match);
      return;
    }
    doAdd();
  };

  return (
    <div style={{ background: "var(--cp-bg-card)", borderBottom: "1px solid var(--cp-border)", animation: "fadeUp .2s ease" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}
      >
        <Plus size={14} strokeWidth={2} style={{ color: "var(--cp-text-muted)", flexShrink: 0 }} />
        <input
          ref={textRef}
          value={text}
          onChange={e => { setText(e.target.value); setDupeMatch(null); }}
          placeholder="Quote text\u2026"
          style={{
            flex: 1, minWidth: 0, padding: "6px 10px", fontSize: 13, fontFamily: "inherit",
            border: "1px solid var(--cp-border)", borderRadius: 6,
            background: "var(--cp-bg)", color: "var(--cp-text)", outline: "none",
          }}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <input
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source (optional)"
          style={{
            width: 160, padding: "6px 10px", fontSize: 13, fontFamily: "inherit",
            border: "1px solid var(--cp-border)", borderRadius: 6,
            background: "var(--cp-bg)", color: "var(--cp-text)", outline: "none",
          }}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            padding: "6px 14px", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            background: text.trim() ? "var(--cp-accent)" : "var(--cp-bg-tab)",
            color: text.trim() ? "#fff" : "var(--cp-text-muted)",
            border: "none", borderRadius: 6, cursor: text.trim() ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cp-text-muted)", padding: 4, borderRadius: 4, flexShrink: 0,
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </form>
      {dupeMatch && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 16px 10px",
          fontSize: 12, color: "var(--cp-warning-text)",
          background: "var(--cp-warning-bg)",
          flexWrap: "wrap",
        }}>
          <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            Similar to: "{dupeMatch.text.length > 60 ? dupeMatch.text.slice(0, 60) + "\u2026" : dupeMatch.text}"
          </span>
          <button
            onClick={doAdd}
            style={{
              padding: "3px 10px", borderRadius: 5, border: "1px solid var(--cp-warning-border)",
              background: "transparent", color: "var(--cp-warning-text)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            Add anyway
          </button>
          <button
            onClick={() => setDupeMatch(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--cp-warning-text)", padding: 2, fontSize: 11, fontFamily: "inherit",
              opacity: 0.7,
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function Commonplace() {
  const { showToast } = useToastContext();
  const {
    quotes, setQuotes,
    customCats, setCustomCats,
    columnOrder, setColumnOrder,
    allCats,
    isSharedView, setIsSharedView,
    syncStatus,
    lastSynced,
    initialLoading,
    trackDeletion, untrackDeletion,
    collections,
    activeCollectionId, setActiveCollectionId,
    createCollection, deleteCollection, restoreCollection, renameCollection,
    addToCollection, removeFromCollection, updateCollectionIcon,
    cleanCollectionRefs,
    manualPush,
  } = useQuotesContext();

  const [phase, setPhase]         = useState("input");
  const [fadeClass, setFadeClass] = useState("phase-in");
  const [rawInput, setRawInput]   = useState(() => {
    try { return localStorage.getItem(LS_DRAFT) || ""; } catch(e) { return ""; }
  });

  const goPhase = useCallback((next) => {
    setFadeClass("phase-out");
    setTimeout(() => { setPhase(next); setFadeClass("phase-in"); }, PHASE_TRANSITION_MS);
  }, []);

  const processing = useProcessing({ quotes, setQuotes, allCats, goPhase });
  const {
    isProcessing, processingDone, progress, identifiedFeed,
    apiError, failedEntries,
    stats,
    pendingDupes, dupeDecisions, setDupeDecision,
    formattingEnabled, setFormattingEnabled,
    processEntries, handleDupesContinue, retryFailed,
    identifyBatch, autoGroup, cancelProcessing, resetProcessingState,
    dismissApiError, dismissStats,
  } = processing;

  // AI auto-group: create a collection from a theme
  const handleAutoGroup = useCallback(async (theme) => {
    if (quotes.length === 0) throw new Error("No quotes to group");
    const matchedIds = await autoGroup(theme, quotes);
    if (matchedIds.length === 0) throw new Error("No quotes matched that theme");
    // Capitalize first letter of theme for collection name
    const name = theme.charAt(0).toUpperCase() + theme.slice(1);
    const col = createCollection(name);
    if (!col || col.error) throw new Error(`Collection "${name}" already exists`);
    addToCollection(col.id, matchedIds);
    setActiveCollectionId(col.id);
    showToast(`Created "${col.name}" with ${matchedIds.length} quote${matchedIds.length === 1 ? "" : "s"}`, null, null, "success");
  }, [quotes, autoGroup, createCollection, addToCollection, setActiveCollectionId, showToast]);

  const {
    view, setView,
    compact, setCompact,
    sortBy, setSortBy,
    catFilter, setCatFilter,
    favFilter, setFavFilter,
    search, setSearch,
    isMobile,
    filtered, collectionFiltered, visible, hasMore, remaining, loadMore,
    cc, favCount, unknownCount,
    hasActiveFilters, clearFilters, computedStats,
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
  } = useEditState({ quotes, setQuotes, filtered, visibleFiltered: collectionFiltered, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs });

  const {
    deletingId,
    copiedId,
    reidentifyingIds,
    handleDelete, copyQuote, shareAsImage, reIdentify, batchReIdentify,
    handleFileImport,
  } = useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion, untrackDeletion, cleanCollectionRefs });

  // ── dnd-kit sensors ──
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(pointerSensor, keyboardSensor);
  const [activeDragId, setActiveDragId] = useState(null);

  // Prioritize collection droppables (pointer must be inside them),
  // then fall back to closestCenter for sortable reordering
  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const collectionHit = pointerHits.find(c => typeof c.id === "string" && c.id.startsWith("collection:"));
    if (collectionHit) return [collectionHit];
    return closestCenter(args);
  }, []);

  const handleDndStart = useCallback(({ active }) => {
    setActiveDragId(active.id);
  }, []);

  // Anchor overlay to the cursor grab point instead of the element's top-left
  const anchorToCursor = useCallback(({ transform, activatorEvent, activeNodeRect }) => {
    if (!activatorEvent || !activeNodeRect) return transform;
    const offsetX = activatorEvent.clientX - activeNodeRect.left;
    const offsetY = activatorEvent.clientY - activeNodeRect.top;
    return { ...transform, x: transform.x + offsetX - 20, y: transform.y + offsetY - 16 };
  }, []);

  const handleDndEnd = useCallback(({ active, over }) => {
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    // Drop onto a collection
    if (typeof over.id === "string" && over.id.startsWith("collection:")) {
      const collectionId = over.id.replace("collection:", "");
      const ids = selected.has(active.id) && selected.size > 1
        ? [...selected]
        : [active.id];
      addToCollection(collectionId, ids);
      const col = collections.find(c => c.id === collectionId);
      if (col) showToast(`Added ${ids.length === 1 ? "1 quote" : `${ids.length} quotes`} to "${col.name}"`, "Undo", () => removeFromCollection(collectionId, ids), "success");
      return;
    }

    // Sortable reorder
    setQuotes(prev => {
      const oldIndex = prev.findIndex(q => q.id === active.id);
      const newIndex = prev.findIndex(q => q.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [selected, collections, addToCollection, removeFromCollection, showToast, setQuotes]);

  const [showExport, setShowExport]           = useState(false);
  const [showSort, setShowSort]               = useState(false);
  const [showStats, setShowStats]             = useState(false);
  const [showAddMore, setShowAddMore]         = useState(false);
  const [addMoreInput, setAddMoreInput]       = useState("");
  const [addMoreFormatting, setAddMoreFormatting] = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [newCatName, setNewCatName]           = useState("");
  const [showNewCat, setShowNewCat]           = useState(false);
  const { dark, toggleTheme } = useTheme();
  const [headerVisible, setHeaderVisible]     = useState(true);
  const [catFade, setCatFade]                 = useState({ left: false, right: false });
  const [inputTab, setInputTab]               = useState("paste");
  const [isDragOver, setIsDragOver]           = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const [dismissedAtCount, setDismissedAtCount] = useState(null);
  const [showShortcuts, setShowShortcuts]       = useState(false);
  const [showQuickInput, setShowQuickInput]     = useState(false);
  const [collectionDupes, setCollectionDupes]   = useState([]);
  const [shareImageQuote, setShareImageQuote]   = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("commonplace_sidebar_collapsed") === "1"; } catch { return false; }
  });

  const addMoreRef          = useRef(null);
  const exportRef           = useRef(null);
  const miniExportRef       = useRef(null);
  const sortRef             = useRef(null);
  const fileInputRef        = useRef(null);
  const toolbarRef          = useRef(null);
  const pendingScrollAdjust = useRef(null);
  const catScrollRef        = useRef(null);
  const headerRef           = useRef(null);


  // useLayoutEffect prevents flash of input phase on synchronous loads
  useLayoutEffect(() => {
    if (quotes.length > 0 && phase === "input") {
      setPhase("results");
      setFadeClass("phase-in");
    }
  }, [quotes.length, phase]);

  // Auto-save raw input draft
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (rawInput.trim()) localStorage.setItem(LS_DRAFT, rawInput);
        else localStorage.removeItem(LS_DRAFT);
      } catch(e) {}
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawInput]);

  useEffect(() => {
    if (phase !== "results" || !headerRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      setHeaderVisible(entry.isIntersecting);
    }, { threshold: 0 });
    obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, [phase]);

  // Close dropdowns when scrolling between main/mini header
  useEffect(() => {
    setShowExport(false);
    setShowSort(false);
  }, [headerVisible]);

  // Preserve scroll position when toggling panels via mini-header
  const preserveScroll = useCallback(() => {
    if (toolbarRef.current && !headerVisible) {
      pendingScrollAdjust.current = toolbarRef.current.getBoundingClientRect().top;
    }
  }, [headerVisible]);

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

  const updateCatFade = useCallback(() => {
    const el = catScrollRef.current;
    if (!el) return;
    setCatFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(updateCatFade, 100);
    window.addEventListener("resize", updateCatFade);
    return () => { clearTimeout(t); window.removeEventListener("resize", updateCatFade); };
  }, [updateCatFade]);

  useEffect(() => { updateCatFade(); }, [quotes.length, customCats.length, catFilter, updateCatFade]);

  useEffect(() => {
    const h = e => {
      if (exportRef.current && !exportRef.current.contains(e.target) && (!miniExportRef.current || !miniExportRef.current.contains(e.target))) setShowExport(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);

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

  const onFav = useCallback(id => setQuotes(p => p.map(x => x.id === id ? { ...x, favorite: !x.favorite, updatedAt: Date.now() } : x)), [setQuotes]);

  useKeyboardShortcuts({
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
    visible,
    onFav, handleDelete, bulkDel,
    setEditingId, setSearch,
    lastSelectedIndex,
    showToast,
  });

  useEffect(() => {
    const baseTitle = "Commonplace";
    if (phase === "processing" && progress) {
      document.title = `(${progress.done}/${progress.total}) Organizing... \u2014 ${baseTitle}`;
    } else if (quotes.length > 0) {
      document.title = `(${quotes.length}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [quotes, phase, progress]);

  const handleProcess = () => processEntries(rawInput, false, formattingEnabled);
  const handleAddMore = () => {
    if (!addMoreInput.trim()) return;
    processEntries(addMoreInput, true, addMoreFormatting);
    setAddMoreInput("");
    setShowAddMore(false);
  };

  const handleQuickAdd = useCallback((text, source, category) => {
    if (!text || !text.trim()) return;
    const addQuote = () => {
      const newQuote = {
        id: generateId(),
        text,
        source: source || "Unknown source",
        category: category || "Reflection",
        confidence: "high",
        favorite: false,
        updatedAt: Date.now(),
      };
      setQuotes(p => [newQuote, ...p]);
      setShowAddMore(false);
      showToast("Quote added", null, null, "success");
    };

    const match = quotes.find(q => similarity(q.text, text) > DUPE_SIMILARITY_THRESHOLD);
    if (match) {
      const preview = match.text.length > 60 ? match.text.slice(0, 60) + "…" : match.text;
      showToast(`Similar entry exists: "${preview}"`, "Add anyway", addQuote, "error");
      return;
    }
    addQuote();
  }, [quotes, setQuotes, showToast]);

  const handleClear = () => {
    if (quotes.length > 0) trackDeletion(quotes.map(q => q.id));
    try { window.history.replaceState(null, "", window.location.pathname); } catch(e) {} setIsSharedView(false);
    try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); localStorage.removeItem(LS_FILTERS); localStorage.removeItem(LS_DRAFT); } catch(e) {}
    goPhase("input"); setQuotes([]); setRawInput(""); setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); resetProcessingState();
    setConfirmClear(false); setShowAddMore(false); setSortBy("default"); setShowStats(false);
    setImportedFileName(null); setInputTab("paste"); setCustomCats([]); setActiveCollectionId(null);
  };

  const handleStartReview = () => {
    setSortBy("confidence");
    setCatFilter("All");
    setFavFilter(false);
    setSearch("");
    startReviewFlow();
  };

  const handleFindDupes = useCallback(() => {
    const target = activeCollectionId ? collectionFiltered : quotes;
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
  }, [quotes, collectionFiltered, activeCollectionId, showToast]);

  const handleDupeDeleteBatch = useCallback((quoteIds) => {
    const snapshot = quotes.filter(q => quoteIds.includes(q.id));
    const indices = snapshot.map(q => ({ quote: q, idx: quotes.findIndex(x => x.id === q.id) }));
    trackDeletion(quoteIds);
    const idSet = new Set(quoteIds);
    setQuotes(prev => prev.filter(q => !idSet.has(q.id)));
    cleanCollectionRefs(quoteIds);
    showToast(
      `Removed ${quoteIds.length} duplicate${quoteIds.length === 1 ? "" : "s"}`,
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
  }, [quotes, setQuotes, trackDeletion, untrackDeletion, cleanCollectionRefs, showToast]);

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
  const remCat = c => { setCustomCats(p => p.filter(x => x !== c)); setQuotes(p => p.map(q => q.category === c ? { ...q, category: "Reflection", updatedAt: Date.now() } : q)); if (catFilter === c) setCatFilter("All"); };

  const importCollections = useCallback((imported) => {
    const existingNames = new Set(collections.map(c => c.name.toLowerCase()));
    let added = 0;
    for (const c of imported) {
      if (existingNames.has(c.name.toLowerCase())) continue;
      const col = createCollection(c.name);
      if (col && !col.error) {
        if (c.icon) updateCollectionIcon(col.id, c.icon);
        if (c.quoteIds?.length > 0) addToCollection(col.id, c.quoteIds);
        existingNames.add(c.name.toLowerCase());
        added++;
      }
    }
    if (added > 0) showToast(`Imported ${added} collection${added === 1 ? "" : "s"}`, null, null, "success");
  }, [collections, createCollection, updateCollectionIcon, addToCollection, showToast]);

  // Persist sidebar collapsed state
  useEffect(() => {
    try { localStorage.setItem("commonplace_sidebar_collapsed", sidebarCollapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  // Compute per-collection quote counts for sidebar
  const quoteCounts = useMemo(() => {
    const quoteIdSet = new Set(quotes.map(q => q.id));
    const counts = {};
    for (const c of collections) {
      counts[c.id] = c.quoteIds.filter(id => quoteIdSet.has(id)).length;
    }
    return counts;
  }, [collections, quotes]);

  const handleDeleteCollection = useCallback((id) => {
    const col = collections.find(c => c.id === id);
    const count = quoteCounts[id] || 0;
    const snapshot = col ? { ...col, quoteIds: [...col.quoteIds] } : null;
    const wasActive = activeCollectionId === id;
    deleteCollection(id);
    if (col) {
      showToast(
        count > 0
          ? `Deleted "${col.name}" \u2014 ${count} ${count === 1 ? "quote stays" : "quotes stay"} in All Quotes`
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
  }, [collections, quoteCounts, activeCollectionId, deleteCollection, restoreCollection, setActiveCollectionId, showToast]);

  const handleRemoveFromCollection = useCallback((collectionId, quoteIds) => {
    removeFromCollection(collectionId, quoteIds);
    const col = collections.find(c => c.id === collectionId);
    const count = quoteIds.length;
    showToast(
      `Removed ${count} ${count === 1 ? "quote" : "quotes"} from "${col?.name || "collection"}"`,
      "Undo",
      () => addToCollection(collectionId, quoteIds),
    );
  }, [collections, removeFromCollection, addToCollection, showToast]);

  const showBulkBar = selected.size > 0;

  const actionProps = useMemo(() => ({
    onFav,
    onDelete:      handleDelete,
    onCopy:        copyQuote,
    onReidentify:  reIdentify,
    onShareImage:  setShareImageQuote,
    copiedId,
    reidentifying: reidentifyingIds,
    collections,
    onAddToCollection: (collectionId, quoteIds) => {
      addToCollection(collectionId, quoteIds);
      const col = collections.find(c => c.id === collectionId);
      const count = quoteIds.length;
      showToast(
        `Added ${count} ${count === 1 ? "quote" : "quotes"} to "${col?.name || "collection"}"`,
        "Undo",
        () => removeFromCollection(collectionId, quoteIds),
      );
    },
    onRemoveFromCollection: handleRemoveFromCollection,
    activeCollectionId,
  }), [onFav, handleDelete, copyQuote, reIdentify, setShareImageQuote, copiedId, reidentifyingIds, collections, addToCollection, removeFromCollection, handleRemoveFromCollection, activeCollectionId, showToast]);

  const exportDropdownContent = (
    <ExportDropdown
      quotes={quotes}
      filtered={filtered}
      selected={selected}
      hasActiveFilters={hasActiveFilters}
      showToast={showToast}
      setShowExport={setShowExport}
      collections={collections}
    />
  );

  return (
    <>
      <Analytics />
      <SpeedInsights />

      <DupeModal
        pendingDupes={pendingDupes}
        dupeDecisions={dupeDecisions}
        setDupeDecision={setDupeDecision}
        onContinue={handleDupesContinue}
      />

      <CollectionDupeModal
        dupeGroups={collectionDupes}
        onClose={() => setCollectionDupes([])}
        onDeleteQuotes={handleDupeDeleteBatch}
      />

      {/* ── Input phase ── */}
      {phase === "input" && (
        <SectionErrorBoundary name="Input">
          <InputPhase
            fadeClass={fadeClass}
            rawInput={rawInput} setRawInput={setRawInput}
            inputTab={inputTab} setInputTab={setInputTab}
            isDragOver={isDragOver} setIsDragOver={setIsDragOver}
            importedFileName={importedFileName}
            formattingEnabled={formattingEnabled} setFormattingEnabled={setFormattingEnabled}
            isProcessing={isProcessing}
            initialLoading={initialLoading}
            onProcess={handleProcess}
            onFileImport={(file) => handleFileImport(file, setRawInput, setImportedFileName, importCollections)}
            fileInputRef={fileInputRef}
            dark={dark}
            toggleTheme={toggleTheme}
          />
        </SectionErrorBoundary>
      )}

      {/* ── Processing phase ── */}
      {phase === "processing" && (
        <SectionErrorBoundary name="Processing">
          <ProcessingPhase
            fadeClass={fadeClass}
            progress={progress}
            identifiedFeed={identifiedFeed}
            customCats={customCats}
            processingDone={processingDone}
            onCancel={cancelProcessing}
          />
        </SectionErrorBoundary>
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <div style={styles.wrap} className={fadeClass}>

          {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

          {shareImageQuote && (
            <ShareImageModal
              quote={shareImageQuote}
              onClose={() => setShareImageQuote(null)}
              showToast={showToast}
            />
          )}

          {confirmClear && (
            <ConfirmModal
              icon={<AlertTriangle size={20} color="#EA580C" strokeWidth={2} />}
              iconColor="#EA580C"
              iconBg="var(--cp-warning-bg)"
              borderColor="#EA580C"
              title="Start fresh?"
              description={`This will clear all ${quotes.length} entries and remove them from your saved session. This cannot be undone.`}
              cancelLabel="Keep my entries"
              confirmLabel="Clear everything"
              onCancel={() => setConfirmClear(false)}
              onConfirm={handleClear}
            />
          )}

          {confirmBulkDel && (
            <ConfirmModal
              icon={<Trash2 size={20} color="#EB5757" strokeWidth={2} />}
              iconColor="#EB5757"
              iconBg="var(--cp-error-bg)"
              borderColor="#EB5757"
              title={`Delete ${selected.size} entries?`}
              description={`This will remove ${selected.size} selected entries. You can undo immediately after.`}
              cancelLabel="Keep entries"
              confirmLabel={`Delete ${selected.size} entries`}
              onCancel={() => setConfirmBulkDel(false)}
              onConfirm={bulkDel}
            />
          )}

          {isSharedView && (
            <div style={styles.shareBanner}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} strokeWidth={1.5} /> You're viewing a shared collection ({quotes.length} entries)</span>
              <button style={styles.shareBannerBtn} onClick={() => { setIsSharedView(false); try { window.history.replaceState(null, "", window.location.pathname); } catch(e) {} }}>Make it yours</button>
            </div>
          )}

          <SectionErrorBoundary name="Header">
            <HeaderBar
              quotes={quotes}
              filtered={filtered}
              view={view}
              compact={compact}
              setView={setView}
              setCompact={setCompact}
              showStats={showStats}
              setShowStats={setShowStats}
              showExport={showExport}
              setShowExport={setShowExport}
              showAddMore={showAddMore}
              setShowAddMore={setShowAddMore}
              isMobile={isMobile}
              setConfirmClear={setConfirmClear}
              addMoreRef={addMoreRef}
              exportRef={exportRef}
              headerRef={headerRef}
              headerVisible={headerVisible}
              exportDropdownContent={exportDropdownContent}
              syncStatus={syncStatus}
              lastSynced={lastSynced}
              onManualSync={manualPush}
              dark={dark}
              toggleTheme={toggleTheme}
              onShowShortcuts={() => setShowShortcuts(true)}
            />
          </SectionErrorBoundary>

          {/* Sticky mini-header when main header scrolls out */}
          {!headerVisible && !isMobile && (
            <MiniHeader
              view={view} setView={setView}
              compact={compact} setCompact={setCompact}
              showStats={showStats} setShowStats={setShowStats}
              showExport={showExport} setShowExport={setShowExport}
              showAddMore={showAddMore} setShowAddMore={setShowAddMore}
              addMoreRef={addMoreRef}
              miniExportRef={miniExportRef}
              preserveScroll={preserveScroll}
              quotes={quotes}
              filtered={filtered}
              selected={selected}
              hasActiveFilters={hasActiveFilters}
              showToast={showToast}
              collections={collections}
              syncStatus={syncStatus}
              lastSynced={lastSynced}
              onManualSync={manualPush}
              dark={dark}
              toggleTheme={toggleTheme}
              setConfirmClear={setConfirmClear}
              onShowShortcuts={() => setShowShortcuts(true)}
            />
          )}

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

          {apiError && (
            <div style={styles.errorBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} strokeWidth={2} /> {apiError}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {failedEntries.length > 0 && <button style={styles.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
                <button className="dismiss-link" style={{ background: "none", border: "none", color: "var(--cp-error-text)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={dismissApiError}>Dismiss</button>
              </div>
            </div>
          )}

          {stats && (
            <div style={styles.statsBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} strokeWidth={2} /> <strong>{stats.local}</strong> matched locally</span>
              {stats.lookup > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Globe size={13} strokeWidth={2} /> <strong>{stats.lookup}</strong> found online</span></>}
              <span style={styles.statDot} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bot size={13} strokeWidth={2} /> <strong>{stats.api}</strong> identified by AI</span>
              {stats.failed > 0 && <><span style={styles.statDot} /><span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={13} strokeWidth={2} /> <strong>{stats.failed}</strong> failed</span></>}
              {stats.dupes > 0 && <><span style={styles.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} strokeWidth={2} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
              <button style={styles.statsDismiss} onClick={dismissStats}><X size={14} strokeWidth={2} /></button>
            </div>
          )}

          {showAddMore && (
            headerVisible ? (
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
                />
              </div>
            ) : (
              <div style={{
                position: "fixed", top: 49, left: 0, right: 0,
                zIndex: 59, background: "var(--cp-mini-bg)",
                padding: "12px 32px", borderBottom: "1px solid var(--cp-border)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                animation: "slideD .2s ease",
              }}>
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                  <AddMorePanel
                    addMoreInput={addMoreInput} setAddMoreInput={setAddMoreInput}
                    addMoreFormatting={addMoreFormatting} setAddMoreFormatting={setAddMoreFormatting}
                    addMoreRef={addMoreRef}
                    onAddMore={handleAddMore}
                    onCancel={() => { setShowAddMore(false); setAddMoreInput(""); }}
                    onFileImport={(file, setter, nameSetter) => handleFileImport(file, setter, nameSetter, importCollections)}
                  />
                </div>
              </div>
            )
          )}

          {showBulkBar && (
            <BulkBar
              selected={selected}
              setSelected={setSelected}
              bulkEditCat={bulkEditCat}
              setBulkEditCat={setBulkEditCat}
              bulkEditSource={bulkEditSource}
              setBulkEditSource={setBulkEditSource}
              allCats={allCats}
              applyBulk={applyBulk}
              onDelete={() => selected.size > 3 ? setConfirmBulkDel(true) : bulkDel()}
              onBatchReIdentify={() => batchReIdentify(selected)}
              isReidentifying={reidentifyingIds.size > 0}
              collections={collections}
              onAddToCollection={(collectionId, quoteIds) => {
                addToCollection(collectionId, quoteIds);
                const col = collections.find(c => c.id === collectionId);
                const count = quoteIds.length;
                showToast(
                  `Added ${count} ${count === 1 ? "quote" : "quotes"} to "${col?.name || "collection"}"`,
                  "Undo",
                  () => removeFromCollection(collectionId, quoteIds),
                );
              }}
              onRemoveFromCollection={handleRemoveFromCollection}
              activeCollectionId={activeCollectionId}
            />
          )}

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
              sortRef={sortRef}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
            />
          </SectionErrorBoundary>

          {unknownCount > 0 && (reviewQueue.length > 0 ? (
            <div style={styles.attentionBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={styles.attentionCount}>{reviewQueue.length}</span>
                <span>{reviewQueue.length === 1 ? "entry" : "entries"} remaining in review</span>
              </div>
              <button style={{ ...styles.attentionBtn, background: "#92400E" }} onClick={() => { setReviewQueue([]); setEditingId(null); }}>Exit review</button>
            </div>
          ) : sortBy !== "confidence" && (dismissedAtCount === null || unknownCount > dismissedAtCount) && (
            <div style={styles.attentionBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={styles.attentionCount}>{unknownCount}</span>
                <span>{unknownCount === 1 ? "entry needs" : "entries need"} your attention — source or category is missing</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button className="ui-tip" data-tip="Step through entries that need attention" style={styles.attentionBtn} onClick={handleStartReview}>Review now &rarr;</button>
                <button className="ui-tip attention-dismiss" data-tip="Dismiss" style={styles.attentionDismiss} onClick={() => setDismissedAtCount(unknownCount)}>&times;</button>
              </div>
            </div>
          ))}

          {/* Main content area with optional sidebar */}
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDndStart} onDragEnd={handleDndEnd}>
          <div style={{ display: "flex", gap: 0 }}>
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
            />
            <div style={{ flex: 1, minWidth: 0 }}>

          {showQuickInput && (
            <QuickAddBar
              onAdd={(text, source, category) => { handleQuickAdd(text, source, category); setShowQuickInput(false); }}
              onClose={() => setShowQuickInput(false)}
              allCats={allCats}
              quotes={quotes}
            />
          )}

          {/* TABLE VIEW */}
          {view === "table" && (
            <SectionErrorBoundary name="Table view">
              <SortableContext items={visible.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <TableView
                filtered={visible}
                selected={selected}
                toggleSel={toggleSel}
                selAll={selAll}
                editingId={editingId}
                setEditingId={setEditingId}
                inlineEdit={inlineEdit}
                setInlineEdit={setInlineEdit}
                saveEdit={saveEdit}
                saveInlineField={saveInlineField}
                allCats={allCats}
                customCats={customCats}
                actionProps={actionProps}
                compact={compact}
                columnOrder={columnOrder}
                setColumnOrder={setColumnOrder}
                sortBy={sortBy}
                isMobile={isMobile}
                savedPulse={savedPulse}
                deletingId={deletingId}
                searchTerm={search}
              />
              </SortableContext>
            </SectionErrorBoundary>
          )}

          {/* CARD VIEW */}
          {view === "cards" && (
            <SectionErrorBoundary name="Card view">
              <SortableContext items={visible.map(q => q.id)} strategy={rectSortingStrategy}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
                {visible.map((q) => {
                  const col = getCatColor(q.category, customCats);
                  const isSel = selected.has(q.id);
                  const isEd  = editingId === q.id;
                  const needsAtt = q.confidence === "low" || q.category === "Unknown";
                  const isInlineEditing = inlineEdit?.id === q.id;
                  const inlineEditField = isInlineEditing ? inlineEdit.field : null;
                  const isDeleting = deletingId === q.id;
                  const isSavedPulse = savedPulse?.id === q.id;
                  const savedPulseField = isSavedPulse ? savedPulse.field : null;
                  return (
                    <CardItem
                      key={q.id}
                      q={q}
                      col={col}
                      isSel={isSel}
                      isEd={isEd}
                      needsAtt={needsAtt}
                      sortBy={sortBy}
                      isMobile={isMobile}
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
                    />
                  );
                })}
              </div>
              </SortableContext>
            </SectionErrorBoundary>
          )}
{hasMore && (
  <button
    className="load-more-btn"
    onClick={loadMore}
    style={{
      display: "block",
      margin: "20px auto",
      padding: "10px 24px",
      fontSize: 13,
      color: "#2383E2",
      background: "none",
      border: "1px solid var(--cp-border)",
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "inherit",
      animation: "fadeUp .3s ease",
    }}
  >
    Load more ({remaining} remaining)
  </button>
)}
          {collectionFiltered.length === 0 && (
            <EmptyState
              catFilter={catFilter} setCatFilter={setCatFilter}
              favFilter={favFilter} setFavFilter={setFavFilter}
              search={search} setSearch={setSearch}
              setSortBy={setSortBy}
              customCats={customCats}
              activeCollectionName={activeCollectionId ? collections.find(c => c.id === activeCollectionId)?.name : null}
              onBrowseAll={activeCollectionId ? () => setActiveCollectionId(null) : null}
            />
          )}

          <Footer styles={styles} />

          {showBulkBar && <div style={{ height: 64 }} />}

            </div>{/* end flex main content */}
          </div>{/* end flex container with sidebar */}
          <DragOverlay dropAnimation={null} modifiers={[anchorToCursor]}>
            {activeDragId ? (() => {
              const q = quotes.find(x => x.id === activeDragId);
              if (!q) return null;
              const count = selected.has(activeDragId) && selected.size > 1 ? selected.size : 1;
              const preview = q.text.length > 60 ? q.text.slice(0, 60) + "\u2026" : q.text;
              return (
                <div style={{ position: "relative" }}>
                  {count > 1 && (
                    <span style={{
                      position: "absolute", top: -8, left: -8, zIndex: 1,
                      background: "#3C5775", color: "#fff",
                      fontSize: 11, fontWeight: 700, lineHeight: 1,
                      padding: "3px 7px", borderRadius: 10,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    }}>{count}</span>
                  )}
                  <div style={{
                    background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)",
                    borderRadius: 8, padding: "8px 14px", fontSize: 13,
                    boxShadow: "var(--cp-shadow-md)", maxWidth: 320, opacity: 0.92,
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
      )}
    </>
  );
}
