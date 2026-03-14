// ── QuotesContext — thin bridge over Zustand store ──
// Preserves the useQuotesContext() API so all consumers work unchanged.
// State, persistence, cross-tab sync, and collection helpers now live in
// the Zustand store (src/stores/quotesStore.js). This file handles:
// - Mount-time side effects (shared links, initial cloud pull)
// - Bridging the store to React context for backward compatibility
// - Toast notifications that depend on React context (ToastContext)

import { createContext, useContext, useEffect, useMemo, useCallback, useRef } from "react";
import { DEFAULT_CATEGORIES } from "../data/constants";
import { useToastContext } from "./ToastContext";
import { useQuotesStore } from "../stores/quotesStore";
import useSync from "../hooks/useSync";
import { generateId } from "../utils/uuid";
import { fetchWithTimeout } from "../utils/api";
import {
  MAX_QUOTE_TEXT_LENGTH, MAX_SOURCE_LENGTH, MAX_CATEGORY_LENGTH, MAX_SHARE_ITEMS,
  API_TIMEOUT_MS, STORAGE_WARN_BYTES,
  LS_QUOTES, LS_CATS,
  SHARE_HASH_PREFIX, PUBLIC_HASH_PREFIX,
} from "../config";

const QuotesContext = createContext(null);

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

  // ── Pull state from Zustand store ──
  const quotes = useQuotesStore(s => s.quotes);
  const customCats = useQuotesStore(s => s.customCats);
  const collections = useQuotesStore(s => s.collections);
  const columnOrder = useQuotesStore(s => s.columnOrder);
  const activeCollectionId = useQuotesStore(s => s.activeCollectionId);
  const isSharedView = useQuotesStore(s => s.isSharedView);

  // ── Pull actions from store (stable references — no useCallback needed) ──
  const setQuotes = useQuotesStore(s => s.setQuotes);
  const setCustomCats = useQuotesStore(s => s.setCustomCats);
  const setColumnOrder = useQuotesStore(s => s.setColumnOrder);
  const setActiveCollectionId = useQuotesStore(s => s.setActiveCollectionId);
  const setIsSharedView = useQuotesStore(s => s.setIsSharedView);
  const trackDeletion = useQuotesStore(s => s.trackDeletion);
  const untrackDeletion = useQuotesStore(s => s.untrackDeletion);
  const createCollection = useQuotesStore(s => s.createCollection);
  const deleteCollection = useQuotesStore(s => s.deleteCollection);
  const restoreCollection = useQuotesStore(s => s.restoreCollection);
  const renameCollection = useQuotesStore(s => s.renameCollection);
  const addToCollection = useQuotesStore(s => s.addToCollection);
  const removeFromCollection = useQuotesStore(s => s.removeFromCollection);
  const updateCollectionIcon = useQuotesStore(s => s.updateCollectionIcon);
  const cleanCollectionRefs = useQuotesStore(s => s.cleanCollectionRefs);
  const handleCloudData = useQuotesStore(s => s.handleCloudData);
  const setInitialLoading = useQuotesStore(s => s.setInitialLoading);

  const allCats = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  // ── Storage limit warning (needs toast) ──
  const storageLimitWarned = useRef(false);
  useEffect(() => {
    if (storageLimitWarned.current) return;
    const state = useQuotesStore.getState();
    if (state._storageLimitHit) {
      storageLimitWarned.current = true;
      showToast("Large collection \u2014 your data is backed up to the cloud.");
    }
  });

  // ── Cloud sync via useSync (will be replaced by TanStack Query in phase 2) ──
  const handleSyncError = useCallback((message) => {
    showToast(message);
  }, [showToast]);

  const { syncStatus, lastSynced, initialLoading, pull, schedulePush, manualPush, markReady } = useSync({
    onCloudData: handleCloudData,
    onSyncError: handleSyncError,
  });

  // ── Push to Supabase whenever quotes/categories change ──
  useEffect(() => {
    if (isSharedView) return;
    const deletedIds = useQuotesStore.getState()._deletedIds;
    if (quotes.length === 0 && deletedIds.length === 0) return;
    schedulePush(quotes, customCats, deletedIds, collections);
  }, [quotes, customCats, collections, isSharedView, schedulePush]);

  // ── Mount: shared link OR mark ready / pull from cloud ──
  useEffect(() => {
    const hash = window.location.hash.slice(1);

    // 1a. Base64 shared link
    if (hash.startsWith(SHARE_HASH_PREFIX)) {
      const decoded = safeDecodeShareData(hash.slice(SHARE_HASH_PREFIX.length));
      if (decoded?.length > 0) {
        setQuotes(decoded);
        setIsSharedView(true);
        setInitialLoading(false);
        return;
      }
      showToast("This shared link couldn't be loaded \u2014 it may be corrupted.", null, null, "error");
      try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ignore */ }
    }

    // 1b. Public collection link
    if (hash.startsWith(PUBLIC_HASH_PREFIX)) {
      const shareId = hash.slice(PUBLIC_HASH_PREFIX.length);
      if (shareId.length >= 4 && shareId.length <= 20) {
        (async () => {
          try {
            const r = await fetchWithTimeout(
              `/api/share?id=${encodeURIComponent(shareId)}`,
              {},
              API_TIMEOUT_MS,
            );
            if (r.status === 410) throw new Error("expired");
            if (r.status === 404) throw new Error("not_found");
            if (!r.ok) throw new Error("fetch_failed");

            const data = await r.json();
            if (!Array.isArray(data.quotes) || data.quotes.length === 0) {
              throw new Error("empty");
            }

            const reconstructed = data.quotes.map(q =>
              Array.isArray(q) ? validateShareQuote(q) : (q.id ? q : null)
            ).filter(Boolean);
            if (reconstructed.length === 0) throw new Error("empty");

            setQuotes(reconstructed);
            setIsSharedView(true);
            setInitialLoading(false);
            if (data.title) {
              showToast(`Viewing "${data.title}" (${reconstructed.length} entries)`);
            }
          } catch (err) {
            if (err.name === "AbortError") return;
            const msg = err.message === "expired"
              ? "This shared link has expired."
              : err.message === "not_found"
              ? "Shared collection not found."
              : err.message === "empty"
              ? "This shared collection is empty."
              : "Couldn't load this shared collection.";
            showToast(msg, null, null, "error");
            try { window.history.replaceState(null, "", window.location.pathname); } catch { /* ignore */ }
            markReady();
            pull();
          }
        })();
        return;
      }
    }

    // 2. If quotes were loaded synchronously from localStorage, mark ready
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (q?.length > 0) {
          markReady();
          pull();
          return;
        }
      }
    } catch {
      showToast("Saved session couldn't be loaded. Starting fresh.", null, null, "error");
      try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch { /* ignore */ }
    }

    // 3. No local data — pull from Supabase
    pull();
  }, [showToast, pull, markReady, setQuotes, setIsSharedView, setInitialLoading]);

  // ── Build context value ──
  // This is the same shape as before so all consumers work unchanged.
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
    createCollection, deleteCollection, restoreCollection, renameCollection,
    addToCollection, removeFromCollection, updateCollectionIcon,
    cleanCollectionRefs,
    manualPush,
  }), [quotes, customCats, columnOrder, allCats, isSharedView, syncStatus, lastSynced, initialLoading, trackDeletion,
       collections, activeCollectionId, createCollection, deleteCollection, restoreCollection, renameCollection,
       addToCollection, removeFromCollection, updateCollectionIcon, untrackDeletion, cleanCollectionRefs, manualPush]);

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
