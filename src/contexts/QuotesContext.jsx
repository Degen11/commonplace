import { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  DEFAULT_CATEGORIES, REORDERABLE_COLS, sanitizeName,
} from "../data/constants";
import { useToastContext } from "./ToastContext";
import useSync from "../hooks/useSync";
import { generateId } from "../utils/uuid";
import {
  TOMBSTONE_TTL_MS, STORAGE_WARN_BYTES, PERSIST_DEBOUNCE_MS,
  MAX_QUOTE_TEXT_LENGTH, MAX_SOURCE_LENGTH, MAX_CATEGORY_LENGTH, MAX_SHARE_ITEMS,
  API_TIMEOUT_MS,
} from "../config";

const QuotesContext = createContext(null);

const LS_QUOTES      = "commonplace_quotes";
const LS_CATS        = "commonplace_cats";
const LS_COL_ORDER   = "commonplace_col_order";
const LS_DELETED_IDS = "commonplace_deleted_ids";
const LS_COLLECTIONS = "commonplace_collections";

function validateShareQuote(raw) {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const [text, source, category, fav] = raw;
  if (typeof text !== "string" || typeof source !== "string" || typeof category !== "string") return null;
  if (text.length === 0 || text.length > MAX_QUOTE_TEXT_LENGTH) return null;
  if (source.length > MAX_SOURCE_LENGTH) return null;
  if (category.length > MAX_CATEGORY_LENGTH) return null;
  const clean = (s) => s.replace(/<[^>]*>/g, "").trim();
  return {
    id: generateId(),
    text: clean(text),
    source: clean(source),
    category: clean(category),
    confidence: "high",
    favorite: fav === 1,
    updatedAt: Date.now(),
  };
}

export function safeDecodeShareData(hash) {
  try {
    const bytes = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0 || arr.length > MAX_SHARE_ITEMS) return null;
    const validated = arr.map(validateShareQuote).filter(Boolean);
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

export function QuotesProvider({ children }) {
  const { showToast } = useToastContext();

  // Synchronously initialize from localStorage to avoid flash of input phase.
  // Shared links skip localStorage (handled in mount effect).
  const [quotes, setQuotes] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=") || hash.startsWith("p=")) return [];
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (Array.isArray(q) && q.length > 0) return q;
      }
    } catch(e) { /* mount effect handles errors */ }
    return [];
  });
  const [customCats, setCustomCats] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=") || hash.startsWith("p=")) return [];
    try {
      const saved = localStorage.getItem(LS_CATS);
      if (saved) {
        const cats = JSON.parse(saved);
        if (Array.isArray(cats)) return cats;
      }
    } catch(e) { /* ignore */ }
    return [];
  });
  const [isSharedView, setIsSharedView] = useState(false);

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

  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COLLECTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  const storageLimitWarned = useRef(false);
  const allCats = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  // Track whether initial data load (localStorage or cloud) is complete
  const initialLoadDone = useRef(false);

  // Track deleted quote IDs as tombstones for sync merge
  const [initDeletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_DELETED_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          return parsed.filter(e => e && now - e.deletedAt < TOMBSTONE_TTL_MS);
        }
      }
    } catch { /* ignore */ }
    return [];
  });
  const deletedIdsRef = useRef(initDeletedIds);

  const trackDeletion = useCallback((quoteIds) => {
    const now = Date.now();
    const newEntries = quoteIds.map(id => ({ id, deletedAt: now }));
    deletedIdsRef.current = [...deletedIdsRef.current, ...newEntries];
    try { localStorage.setItem(LS_DELETED_IDS, JSON.stringify(deletedIdsRef.current)); } catch { /* ignore */ }
  }, []);

  const untrackDeletion = useCallback((quoteIds) => {
    const idSet = new Set(quoteIds);
    deletedIdsRef.current = deletedIdsRef.current.filter(e => !idSet.has(e.id));
    try { localStorage.setItem(LS_DELETED_IDS, JSON.stringify(deletedIdsRef.current)); } catch { /* ignore */ }
  }, []);

  // ── Cloud sync ──
  const handleCloudData = useCallback((cloudQuotes, cloudCats, cloudCollections) => {
    if (!initialLoadDone.current) {
      // First load — no local data, use cloud data directly
      initialLoadDone.current = true;
      setQuotes(cloudQuotes);
      setCustomCats(cloudCats);
      if (cloudCollections?.length > 0) setCollections(cloudCollections);
      try {
        localStorage.setItem(LS_QUOTES, JSON.stringify(cloudQuotes));
        localStorage.setItem(LS_CATS, JSON.stringify(cloudCats));
        if (cloudCollections?.length > 0) localStorage.setItem(LS_COLLECTIONS, JSON.stringify(cloudCollections));
      } catch(e) { /* ignore */ }
      return;
    }

    // Returning user — merge cloud quotes into local state.
    // Adds missing quotes AND updates existing ones when the cloud version is newer.
    if (cloudQuotes?.length > 0) {
      setQuotes(prev => {
        const localMap = new Map(prev.map(q => [q.id, q]));
        let changed = false;
        const missing = [];
        for (const cq of cloudQuotes) {
          const local = localMap.get(cq.id);
          if (!local) {
            missing.push(cq);
            changed = true;
          } else if ((cq.updatedAt || 0) > (local.updatedAt || 0)) {
            localMap.set(cq.id, cq);
            changed = true;
          }
        }
        if (!changed) return prev;
        // Rebuild array: update in place + append missing
        const updated = prev.map(q => localMap.get(q.id));
        return missing.length > 0 ? [...updated, ...missing] : updated;
      });
    }
    if (cloudCats?.length > 0) {
      setCustomCats(prev => {
        const catSet = new Set(prev);
        const newCats = cloudCats.filter(c => !catSet.has(c));
        return newCats.length > 0 ? [...prev, ...newCats] : prev;
      });
    }
    if (cloudCollections?.length > 0) {
      setCollections(prev => {
        const localMap = new Map(prev.map(c => [c.id, c]));
        let changed = false;
        const missing = [];
        for (const cc of cloudCollections) {
          const local = localMap.get(cc.id);
          if (!local) {
            missing.push(cc);
            changed = true;
          } else if ((cc.createdAt || 0) > (local.createdAt || 0)) {
            localMap.set(cc.id, cc);
            changed = true;
          }
        }
        if (!changed) return prev;
        const updated = prev.map(c => localMap.get(c.id));
        return missing.length > 0 ? [...updated, ...missing] : updated;
      });
    }
  }, []);

  const handleSyncError = useCallback((message) => {
    showToast(message);
  }, [showToast]);

  const { syncStatus, lastSynced, initialLoading, pull, schedulePush, manualPush, markReady } = useSync({
    onCloudData: handleCloudData,
    onSyncError: handleSyncError,
  });

  // ── Debounced persistence to localStorage ──
  const saveTimerRef = useRef(null);

  const persistQuotes = useCallback((q, cats, shared) => {
    if (q.length === 0 || shared) return;
    try {
      const data = JSON.stringify(q);
      const catsData = JSON.stringify(cats);
      const totalSize = data.length + catsData.length;

      if (!storageLimitWarned.current && totalSize > STORAGE_WARN_BYTES) {
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
    }, PERSIST_DEBOUNCE_MS);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [quotes, customCats, isSharedView, persistQuotes]);

  // ── Push to Supabase whenever quotes/categories change ──
  useEffect(() => {
    if (isSharedView) return;
    if (quotes.length === 0 && deletedIdsRef.current.length === 0) return;
    schedulePush(quotes, customCats, deletedIdsRef.current, collections);
  }, [quotes, customCats, collections, isSharedView, schedulePush]);

  // Persist column order
  useEffect(() => {
    try { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)); } catch(e) { /* ignore */ }
  }, [columnOrder]);

  // Persist collections
  useEffect(() => {
    try { localStorage.setItem(LS_COLLECTIONS, JSON.stringify(collections)); } catch(e) { /* ignore */ }
  }, [collections]);

  // ── Collection helpers ──
  const createCollection = useCallback((name) => {
    const sanitized = sanitizeName(name);
    if (!sanitized) return { error: "invalid" };
    // Check inside the state setter to avoid race conditions with rapid calls
    let newCol = null;
    let duplicate = false;
    setCollections(prev => {
      if (prev.some(c => c.name.toLowerCase() === sanitized.toLowerCase())) {
        duplicate = true;
        return prev;
      }
      newCol = { id: generateId(), name: sanitized, quoteIds: [], createdAt: Date.now() };
      return [...prev, newCol];
    });
    if (duplicate) return { error: "duplicate", name: sanitized };
    return newCol;
  }, []);

  const deleteCollection = useCallback((id) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    setActiveCollectionId(prev => prev === id ? null : prev);
  }, []);

  const renameCollection = useCallback((id, name) => {
    const sanitized = sanitizeName(name);
    if (!sanitized) return;
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name: sanitized } : c));
  }, []);

  const addToCollection = useCallback((collectionId, quoteIds) => {
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      const existing = new Set(c.quoteIds);
      const newIds = quoteIds.filter(id => !existing.has(id));
      if (newIds.length === 0) return c;
      return { ...c, quoteIds: [...c.quoteIds, ...newIds] };
    }));
  }, []);

  const removeFromCollection = useCallback((collectionId, quoteIds) => {
    const toRemove = new Set(quoteIds);
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      return { ...c, quoteIds: c.quoteIds.filter(id => !toRemove.has(id)) };
    }));
  }, []);

  const updateCollectionIcon = useCallback((id, icon) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, icon } : c));
  }, []);

  // Remove deleted quote IDs from all collection quoteIds arrays
  const cleanCollectionRefs = useCallback((deletedQuoteIds) => {
    const toRemove = new Set(deletedQuoteIds);
    setCollections(prev => {
      let changed = false;
      const next = prev.map(c => {
        const filtered = c.quoteIds.filter(id => !toRemove.has(id));
        if (filtered.length !== c.quoteIds.length) { changed = true; return { ...c, quoteIds: filtered }; }
        return c;
      });
      return changed ? next : prev;
    });
  }, []);

  // ── Cross-tab storage sync ──
  // When another tab writes to localStorage, pick up the changes.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === LS_QUOTES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setQuotes(parsed);
        } catch { /* ignore corrupt data */ }
      } else if (e.key === LS_CATS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCustomCats(parsed);
        } catch { /* ignore */ }
      } else if (e.key === LS_COLLECTIONS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCollections(parsed);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ── Mount: shared link OR mark ready / pull from cloud ──
  useEffect(() => {
    // 1a. Check for base64 shared link
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

    // 1b. Check for public collection link
    if (hash.startsWith("p=")) {
      const shareId = hash.slice(2);
      if (shareId.length >= 4 && shareId.length <= 20) {
        const controller = new AbortController();
        fetch(`/api/share?id=${encodeURIComponent(shareId)}`, {
          signal: controller.signal,
        })
          .then(r => {
            if (r.status === 410) throw new Error("expired");
            if (r.status === 404) throw new Error("not_found");
            if (!r.ok) throw new Error("fetch_failed");
            return r.json();
          })
          .then(data => {
            if (!Array.isArray(data.quotes) || data.quotes.length === 0) {
              throw new Error("empty");
            }
            // Reconstruct full quote objects from minimal arrays
            const reconstructed = data.quotes.map(q => {
              if (Array.isArray(q)) {
                return validateShareQuote(q);
              }
              // Already a full object (future-proofing)
              return q.id ? q : null;
            }).filter(Boolean);
            if (reconstructed.length === 0) throw new Error("empty");
            setQuotes(reconstructed);
            setIsSharedView(true);
            initialLoadDone.current = true;
            if (data.title) {
              showToast(`Viewing "${data.title}" (${reconstructed.length} entries)`);
            }
          })
          .catch(err => {
            const msg = err.message === "expired"
              ? "This shared link has expired."
              : err.message === "not_found"
              ? "Shared collection not found."
              : err.message === "empty"
              ? "This shared collection is empty."
              : "Couldn't load this shared collection.";
            showToast(msg);
            try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ignore */ }
            // Fall through to normal load
            markReady();
            pull();
          });
        setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        return;
      }
    }

    // 2. If quotes were loaded synchronously from localStorage, mark ready
    //    and background-pull to pick up any quotes missing locally.
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (q?.length > 0) {
          initialLoadDone.current = true;
          markReady();
          pull();
          return;
        }
      }
    } catch(e) {
      showToast("Saved session couldn't be loaded. Starting fresh.");
      try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch(e2) { /* ignore */ }
    }

    // 3. No local data — try to pull from Supabase (auto-restores via handleCloudData)
    pull();
  }, [showToast, pull, markReady]);

  const value = useMemo(() => ({
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
  }), [quotes, customCats, columnOrder, allCats, isSharedView, syncStatus, lastSynced, initialLoading, trackDeletion,
       collections, activeCollectionId, createCollection, deleteCollection, renameCollection, addToCollection, removeFromCollection, updateCollectionIcon, untrackDeletion, cleanCollectionRefs, manualPush]);

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
