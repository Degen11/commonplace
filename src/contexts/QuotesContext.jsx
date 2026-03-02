import { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_CATEGORIES, REORDERABLE_COLS,
} from "../data/constants";
import { useToastContext } from "./ToastContext";
import useSync from "../hooks/useSync";

const QuotesContext = createContext(null);

const LS_QUOTES    = "commonplace_quotes";
const LS_CATS      = "commonplace_cats";
const LS_COL_ORDER = "commonplace_col_order";

// localStorage is now a local cache; Supabase is the durable store.
// We still warn at 4 MB but no longer hard-refuse writes — the data
// is safe in the cloud even if localStorage fills up.
const STORAGE_WARN_THRESHOLD = 4 * 1024 * 1024;

function validateShareQuote(raw) {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const [text, source, category, fav] = raw;
  if (typeof text !== "string" || typeof source !== "string" || typeof category !== "string") return null;
  if (text.length === 0 || text.length > 5000) return null;
  if (source.length > 500) return null;
  if (category.length > 100) return null;
  const clean = (s) => s.replace(/<[^>]*>/g, "").trim();
  return {
    id: crypto.randomUUID(),
    text: clean(text),
    source: clean(source),
    category: clean(category),
    confidence: "high",
    favorite: fav === 1,
  };
}

export function safeDecodeShareData(hash) {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0 || arr.length > 10000) return null;
    const validated = arr.map(validateShareQuote).filter(Boolean);
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

export function QuotesProvider({ children }) {
  const { showToast } = useToastContext();

  const [quotes, setQuotes]           = useState([]);
  const [customCats, setCustomCats]   = useState([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === REORDERABLE_COLS.length &&
            REORDERABLE_COLS.every(c => parsed.includes(c))) return parsed;
      }
    } catch(e) { /* ignore */ }
    return [...REORDERABLE_COLS];
  });

  const storageLimitWarned = useRef(false);
  const allCats = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  // Track whether initial data load (localStorage or cloud) is complete
  const initialLoadDone = useRef(false);

  // ── Cloud sync ──
  const handleCloudData = useCallback((cloudQuotes, cloudCats) => {
    // Only use cloud data if localStorage was empty (cloud = backup)
    // This runs before savedSession is shown, so we check quotes state
    if (initialLoadDone.current) return; // Already loaded from localStorage

    setQuotes(cloudQuotes);
    setCustomCats(cloudCats);
    // Also write to localStorage as cache
    try {
      localStorage.setItem(LS_QUOTES, JSON.stringify(cloudQuotes));
      localStorage.setItem(LS_CATS, JSON.stringify(cloudCats));
    } catch(e) { /* ignore */ }
    setSavedSession({ quotes: cloudQuotes, customCats: cloudCats, fromCloud: true });
  }, []);

  const { syncStatus, lastSynced, pull, schedulePush } = useSync({
    onCloudData: handleCloudData,
  });

  // ── Debounced persistence to localStorage ──
  const saveTimerRef = useRef(null);

  const persistQuotes = useCallback((q, cats, shared) => {
    if (q.length === 0 || shared) return;
    try {
      const data = JSON.stringify(q);
      const catsData = JSON.stringify(cats);
      const totalSize = data.length + catsData.length;

      if (!storageLimitWarned.current && totalSize > STORAGE_WARN_THRESHOLD) {
        storageLimitWarned.current = true;
        showToast("Large collection \u2014 your data is backed up to the cloud.");
      }

      localStorage.setItem(LS_QUOTES, data);
      localStorage.setItem(LS_CATS, catsData);
    } catch(e) {
      // localStorage full — that's fine, data is in Supabase
    }
  }, [showToast]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistQuotes(quotes, customCats, isSharedView);
    }, 300);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [quotes, customCats, isSharedView, persistQuotes]);

  // ── Push to Supabase whenever quotes/categories change ──
  useEffect(() => {
    if (isSharedView) return;
    if (quotes.length === 0) return;
    schedulePush(quotes, customCats);
  }, [quotes, customCats, isSharedView, schedulePush]);

  // Persist column order
  useEffect(() => {
    try { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)); } catch(e) { /* ignore */ }
  }, [columnOrder]);

  // ── Mount: shared link OR restore session ──
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = safeDecodeShareData(hash.slice(2));
      if (decoded?.length > 0) {
        setQuotes(decoded); setIsSharedView(true);
        initialLoadDone.current = true;
        return;
      }
      showToast("This shared link couldn't be loaded \u2014 it may be corrupted.");
      try { window.history.replaceState(null, "", window.location.pathname); } catch(e) { /* ignore */ }
    }
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (q?.length > 0) {
          const cats = JSON.parse(localStorage.getItem(LS_CATS) || "[]");
          initialLoadDone.current = true;
          setSavedSession({ quotes: q, customCats: cats });
          return;
        }
      }
    } catch(e) {
      showToast("Saved session couldn't be loaded. Starting fresh.");
      try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch(e2) { /* ignore */ }
    }

    // No local data — try to pull from Supabase
    pull();
  }, [showToast, pull]);

  const value = useMemo(() => ({
    quotes, setQuotes,
    customCats, setCustomCats,
    columnOrder, setColumnOrder,
    allCats,
    isSharedView, setIsSharedView,
    savedSession, setSavedSession,
    syncStatus,
    lastSynced,
  }), [quotes, customCats, columnOrder, allCats, isSharedView, savedSession, syncStatus, lastSynced]);

  return (
    <QuotesContext.Provider value={value}>
      {children}
    </QuotesContext.Provider>
  );
}

export function useQuotesContext() {
  const ctx = useContext(QuotesContext);
  if (!ctx) throw new Error("useQuotesContext must be used within QuotesProvider");
  return ctx;
}
