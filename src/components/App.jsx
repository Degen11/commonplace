import { useState, useRef, useCallback, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Data
import { localLookup } from "../data/localQuotes";
import {
  DEFAULT_CATEGORIES, SOURCE_CATEGORIES, VIBE_TAGS, QUOTED_CATS,
  CONF_ORDER, CONF_LABELS, EXAMPLE_QUOTES, getCatColor
} from "../data/constants";

// Utils
import {
  normalize, similarity, smartParse, smartSplit, basicFormat, displayText,
  exportCSV, exportMD, exportJSON, exportTXT,
  copyToClipboard, richCopyToClipboard, encodeShareData, decodeShareData
} from "../utils/helpers";

// Components
import Toast from "./Toast";
import EditForm from "./EditForm";
import DupeModal from "./DupeModal";
import StatsPanel from "./StatsPanel";
import TransformPreview from "./TransformPreview";
import TableView from "./TableView";
import { FavBtn, DelBtn, CopyBtn, ReidentifyBtn, ConfDot } from "./QuoteActions";
import { baseCSS, Z, CZ } from "./styles";

const LS_QUOTES     = "commonplace_quotes";
const LS_CATS       = "commonplace_cats";
const LS_COL_ORDER  = "commonplace_col_order";

const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "confidence", label: "Needs attention first" },
  { key: "alpha",      label: "Alphabetical" },
  { key: "category",   label: "By category" },
];

// Column config for persistence
const REORDERABLE_COLS = ["content", "source", "category"];

// ── Footer ──
function Footer({ styles }) {
  return (
    <footer style={styles.footer}>
      <span>Built by <a href="https://github.com/Degen11" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Degen Hill</a></span>
    </footer>
  );
}

// ===================== MAIN COMPONENT =====================
export default function Commonplace() {
  const [phase, setPhase]                     = useState("input");
  const [fadeClass, setFadeClass]             = useState("phase-in");
  const [rawInput, setRawInput]               = useState("");
  const [quotes, setQuotes]                   = useState([]);
  const [customCats, setCustomCats]           = useState([]);
  const [progress, setProgress]               = useState(null);
  const [view, setView]                       = useState(() => window.innerWidth < 640 ? "cards" : "table");
  const [compact, setCompact]                 = useState(false);
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
  const [confirmClear, setConfirmClear]       = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth < 640);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [toast, setToast]                     = useState(null);
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

  const undoRef                = useRef(null);
  const addMoreRef             = useRef(null);
  const exportRef              = useRef(null);
  const sortRef                = useRef(null);
  const pendingContinuationRef = useRef(null);
  const fileInputRef           = useRef(null);
  const lastSelectedIndex      = useRef(null);

  const allCats = [...DEFAULT_CATEGORIES, ...customCats];

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

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = e => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.matches('input, textarea, select')) return;
      
      // Escape: Clear search (only if not in edit mode)
      if (e.key === 'Escape') {
        if (search && !editingId) {
          setSearch('');
        }
      }
      
      // Cmd/Ctrl + A: Select all visible quotes
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (filtered.length > 0) {
          setSelected(new Set(filtered.map(q => q.id)));
        }
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [search, editingId, filtered]);

  const showToast = (message, action, onAction) => setToast({ message, action, onAction });

  
  // ── File import ──
  const handleFileImport = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "csv"].includes(ext)) { showToast("Only .txt and .csv files are supported"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;
      if (ext === "csv") {
        const lines = content.split("\n");
        const header = lines[0]?.toLowerCase() || "";
        const headers = header.split(",").map(h => h.replace(/"/g, "").trim());
        const textCol = ["text","quote","quotes","content","entry"].reduce((found, key) => {
          const idx = headers.indexOf(key);
          return found >= 0 ? found : idx;
        }, -1);
        const colIdx = textCol >= 0 ? textCol : 0;
        const dataLines = lines.slice(1);
        content = dataLines.map(l => {
          const fields = [];
          let cur = "", inQuote = false;
          for (let i = 0; i < l.length; i++) {
            if (l[i] === '"') { inQuote = !inQuote; }
            else if (l[i] === "," && !inQuote) { fields.push(cur.trim()); cur = ""; }
            else { cur += l[i]; }
          }
          fields.push(cur.trim());
          return fields[colIdx]?.trim() || "";
        }).filter(Boolean).join("\n");
      }
      setRawInput(content);
      setImportedFileName(file.name);
      showToast(`Loaded ${smartSplit(content).length} entries from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleDropZone = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileImport(file);
  };

  // ── API: batch identification ──
  const identifyBatch = useCallback(async (items, withFormatting = false) => {
    if (items.length === 0) return [];
    const sourceCats = ["Film","TV","Book","Music","Speech","Person","Phrase"];
    const allCatStr = [...sourceCats, ...VIBE_TAGS, ...customCats.filter(c => !sourceCats.includes(c) && !VIBE_TAGS.includes(c)), "Unknown"].join("|");
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");
    const extraField = withFormatting ? `,"cleanText":"the text with typos fixed and proper capitalization"` : "";
    const extraInstr = withFormatting ? " For cleanText: fix typos, fix 'i' → 'I', capitalize the first word, preserve original meaning." : "";
    const r = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", max_tokens: 4000,
        system: `You are an expert in film, television, literature, music, history, philosophy, and popular culture. Your job is to identify the origin of quotes and phrases. Given a numbered list, identify each one. Respond ONLY with a JSON array (no markdown, no preamble).
Each element: {"i":index,"source":"Source - Speaker/Author","category":"${allCatStr}","confidence":"high|medium|low"${extraField}}

CATEGORY DEFINITIONS:
- Film: movies and screenplays
- TV: television shows and series
- Book: novels, non-fiction, poetry, plays
- Music: song lyrics
- Speech: famous speeches, interviews, public statements
- Person: attributed to a real person (not from a specific work)
- Phrase: common idiom or expression with no single clear origin

VIBE TAGS (use when source is not identifiable — always pick the best fit, never skip):
Aphorism=short punchy universal truth | Philosophical=abstract ideas about existence/reality | Observation=comment on human behavior or the world | Comedic=humorous or witty | Poetic=lyrical or emotionally vivid | Existential=questions of purpose/being/mortality | Motivational=inspires action or perseverance | Cynical=skeptical or darkly realistic | Identity=relates to self-concept | Reflection=introspective or personal insight

IDENTIFICATION RULES — follow strictly:
1. Commit to your best guess. If you are 40% or more confident of an origin, provide it with confidence "low" or "medium" rather than defaulting to Unknown source.
2. Consider paraphrases. If a quote is a loose version of a famous line, attribute it to that origin with confidence "medium" or "low".
3. Check all domains. Before giving up, mentally check: is this from a film? TV show? Novel? Song? A philosopher, politician, or historical figure? A common saying?
4. Partial attribution is better than none. "Attributed to Mark Twain (origin disputed)" is more useful than Unknown.
5. Unknown source is a last resort — only use it when you genuinely have no plausible attribution after considering all categories.
6. Always assign a vibe tag as the category whenever source is Unknown. category="Unknown" with no vibe tag is never acceptable.
7. Be concise with sources: "The Dark Knight (2008) - The Joker" not "The Dark Knight directed by Christopher Nolan".${extraInstr}
Return exactly one JSON object per input item.`,
        messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
      }),
    });
    if (!r.ok) throw new Error(`API returned ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "API error");
    const t = d.content.map(x => x.text || "").join("");
    const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  }, [customCats]);

  // ── Re-identify a single entry ──
  const reIdentify = async (q) => {
    const local = localLookup(q.text, null, { exactOnly: true });
    if (local) {
      setQuotes(prev => prev.map(x => x.id === q.id ? {
        ...x, source: local.source, category: local.category, confidence: local.confidence,
      } : x));
      showToast("Re-identified!");
      return;
    }
    const item = { text: q.text, hint: null };
    try {
      const results = await identifyBatch([item]);
      if (results.length > 0) {
        const r = results[0];
        const validCats = new Set([...allCats, ...VIBE_TAGS]);
        setQuotes(prev => prev.map(x => x.id === q.id ? {
          ...x,
          source: r.source || "Unknown",
          category: validCats.has(r.category) ? r.category : "Unknown",
          confidence: r.confidence || "low",
        } : x));
        showToast("Re-identified!");
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
  const runProcessing = async (unique, appendMode) => {
    const localMatches = []; const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    if (localMatches.length > 0) {
      setIdentifiedFeed(localMatches.map(m => ({
        text: formattingEnabled ? basicFormat(m.text) : m.text,
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
          const results = await identifyBatch(chunk, formattingEnabled);
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
          setIdentifiedFeed(prev => [...prev, ...results.map(r => {
            const item = chunk[r.i];
            return { text: (formattingEnabled && r.cleanText) ? r.cleanText : (item?.text || ""), source: r.source || "Unknown", category: r.category || "Unknown" };
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
        const text = formattingEnabled ? basicFormat(p.text) : p.text;
        return { id: crypto.randomUUID(), text, source: local.result.source, category: local.result.category, confidence: local.result.confidence, favorite: false };
      }
      const api = apiResults.get(i);
      if (api) {
        const text = (formattingEnabled && api.cleanText) ? api.cleanText : p.text;
        const validCats = new Set([...allCats, ...VIBE_TAGS]);
        return { id: crypto.randomUUID(), text, source: api.source || p.hint || "Unknown", category: validCats.has(api.category) ? api.category : "Unknown", confidence: api.confidence || "low", favorite: false };
      }
      const text = formattingEnabled ? basicFormat(p.text) : p.text;
      return { id: crypto.randomUUID(), text, source: p.hint || "Unknown", category: "Unknown", confidence: "low", favorite: false };
    });

    appendMode ? setQuotes(prev => [...prev, ...newQuotes]) : setQuotes(newQuotes);
    setStats(prev => ({ ...(prev || {}), local: localMatches.length, api: apiResults.size, failed: apiFailed ? needsApi.length - apiResults.size : 0, total: unique.length }));
    setProgress(null); setIsProcessing(false); goPhase("results");
  };

  const processEntries = async (inputText, appendMode = false) => {
    const lines = smartSplit(inputText.trim());
    if (!lines.length) return;

    const parsed = lines.map(l => smartParse(l));
    const existingTexts = appendMode ? quotes.map(q => normalize(q.text)) : [];
    const unique = []; const seen = new Set(existingTexts); const nearDupes = [];

    parsed.forEach(p => {
      const norm = normalize(p.text);
      const matchedNorm = [...seen].find(s => similarity(s, norm) > 0.55);
      if (matchedNorm) {
        const matchedQuote = appendMode ? quotes.find(q => normalize(q.text) === matchedNorm) : null;
        nearDupes.push({ incoming: p, matchedText: matchedQuote?.text || matchedNorm, matchedSource: matchedQuote?.source || null });
      } else {
        unique.push(p); seen.add(norm);
      }
    });

    if (nearDupes.length > 0) {
      setPendingDupes(nearDupes);
      setDupeDecisions(Object.fromEntries(nearDupes.map((_, i) => [i, "skip"])));
      pendingContinuationRef.current = { unique, seen, appendMode, totalParsed: parsed.length };
      return;
    }

    setIsProcessing(true); setFailedEntries([]); setIdentifiedFeed([]); goPhase("processing"); setApiError(null);
    setStats({ dupes: 0, total: unique.length });
    await runProcessing(unique, appendMode);
  };

  const handleDupesContinue = async () => {
    const { unique, seen, appendMode } = pendingContinuationRef.current;
    let keptCount = 0;
    pendingDupes.forEach((dupe, i) => {
      if (dupeDecisions[i] === "keep") {
        const norm = normalize(dupe.incoming.text);
        if (![...seen].some(s => similarity(s, norm) > 0.55)) {
          unique.push(dupe.incoming); seen.add(norm); keptCount++;
        }
      }
    });
    const dupes = pendingDupes.length - keptCount;
    setPendingDupes([]); setDupeDecisions({});
    pendingContinuationRef.current = null;
    setIsProcessing(true); setFailedEntries([]); setIdentifiedFeed([]); goPhase("processing"); setApiError(null);
    setStats({ dupes, total: unique.length });
    await runProcessing(unique, appendMode);
  };

  const retryFailed = async () => {
    if (!failedEntries.length) return;
    setApiError(null);
    const text = failedEntries.map(e => `${e.text}${e.hint ? ` — ${e.hint}` : ""}`).join("\n");
    setFailedEntries([]); await processEntries(text, true);
  };

  const handleProcess  = () => processEntries(rawInput, false);
  const handleAddMore  = () => { if (!addMoreInput.trim()) return; processEntries(addMoreInput, true); setAddMoreInput(""); setShowAddMore(false); };

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
  };
  const saveInlineField = (id, field, value) => {
    setQuotes(p => p.map(q => {
      if (q.id !== id) return q;
      const newVal = field === "source" ? (value.trim() || q.source) : value;
      return { ...q, [field]: newVal, confidence: "high" };
    }));
    setInlineEdit(null);
  };
  const applyBulk  = () => {
    setQuotes(p => p.map(q => {
      if (!selected.has(q.id)) return q;
      const u = { ...q };
      if (bulkEditCat) u.category = bulkEditCat;
      if (bulkEditSource.trim()) u.source = bulkEditSource.trim();
      if (bulkEditCat || bulkEditSource.trim()) u.confidence = "high";
      return u;
    }));
    setSelected(new Set()); setBulkEditCat(""); setBulkEditSource("");
  };
  const bulkDel = () => {
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
  const addCat  = () => { const n = newCatName.trim(); if (!n || allCats.some(c => c.toLowerCase() === n.toLowerCase())) return; setCustomCats(p => [...p, n]); setNewCatName(""); setShowNewCat(false); };
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

  const cc           = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
  const favCount     = quotes.filter(q => q.favorite).length;
  const showBulkBar  = selected.size > 0;
  const unknownCount = quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length;
  const topCats      = Object.entries(cc).filter(([c]) => c !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 4);

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
        <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>
          <nav style={Z.nav}>
            <span style={Z.navLogo}>Commonplace</span>
            <div style={Z.navRight}>
              <a className="nav-link" href="#how" style={{ color: "#9A9590", textDecoration: "none" }}>How it works</a>
            </div>
          </nav>

          <div style={Z.landing}>
            <div style={Z.hero}>
              <h1 style={Z.heroTitle}>Commonplace</h1>
              <p style={Z.heroSub}>Paste your messy quotes, phrases, and fragments.<br />We'll organize everything and identify the sources.</p>
            </div>

            {savedSession && (
              <div style={Z.restoreBanner}>
                <span>📂 You have <strong>{savedSession.quotes.length}</strong> entries saved from your last session</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={Z.restoreBtn} onClick={() => {
                    setQuotes(savedSession.quotes);
                    setCustomCats(savedSession.customCats || []);
                    setSavedSession(null);
                    goPhase("results");
                  }}>Restore session</button>
                  <button style={Z.restoreDismiss} onClick={() => {
                    try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch(e) {}
                    setSavedSession(null);
                  }}>Dismiss</button>
                </div>
              </div>
            )}

            <div style={Z.inputCard}>
              <div style={Z.tabRow}>
                <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "paste" ? Z.tabBtnActive : {}) }} onClick={() => setInputTab("paste")}>✏️ Type / Paste</button>
                <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "import" ? Z.tabBtnActive : {}) }} onClick={() => setInputTab("import")}>📁 Import File</button>
              </div>

              {inputTab === "paste" && (
                <textarea style={Z.bigTextarea} value={rawInput} onChange={e => setRawInput(e.target.value)}
                  placeholder={"Paste everything here — one per line, messy is fine:\n\nYou can't handle the truth\nThe world breaks everyone — Hemingway\n\"Be the change\" (Gandhi)\nTo infinity and beyond\nNot all those who wander are lost — Tolkien"} rows={12} />
              )}

              {inputTab === "import" && (
                <div className="drop-zone" style={{ ...Z.dropZone, ...(isDragOver ? Z.dropZoneActive : {}) }}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".txt,.csv" style={{ display: "none" }}
                    onChange={e => { handleFileImport(e.target.files[0]); e.target.value = ""; }} />
                  <div style={Z.dropIcon}>{isDragOver ? "📂" : "📄"}</div>
                  <div style={Z.dropTitle}>{isDragOver ? "Drop it!" : "Drop a .txt or .csv file"}</div>
                  <div style={Z.dropSub}>or click to browse — one quote per line</div>
                  {importedFileName && (
                    <div style={Z.dropFileName}>✓ {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded</div>
                  )}
                </div>
              )}

              <div style={Z.inputFooter}>
                {(() => {
                  const count = rawInput.trim() ? smartSplit(rawInput.trim()).length : 0;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={Z.entryMeta}>
                        {count > 0 ? `${count} ${count === 1 ? "entry" : "entries"} detected` : "Quotes, phrases, expressions — all welcome"}
                      </span>
                      {count > 50 && (
                        <span style={Z.warnBadge}>⚠ {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment</span>
                      )}
                      <label style={Z.fmtToggleWrap} onClick={() => setFormattingEnabled(p => !p)}>
                        <div style={{ ...Z.fmtToggleTrack, background: formattingEnabled ? "#1A1814" : "#E0DCD4" }}>
                          <div style={{ ...Z.fmtToggleThumb, left: formattingEnabled ? 15 : 2 }} />
                        </div>
                        Clean up formatting
                      </label>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!rawInput.trim() && inputTab === "paste" && <button className="try-btn" style={Z.tryBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>Try it with examples</button>}
                  <button className="proc-btn" style={{ ...Z.processBtn, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }} onClick={handleProcess} disabled={!rawInput.trim() || isProcessing}>
                    {isProcessing ? "Processing..." : "Organize my collection →"}
                  </button>
                </div>
              </div>
            </div>

            <TransformPreview />

            <div id="how" style={Z.howSection}>
              <div style={Z.howSectionTitle}>
                <span style={Z.howSectionTitleLine} />
                How it works
                <span style={Z.howSectionTitleLine} />
              </div>
              <div style={Z.howGrid}>
                <div className="how-card" style={Z.howCard}>
                  <div style={Z.howCardIcon}>📋</div>
                  <div style={Z.howCardTitle}>Paste anything</div>
                  <div style={Z.howCardDesc}>One entry per line. Attribution hints via dashes, parentheses, or tildes — or nothing at all. Messy is fine.</div>
                </div>
                <div className="how-card" style={Z.howCard}>
                  <div style={Z.howCardIcon}>⚡</div>
                  <div style={Z.howCardTitle}>Local first</div>
                  <div style={Z.howCardDesc}>600+ common quotes matched instantly from a built-in database. Zero API calls, zero cost, millisecond results.</div>
                </div>
                <div className="how-card" style={Z.howCard}>
                  <div style={Z.howCardIcon}>🤖</div>
                  <div style={Z.howCardTitle}>AI for the rest</div>
                  <div style={Z.howCardDesc}>Unrecognized quotes go to Claude Haiku in batches of 20. Source, category, and confidence — all returned.</div>
                </div>
              </div>
              
              {/* Features section title with lines */}
              <div style={{...Z.howSectionTitle, marginTop: 48, marginBottom: 20}}>
                <span style={Z.howSectionTitleLine} />
                Powerful features
                <span style={Z.howSectionTitleLine} />
              </div>
              
              <div style={Z.featuresGrid}>
                {[
                  { icon: "✎", title: "Inline editing", desc: "Edit text, source, or category with one click" },
                  { icon: "📋", title: "Bulk operations", desc: "Update categories or sources across multiple entries" },
                  { icon: "↕️", title: "Drag to reorder", desc: "Arrange entries exactly how you want them" },
                  { icon: "📤", title: "Multiple export formats", desc: "CSV, Markdown, JSON, or plain text" },
                  { icon: "🔗", title: "Shareable links", desc: "Share your curated collection with anyone" },
                  { icon: "💾", title: "Session restore", desc: "Pick up right where you left off" },
                  { icon: "🏷️", title: "Custom categories", desc: "Create tags that work for your collection" },
                  { icon: "🔄", title: "Duplicate detection", desc: "Keep your collection clean and organized" },
                  { icon: "✨", title: "Smart formatting", desc: "Auto-cleanup and \"Did you mean?\" suggestions" },
                  { icon: "🎯", title: "Confidence indicators", desc: "See at a glance which entries need review" },
                  { icon: "🔍", title: "Search & filter", desc: "Find anything instantly across your collection" },
                  { icon: "⌨️", title: "Keyboard shortcuts", desc: "Escape to clear search, Cmd/Ctrl+A to select all" }
                ].map(f => (
                 <div key={f.title} className="feature-card" style={Z.featureCard}>
                    <div style={Z.featureIcon}>{f.icon}</div>
                    <div style={Z.featureContent}>
                      <div style={Z.featureTitle}>{f.title}</div>
                      <div style={Z.featureDesc}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Footer styles={Z} />
          </div>
        </div>
      )}

      {/* ── Processing phase ── */}
      {phase === "processing" && (
        <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>
          <div style={Z.procWrap}>
            <h2 style={Z.procTitle}>Organizing your collection...</h2>
            <p style={Z.procSub}>{progress?.phase === "local" ? "Checking local database..." : "AI is identifying remaining entries..."}</p>
            {progress && (
              <div style={Z.procCard}>
                <div style={Z.procTop}><span style={{ fontWeight: 600 }}>{progress.done} of {progress.total}</span><span style={{ color: "#9B9A97" }}>{Math.round((progress.done / progress.total) * 100)}%</span></div>
                <div style={Z.track}><div style={{ ...Z.fill, width: `${(progress.done / progress.total) * 100}%` }} /></div>
                <p style={Z.procCurrent}>{progress.current}</p>
              </div>
            )}
            {identifiedFeed.length > 0 && (
              <div style={Z.feedWrap}>
                {[...identifiedFeed].reverse().map((item, i) => {
                  const col = getCatColor(item.category, customCats);
                  return (
                    <div key={i} style={Z.feedItem}>
                      <span style={{ ...Z.feedItemTag, background: col.bg, color: col.text }}>{item.category}</span>
                      <span style={Z.feedItemText}>{item.text}</span>
                      <span style={Z.feedItemSrc}>{item.source}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>

          {toast && <Toast message={toast.message} action={toast.action} onAction={() => { if (toast.onAction) toast.onAction(); setToast(null); }} onDismiss={() => setToast(null)} />}

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

          {isSharedView && (
            <div style={Z.shareBanner}>
              <span>👀 You're viewing a shared collection ({quotes.length} entries)</span>
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
              <button style={{ ...Z.statsBtn, ...(showStats ? Z.statsBtnActive : {}) }} onClick={() => setShowStats(s => !s)}>
                {showStats ? "Hide stats" : "Stats"}
              </button>
              <div ref={exportRef} style={{ position: "relative" }}>
                <button style={Z.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
                {showExport && (
                  <div style={Z.expDrop}>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}>📋 Copy to clipboard</button>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { richCopyToClipboard(quotes).then(() => showToast("Rich text copied — paste into Notion, Notes, etc.")); setShowExport(false); }}>✨ Rich copy</button>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { handleShare(); setShowExport(false); }}>🔗 Shareable link</button>
                    {quotes.length > 80 && <span style={Z.expOptNote}>⚠ Links may break above ~80 entries — export a file instead</span>}
                    <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { exportTXT(quotes); setShowExport(false); }}>📄 Plain text</button>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { exportCSV(quotes); setShowExport(false); }}>📊 CSV</button>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { exportMD(quotes); setShowExport(false); }}>📝 Markdown</button>
                    <button className="dd-opt" style={Z.expOpt} onClick={() => { exportJSON(quotes); setShowExport(false); }}>{"{ }"} JSON</button>
                  </div>
                )}
              </div>
              {!isMobile && quotes.length > 0 && <button style={Z.hdrBtn} onClick={selAll}>{selected.size === filtered.length && filtered.length > 0 ? "Deselect" : "Select all"}</button>}
              <button style={Z.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>＋ Add more</button>
              <button style={Z.startOverBtn} onClick={() => setConfirmClear(true)}>New batch</button>
            </div>
          </div>

          {showStats && <StatsPanel quotes={quotes} computedStats={computedStats} cc={cc} customCats={customCats} onClose={() => setShowStats(false)} />}

          {apiError && (
            <div style={Z.errorBar}>
              <span>⚠️ {apiError}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {failedEntries.length > 0 && <button style={Z.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
                <button style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={() => setApiError(null)}>Dismiss</button>
              </div>
            </div>
          )}

          {stats && (
            <div style={Z.statsBar}>
              <span>⚡ <strong>{stats.local}</strong> matched locally</span><span style={Z.statDot} />
              <span>🤖 <strong>{stats.api}</strong> identified by AI</span>
              {stats.failed > 0 && <><span style={Z.statDot} /><span style={{ color: "#DC2626" }}>❌ <strong>{stats.failed}</strong> failed</span></>}
              {stats.dupes > 0 && <><span style={Z.statDot} /><span>🔁 <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} skipped</span></>}
              <button style={Z.statsDismiss} onClick={() => setStats(null)}>✕</button>
            </div>
          )}

          {showAddMore && (
            <div style={Z.addMorePanel}>
              <textarea ref={addMoreRef} style={{ ...Z.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
                placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#9B9A97" }}>{addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={Z.editCancel} onClick={() => { setShowAddMore(false); setAddMoreInput(""); }}>Cancel</button>
                  <button style={{ ...Z.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={handleAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
                </div>
              </div>
            </div>
          )}

          {showBulkBar && (
            <div style={Z.bulkBar}>
              <span style={Z.bulkN}>{selected.size} selected</span>
              <div style={Z.bulkF}>
                <select style={Z.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input style={Z.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
                <button style={{ ...Z.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
                <button style={Z.bulkDelBtn} onClick={bulkDel}>Delete</button>
                <button style={Z.bulkX} onClick={() => setSelected(new Set())}>✕</button>
              </div>
            </div>
          )}

          <div style={Z.toolbar}>
            <div style={Z.srchW}><span style={Z.srchI}>🔍</span>
              <input style={Z.srchIn} placeholder="Search quotes or sources..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={Z.clrBtn} onClick={() => setSearch("")}>✕</button>}
            </div>
            <div ref={sortRef} style={{ position: "relative" }}>
              <button style={{ ...Z.sortBtn, ...(sortBy !== "default" ? { borderColor: "#2383E2", color: "#2383E2" } : {}) }} onClick={() => setShowSort(!showSort)}>
                Sort{sortBy !== "default" ? " ✓" : ""}<span style={{ fontSize: 10, marginLeft: 4, opacity: .4 }}>▾</span>
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

          {unknownCount > 0 && sortBy !== "confidence" && (
            <div style={Z.attentionBar}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Z.attentionCount}>{unknownCount}</span>
                <span>{unknownCount === 1 ? "entry needs" : "entries need"} your attention — source or category is missing</span>
              </div>
              <button style={Z.attentionBtn} onClick={() => setSortBy("confidence")}>Review now ↑</button>
            </div>
          )}

          {/* TABLE VIEW - Now extracted to TableView component */}
          {view === "table" && (
            <TableView
              filtered={filtered}
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
            />
          )}

          {/* CARD VIEW */}
          {view === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
              {filtered.map(q => {
                const col = getCatColor(q.category, customCats);
                const isSel = selected.has(q.id);
                const isEd  = editingId === q.id;
                const needsAtt = q.confidence === "low" || q.category === "Unknown";
                return (
                  <div key={q.id}
                    draggable={!isEd && inlineEdit?.id !== q.id}
                    onDragStart={() => handleDragStart(q.id)}
                    onDragOver={e => handleDragOver(e, q.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      ...CZ.card,
                      ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}),
                      ...(q.favorite ? CZ.favCard : {}),
                      ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}),
                      ...(dragId === q.id ? { opacity: .4 } : {}),
                      animation: "fadeUp .3s ease",
                    }}
                    onMouseEnter={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 1; }}
                    onMouseLeave={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 0; }}
                  >
                    <div style={CZ.top}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="check-div" style={{ ...Z.check, ...(isSel ? Z.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onClick={() => toggleSel(q.id)} onMouseDown={e => e.preventDefault()}>
                          {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
                        </div>
                        {inlineEdit?.id === q.id && inlineEdit?.field === "category"
                          ? <select style={Z.inlineCatSel} value={q.category} onChange={e => saveInlineField(q.id, "category", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus>
                              {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          : <span className="inline-cat" style={{ ...Z.tag, background: col.bg, color: col.text }} onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "category" }); }} title="Click to change category">{q.category}</span>
                        }
                      </div>
                      <div className="ca" style={{ ...CZ.acts, ...(isMobile ? { opacity: 1 } : {}) }}>
                        <FavBtn q={q} onFav={actionProps.onFav} />
                        <CopyBtn q={q} onCopy={actionProps.onCopy} />
                        <ReidentifyBtn q={q} onReidentify={actionProps.onReidentify} loading={actionProps.reidentifying === q.id} />
                        <DelBtn q={q} onDelete={actionProps.onDelete} />
                      </div>
                    </div>
                    {isEd
                      ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} inCard />
                      : (
                        <>
                          <p style={{ ...CZ.txt, cursor: "text" }} onClick={() => { if (!isEd) setEditingId(q.id); }}>{displayText(q)}</p>
                          <div style={CZ.srcRow}>
                            <span style={{ color: "#D3D3D0" }}>—</span>
                            {inlineEdit?.id === q.id && inlineEdit?.field === "source"
                              ? <input style={Z.inlineSrcInput} value={q.source} onChange={e => saveInlineField(q.id, "source", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus />
                              : <span className="inline-src" style={CZ.src} onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "source" }); }}>{q.source}</span>
                            }
                            <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
                          </div>
                        </>
                      )
                    }
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length === 0 && (
            <div style={Z.empty}>
              <p style={{ fontSize: 14, color: "#9B9A97", marginBottom: 8 }}>No entries match your current filters.</p>
              <button style={{ background: "none", border: "none", color: "#2383E2", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                onClick={() => { setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default"); }}>Clear all filters</button>
            </div>
          )}

          <Footer styles={Z} />
        </div>
      )}
    </>
  );
}