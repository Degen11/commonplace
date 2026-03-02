import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import useProcessing from "../hooks/useProcessing";

// Contexts
import { useToastContext } from "../contexts/ToastContext";
import { useQuotesContext } from "../contexts/QuotesContext";

// Data
import {
  VIBE_TAGS, QUOTED_CATS,
  CONF_ORDER, getCatColor,
} from "../data/constants";

// Utils
import {
  smartSplit,
  parseKindleClippings, parseReadwiseCSV, parseCSVLine,
  generateShareImage,
} from "../utils/helpers";

// Components
import Toast from "./Toast";
import DupeModal from "./DupeModal";
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
import { Z } from "./styles";

// Icons
import {
  AlertTriangle, Zap, Bot, XCircle, RefreshCw, Eye, Trash2, X,
} from "lucide-react";

const LS_QUOTES     = "commonplace_quotes";
const LS_CATS       = "commonplace_cats";
const LS_VIEW       = "commonplace_view";
const LS_SORT       = "commonplace_sort";
const LS_FILTERS    = "commonplace_filters";
const LS_DRAFT      = "commonplace_draft";

const _initFilters = (() => {
  try { const s = localStorage.getItem("commonplace_filters"); if (s) return JSON.parse(s); } catch(e) {}
  return {};
})();

const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "confidence", label: "Needs attention first" },
  { key: "alpha",      label: "Alphabetical" },
  { key: "category",   label: "By category" },
];

// ===================== MAIN COMPONENT =====================
export default function Commonplace() {
  // ── Contexts ──
  const { toasts, showToast, dismissToast } = useToastContext();
  const {
    quotes, setQuotes,
    customCats, setCustomCats,
    columnOrder, setColumnOrder,
    allCats,
    isSharedView, setIsSharedView,
    savedSession, setSavedSession,
    syncStatus,
  } = useQuotesContext();

  // ── Phase / UI chrome ──
  const [phase, setPhase]                     = useState("input");
  const [fadeClass, setFadeClass]             = useState("phase-in");
  const [rawInput, setRawInput]               = useState(() => {
    try { return localStorage.getItem(LS_DRAFT) || ""; } catch(e) { return ""; }
  });

  // ── Phase transition ──
  const goPhase = useCallback((next) => {
    setFadeClass("phase-out");
    setTimeout(() => { setPhase(next); setFadeClass("phase-in"); }, 200);
  }, []);

  // ── Processing pipeline ──
  const processing = useProcessing({ quotes, setQuotes, allCats, goPhase });
  const {
    isProcessing, processingDone, progress, identifiedFeed,
    apiError, setApiError, failedEntries,
    stats, setStats,
    pendingDupes, dupeDecisions, setDupeDecisions,
    formattingEnabled, setFormattingEnabled,
    processEntries, handleDupesContinue, retryFailed,
    identifyBatch, resetProcessingState,
  } = processing;

  // ── View / filter / sort state ──
  const [deletingId, setDeletingId]           = useState(null);
  const [view, setView]                       = useState(() => {
    try {
      const saved = localStorage.getItem(LS_VIEW);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.view) {
          if (window.innerWidth < 640 && parsed.view === "table") return "cards";
          return parsed.view;
        }
      }
    } catch(e) {}
    return window.innerWidth < 640 ? "cards" : "table";
  });
  const [compact, setCompact]                 = useState(() => {
    try {
      const saved = localStorage.getItem(LS_VIEW);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.compact === "boolean") return parsed.compact;
      }
    } catch(e) {}
    return false;
  });
  const [catFilter, setCatFilter]             = useState(_initFilters.cat || "All");
  const [favFilter, setFavFilter]             = useState(!!_initFilters.fav);
  const [search, setSearch]                   = useState(_initFilters.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(_initFilters.search || "");
  const [sortBy, setSortBy]                   = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SORT);
      if (saved && SORT_OPTIONS.some(o => o.key === saved)) return saved;
    } catch(e) {}
    return "default";
  });
  const [editingId, setEditingId]             = useState(null);
  const [inlineEdit, setInlineEdit]           = useState(null);
  const [selected, setSelected]               = useState(new Set());
  const [bulkEditCat, setBulkEditCat]         = useState("");
  const [bulkEditSource, setBulkEditSource]   = useState("");
  const [newCatName, setNewCatName]           = useState("");
  const [showNewCat, setShowNewCat]           = useState(false);
  const [showExport, setShowExport]           = useState(false);
  const [showSort, setShowSort]               = useState(false);
  const [showStats, setShowStats]             = useState(false);
  const [showAddMore, setShowAddMore]         = useState(false);
  const [addMoreInput, setAddMoreInput]       = useState("");
  const [addMoreFormatting, setAddMoreFormatting] = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 640);
  const [confirmBulkDel, setConfirmBulkDel]   = useState(false);
  const [reviewQueue, setReviewQueue]         = useState([]);
  const [dragId, setDragId]                   = useState(null);
  const [copiedId, setCopiedId]               = useState(null);
  const [reidentifyingIds, setReidentifyingIds] = useState(new Set());
  const [dragInsert, setDragInsert]           = useState(null);
  const [headerVisible, setHeaderVisible]     = useState(true);
  const [savedPulse, setSavedPulse]           = useState(null);
  const [catFade, setCatFade]                 = useState({ left: false, right: false });
  const [inputTab, setInputTab]               = useState("paste");
  const [isDragOver, setIsDragOver]           = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);

  // ── Refs ──
  const undoRef                = useRef(null);
  const addMoreRef             = useRef(null);
  const exportRef              = useRef(null);
  const miniExportRef          = useRef(null);
  const sortRef                = useRef(null);
  const fileInputRef           = useRef(null);
  const lastSelectedIndex      = useRef(null);
  const toolbarRef             = useRef(null);
  const pendingScrollAdjust    = useRef(null);
  const catScrollRef           = useRef(null);
  const headerRef              = useRef(null);
  const reidentifyAbortRefs    = useRef(new Map()); // FIX: abort controllers for re-identify

  // ── Helper functions ──
  const sanitizeCategoryName = (name) => {
    return name
      .replace(/[<>"'&]/g, '')
      .trim()
      .slice(0, 50);
  };

  const startEditing = (id) => {
    setEditingId(id);
    setInlineEdit(null);
  };

  const startInlineEdit = (id, field) => {
    setInlineEdit({ id, field });
    setEditingId(null);
  };

  // ── Mount: set initial phase if shared link loaded quotes ──
  useEffect(() => {
    if (isSharedView && quotes.length > 0 && phase === "input") {
      setPhase("results");
    }
  }, [isSharedView, quotes.length, phase]);

  // ── Persist view preference ──
  useEffect(() => {
    try { localStorage.setItem(LS_VIEW, JSON.stringify({ view, compact })); } catch(e) {}
  }, [view, compact]);

  // Persist sort preference
  useEffect(() => {
    try { localStorage.setItem(LS_SORT, sortBy); } catch(e) {}
  }, [sortBy]);

  // Persist filter state
  useEffect(() => {
    try { localStorage.setItem(LS_FILTERS, JSON.stringify({ cat: catFilter, fav: favFilter, search })); } catch(e) {}
  }, [catFilter, favFilter, search]);

  // Auto-save raw input draft
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (rawInput.trim()) localStorage.setItem(LS_DRAFT, rawInput);
        else localStorage.removeItem(LS_DRAFT);
      } catch(e) {}
    }, 500);
    return () => clearTimeout(t);
  }, [rawInput]);

  // ── Responsive ──
  useEffect(() => {
    const h = () => {
      const m = window.innerWidth < 640;
      setIsMobile(m);
      if (m && view === "table") setView("cards");
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [view]);

  // ── Search debounce (150ms) — avoids re-filtering on every keystroke ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  // ── Sticky header observer ──
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

  // Lock body scroll when stats overlay is open
  useEffect(() => {
    if (showStats) {
      const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarW}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };
  }, [showStats]);

  // ── Scroll position preservation for mini-header actions ──
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

  // ── Category pill scroll fade ──
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

  // ── Click-outside for dropdowns and edit form ──
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
  }, [editingId]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = e => {
      if (e.target.matches('input, textarea, select')) return;

      if (e.key === 'Escape') {
        if (confirmClear) { setConfirmClear(false); return; }
        if (confirmBulkDel) { setConfirmBulkDel(false); return; }
        if (showExport) { setShowExport(false); return; }
        if (showSort) { setShowSort(false); return; }
        if (selected.size > 0) {
          setSelected(new Set());
          lastSelectedIndex.current = null;
          return;
        }
        if (editingId) {
          setEditingId(null);
          if (reviewQueue.length > 0) { setReviewQueue([]); showToast("Review paused"); }
          return;
        }
        if (search) {
          setSearch('');
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        const visibleQuotes = quotes.filter(q => {
          if (catFilter !== "All" && q.category !== catFilter) return false;
          if (favFilter && !q.favorite) return false;
          if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.source.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        });
        if (visibleQuotes.length > 0) {
          setSelected(new Set(visibleQuotes.map(q => q.id)));
        }
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [search, editingId, quotes, catFilter, favFilter, selected, confirmClear, confirmBulkDel, showExport, showSort, reviewQueue.length, showToast]);

  // Reset shift-click index when filters change
  useEffect(() => {
    lastSelectedIndex.current = null;
  }, [catFilter, favFilter, search, sortBy]);

  // ── Update document title with quote count ──
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

  // ── FIX: Clean up ghost IDs in selection Set when quotes change ──
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

  // ── FIX: Filter reviewQueue when quotes change ──
  useEffect(() => {
    if (reviewQueue.length === 0) return;
    const quoteIds = new Set(quotes.map(q => q.id));
    setReviewQueue(prev => {
      const filtered = prev.filter(id => quoteIds.has(id));
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [quotes, reviewQueue.length]);

  // ── FIX: Abort re-identify controllers on unmount ──
  useEffect(() => {
    const refs = reidentifyAbortRefs.current;
    return () => {
      for (const controller of refs.values()) {
        controller.abort();
      }
      refs.clear();
    };
  }, []);

  // ── File import ──
  const handleFileImport = (file) => {
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
  };

  // ── Re-identify a single entry (FIX: with AbortController) ──
  const describeChanges = (oldQ, newSource, newCategory) => {
    const parts = [];
    if (newSource !== oldQ.source) parts.push(`source \u2192 ${newSource}`);
    if (newCategory !== oldQ.category) parts.push(`${oldQ.category} \u2192 ${newCategory}`);
    if (parts.length === 0) return "Re-identified \u2014 no changes";
    return `Re-identified: ${parts.join(", ")}`;
  };

  const reIdentify = async (q) => {
    // Cancel any existing in-flight request for this quote
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
          ...x, source: local.source, category: local.category, confidence: local.confidence,
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
  };

  // ── Copy single quote to clipboard ──
  const copyQuote = (q) => {
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
  };

  // ── Share single quote as PNG image ──
  const shareAsImage = async (q) => {
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
  };

  const handleProcess  = () => processEntries(rawInput, false, formattingEnabled);
  const handleAddMore  = () => {
    if (!addMoreInput.trim()) return;
    processEntries(addMoreInput, true, addMoreFormatting);
    setAddMoreInput("");
    setShowAddMore(false);
  };

  const handleClear = () => {
    try { window.history.replaceState(null, "", window.location.pathname); } catch(e) {} setIsSharedView(false);
    try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); localStorage.removeItem(LS_FILTERS); localStorage.removeItem(LS_DRAFT); } catch(e) {}
    goPhase("input"); setQuotes([]); setRawInput(""); setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); resetProcessingState();
    setConfirmClear(false); setShowAddMore(false); setSortBy("default"); setShowStats(false);
    setImportedFileName(null); setInputTab("paste"); setCustomCats([]);
  };

  const handleDelete = (id) => {
    const deleted = quotes.find(q => q.id === id);
    const idx = quotes.findIndex(q => q.id === id);
    setDeletingId(id);
    setTimeout(() => {
      setDeletingId(null);
      setQuotes(p => p.filter(q => q.id !== id));
      undoRef.current = { quote: deleted, index: idx };
      showToast("Entry deleted", "Undo", () => {
        if (undoRef.current) {
          const { quote, index } = undoRef.current;
          setQuotes(p => { const n = [...p]; n.splice(Math.min(index, n.length), 0, quote); return n; });
          undoRef.current = null;
        }
      });
    }, 200);
  };

  // ── Inline actions ──
  const toggleSel = (id, shiftKey = false) => {
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
  };
  const selAll = () => {
    if (filtered.length === 0) return;
    const allSelected = filtered.every(q => selected.has(q.id));
    if (allSelected) {
      setSelected(new Set());
      lastSelectedIndex.current = null;
    } else {
      setSelected(new Set(filtered.map(q => q.id)));
      lastSelectedIndex.current = null;
    }
  };
  const saveEdit   = (id, text, source, category) => {
    setQuotes(p => p.map(q => q.id === id ? { ...q, text, source, category, confidence: "high" } : q));
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
  };
  const saveInlineField = (id, field, value) => {
    setQuotes(p => p.map(q => {
      if (q.id !== id) return q;
      const newVal = field === "source" ? (value.trim() || q.source) : value;
      return { ...q, [field]: newVal, confidence: "high" };
    }));
    setInlineEdit(null);
    setSavedPulse({ id, field });
    setTimeout(() => setSavedPulse(prev => prev?.id === id && prev?.field === field ? null : prev), 600);
  };
  const applyBulk  = () => {
    const affectedIds = new Set(selected);
    const snapshot = quotes.filter(q => affectedIds.has(q.id)).map(q => ({ ...q }));
    setQuotes(p => p.map(q => {
      if (!selected.has(q.id)) return q;
      const u = { ...q };
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
  };
  const bulkDel = () => {
    setConfirmBulkDel(false);
    const deletedQuotes = quotes.filter(q => selected.has(q.id));
    const deletedIds = new Set(selected);
    setQuotes(p => p.filter(q => !deletedIds.has(q.id)));
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
  };
  const startReviewFlow = () => {
    setSortBy("confidence");
    setCatFilter("All");
    setFavFilter(false);
    setSearch("");
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
  };

  const addCat  = () => {
    const sanitized = sanitizeCategoryName(newCatName);
    if (!sanitized || allCats.some(c => c.toLowerCase() === sanitized.toLowerCase())) {
      showToast("Invalid or duplicate category name");
      return;
    }
    setCustomCats(p => [...p, sanitized]);
    setNewCatName("");
    setShowNewCat(false);
  };
  const remCat  = c => { setCustomCats(p => p.filter(x => x !== c)); setQuotes(p => p.map(q => q.category === c ? { ...q, category: "Unknown" } : q)); if (catFilter === c) setCatFilter("All"); };

  // ── Row drag reorder (throttled — only re-renders when target or half changes) ──
  const lastDragTarget = useRef(null);
  const lastDragHalf = useRef(null);
  const handleDragStart = (id) => { setDragId(id); lastDragTarget.current = null; lastDragHalf.current = null; };
  const handleDragOver  = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragInsert(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const half = (e.clientY - rect.top) < rect.height / 2 ? "above" : "below";
    if (lastDragTarget.current === targetId && lastDragHalf.current === half) return;
    lastDragHalf.current = half;
    setDragInsert({ id: targetId, pos: half });
    if (lastDragTarget.current === targetId) return;
    lastDragTarget.current = targetId;
    setQuotes(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(q => q.id === dragId);
      const toIdx   = arr.findIndex(q => q.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };
  const handleDragEnd = () => { setDragId(null); setDragInsert(null); lastDragTarget.current = null; lastDragHalf.current = null; };

  // ── Filtering & sorting ──
  const filtered = useMemo(() => {
    const result = quotes.filter(q => {
      if (catFilter !== "All" && q.category !== catFilter) return false;
      if (favFilter && !q.favorite) return false;
      if (debouncedSearch && !q.text.toLowerCase().includes(debouncedSearch.toLowerCase()) && !q.source.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      return true;
    });
    if (sortBy === "confidence") result.sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0));
    else if (sortBy === "alpha")    result.sort((a, b) => a.text.localeCompare(b.text));
    else if (sortBy === "category") result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [quotes, catFilter, favFilter, debouncedSearch, sortBy]);
  const paginationKey = `${catFilter}-${favFilter}-${debouncedSearch}-${sortBy}-${quotes.length}`;
  const { visible, hasMore, remaining, loadMore } = useInfiniteScroll(filtered, paginationKey);

  const { cc, favCount, unknownCount, topCats } = useMemo(() => {
    const cc = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
    return {
      cc,
      favCount: quotes.filter(q => q.favorite).length,
      unknownCount: quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length,
      topCats: Object.entries(cc).filter(([c]) => c !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 4),
    };
  }, [quotes]);
  const showBulkBar  = selected.size > 0;
  const hasActiveFilters = catFilter !== "All" || favFilter || search;

  const computedStats = useMemo(() => {
    if (quotes.length === 0) return null;
    const srcCount = {}; quotes.forEach(q => { srcCount[q.source] = (srcCount[q.source] || 0) + 1; });
    const topSrcs  = Object.entries(srcCount).filter(([s]) => s !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sorted   = [...quotes].sort((a, b) => a.text.length - b.text.length);
    const avgWords = Math.round(quotes.reduce((s, q) => s + q.text.split(" ").length, 0) / quotes.length);
    return { topSrcs, shortest: sorted[0], longest: sorted[sorted.length - 1], avgWords };
  }, [quotes]);

  const actionProps = {
    onFav:         id => setQuotes(p => p.map(x => x.id === id ? { ...x, favorite: !x.favorite } : x)),
    onDelete:      handleDelete,
    onCopy:        copyQuote,
    onReidentify:  reIdentify,
    onShareImage:  shareAsImage,
    copiedId,
    reidentifying: reidentifyingIds,
  };

  const exportDropdownContent = (
    <ExportDropdown
      quotes={quotes}
      filtered={filtered}
      selected={selected}
      hasActiveFilters={hasActiveFilters}
      showToast={showToast}
      setShowExport={setShowExport}
    />
  );

  // ========================== RENDER ==========================
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
            savedSession={savedSession}
            isProcessing={isProcessing}
            onProcess={handleProcess}
            onFileImport={handleFileImport}
            onRestoreSession={() => {
              setQuotes(savedSession.quotes || []);
              setCustomCats(savedSession.customCats || []);
              setSavedSession(null);
              goPhase("results");
            }}
            onDismissSession={() => {
              try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); localStorage.removeItem(LS_FILTERS); } catch(e) {}
              setSavedSession(null);
            }}
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
        <div style={Z.wrap} className={fadeClass}>

          {toasts.length > 0 && <Toast key={toasts[0].id} message={toasts[0].message} action={toasts[0].action} onAction={() => { if (toasts[0].onAction) toasts[0].onAction(); dismissToast(); }} onDismiss={dismissToast} />}

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
            <div style={Z.shareBanner}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} strokeWidth={1.5} /> You're viewing a shared collection ({quotes.length} entries)</span>
              <button style={Z.shareBannerBtn} onClick={() => { setIsSharedView(false); try { window.history.replaceState(null, "", window.location.pathname); } catch(e) {} }}>Make it yours</button>
            </div>
          )}

          <SectionErrorBoundary name="Header">
            <HeaderBar
              quotes={quotes}
              filtered={filtered}
              topCats={topCats}
              customCats={customCats}
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
              getCatColor={getCatColor}
              syncStatus={syncStatus}
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
              syncStatus={syncStatus}
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
            <div style={Z.errorBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} strokeWidth={2} /> {apiError}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {failedEntries.length > 0 && <button style={Z.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
                <button className="dismiss-link" style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={() => setApiError(null)}>Dismiss</button>
              </div>
            </div>
          )}

          {stats && (
            <div style={Z.statsBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} strokeWidth={2} /> <strong>{stats.local}</strong> matched locally</span><span style={Z.statDot} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bot size={13} strokeWidth={2} /> <strong>{stats.api}</strong> identified by AI</span>
              {stats.failed > 0 && <><span style={Z.statDot} /><span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={13} strokeWidth={2} /> <strong>{stats.failed}</strong> failed</span></>}
              {stats.dupes > 0 && <><span style={Z.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} strokeWidth={2} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
              <button style={Z.statsDismiss} onClick={() => setStats(null)}><X size={14} strokeWidth={2} /></button>
            </div>
          )}

          {showAddMore && (
            headerVisible ? (
              <div style={Z.addMorePanel}>
                <AddMorePanel
                  addMoreInput={addMoreInput} setAddMoreInput={setAddMoreInput}
                  addMoreFormatting={addMoreFormatting} setAddMoreFormatting={setAddMoreFormatting}
                  addMoreRef={addMoreRef}
                  onAddMore={handleAddMore}
                  onCancel={() => { setShowAddMore(false); setAddMoreInput(""); }}
                />
              </div>
            ) : (
              <div style={{
                position: "fixed", top: 49, left: 0, right: 0,
                zIndex: 59, background: "rgba(250,248,244,0.98)",
                padding: "12px 32px", borderBottom: "1px solid #E3E2DE",
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
            />
          </SectionErrorBoundary>

          {unknownCount > 0 && (reviewQueue.length > 0 ? (
            <div style={Z.attentionBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Z.attentionCount}>{reviewQueue.length}</span>
                <span>{reviewQueue.length === 1 ? "entry" : "entries"} remaining in review</span>
              </div>
              <button style={{ ...Z.attentionBtn, background: "#92400E" }} onClick={() => { setReviewQueue([]); setEditingId(null); }}>Exit review</button>
            </div>
          ) : sortBy !== "confidence" && (
            <div style={Z.attentionBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Z.attentionCount}>{unknownCount}</span>
                <span>{unknownCount === 1 ? "entry needs" : "entries need"} your attention — source or category is missing</span>
              </div>
              <button className="ui-tip" data-tip="Step through entries that need attention" style={Z.attentionBtn} onClick={startReviewFlow}>Review now &rarr;</button>
            </div>
          ))}

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
              />
              </div>
            </SectionErrorBoundary>
          )}

          {/* CARD VIEW */}
          {view === "cards" && (
            <SectionErrorBoundary name="Card view">
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
                {visible.map((q, idx) => {
                  const col = getCatColor(q.category, customCats);
                  const isSel = selected.has(q.id);
                  const isEd  = editingId === q.id;
                  const needsAtt = q.confidence === "low" || q.category === "Unknown";
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
                      inlineEdit={inlineEdit}
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
                      savedPulse={savedPulse}
                      index={idx}
                      deletingId={deletingId}
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
      border: "1px solid #E3E2DE",
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "inherit",
      animation: "fadeUp .3s ease",
    }}
  >
    Load more ({remaining} remaining)
  </button>
)}
          {filtered.length === 0 && (
            <EmptyState
              catFilter={catFilter} setCatFilter={setCatFilter}
              favFilter={favFilter} setFavFilter={setFavFilter}
              search={search} setSearch={setSearch}
              setSortBy={setSortBy}
              customCats={customCats}
            />
          )}

          {showBulkBar && <div style={{ height: 64 }} />}

          <Footer styles={Z} />
        </div>
      )}
    </>
  );
}
