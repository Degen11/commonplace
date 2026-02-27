import { useState, useRef, useCallback, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import useToasts from "../hooks/useToasts";

// Data
import { localLookup } from "../data/localQuotes";
import {
  DEFAULT_CATEGORIES, SOURCE_CATEGORIES, VIBE_TAGS, QUOTED_CATS,
  CONF_ORDER, getCatColor, REORDERABLE_COLS
} from "../data/constants";

// Utils
import {
  normalize, similarity, smartParse, smartSplit, basicFormat,
  exportCSV, exportMD, exportJSON, exportTXT,
  copyToClipboard, richCopyToClipboard, encodeShareData, decodeShareData,
  parseKindleClippings, parseReadwiseCSV, parseCSVLine,
} from "../utils/helpers";

// Components
import Toast from "./Toast";
import DupeModal from "./DupeModal";
import StatsPanel from "./StatsPanel";
import InputPhase from "./InputPhase";
import ProcessingPhase from "./ProcessingPhase";
import TableView from "./TableView";
import CardItem from "./CardItem";
import Footer from "./Footer";
import { baseCSS, Z } from "./styles";
import { Zap, Bot, XCircle, RefreshCw, AlertTriangle, X, Eye, Search, ClipboardList, Sparkles, Link, FileText, BarChart3, FileEdit, Pencil, Info } from "lucide-react";

const LS_QUOTES     = "commonplace_quotes";
const LS_CATS       = "commonplace_cats";
const LS_COL_ORDER  = "commonplace_col_order";
const LS_VIEW       = "commonplace_view";

const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "confidence", label: "Needs attention first" },
  { key: "alpha",      label: "Alphabetical" },
  { key: "category",   label: "By category" },
];

// ===================== MAIN COMPONENT =====================
export default function Commonplace() {
  const [phase, setPhase]                     = useState("input");
  const [fadeClass, setFadeClass]             = useState("phase-in");
  const [rawInput, setRawInput]               = useState("");
  const [quotes, setQuotes]                   = useState([]);
  const [customCats, setCustomCats]           = useState([]);
  const [progress, setProgress]               = useState(null);
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
  const [catFilter, setCatFilter]             = useState("All");
  const [favFilter, setFavFilter]             = useState(false);
  const [search, setSearch]                   = useState("");
  const [sortBy, setSortBy]                   = useState("default");
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
  const [stats, setStats]                     = useState(null);
  const [apiError, setApiError]               = useState(null);
  const [showAddMore, setShowAddMore]         = useState(false);
  const [addMoreInput, setAddMoreInput]       = useState("");
  const [addMoreFormatting, setAddMoreFormatting] = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 640);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [confirmBulkDel, setConfirmBulkDel]   = useState(false);
  const [reviewQueue, setReviewQueue]         = useState([]);
  const [dragId, setDragId]                   = useState(null);
  const [failedEntries, setFailedEntries]     = useState([]);
  const [isSharedView, setIsSharedView]       = useState(false);
  const [formattingEnabled, setFormattingEnabled] = useState(false);
  const [identifiedFeed, setIdentifiedFeed]   = useState([]);
  const [savedSession, setSavedSession]       = useState(null);
  const [inputTab, setInputTab]               = useState("paste");
  const [isDragOver, setIsDragOver]           = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const [pendingDupes, setPendingDupes]       = useState([]);
  const [dupeDecisions, setDupeDecisions]     = useState({});

  // Column order state — persisted to localStorage
  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === REORDERABLE_COLS.length &&
            REORDERABLE_COLS.every(c => parsed.includes(c))) return parsed;
      }
    } catch(e) {}
    return [...REORDERABLE_COLS];
  });

  const { toasts, showToast, dismissToast } = useToasts();

  const undoRef                = useRef(null);
  const addMoreRef             = useRef(null);
  const exportRef              = useRef(null);
  const sortRef                = useRef(null);
  const pendingContinuationRef = useRef(null);
  const fileInputRef           = useRef(null);
  const lastSelectedIndex      = useRef(null);

  const allCats = [...DEFAULT_CATEGORIES, ...customCats];

  // Helper functions
  const sanitizeCategoryName = (name) => {
    return name
      .replace(/[<>\"'&]/g, '')
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

  // ── Phase transition ──
  const goPhase = useCallback((next) => {
    setFadeClass("phase-out");
    setTimeout(() => { setPhase(next); setFadeClass("phase-in"); }, 200);
  }, []);

  // ── LocalStorage persistence ──
  useEffect(() => {
    if (quotes.length > 0 && !isSharedView) {
      try {
        localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
        localStorage.setItem(LS_CATS, JSON.stringify(customCats));
      } catch(e) {}
    }
  }, [quotes, customCats, isSharedView]);

  // Persist column order
  useEffect(() => {
    try { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)); } catch(e) {}
  }, [columnOrder]);

  // Persist view preference (change #6)
  useEffect(() => {
    try { localStorage.setItem(LS_VIEW, JSON.stringify({ view, compact })); } catch(e) {}
  }, [view, compact]);

  // ── Mount: shared link OR restore session ──
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = decodeShareData(hash.slice(2));
      if (decoded?.length > 0) {
        setQuotes(decoded); setPhase("results"); setIsSharedView(true);
        return;
      }
    }
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (q?.length > 0) {
          const cats = JSON.parse(localStorage.getItem(LS_CATS) || "[]");
          setSavedSession({ quotes: q, customCats: cats });
        }
      }
    } catch(e) {}
  }, []);

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

  // ── Click-outside for dropdowns and edit form ──
  useEffect(() => {
    const h = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
      
      // Close edit form if clicking outside the table/cards area
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

  // ── Keyboard shortcuts (changes #2, #3) ──
  useEffect(() => {
    const h = e => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.matches('input, textarea, select')) return;
      
      // Escape: prioritized dismissal chain (change #3, #2)
      if (e.key === 'Escape') {
        // Priority 1: Clear selection if any entries are selected
        if (selected.size > 0) {
          setSelected(new Set());
          lastSelectedIndex.current = null;
          return;
        }
        // Priority 2: Close edit form if open and no field is focused (change #2)
        if (editingId) {
          setEditingId(null);
          if (reviewQueue.length > 0) { setReviewQueue([]); showToast("Review paused"); }
          return;
        }
        // Priority 3: Clear search
        if (search) {
          setSearch('');
          return;
        }
      }
      
      // Cmd/Ctrl + A: Select all visible quotes
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        // Compute filtered inline to avoid dependency issues
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
  }, [search, editingId, quotes, catFilter, favFilter, selected]);

  // Reset shift-click index when filters change
  useEffect(() => {
    lastSelectedIndex.current = null;
  }, [catFilter, favFilter, search, sortBy]);

  // ── Update document title with quote count ──
  useEffect(() => {
    const baseTitle = "Commonplace";
    if (phase === "processing" && progress) {
      document.title = `(${progress.done}/${progress.total}) Organizing... — ${baseTitle}`;
    } else if (quotes.length > 0) {
      document.title = `(${quotes.length}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [quotes, phase, progress]);

  // ── File import ──
  const handleFileImport = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "csv"].includes(ext)) { showToast("Only .txt and .csv files are supported"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;
      let formatLabel = null;

      if (ext === "txt" && content.includes("==========")) {
        // Kindle My Clippings.txt
        const entries = parseKindleClippings(content);
        if (entries.length > 0) {
          content = entries.map(en => en.hint ? `${en.text} \u2014 ${en.hint}` : en.text).join("\n");
          formatLabel = "Kindle highlights";
        }
      } else if (ext === "csv") {
        const headerLine = content.split("\n")[0]?.toLowerCase() || "";
        if (headerLine.includes("highlight")) {
          // Readwise export
          const entries = parseReadwiseCSV(content);
          if (entries.length > 0) {
            content = entries.map(en => en.hint ? `${en.text} \u2014 ${en.hint}` : en.text).join("\n");
            formatLabel = "Readwise";
          }
        } else {
          // Generic CSV
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
      showToast(formatLabel
        ? `Loaded ${count} entries from ${file.name} (${formatLabel})`
        : `Loaded ${count} entries from ${file.name}`);
    };
    reader.readAsText(file);
  };

  // ── API: batch identification ──
  const identifyBatch = useCallback(async (items, withFormatting = false) => {
    if (items.length === 0) return [];
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");
    const r = await fetch("/api/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "CommonplaceApp",
      },
      body: JSON.stringify({
        formatting: withFormatting,
        messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
      }),
    });
    if (!r.ok) throw new Error(`API returned ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "API error");
    const t = d.content.map(x => x.text || "").join("");
    const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  }, []);

  // ── Re-identify a single entry ──
  const describeChanges = (oldQ, newSource, newCategory) => {
    const parts = [];
    if (newSource !== oldQ.source) parts.push(`source → ${newSource}`);
    if (newCategory !== oldQ.category) parts.push(`${oldQ.category} → ${newCategory}`);
    if (parts.length === 0) return "Re-identified — no changes";
    return `Re-identified: ${parts.join(", ")}`;
  };

  const reIdentify = async (q) => {
    const local = localLookup(q.text, null, { exactOnly: true });
    if (local) {
      const snapshot = { ...q };
      setQuotes(prev => prev.map(x => x.id === q.id ? {
        ...x, source: local.source, category: local.category, confidence: local.confidence,
      } : x));
      showToast(describeChanges(q, local.source, local.category), "Undo", () => {
        setQuotes(prev => prev.map(x => x.id === q.id ? snapshot : x));
      });
      return;
    }
    const item = { text: q.text, hint: null };
    try {
      const results = await identifyBatch([item]);
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
    } catch {
      showToast("Couldn't reach AI. Try again.");
    }
  };

  // ── Copy single quote to clipboard ──
  const copyQuote = (q) => {
    const text = QUOTED_CATS.has(q.category)
      ? `"${q.text}" — ${q.source}`
      : `${q.text} — ${q.source}`;
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied!"))
      .catch(() => showToast("Couldn't copy — try manually selecting the text."));
  };

  // ── Processing pipeline ──
  const runProcessing = async (unique, appendMode, useFormatting = false) => {
    const localMatches = []; const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    if (localMatches.length > 0) {
      setIdentifiedFeed(localMatches.map(m => ({
        text: useFormatting ? basicFormat(m.text) : m.text,
        source: m.result.source, category: m.result.category,
      })));
    }

    setProgress({ total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need AI...`, phase: "local" });

    const apiResults = new Map(); let apiFailed = false; const failed = []; const BATCH_SIZE = 20;
    if (needsApi.length > 0) {
      for (let i = 0; i < needsApi.length; i += BATCH_SIZE) {
        const chunk = needsApi.slice(i, i + BATCH_SIZE);
        setProgress({ total: unique.length, done: localMatches.length + i, current: `AI identifying batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsApi.length / BATCH_SIZE)}...`, phase: "api" });
        try {
          const results = await identifyBatch(chunk, useFormatting);
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
          setIdentifiedFeed(prev => [...prev, ...results.map(r => {
            const item = chunk[r.i];
            return { text: (useFormatting && r.cleanText) ? r.cleanText : (item?.text || ""), source: r.source || "Unknown", category: r.category || "Unknown" };
          })]);
        } catch {
          apiFailed = true; chunk.forEach(c => failed.push(c));
          setApiError(`AI identification failed for ${needsApi.length - i} entries. You can edit them manually or retry.`);
          break;
        }
      }
    }
    if (failed.length > 0) setFailedEntries(failed);

    const newQuotes = unique.map((p, i) => {
      const local = localMatches.find(m => m.idx === i);
      if (local) {
        const text = useFormatting ? basicFormat(p.text) : p.text;
        return { id: crypto.randomUUID(), text, source: local.result.source, category: local.result.category, confidence: local.result.confidence, favorite: false };
      }
      const api = apiResults.get(i);
      if (api) {
        const text = (useFormatting && api.cleanText) ? api.cleanText : p.text;
        const validCats = new Set([...allCats, ...VIBE_TAGS]);
        return { id: crypto.randomUUID(), text, source: api.source || p.hint || "Unknown", category: validCats.has(api.category) ? api.category : "Unknown", confidence: api.confidence || "low", favorite: false };
      }
      const text = useFormatting ? basicFormat(p.text) : p.text;
      return { id: crypto.randomUUID(), text, source: p.hint || "Unknown", category: "Unknown", confidence: "low", favorite: false };
    });

    appendMode ? setQuotes(prev => [...prev, ...newQuotes]) : setQuotes(newQuotes);
    setStats(prev => ({ ...(prev || {}), local: localMatches.length, api: apiResults.size, failed: apiFailed ? needsApi.length - apiResults.size : 0, total: unique.length }));
    setProgress(null); setIsProcessing(false); goPhase("results");
  };

  const processEntries = async (inputText, appendMode = false, useFormatting = false) => {
    const lines = smartSplit(inputText.trim());
    if (!lines.length) return;

    const parsed = lines.map(l => smartParse(l));
    const existingTexts = appendMode ? quotes.map(q => normalize(q.text)) : [];
    
    const unique = []; 
    const seen = new Map(existingTexts.map(t => {
      const q = quotes.find(q => normalize(q.text) === t);
      return [t, q];
    }));
    const nearDupes = [];

    parsed.forEach(p => {
      const norm = normalize(p.text);
      const matchedNorm = [...seen.keys()].find(s => similarity(s, norm) > 0.55);
      
      if (matchedNorm) {
        const matchedQuote = seen.get(matchedNorm);
        nearDupes.push({ 
          incoming: p, 
          matchedText: matchedQuote?.text || matchedNorm, 
          matchedSource: matchedQuote?.source || null 
        });
      } else {
        unique.push(p); 
        seen.set(norm, { text: p.text, source: p.hint });
      }
    });

    if (nearDupes.length > 0) {
      setPendingDupes(nearDupes);
      setDupeDecisions(Object.fromEntries(nearDupes.map((_, i) => [i, "skip"])));
      pendingContinuationRef.current = { unique, seen, appendMode, totalParsed: parsed.length, useFormatting };
      return;
    }

    setIsProcessing(true); setFailedEntries([]); setIdentifiedFeed([]); goPhase("processing"); setApiError(null);
    setStats({ dupes: 0, total: unique.length });
    await runProcessing(unique, appendMode, useFormatting);
  };

const handleDupesContinue = async () => {
  const { unique, appendMode, useFormatting } = pendingContinuationRef.current;
  let keptCount = 0;
  
  pendingDupes.forEach((dupe, i) => {
    const decision = dupeDecisions[i];
    const norm = normalize(dupe.incoming.text);
    
    if (decision === "keep") {
      // Just add it - user explicitly wants to keep it
      unique.push(dupe.incoming);
      keptCount++;
    } else if (decision === "merge") {
      // Merge sources: keep new text but combine sources
      const mergedSource = dupe.matchedSource && dupe.incoming.hint
        ? `${dupe.incoming.hint} / ${dupe.matchedSource}`
        : dupe.incoming.hint || dupe.matchedSource || "Unknown";
      
      unique.push({ ...dupe.incoming, hint: mergedSource });
      keptCount++;
    }
    // "skip" does nothing
  });
  
  const dupes = pendingDupes.length - keptCount;
  setPendingDupes([]); 
  setDupeDecisions({});
  pendingContinuationRef.current = null;
  
  setIsProcessing(true); 
  setFailedEntries([]); 
  setIdentifiedFeed([]); 
  goPhase("processing"); 
  setApiError(null);
  setStats({ dupes, total: unique.length });
  await runProcessing(unique, appendMode, useFormatting);
};

  const retryFailed = async () => {
    if (!failedEntries.length) return;
    setApiError(null);
    
    const entriesToRetry = [...failedEntries];
    const text = entriesToRetry.map(e => `${e.text}${e.hint ? ` — ${e.hint}` : ""}`).join("\n");
    
    try {
      await processEntries(text, true, formattingEnabled);
      setFailedEntries([]);
    } catch (error) {
      setApiError(`Retry failed. You can try again or edit manually.`);
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
    window.history.replaceState(null, "", window.location.pathname); setIsSharedView(false);
    try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch(e) {}
    goPhase("input"); setQuotes([]); setRawInput(""); setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); setStats(null); setApiError(null);
    setConfirmClear(false); setShowAddMore(false); setSortBy("default"); setFailedEntries([]);
    setShowStats(false); setImportedFileName(null); setInputTab("paste"); setCustomCats([]);
    setPendingDupes([]); setDupeDecisions({}); pendingContinuationRef.current = null;
  };

  const handleDelete = (id) => {
    const deleted = quotes.find(q => q.id === id);
    const idx = quotes.findIndex(q => q.id === id);
    setQuotes(p => p.filter(q => q.id !== id));
    undoRef.current = { quote: deleted, index: idx };
    showToast("Entry deleted", "Undo", () => {
      if (undoRef.current) {
        const { quote, index } = undoRef.current;
        setQuotes(p => { const n = [...p]; n.splice(Math.min(index, n.length), 0, quote); return n; });
        undoRef.current = null;
      }
    });
  };

  const handleShare = () => {
    const encoded = encodeShareData(quotes);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    if (encoded.length > 6000) showToast(`⚠ Link may be too long for some browsers (${quotes.length} entries). Consider exporting instead.`);
    navigator.clipboard.writeText(url).then(() => {
      if (encoded.length <= 6000) showToast("Shareable link copied to clipboard!");
    }).catch(() => {
      showToast("Couldn't copy — try manually copying from the address bar.");
      window.location.hash = `s=${encoded}`;
    });
  };

  // ── Inline actions ──
  const toggleSel = (id, shiftKey = false) => {
    if (shiftKey && lastSelectedIndex.current !== null) {
      // Shift-click: select range
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
      // Normal click: toggle single
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
      // Deselect all
      setSelected(new Set());
      lastSelectedIndex.current = null;
    } else {
      // Select all visible
      setSelected(new Set(filtered.map(q => q.id)));
      lastSelectedIndex.current = null;
    }
  };
  const saveEdit   = (id, text, source, category) => {
    setQuotes(p => p.map(q => q.id === id ? { ...q, text, source, category, confidence: "high" } : q));
    setEditingId(null);
    // Advance review queue if active
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
        showToast("Review complete — all entries updated!");
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
  };
  // Change #1: Undo for bulk edit — snapshot affected quotes before mutation
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

  // ── Row drag reorder ──
  const lastDragTarget = useRef(null);
  const handleDragStart = (id) => { setDragId(id); lastDragTarget.current = null; };
  const handleDragOver  = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
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
  const handleDragEnd = () => { setDragId(null); lastDragTarget.current = null; };

  // ── Filtering & sorting ──
  let filtered = quotes.filter(q => {
    if (catFilter !== "All" && q.category !== catFilter) return false;
    if (favFilter && !q.favorite) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  if (sortBy === "confidence") filtered = [...filtered].sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0));
  else if (sortBy === "alpha")    filtered = [...filtered].sort((a, b) => a.text.localeCompare(b.text));
  else if (sortBy === "category") filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));
  const paginationKey = `${catFilter}-${favFilter}-${search}-${sortBy}-${quotes.length}`;
  const { visible, hasMore, remaining, loadMore } = useInfiniteScroll(filtered, paginationKey);

  const cc           = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
  const favCount     = quotes.filter(q => q.favorite).length;
  const showBulkBar  = selected.size > 0;
  const unknownCount = quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length;
  const topCats      = Object.entries(cc).filter(([c]) => c !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hasActiveFilters = catFilter !== "All" || favFilter || search;

  const computedStats = quotes.length > 0 ? (() => {
    const srcCount = {}; quotes.forEach(q => { srcCount[q.source] = (srcCount[q.source] || 0) + 1; });
    const topSrcs  = Object.entries(srcCount).filter(([s]) => s !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sorted   = [...quotes].sort((a, b) => a.text.length - b.text.length);
    const avgWords = Math.round(quotes.reduce((s, q) => s + q.text.split(" ").length, 0) / quotes.length);
    return { topSrcs, shortest: sorted[0], longest: sorted[sorted.length - 1], avgWords };
  })() : null;

  const actionProps = {
    onFav:        id => setQuotes(p => p.map(x => x.id === id ? { ...x, favorite: !x.favorite } : x)),
    onDelete:     handleDelete,
    onCopy:       copyQuote,
    onReidentify: reIdentify,
  };

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
          onDismissSession={() => setSavedSession(null)}
          fileInputRef={fileInputRef}
        />
      )}

      {/* ── Processing phase ── */}
      {phase === "processing" && (
        <ProcessingPhase
          fadeClass={fadeClass}
          progress={progress}
          identifiedFeed={identifiedFeed}
          customCats={customCats}
          onCancel={() => { setIsProcessing(false); setProgress(null); goPhase("input"); }}
        />
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>

          {toasts.length > 0 && <Toast key={toasts[0].id} message={toasts[0].message} action={toasts[0].action} onAction={() => { if (toasts[0].onAction) toasts[0].onAction(); dismissToast(); }} onDismiss={dismissToast} />}

          {confirmClear && (
            <div style={Z.modalOverlay} onClick={() => setConfirmClear(false)}>
              <div style={Z.confirmBox} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Start fresh?</p>
                <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 16 }}>This will clear all {quotes.length} entries and remove them from your saved session.</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={Z.confirmCancel} onClick={() => setConfirmClear(false)}>Cancel</button>
                  <button style={Z.confirmYes} onClick={handleClear}>Clear everything</button>
                </div>
              </div>
            </div>
          )}

          {confirmBulkDel && (
            <div style={Z.modalOverlay} onClick={() => setConfirmBulkDel(false)}>
              <div style={Z.confirmBox} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Delete {selected.size} entries?</p>
                <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 16 }}>This will remove {selected.size} selected entries. You'll be able to undo immediately after.</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={Z.confirmCancel} onClick={() => setConfirmBulkDel(false)}>Cancel</button>
                  <button style={Z.confirmYes} onClick={bulkDel}>Delete {selected.size} entries</button>
                </div>
              </div>
            </div>
          )}

          {isSharedView && (
            <div style={Z.shareBanner}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={15} /> You're viewing a shared collection ({quotes.length} entries)</span>
              <button style={Z.shareBannerBtn} onClick={() => { setIsSharedView(false); window.history.replaceState(null, "", window.location.pathname); }}>Make it yours</button>
            </div>
          )}

          <div style={Z.header}>
            <div>
              <h1 style={Z.title}>Commonplace</h1>
              <p style={Z.sub}>
                {filtered.length < quotes.length
                  ? <>{filtered.length} of {quotes.length} {quotes.length === 1 ? "entry" : "entries"}</>
                  : <>{quotes.length} {quotes.length === 1 ? "entry" : "entries"} organized</>
                }
                {filtered.length === quotes.length && topCats.length > 0 && <span style={{ color: "#D3D3D0" }}> · </span>}
                {filtered.length === quotes.length && topCats.map(([c, n], i) => <span key={c} style={{ color: getCatColor(c, customCats).text }}>{i > 0 && <span style={{ color: "#D3D3D0" }}>, </span>}{n} {c}</span>)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {!isMobile && (
                <div style={Z.viewTog}>
                  <button style={{ ...Z.viewBtn, ...(view === "table" && !compact ? Z.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }} title="Table">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".8"/><rect x="1" y="6.5" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".5"/><rect x="1" y="11" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".3"/></svg>
                  </button>
                  <button style={{ ...Z.viewBtn, ...(view === "table" && compact ? Z.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }} title="Compact">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="1.5" rx=".5" fill="currentColor" opacity=".8"/><rect x="1" y="5.5" width="14" height="1.5" rx=".5" fill="currentColor" opacity=".6"/><rect x="1" y="9" width="14" height="1.5" rx=".5" fill="currentColor" opacity=".4"/><rect x="1" y="12.5" width="14" height="1.5" rx=".5" fill="currentColor" opacity=".3"/></svg>
                  </button>
                  <button style={{ ...Z.viewBtn, ...(view === "cards" ? Z.viewOn : {}) }} onClick={() => setView("cards")} title="Cards">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>
                  </button>
                </div>
              )}
              <button style={{ ...Z.statsBtn, ...(showStats ? Z.statsBtnActive : {}) }} onClick={() => setShowStats(s => !s)} title="View statistics about your collection">
                {showStats ? "Hide stats" : "Stats"}
              </button>
              <div ref={exportRef} style={{ position: "relative" }}>
                <button style={Z.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
                {showExport && (
                  <div style={Z.expDrop}>
                      <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#9B9A97", borderBottom: "1px solid #F1F1EF", marginBottom: 2 }}>
                      Exporting all {quotes.length} {quotes.length === 1 ? "entry" : "entries"}
                    </div>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}><ClipboardList size={13} /> Copy to clipboard</button>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { richCopyToClipboard(quotes).then(() => showToast("Rich text copied — paste into Notion, Notes, etc.")); setShowExport(false); }}><Sparkles size={13} /> Rich copy</button>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { handleShare(); setShowExport(false); }}><Link size={13} /> Shareable link</button>
                    {quotes.length > 80 && <span style={Z.expOptNote}><AlertTriangle size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />Links may break above ~80 entries — export a file instead</span>}
                    <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportTXT(quotes); showToast("Exported as TXT"); setShowExport(false); }}><FileText size={13} /> Plain text</button>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportCSV(quotes); showToast("Exported as CSV"); setShowExport(false); }}><BarChart3 size={13} /> CSV</button>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportMD(quotes); showToast("Exported as Markdown"); setShowExport(false); }}><FileEdit size={13} /> Markdown</button>
                    <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportJSON(quotes); showToast("Exported as JSON"); setShowExport(false); }}>{"{ }"} JSON</button>
                    {hasActiveFilters && (<>
                      <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
                      <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#2383E2", borderBottom: "1px solid #F1F1EF", marginBottom: 2 }}>
                        Export filtered only ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
                      </div>
                      <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { copyToClipboard(filtered).then(() => showToast(`Copied ${filtered.length} filtered entries`)); setShowExport(false); }}><ClipboardList size={13} /> Copy filtered</button>
                      <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportTXT(filtered); showToast(`Exported ${filtered.length} as TXT`); setShowExport(false); }}><FileText size={13} /> Filtered TXT</button>
                      <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportCSV(filtered); showToast(`Exported ${filtered.length} as CSV`); setShowExport(false); }}><BarChart3 size={13} /> Filtered CSV</button>
                      <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportMD(filtered); showToast(`Exported ${filtered.length} as Markdown`); setShowExport(false); }}><FileEdit size={13} /> Filtered MD</button>
                      <button className="dd-opt" style={{ ...Z.expOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => { exportJSON(filtered); showToast(`Exported ${filtered.length} as JSON`); setShowExport(false); }}>{"{ }"} Filtered JSON</button>
                    </>)}
                  </div>
                )}
              </div>
              <button style={Z.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }} title="Add more quotes to your existing collection">＋ Add more</button>
              <button style={Z.startOverBtn} onClick={() => setConfirmClear(true)}>New batch</button>
            </div>
          </div>

          {showStats && <StatsPanel quotes={quotes} computedStats={computedStats} cc={cc} customCats={customCats} onClose={() => setShowStats(false)} />}

          {apiError && (
            <div style={Z.errorBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {apiError}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {failedEntries.length > 0 && <button style={Z.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
                <button style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={() => setApiError(null)}>Dismiss</button>
              </div>
            </div>
          )}

          {stats && (
            <div style={Z.statsBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Zap size={13} color="#D97706" /> <strong>{stats.local}</strong> matched locally</span><span style={Z.statDot} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bot size={13} color="#059669" /> <strong>{stats.api}</strong> identified by AI</span>
              {stats.failed > 0 && <><span style={Z.statDot} /><span style={{ color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={13} /> <strong>{stats.failed}</strong> failed</span></>}
              {stats.dupes > 0 && <><span style={Z.statDot} /><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} /> <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
              <button style={Z.statsDismiss} onClick={() => setStats(null)}><X size={14} /></button>
            </div>
          )}

          {/* UPDATED: Add More panel with formatting toggle */}
          {showAddMore && (
            <div style={Z.addMorePanel}>
              <textarea ref={addMoreRef} style={{ ...Z.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
                placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <label style={Z.fmtToggleWrap} onClick={() => setAddMoreFormatting(p => !p)}>
                    <div style={{ ...Z.fmtToggleTrack, background: addMoreFormatting ? "#1A1814" : "#E0DCD4" }}>
                      <div style={{ ...Z.fmtToggleThumb, left: addMoreFormatting ? 15 : 2 }} />
                    </div>
                    Clean up formatting
                    <span className="conf-tooltip" data-tip="Fixes capitalization, converts straight quotes to curly quotes, normalizes dashes and spacing" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", cursor: "help" }}><Info size={12} color="#9B9A97" /></span>
                  </label>
                  <span style={{ fontSize: 12, color: "#9B9A97" }}>
                    {addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={Z.editCancel} onClick={() => { setShowAddMore(false); setAddMoreInput(""); }}>Cancel</button>
                  <button style={{ ...Z.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={handleAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
                </div>
              </div>
            </div>
          )}

          {showBulkBar && (
            <div style={Z.bulkBar}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#9B9A97" }}><Pencil size={14} /> Bulk edit</span>
                <span style={{ width: 1, height: 16, background: "#E3E2DE" }} />
                <span style={Z.bulkN}>{selected.size} selected</span>
              </span>
              <div style={Z.bulkF}>
                <select style={Z.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input style={Z.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
                <button style={{ ...Z.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
                <button style={Z.bulkDelBtn} onClick={() => selected.size > 10 ? setConfirmBulkDel(true) : bulkDel()}>Delete</button>
                <button style={Z.bulkX} onClick={() => setSelected(new Set())}><X size={14} /></button>
              </div>
            </div>
          )}

          <div style={Z.toolbar}>
            <div style={Z.srchW}><span style={Z.srchI}><Search size={13} /></span>
              <input style={Z.srchIn} placeholder="Search quotes or sources..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={Z.clrBtn} onClick={() => setSearch("")}><X size={12} /></button>}
            </div>
            <div ref={sortRef} style={{ position: "relative" }}>
              <button style={{ ...Z.sortBtn, ...(sortBy !== "default" ? { borderColor: "#2383E2", color: "#2383E2" } : {}) }} onClick={() => setShowSort(!showSort)}>
                Sort by{sortBy !== "default" ? `: ${SORT_OPTIONS.find(o => o.key === sortBy)?.label}` : ""}<span style={{ fontSize: 10, marginLeft: 4, opacity: .4 }}>▾</span>
              </button>
              {showSort && (
                <div style={Z.sortDrop}>
                  {SORT_OPTIONS.map(o => <button key={o.key} className="dd-opt" style={{ ...Z.sortOpt, ...(sortBy === o.key ? Z.sortOptOn : {}) }} onClick={() => { setSortBy(o.key); setShowSort(false); }}>{o.label}</button>)}
                </div>
              )}
            </div>
          </div>

          <div style={Z.cats}>
            <button onClick={() => setCatFilter("All")} style={{ ...Z.catPill, ...(catFilter === "All" && !favFilter ? Z.catOn : {}) }}>All</button>
            {favCount > 0 && (
              <button onClick={() => setFavFilter(!favFilter)} style={{ ...Z.catPill, ...(favFilter ? { background: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A" } : {}) }}>
                ★ Favorites<span style={{ opacity: .5, fontSize: 11 }}>{favCount}</span>
              </button>
            )}
            {allCats.filter(c => cc[c] || customCats.includes(c)).map(c => {
              const col = getCatColor(c, customCats); const on = catFilter === c;
              const count = cc[c];
              return <button key={c} onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...Z.catPill, ...(on ? { background: col.bg, color: col.text, borderColor: col.bg } : {}), ...(!count ? { opacity: .6 } : {}) }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}
                {count ? <span style={{ opacity: .5, fontSize: 11 }}>{count}</span> : <span style={{ opacity: .4, fontSize: 10 }}>0</span>}
                {customCats.includes(c) && <span style={{ opacity: .4, fontSize: 10, cursor: "pointer" }} onClick={e => { e.stopPropagation(); remCat(c); }}>✕</span>}
              </button>;
            })}
            {showNewCat ? (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input style={Z.newCatIn} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Name" autoFocus onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); } }} />
                <button style={Z.newCatSv} onClick={addCat}>Add</button>
              </div>
            ) : <button style={Z.addCatBtn} onClick={() => setShowNewCat(true)}>+</button>}
          </div>

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
              <button style={Z.attentionBtn} onClick={startReviewFlow}>Review now →</button>
            </div>
          ))}

          {/* TABLE VIEW */}
          {view === "table" && (
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
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              columnOrder={columnOrder}
              setColumnOrder={setColumnOrder}
              sortBy={sortBy}
              isMobile={isMobile}
            />
          )}

          {/* CARD VIEW — with long-press to select (change #8) */}
          {view === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
              {visible.map(q => {
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
                  />
                );
              })}
            </div>
          )}
{hasMore && (
  <button
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
            <div style={Z.empty}>
              <p style={{ fontSize: 14, color: "#9B9A97", marginBottom: 8 }}>No entries match your current filters.</p>
              <button style={{ background: "none", border: "none", color: "#2383E2", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                onClick={() => { setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default"); }}>Reset all filters</button>
            </div>
          )}

          {showBulkBar && <div style={{ height: 64 }} />}

          <Footer styles={Z} />
        </div>
      )}
    </>
  );
}

