import { useState, useRef, useCallback, useMemo, useEffect, useLayoutEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useProcessing from "../hooks/useProcessing";
import useViewPreferences from "../hooks/useViewPreferences";
import useQuoteActions from "../hooks/useQuoteActions";
import useEditState from "../hooks/useEditState";
import useTheme from "../hooks/useTheme";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesContext } from "../contexts/QuotesContext";

import { getCatColor, sanitizeName } from "../data/constants";
import { setMultiDragImage, cleanupDragGhost } from "../utils/dragGhost";
import { normalize, similarity } from "../utils/textFormatting";
import { generateId } from "../utils/uuid";
import {
  DUPE_SIMILARITY_THRESHOLD, DRAFT_SAVE_DEBOUNCE_MS, PHASE_TRANSITION_MS,
  LS_QUOTES, LS_CATS, LS_FILTERS, LS_DRAFT,
} from "../config";

import Toast from "./Toast";
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
  AlertTriangle, Zap, Bot, Globe, XCircle, RefreshCw, Eye, Trash2, X,
} from "lucide-react";

export default function Commonplace() {
  const { toasts, showToast, dismissToast } = useToastContext();
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
    createCollection, deleteCollection, renameCollection,
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
    apiError, setApiError, failedEntries,
    stats, setStats,
    pendingDupes, dupeDecisions, setDupeDecisions,
    formattingEnabled, setFormattingEnabled,
    processEntries, handleDupesContinue, retryFailed,
    identifyBatch, autoGroup, resetProcessingState,
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
    showToast(`Created "${col.name}" with ${matchedIds.length} quote${matchedIds.length === 1 ? "" : "s"}`);
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
    hasActiveFilters, computedStats,
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
    dragId, dragInsert,
    handleDelete, copyQuote, shareAsImage, reIdentify, batchReIdentify,
    handleDragStart: rawDragStart, handleDragOver, handleDragEnd: rawDragEnd,
    handleFileImport,
  } = useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion, untrackDeletion, cleanCollectionRefs });

  // Wrap drag handlers so the multi-drag ghost uses the always-fresh `selected` set
  // (memoized rows hold stale selectionCount props, so we handle it here instead)
  const handleDragStart = useCallback((id, e) => {
    if (e && selected.has(id) && selected.size > 1) {
      setMultiDragImage(e, selected.size);
    }
    rawDragStart(id);
  }, [rawDragStart, selected]);

  const handleDragEnd = useCallback(() => {
    cleanupDragGhost();
    rawDragEnd();
  }, [rawDragEnd]);

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

  // Keyboard shortcuts — use a ref to avoid re-registering on every state change
  const kbStateRef = useRef({});
  kbStateRef.current = { search, editingId, selected, confirmClear, confirmBulkDel, showExport, showSort, reviewQueue, selAll, visible, onFav, handleDelete, bulkDel, phase, showShortcuts, showStats, showAddMore, inlineEdit };

  useEffect(() => {
    const h = e => {
      if (e.target.matches('input, textarea, select')) return;
      const s = kbStateRef.current;

      // Block all shortcuts except Escape when not in results phase
      if (s.phase !== 'results' && e.key !== 'Escape') return;

      // Block navigation/action shortcuts when modals or inline edits are active
      const modalOpen = s.showShortcuts || s.showStats || s.showAddMore || s.confirmClear || s.confirmBulkDel;
      const isEditing = s.editingId || s.inlineEdit;

      if (e.key === 'Escape') {
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
          setSearch('');
          return;
        }
      }

      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        s.selAll();
        return;
      }

      // Skip action/navigation shortcuts when modals or editing are active
      if (modalOpen || isEditing) return;

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) searchInput.focus();
        return;
      }

      if (e.key === 'j' || e.key === 'k') {
        const list = s.visible;
        if (!list || list.length === 0) return;
        // Find current position based on last selected item
        let curIdx = -1;
        if (s.selected.size > 0) {
          const lastId = [...s.selected].pop();
          curIdx = list.findIndex(q => q.id === lastId);
        }
        const nextIdx = e.key === 'j'
          ? Math.min(curIdx + 1, list.length - 1)
          : Math.max(curIdx - 1, 0);
        setSelected(new Set([list[nextIdx].id]));
        // Scroll the row into view
        const el = document.querySelector(`[data-id="${list[nextIdx].id}"]`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }

      if (e.key === 'f') {
        if (s.selected.size === 0) return;
        for (const id of s.selected) s.onFav(id);
        return;
      }

      if (e.key === 'd' || e.key === 'Delete' || e.key === 'Backspace') {
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
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [showToast, setEditingId, setSelected, setReviewQueue, setSearch, setConfirmBulkDel, lastSelectedIndex]);

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
      showToast("Quote added");
    };

    const match = quotes.find(q => similarity(q.text, text) > DUPE_SIMILARITY_THRESHOLD);
    if (match) {
      const preview = match.text.length > 60 ? match.text.slice(0, 60) + "…" : match.text;
      showToast(`Similar entry exists: "${preview}"`, "Add anyway", addQuote);
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
      showToast("Need at least 2 entries to scan for duplicates.");
      return;
    }
    const norms = target.map(q => ({ id: q.id, text: q.text, source: q.source, category: q.category, norm: normalize(q.text) }));

    // Build adjacency via pairwise similarity, then group into clusters (union-find)
    const parent = norms.map((_, i) => i);
    const scores = new Map(); // "i:j" -> score
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (a, b) => { parent[find(a)] = find(b); };

    for (let i = 0; i < norms.length; i++) {
      for (let j = i + 1; j < norms.length; j++) {
        const score = similarity(norms[i].norm, norms[j].norm);
        if (score > DUPE_SIMILARITY_THRESHOLD) {
          union(i, j);
          scores.set(`${i}:${j}`, score);
        }
      }
    }

    // Collect clusters (groups with 2+ members)
    const clusters = new Map();
    norms.forEach((_, i) => {
      const root = find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(i);
    });

    const groups = [];
    for (const members of clusters.values()) {
      if (members.length < 2) continue;
      let minScore = 1, maxScore = 0;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const key = `${Math.min(members[i], members[j])}:${Math.max(members[i], members[j])}`;
          const s = scores.get(key);
          if (s !== undefined) { minScore = Math.min(minScore, s); maxScore = Math.max(maxScore, s); }
        }
      }
      groups.push({ entries: members.map(i => norms[i]), minScore, maxScore });
    }

    if (groups.length === 0) {
      showToast("No duplicates found!");
      return;
    }
    groups.sort((a, b) => b.maxScore - a.maxScore);
    setCollectionDupes(groups);
  }, [quotes, collectionFiltered, activeCollectionId, showToast]);

  const handleDupeDeleteBatch = useCallback((quoteIds) => {
    trackDeletion(quoteIds);
    const idSet = new Set(quoteIds);
    setQuotes(prev => prev.filter(q => !idSet.has(q.id)));
    cleanCollectionRefs(quoteIds);
    showToast(`Removed ${quoteIds.length} duplicate${quoteIds.length === 1 ? "" : "s"}`);
  }, [setQuotes, trackDeletion, cleanCollectionRefs, showToast]);

  const addCat = () => {
    const sanitized = sanitizeName(newCatName);
    if (!sanitized || allCats.some(c => c.toLowerCase() === sanitized.toLowerCase())) {
      showToast("Invalid or duplicate category name");
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
    if (added > 0) showToast(`Imported ${added} collection${added === 1 ? "" : "s"}`);
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
    deleteCollection(id);
    if (col) {
      showToast(count > 0
        ? `Deleted "${col.name}" \u2014 ${count} ${count === 1 ? "quote stays" : "quotes stay"} in All Quotes`
        : `Deleted "${col.name}"`
      );
    }
  }, [collections, quoteCounts, deleteCollection, showToast]);

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
    onAddToCollection: addToCollection,
    onRemoveFromCollection: removeFromCollection,
    activeCollectionId,
  }), [onFav, handleDelete, copyQuote, reIdentify, setShareImageQuote, copiedId, reidentifyingIds, collections, addToCollection, removeFromCollection, activeCollectionId]);

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
        setDupeDecisions={setDupeDecisions}
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
            onCancel={() => { processing.setIsProcessing(false); processing.setProgress(null); processing.setProcessingDone(false); goPhase("input"); }}
          />
        </SectionErrorBoundary>
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <div style={styles.wrap} className={fadeClass}>

          {toasts.length > 0 && <Toast key={toasts[0].id} id={toasts[0].id} message={toasts[0].message} action={toasts[0].action} onAction={toasts[0].onAction} onDismiss={dismissToast} />}

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
              iconBg="#FFF7ED"
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
              iconBg="#FEF2F2"
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
                <button className="dismiss-link" style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={() => setApiError(null)}>Dismiss</button>
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
              <button style={styles.statsDismiss} onClick={() => setStats(null)}><X size={14} strokeWidth={2} /></button>
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
              onAddToCollection={addToCollection}
              onRemoveFromCollection={removeFromCollection}
              activeCollectionId={activeCollectionId}
            />
          )}

          <SectionErrorBoundary name="Toolbar">
            <ToolbarSection
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showSort={showSort}
              setShowSort={setShowSort}
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
              sortRef={sortRef}
              catScrollRef={catScrollRef}
              updateCatFade={updateCatFade}
              catFade={catFade}
              getCatColor={getCatColor}
              onFindDupes={handleFindDupes}
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
                onDropQuote={(collectionId, e) => {
                  const quoteId = e.dataTransfer.getData("text/x-quote-id");
                  if (!quoteId) return;
                  const ids = selected.has(quoteId) && selected.size > 1
                    ? [...selected]
                    : [quoteId];
                  addToCollection(collectionId, ids);
                  const col = collections.find(c => c.id === collectionId);
                  if (col) showToast(`Added ${ids.length === 1 ? "1 quote" : `${ids.length} quotes`} to "${col.name}"`);
                }}
                onAutoGroup={handleAutoGroup}
            />
            <div style={{ flex: 1, minWidth: 0 }}>

          {/* TABLE VIEW */}
          {view === "table" && (
            <SectionErrorBoundary name="Table view">
              <div>
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
                dragId={dragId}
                dragInsert={dragInsert}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragEnd={handleDragEnd}
                columnOrder={columnOrder}
                setColumnOrder={setColumnOrder}
                sortBy={sortBy}
                isMobile={isMobile}
                savedPulse={savedPulse}
                deletingId={deletingId}
                searchTerm={search}
              />
              </div>
            </SectionErrorBoundary>
          )}

          {/* CARD VIEW */}
          {view === "cards" && (
            <SectionErrorBoundary name="Card view">
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
                      dragId={dragId}
                      isMobile={isMobile}
                      isInlineEditing={isInlineEditing}
                      inlineEditField={inlineEditField}
                      isSavedPulse={isSavedPulse}
                      savedPulseField={savedPulseField}
                      allCats={allCats}
                      actionProps={actionProps}
                      toggleSel={toggleSel}
                      startEditing={startEditing}
                      startInlineEdit={startInlineEdit}
                      saveEdit={saveEdit}
                      saveInlineField={saveInlineField}
                      setInlineEdit={setInlineEdit}
                      setEditingId={setEditingId}
                      handleDragStart={handleDragStart}
                      handleDragOver={handleDragOver}
                      handleDragEnd={handleDragEnd}
                      isDeleting={isDeleting}
                      searchTerm={search}
                    />
                  );
                })}
              </div>
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
            />
          )}

          {showBulkBar && <div style={{ height: 64 }} />}

          <Footer styles={styles} />

            </div>{/* end flex main content */}
          </div>{/* end flex container with sidebar */}
        </div>
      )}
    </>
  );
}
