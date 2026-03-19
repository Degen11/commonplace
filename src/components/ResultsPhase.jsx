import { useState, useRef, useCallback, useMemo, useEffect, useLayoutEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "motion/react";
import useViewPreferences from "../hooks/useViewPreferences";
import useEditState from "../hooks/useEditState";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import useDndQuotes from "../hooks/useDndQuotes";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesContext } from "../contexts/QuotesContext";

import { getCatColor, sanitizeName } from "../data/constants";
import { similarity } from "../utils/textFormatting";
import { generateId } from "../utils/uuid";
import { findDuplicateGroups } from "../utils/quotes";
import {
  DUPE_SIMILARITY_THRESHOLD,
  LS_QUOTES, LS_CATS, LS_FILTERS, LS_DRAFT, LS_SIDEBAR, LS_KB_HINT,
} from "../config";
import { pluralize } from "../utils/helpers";
import { saveToStorage } from "../utils/storage";

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
import { styles } from "./styles";

import { X } from "lucide-react";

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
  dark, toggleTheme,
  // Callbacks from App.jsx
  importCollections, onClearReset,
}) {
  const { showToast } = useToastContext();
  const {
    quotes, setQuotes,
    customCats, setCustomCats,
    columnOrder, setColumnOrder,
    allCats,
    isSharedView, setIsSharedView,
    syncStatus,
    lastSynced,
    trackDeletion, untrackDeletion,
    collections,
    activeCollectionId, setActiveCollectionId,
    createCollection, deleteCollection, restoreCollection, renameCollection,
    addToCollection, removeFromCollection, updateCollectionIcon,
    cleanCollectionRefs,
    manualPush,
  } = useQuotesContext();

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
    filtered, collectionFiltered, visible, hasMore, remaining, loadMore,
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
  } = useEditState({ quotes, setQuotes, filtered, visibleFiltered: collectionFiltered, showToast, trackDeletion, untrackDeletion, cleanCollectionRefs, collections, addToCollection });

  const {
    sensors, activeDragId, overDragId,
    collisionDetection, handleDndStart, handleDndOver, handleDndEnd, anchorToCursor,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_SIDEBAR) === "1"; } catch { return false; }
  });
  const [showKbHint, setShowKbHint] = useState(() => {
    try { return !localStorage.getItem(LS_KB_HINT); } catch { return false; }
  });

  // ── Refs ──

  const addMoreRef          = useRef(null);
  const sortRef             = useRef(null);
  const toolbarRef          = useRef(null);
  const pendingScrollAdjust = useRef(null);
  const catScrollRef        = useRef(null);
  const headerObsRef        = useRef(null);
  const headerRef           = useCallback((node) => {
    if (headerObsRef.current) { headerObsRef.current.disconnect(); headerObsRef.current = null; }
    if (node) {
      const obs = new IntersectionObserver(([entry]) => {
        setHeaderVisible(entry.isIntersecting);
      }, { threshold: 0 });
      obs.observe(node);
      headerObsRef.current = obs;
    }
  }, []);
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

  // Persist sidebar collapsed state
  useEffect(() => {
    saveToStorage(LS_SIDEBAR, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const dismissKbHint = useCallback(() => {
    setShowKbHint(false);
    try { localStorage.setItem(LS_KB_HINT, "1"); } catch { /* ignore */ }
  }, []);

  // ── Handlers ──

  const onFav = useCallback(id => setQuotes(p => p.map(x => x.id === id ? { ...x, favorite: !x.favorite, updatedAt: Date.now() } : x)), [setQuotes]);

  const handleAddMore = () => {
    if (!addMoreInput.trim()) return;
    processEntries(addMoreInput, true, addMoreFormatting);
    setAddMoreInput("");
    setShowAddMore(false);
  };

  const handleQuickAdd = useCallback((text, source, category, { skipDupeCheck } = {}) => {
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

    if (!skipDupeCheck) {
      const match = quotes.find(q => similarity(q.text, text) > DUPE_SIMILARITY_THRESHOLD);
      if (match) {
        const preview = match.text.length > 60 ? match.text.slice(0, 60) + "…" : match.text;
        showToast(`Similar entry exists: "${preview}"`, "Add anyway", addQuote, "error");
        return;
      }
    }
    addQuote();
  }, [quotes, setQuotes, showToast]);

  const handleClear = useCallback(() => {
    if (quotes.length > 0) trackDeletion(quotes.map(q => q.id));
    try { window.history.replaceState(null, "", window.location.pathname); } catch {}
    setIsSharedView(false);
    try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); localStorage.removeItem(LS_FILTERS); localStorage.removeItem(LS_DRAFT); } catch {}
    setQuotes([]);
    setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default");
    setConfirmClear(false); setShowAddMore(false); setShowStats(false);
    setCustomCats([]); setActiveCollectionId(null);
    onClearReset();
  }, [quotes, trackDeletion, setIsSharedView, setQuotes, setCustomCats, setActiveCollectionId,
      setSelected, setCatFilter, setFavFilter, setSearch, setSortBy, onClearReset]);

  const handleStartReview = () => {
    setSortBy("confidence");
    setCatFilter("All");
    setFavFilter(false);
    setSearch("");
    startReviewFlow();
  };

  const handleFindDupes = useCallback(() => {
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
  }, [quotes, collections, activeCollectionId, showToast]);

  const handleDupeDeleteBatch = useCallback((quoteIds) => {
    const snapshot = quotes.filter(q => quoteIds.includes(q.id));
    const indices = snapshot.map(q => ({ quote: q, idx: quotes.findIndex(x => x.id === q.id) }));
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

  // AI auto-group: create a collection from a theme
  const handleAutoGroup = useCallback(async (theme) => {
    if (quotes.length === 0) throw new Error("No quotes to group");
    const matchedIds = await autoGroup(theme, quotes);
    if (matchedIds.length === 0) throw new Error("No quotes matched that theme");
    const name = theme.charAt(0).toUpperCase() + theme.slice(1);
    const col = createCollection(name);
    if (!col || col.error) throw new Error(`Collection "${name}" already exists`);
    addToCollection(col.id, matchedIds);
    setActiveCollectionId(col.id);
    showToast(`Created "${col.name}" with ${pluralize(matchedIds.length, "quote")}`, null, null, "success");
  }, [quotes, autoGroup, createCollection, addToCollection, setActiveCollectionId, showToast]);

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
  }, [collections, quoteCounts, activeCollectionId, deleteCollection, restoreCollection, setActiveCollectionId, showToast]);

  const handleRemoveFromCollection = useCallback((collectionId, quoteIds) => {
    removeFromCollection(collectionId, quoteIds);
    const col = collections.find(c => c.id === collectionId);
    showToast(
      `Removed ${pluralize(quoteIds.length, "quote")} from "${col?.name || "collection"}"`,
      "Undo",
      () => addToCollection(collectionId, quoteIds),
    );
  }, [collections, removeFromCollection, addToCollection, showToast]);

  const handleAddToCollection = useCallback((collectionId, quoteIds) => {
    addToCollection(collectionId, quoteIds);
    const col = collections.find(c => c.id === collectionId);
    showToast(
      `Added ${pluralize(quoteIds.length, "quote")} to "${col?.name || "collection"}"`,
      "Undo",
      () => removeFromCollection(collectionId, quoteIds),
    );
  }, [collections, addToCollection, removeFromCollection, showToast]);

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
    onAddToCollection: handleAddToCollection,
    onRemoveFromCollection: handleRemoveFromCollection,
    activeCollectionId,
  }), [onFav, handleDelete, copyQuote, reIdentify, setShareImageQuote, copiedId, reidentifyingIds, collections, handleAddToCollection, handleRemoveFromCollection, activeCollectionId]);

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

  // ── Render ──

  return (
    <>
      <ResultsModals
        showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts}
        shareImageQuote={shareImageQuote} setShareImageQuote={setShareImageQuote} showToast={showToast}
        confirmClear={confirmClear} setConfirmClear={setConfirmClear} handleClear={handleClear} quotesLength={quotes.length}
        confirmBulkDel={confirmBulkDel} setConfirmBulkDel={setConfirmBulkDel} bulkDel={bulkDel} selectedSize={selected.size}
        collectionDupes={collectionDupes} setCollectionDupes={setCollectionDupes} handleDupeDeleteBatch={handleDupeDeleteBatch}
      />

      <div style={styles.wrap}>

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
              dark={dark}
              toggleTheme={toggleTheme}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              onShowShortcuts={() => { setShowShortcuts(true); dismissKbHint(); }}
            />
          </SectionErrorBoundary>

          {/* Sticky mini-header when main header scrolls out */}
          {!headerVisible && !isMobile && (
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
              dark={dark}
              toggleTheme={toggleTheme}
              showConfidence={showConfidence}
              setShowConfidence={setShowConfidence}
              setConfirmClear={setConfirmClear}
              onShowShortcuts={() => { setShowShortcuts(true); dismissKbHint(); }}
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
                animation: "slideD .25s ease",
              }}>
                <div style={{ maxWidth: 1120, margin: "0 auto" }}>
                  <AddMorePanel
                    addMoreInput={addMoreInput} setAddMoreInput={setAddMoreInput}
                    addMoreFormatting={addMoreFormatting} setAddMoreFormatting={setAddMoreFormatting}
                    addMoreRef={addMoreRef}
                    onAddMore={handleAddMore}
                    onQuickAdd={handleQuickAdd}
                    onCancel={() => { setShowAddMore(false); setAddMoreInput(""); }}
                    onFileImport={(file, setter, nameSetter) => handleFileImport(file, setter, nameSetter, importCollections)}
                  />
                </div>
              </div>
            )
          )}

          <AnimatePresence>
          {showBulkBar && (
            <motion.div
              key="bulk-bar"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }}
              exit={{ opacity: 0, y: "100%", transition: { duration: 0.15, ease: "easeIn" } }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500 }}
            >
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
              onAddToCollection={handleAddToCollection}
              onRemoveFromCollection={handleRemoveFromCollection}
              activeCollectionId={activeCollectionId}
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
              sortRef={sortRef}
              hasActiveFilters={hasActiveFilterOrSort}
              clearFilters={clearFilters}
              resultCount={collectionFiltered.length}
              totalCount={quotes.length}
            />
          </SectionErrorBoundary>

          {showKbHint && !isMobile && quotes.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "6px 14px", fontSize: 12, color: "var(--cp-text-muted)",
              animation: "slideD .25s ease",
            }}>
              <span>Press <kbd style={{ padding: "1px 5px", border: "1px solid var(--cp-border)", borderRadius: 4, fontSize: 11, fontFamily: "inherit", background: "var(--cp-bg-card)" }}>?</kbd> for keyboard shortcuts</span>
              <button onClick={dismissKbHint} style={{ background: "none", border: "none", color: "var(--cp-text-faint)", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Main content area with optional sidebar */}
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDndStart} onDragOver={handleDndOver} onDragEnd={handleDndEnd}>
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
                toolbarHeight={toolbarHeight}
            />
            <div style={{ flex: 1, minWidth: 0 }}>

          {showQuickInput && (
            <QuickAddBar
              onAdd={(text, source, category, opts) => { handleQuickAdd(text, source, category, opts); setShowQuickInput(false); }}
              onClose={() => setShowQuickInput(false)}
              allCats={allCats}
              customCats={customCats}
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
                showConfidence={showConfidence}
                columnOrder={columnOrder}
                setColumnOrder={setColumnOrder}
                sortBy={sortBy}
                isMobile={isMobile}
                savedPulse={savedPulse}
                deletingId={deletingId}
                searchTerm={search}
                toolbarHeight={toolbarHeight}
              />
              </SortableContext>
            </SectionErrorBoundary>
          )}

          {/* CARD VIEW */}
          {view === "cards" && (
            <SectionErrorBoundary name="Card view">
              <SortableContext items={visible.map(q => q.id)} strategy={rectSortingStrategy}>
              <div style={isMobile ? { display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 } : { columns: "280px auto", columnGap: 12, paddingTop: 8 }}>
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
                    <motion.div key={q.id} style={{ breakInside: "avoid", marginBottom: 12 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.6) }}>
                    <CardItem
                      q={q}
                      col={col}
                      isSel={isSel}
                      isEd={isEd}
                      needsAtt={needsAtt}
                      showConfidence={showConfidence}
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
                      isOverTarget={isOverTarget}
                    />
                    </motion.div>
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
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }} modifiers={[anchorToCursor]}>
            {activeDragId ? (() => {
              const q = quotes.find(x => x.id === activeDragId);
              if (!q) return null;
              const count = selected.has(activeDragId) && selected.size > 1 ? selected.size : 1;
              const preview = q.text.length > 60 ? q.text.slice(0, 60) + "\u2026" : q.text;
              return (
                <div style={{ position: "relative", transform: "scale(1.03) rotate(-1.5deg)", transition: "transform .15s ease" }}>
                  {count > 1 && (
                    <span style={{
                      position: "absolute", top: -8, left: -8, zIndex: 1,
                      background: "#3C5775", color: "#fff",
                      fontSize: 11, fontWeight: 700, lineHeight: 1,
                      padding: "3px 7px", borderRadius: 6,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    }}>{count}</span>
                  )}
                  <div style={{
                    background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)",
                    borderRadius: 6, padding: "8px 14px", fontSize: 13,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                    maxWidth: 320, opacity: 0.95,
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
    </>
  );
}
