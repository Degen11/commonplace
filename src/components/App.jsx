import { useState, useRef, useCallback, useEffect } from "react";

// Data
import { localLookup } from "../data/localQuotes";
import { DEFAULT_CATEGORIES, QUOTED_CATS, CONF_ORDER, CONF_LABELS, EXAMPLE_QUOTES, getCatColor } from "../data/constants";

// Utils
import { normalize, similarity, smartParse, displayText, exportCSV, exportMD, exportJSON, copyToClipboard, encodeShareData, decodeShareData } from "../utils/helpers";

// Components & styles
import Toast from "../components/Toast";
import { baseCSS, Z, CZ } from "../components/styles";

// ===================== MAIN COMPONENT =====================
export default function Keeper() {
  const [phase, setPhase] = useState("input");
  const [fadeClass, setFadeClass] = useState("phase-in");
  const [rawInput, setRawInput] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [customCats, setCustomCats] = useState([]);
  const [progress, setProgress] = useState(null);
  const [view, setView] = useState(() => window.innerWidth < 640 ? "cards" : "table");
  const [catFilter, setCatFilter] = useState("All");
  const [favFilter, setFavFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkEditCat, setBulkEditCat] = useState("");
  const [bulkEditSource, setBulkEditSource] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [addMoreInput, setAddMoreInput] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [failedEntries, setFailedEntries] = useState([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const undoRef = useRef(null);
  const addMoreRef = useRef(null);
  const exportRef = useRef(null);
  const sortRef = useRef(null);

  const allCats = [...DEFAULT_CATEGORIES, ...customCats];

  // Phase transition with fade
  const goPhase = useCallback((next) => {
    setFadeClass("phase-out");
    setTimeout(() => { setPhase(next); setFadeClass("phase-in"); }, 200);
  }, []);

  // Load shared link on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = decodeShareData(hash.slice(2));
      if (decoded && decoded.length > 0) {
        setQuotes(decoded); setPhase("results"); setIsSharedView(true);
      }
    }
  }, []);

  // Responsive
  useEffect(() => {
    const h = () => { const m = window.innerWidth < 640; setIsMobile(m); if (m && view === "table") setView("cards"); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [view]);

  // Click-outside for dropdowns
  useEffect(() => {
    const h = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const showToast = (message, action, onAction) => setToast({ message, action, onAction });

  // ── API ──
  const identifyBatch = useCallback(async (items) => {
    if (items.length === 0) return [];
    const cl = allCats.filter(c => c !== "Unknown").join("|");
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");

    const r = await fetch("/api/identify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", max_tokens: 4000,
        system: `You identify quotes and phrases. Given a numbered list, identify each one. Respond ONLY with a JSON array (no markdown, no preamble).
Each element: {"i":index,"source":"Source - Speaker/Author","category":"${cl}|Unknown","confidence":"high|medium|low"}
Film=movies, TV=television, Book=novels/nonfiction/poetry, Music=lyrics, Speech=speeches, Person=real person.
Phrase=expressions, idioms, adverbial phrases not from a specific source.
Unknown if unsure. Be concise with sources. Return one object per input.`,
        messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
      }),
    });
    if (!r.ok) throw new Error(`API returned ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || "API error");
    const t = d.content.map(x => x.text || "").join("");
    const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  }, [allCats]);

  // ── Processing pipeline ──
  const processEntries = async (inputText, appendMode = false) => {
    const lines = inputText.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    setIsProcessing(true); setFailedEntries([]); goPhase("processing"); setApiError(null);
    const parsed = lines.map(l => smartParse(l));

    const existingTexts = appendMode ? quotes.map(q => normalize(q.text)) : [];
    const unique = []; const seen = new Set(existingTexts); let dupes = 0;
    parsed.forEach(p => {
      const norm = normalize(p.text);
      if ([...seen].some(s => similarity(s, norm) > 0.55)) dupes++;
      else { unique.push(p); seen.add(norm); }
    });

    const localMatches = []; const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    setProgress({ total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need AI...`, phase: "local" });

    const apiResults = new Map(); let apiFailed = false; const failed = []; const BATCH_SIZE = 20;
    if (needsApi.length > 0) {
      for (let i = 0; i < needsApi.length; i += BATCH_SIZE) {
        const chunk = needsApi.slice(i, i + BATCH_SIZE);
        setProgress({ total: unique.length, done: localMatches.length + i, current: `AI identifying batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsApi.length / BATCH_SIZE)}...`, phase: "api" });
        try {
          const results = await identifyBatch(chunk);
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
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
      if (local) return { id: (Date.now() + i).toString(), text: p.text, source: local.result.source, category: local.result.category, confidence: local.result.confidence, favorite: false };
      const api = apiResults.get(i);
      if (api) return { id: (Date.now() + i).toString(), text: p.text, source: api.source || p.hint || "Unknown", category: allCats.includes(api.category) ? api.category : "Unknown", confidence: api.confidence || "low", favorite: false };
      return { id: (Date.now() + i).toString(), text: p.text, source: p.hint || "Unknown", category: "Unknown", confidence: "low", favorite: false };
    });

    appendMode ? setQuotes(prev => [...prev, ...newQuotes]) : setQuotes(newQuotes);
    setStats({ local: localMatches.length, api: apiResults.size, failed: apiFailed ? needsApi.length - apiResults.size : 0, total: unique.length, dupes });
    setProgress(null); setIsProcessing(false); goPhase("results");
  };

  const retryFailed = async () => {
    if (!failedEntries.length) return;
    setApiError(null);
    const text = failedEntries.map(e => `${e.text}${e.hint ? ` — ${e.hint}` : ""}`).join("\n");
    setFailedEntries([]); await processEntries(text, true);
  };

  const handleProcess = () => processEntries(rawInput, false);
  const handleAddMore = () => { if (!addMoreInput.trim()) return; processEntries(addMoreInput, true); setAddMoreInput(""); setShowAddMore(false); };

  const handleClear = () => {
    window.history.replaceState(null, "", window.location.pathname); setIsSharedView(false);
    goPhase("input"); setQuotes([]); setRawInput(""); setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); setStats(null); setApiError(null);
    setConfirmClear(false); setShowAddMore(false); setSortBy("default"); setFailedEntries([]);
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
    const url = `${window.location.origin}${window.location.pathname}#s=${encodeShareData(quotes)}`;
    navigator.clipboard.writeText(url).then(() => showToast("Shareable link copied to clipboard!"));
  };

  // ── Inline actions ──
  const toggleSel = id => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const startEdit = q => { setEditingId(q.id); setEditText(q.text); setEditSource(q.source); setEditCategory(q.category); };
  const saveEdit = id => { setQuotes(p => p.map(q => q.id === id ? { ...q, text: editText, source: editSource, category: editCategory } : q)); setEditingId(null); };
  const applyBulk = () => { setQuotes(p => p.map(q => { if (!selected.has(q.id)) return q; const u = { ...q }; if (bulkEditCat) u.category = bulkEditCat; if (bulkEditSource.trim()) u.source = bulkEditSource.trim(); return u; })); setSelected(new Set()); setBulkEditCat(""); setBulkEditSource(""); };
  const bulkDel = () => { setQuotes(p => p.filter(q => !selected.has(q.id))); setSelected(new Set()); };
  const addCat = () => { const n = newCatName.trim(); if (!n || allCats.includes(n)) return; setCustomCats(p => [...p, n]); setNewCatName(""); setShowNewCat(false); };
  const remCat = c => { setCustomCats(p => p.filter(x => x !== c)); setQuotes(p => p.map(q => q.category === c ? { ...q, category: "Unknown" } : q)); if (catFilter === c) setCatFilter("All"); };

  // ── Drag reorder ──
  const handleDragStart = (id) => setDragId(id);
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    setQuotes(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(q => q.id === dragId);
      const toIdx = arr.findIndex(q => q.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };
  const handleDragEnd = () => setDragId(null);

  // ── Filtering & sorting ──
  let filtered = quotes.filter(q => {
    if (catFilter !== "All" && q.category !== catFilter) return false;
    if (favFilter && !q.favorite) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  if (sortBy === "confidence") filtered = [...filtered].sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0));
  else if (sortBy === "alpha") filtered = [...filtered].sort((a, b) => a.text.localeCompare(b.text));
  else if (sortBy === "category") filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));

  const cc = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
  const favCount = quotes.filter(q => q.favorite).length;
  const selAll = () => { const ids = filtered.map(q => q.id); ids.every(id => selected.has(id)) ? setSelected(new Set()) : setSelected(new Set(ids)); };
  const showBulkBar = selected.size > 0;
  const unknownCount = quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length;
  const topCats = Object.entries(cc).filter(([c]) => c !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 4);

  const SORT_OPTIONS = [
    { key: "default", label: "Default order" },
    { key: "confidence", label: `Needs attention first${unknownCount > 0 ? ` (${unknownCount})` : ""}` },
    { key: "alpha", label: "Alphabetical" },
    { key: "category", label: "By category" },
  ];

  // ── Sub-components ──
  const FavBtn = ({ q }) => <button style={{ ...Z.actBtn, color: q.favorite ? "#F59E0B" : "#9B9A97" }} onClick={() => setQuotes(p => p.map(x => x.id === q.id ? { ...x, favorite: !x.favorite } : x))}>{q.favorite ? "★" : "☆"}</button>;
  const EditBtn = ({ q }) => <button style={Z.actBtn} onClick={() => startEdit(q)}>✎</button>;
  const DelBtn = ({ q }) => <button style={{ ...Z.actBtn, color: "#EB5757" }} onClick={() => handleDelete(q.id)}>✕</button>;
  const ConfDot = ({ q }) => {
    if (!q.confidence || q.confidence === "high") return null;
    return <span title={CONF_LABELS[q.confidence]} style={{ ...Z.confDot, background: q.confidence === "medium" ? "#FFB74D" : "#D6D6D4", cursor: "help" }} />;
  };
  const EditForm = ({ q, inCard }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: inCard ? 8 : 0 }} onClick={e => e.stopPropagation()}>
      <textarea style={{ ...Z.textarea, minHeight: 40, fontSize: 13, padding: 8 }} value={editText} onChange={e => setEditText(e.target.value)} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input style={Z.editIn} value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="Source..." />
        <select style={Z.editSel} value={editCategory} onChange={e => setEditCategory(e.target.value)}>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <button style={Z.editSave} onClick={() => saveEdit(q.id)}>Save</button>
        <button style={Z.editCancel} onClick={() => setEditingId(null)}>Cancel</button>
      </div>
    </div>
  );
  const Footer = () => (
    <footer style={Z.footer}>
      <span>Built by <a href="https://github.com/Degen11" target="_blank" rel="noopener noreferrer" style={Z.footerLink}>Degen Hill</a></span>
    </footer>
  );

  // ========================== INPUT PHASE ==========================
  if (phase === "input") return (
    <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>
      <div style={Z.landing}>
        <div style={Z.hero}>
          <h1 style={Z.heroTitle}>Keeper</h1>
          <p style={Z.heroSub}>Paste your messy quotes, phrases, and fragments.<br />We'll organize everything and identify the sources.</p>
        </div>
        <div style={Z.inputCard}>
          <textarea style={Z.bigTextarea} value={rawInput} onChange={e => setRawInput(e.target.value)}
            placeholder={"Paste everything here — one per line, messy is fine:\n\nYou can't handle the truth\nThe world breaks everyone — Hemingway\n\"Be the change\" (Gandhi)\nTo infinity and beyond\nNot all those who wander are lost — Tolkien"} rows={12} />
          <div style={Z.inputFooter}>
            <span style={Z.inputCount}>{rawInput.trim() ? `${rawInput.trim().split("\n").filter(l => l.trim()).length} entries detected` : "Quotes, phrases, expressions — all welcome"}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!rawInput.trim() && <button className="try-btn" style={Z.tryBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>Try it with examples</button>}
              <button className="proc-btn" style={{ ...Z.processBtn, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }} onClick={handleProcess} disabled={!rawInput.trim() || isProcessing}>
                {isProcessing ? "Processing..." : "Organize my collection →"}
              </button>
            </div>
          </div>
        </div>
        <div style={Z.howWrap}>
          <div className="how-step" style={Z.howStep}><div style={Z.howIcon}>📋</div><div style={Z.howLabel}>Paste</div><div style={Z.howDesc}>Dump your messy quotes, one per line</div></div>
          <div style={Z.howArrow}>→</div>
          <div className="how-step" style={Z.howStep}><div style={Z.howIcon}>🤖</div><div style={Z.howLabel}>Identify</div><div style={Z.howDesc}>AI matches sources and categories</div></div>
          <div style={Z.howArrow}>→</div>
          <div className="how-step" style={Z.howStep}><div style={Z.howIcon}>✨</div><div style={Z.howLabel}>Organized</div><div style={Z.howDesc}>Export clean, attributed collections</div></div>
        </div>
        <div style={Z.previewWrap}>
          <div style={Z.previewBox}>
            <div style={Z.previewLabel}>What you paste</div>
            <div style={Z.previewContent}>
              <p style={Z.previewLine}>you miss 100% of the shots you don't take</p>
              <p style={Z.previewLine}>all those moments will be lost in time</p>
              <p style={Z.previewLine}>the unexamined life is not worth living</p>
              <p style={Z.previewLine}>"Be the change" (Gandhi)</p>
              <p style={Z.previewLine}>is this the real life is this just fantasy</p>
            </div>
          </div>
          <div style={Z.previewArrow}>→</div>
          <div style={Z.previewBox}>
            <div style={Z.previewLabel}>What you get</div>
            <div style={Z.previewContent}>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"You miss 100% of the shots you don't take"</span><span style={Z.previewSrc}>Wayne Gretzky</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F3E8FF", color: "#7C3AED" }}>Film</span><span style={Z.previewText}>"All those moments will be lost in time"</span><span style={Z.previewSrc}>Blade Runner (1982)</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"The unexamined life is not worth living"</span><span style={Z.previewSrc}>Socrates</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"Be the change"</span><span style={Z.previewSrc}>Mahatma Gandhi</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#FFE4E6", color: "#E11D48" }}>Music</span><span style={Z.previewText}>"Is this the real life, is this just fantasy"</span><span style={Z.previewSrc}>Bohemian Rhapsody — Queen</span></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );

  // ========================== PROCESSING PHASE ==========================
  if (phase === "processing") return (
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
      </div>
    </div>
  );

  // ========================== RESULTS PHASE ==========================
  return (
    <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>

      {toast && <Toast message={toast.message} action={toast.action} onAction={() => { if (toast.onAction) toast.onAction(); setToast(null); }} onDismiss={() => setToast(null)} />}

      {confirmClear && (
        <div style={Z.modalOverlay} onClick={() => setConfirmClear(false)}>
          <div style={Z.confirmBox} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Start fresh?</p>
            <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 16 }}>This will clear all {quotes.length} organized entries. Make sure you've exported anything you want to keep.</p>
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

      {/* Header */}
      <div style={Z.header}>
        <div>
          <h1 style={Z.title}>Keeper</h1>
          <p style={Z.sub}>
            {quotes.length} {quotes.length === 1 ? "entry" : "entries"} organized
            {topCats.length > 0 && <span style={{ color: "#D3D3D0" }}> · </span>}
            {topCats.map(([c, n], i) => <span key={c} style={{ color: getCatColor(c, customCats).text }}>{i > 0 && <span style={{ color: "#D3D3D0" }}>, </span>}{n} {c}</span>)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {!isMobile && (
            <div style={Z.viewTog}>
              <button style={{ ...Z.viewBtn, ...(view === "table" ? Z.viewOn : {}) }} onClick={() => setView("table")} title="Table">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".8"/><rect x="1" y="6.5" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".5"/><rect x="1" y="11" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".3"/></svg>
              </button>
              <button style={{ ...Z.viewBtn, ...(view === "cards" ? Z.viewOn : {}) }} onClick={() => setView("cards")} title="Cards">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>
              </button>
            </div>
          )}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button style={Z.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
            {showExport && (
              <div style={Z.expDrop}>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}>📋 Copy to clipboard</button>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { handleShare(); setShowExport(false); }}>🔗 Shareable link</button>
                <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
                <button className="dd-opt" style={Z.expOpt} onClick={() => { exportCSV(quotes); setShowExport(false); }}>📄 CSV</button>
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
          {stats.dupes > 0 && <><span style={Z.statDot} /><span>🔁 <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} removed</span></>}
          <button style={Z.statsDismiss} onClick={() => setStats(null)}>✕</button>
        </div>
      )}

      {showAddMore && (
        <div style={Z.addMorePanel}>
          <textarea ref={addMoreRef} style={{ ...Z.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
            placeholder="Paste additional quotes, one per line. Duplicates of existing entries will be skipped." />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#9B9A97" }}>{addMoreInput.trim() ? `${addMoreInput.trim().split("\n").filter(l => l.trim()).length} entries` : "These will be added to your existing collection"}</span>
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
        {allCats.filter(c => cc[c]).map(c => {
          const col = getCatColor(c, customCats); const on = catFilter === c;
          return <button key={c} onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...Z.catPill, ...(on ? { background: col.bg, color: col.text, borderColor: col.bg } : {}) }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}<span style={{ opacity: .5, fontSize: 11 }}>{cc[c]}</span>
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
        <div style={Z.hintBar}>
          <span>{unknownCount} {unknownCount === 1 ? "entry needs" : "entries need"} attention</span>
          <button style={Z.hintBtn} onClick={() => setSortBy("confidence")}>Sort to top ↑</button>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div style={{ overflowX: "auto" }}>
          {filtered.length > 0 && <div style={Z.tHead}><div style={{ width: 32 }} /><div style={{ flex: 1, minWidth: 200 }}>Content</div><div style={{ width: 200 }}>Source</div><div style={{ width: 80 }}>Category</div><div style={{ width: 56 }} /></div>}
          {filtered.map(q => {
            const col = getCatColor(q.category, customCats), isSel = selected.has(q.id), isEd = editingId === q.id;
            const needsAtt = q.confidence === "low" || q.category === "Unknown";
            return (
              <div key={q.id} className="qrow" draggable={!isEd} onDragStart={() => handleDragStart(q.id)} onDragOver={e => handleDragOver(e, q.id)} onDragEnd={handleDragEnd}
                style={{ ...Z.row, ...(isSel ? { background: "#F0F7FF" } : {}), ...(q.favorite ? Z.favRow : {}), ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}), ...(dragId === q.id ? { opacity: .4 } : {}), animation: "fadeUp .25s ease" }}>
                <div className="checkbox" style={{ ...Z.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
                  <div style={{ ...Z.check, ...(isSel ? Z.checkOn : {}) }} onClick={() => toggleSel(q.id)}>{isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, paddingRight: 12, cursor: isEd ? "default" : "text" }} onClick={() => { if (!isEd) startEdit(q); }}>
                  {isEd ? <EditForm q={q} /> : <p style={Z.entryText}>{displayText(q)}</p>}
                </div>
                <div className="src-col" style={Z.srcCol}><span style={Z.srcText} title={q.source}>{q.source}</span><ConfDot q={q} /></div>
                <div style={{ width: 80 }}><span style={{ ...Z.tag, background: col.bg, color: col.text }}>{q.category}</span></div>
                <div className="row-actions" style={Z.rowAct}><FavBtn q={q} /><EditBtn q={q} /><DelBtn q={q} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* CARD VIEW */}
      {view === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
          {filtered.map(q => {
            const col = getCatColor(q.category, customCats), isSel = selected.has(q.id), isEd = editingId === q.id;
            const needsAtt = q.confidence === "low" || q.category === "Unknown";
            return (
              <div key={q.id} draggable={!isEd} onDragStart={() => handleDragStart(q.id)} onDragOver={e => handleDragOver(e, q.id)} onDragEnd={handleDragEnd}
                style={{ ...CZ.card, ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}), ...(q.favorite ? CZ.favCard : {}), ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}), ...(dragId === q.id ? { opacity: .4 } : {}), animation: "fadeUp .3s ease" }}
                onMouseEnter={e => { const a = e.currentTarget.querySelector('.ca'); if (a) a.style.opacity = 1; }}
                onMouseLeave={e => { const a = e.currentTarget.querySelector('.ca'); if (a) a.style.opacity = 0; }}>
                <div style={CZ.top}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ ...Z.check, ...(isSel ? Z.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onClick={() => toggleSel(q.id)}>{isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}</div>
                    <span style={{ ...Z.tag, background: col.bg, color: col.text }}>{q.category}</span>
                  </div>
                  <div className="ca" style={{ ...CZ.acts, ...(isMobile ? { opacity: 1 } : {}) }}><FavBtn q={q} /><EditBtn q={q} /><DelBtn q={q} /></div>
                </div>
                {isEd ? <EditForm q={q} inCard /> : (
                  <><p style={CZ.txt}>{displayText(q)}</p><div style={CZ.srcRow}><span style={{ color: "#D3D3D0" }}>—</span><span style={CZ.src}>{q.source}</span><ConfDot q={q} /></div></>
                )}
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

      <Footer />
    </div>
  );
}
