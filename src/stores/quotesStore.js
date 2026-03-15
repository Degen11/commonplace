// ── Zustand store for quotes, collections, and sync state ──
// Replaces QuotesContext's React Context + useState + useRef patterns.
//
// Key benefits over the old Context:
// - Selective re-renders: components subscribe to individual slices
// - No stale closures: getState() always returns current values
// - Built-in persist middleware replaces manual localStorage debounce
// - No Provider wrapper needed

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { DEFAULT_CATEGORIES, REORDERABLE_COLS, sanitizeName } from "../data/constants";
import { generateId } from "../utils/uuid";
import { mergeByTimestamp } from "../utils/sync";
import {
  TOMBSTONE_TTL_MS, STORAGE_WARN_BYTES,
  MAX_QUOTE_TEXT_LENGTH, MAX_SOURCE_LENGTH, MAX_CATEGORY_LENGTH,
  LS_QUOTES, LS_CATS, LS_COL_ORDER, LS_DELETED_IDS, LS_COLLECTIONS,
  PERSIST_DEBOUNCE_MS,
  SHARE_HASH_PREFIX, PUBLIC_HASH_PREFIX,
} from "../config";
import { loadFromStorage, saveToStorage } from "../utils/storage";

// ── Helpers ──

function isShareHash() {
  const hash = window.location.hash.slice(1);
  return hash.startsWith(SHARE_HASH_PREFIX) || hash.startsWith(PUBLIC_HASH_PREFIX);
}

function loadDeletedIds() {
  const now = Date.now();
  return loadFromStorage(LS_DELETED_IDS, Array.isArray)
    .filter(e => e && now - e.deletedAt < TOMBSTONE_TTL_MS);
}

// ── Debounced localStorage persistence ──
// Zustand's built-in persist middleware serializes the entire store.
// We need fine-grained control: persist only specific keys, debounced,
// and skip writes for shared views. This custom subscriber handles it.

let persistTimer = null;

// Memoization for allCats getter — avoids creating a new array on every access
let _allCatsSrc = null;
let _allCatsCache = null;

function schedulePersist(state) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (state.isSharedView || state.quotes.length === 0) return;
    try {
      const quotesJson = JSON.stringify(state.quotes);
      const catsJson = JSON.stringify(state.customCats);

      // Warn if approaching localStorage limits
      if (quotesJson.length + catsJson.length > STORAGE_WARN_BYTES) {
        useQuotesStore.setState({ _storageLimitHit: true });
      }

      localStorage.setItem(LS_QUOTES, quotesJson);
      localStorage.setItem(LS_CATS, catsJson);
    } catch { /* localStorage full — Supabase is the backup */ }
  }, PERSIST_DEBOUNCE_MS);
}

// ── Store ──

export const useQuotesStore = create(
  subscribeWithSelector((set, get) => ({
    // ── Core data ──
    quotes: isShareHash() ? [] : loadFromStorage(LS_QUOTES, a => Array.isArray(a) && a.length > 0),
    customCats: isShareHash() ? [] : loadFromStorage(LS_CATS),
    columnOrder: loadFromStorage(
      LS_COL_ORDER,
      p => Array.isArray(p) && p.length === REORDERABLE_COLS.length && REORDERABLE_COLS.every(c => p.includes(c)),
      () => [...REORDERABLE_COLS],
    ),
    collections: loadFromStorage(LS_COLLECTIONS),
    activeCollectionId: null,

    // ── Shared view state ──
    isSharedView: false,

    // ── Sync state (managed by TanStack Query, exposed here for UI) ──
    syncStatus: "idle",
    lastSynced: null,
    initialLoading: true,

    // ── Deletion tombstones ──
    _deletedIds: loadDeletedIds(),
    _storageLimitHit: false,

    // ── Derived (memoized — returns same reference unless customCats changes) ──
    get allCats() {
      const customCats = get().customCats;
      if (customCats !== _allCatsSrc) {
        _allCatsSrc = customCats;
        _allCatsCache = [...DEFAULT_CATEGORIES, ...customCats];
      }
      return _allCatsCache;
    },

    // ── Quote setters ──
    // Accepts either a new array or a functional updater (prev => next),
    // matching React's setState API so existing hooks work unchanged.
    setQuotes: (updater) => {
      set(state => {
        const next = typeof updater === "function" ? updater(state.quotes) : updater;
        return { quotes: next };
      });
    },

    setCustomCats: (updater) => {
      set(state => {
        const next = typeof updater === "function" ? updater(state.customCats) : updater;
        return { customCats: next };
      });
    },

    setColumnOrder: (updater) => {
      set(state => {
        const next = typeof updater === "function" ? updater(state.columnOrder) : updater;
        saveToStorage(LS_COL_ORDER, next);
        return { columnOrder: next };
      });
    },

    setActiveCollectionId: (updater) => {
      set(state => {
        const next = typeof updater === "function" ? updater(state.activeCollectionId) : updater;
        return { activeCollectionId: next };
      });
    },

    setIsSharedView: (v) => set({ isSharedView: v }),

    // ── Sync state setters (called by TanStack Query hooks) ──
    setSyncStatus: (status) => set({ syncStatus: status }),
    setLastSynced: (date) => set({ lastSynced: date }),
    setInitialLoading: (v) => set({ initialLoading: v }),

    // ── Deletion tombstones ──
    trackDeletion: (quoteIds) => {
      const now = Date.now();
      const newEntries = quoteIds.map(id => ({ id, deletedAt: now }));
      set(state => {
        const next = [...state._deletedIds, ...newEntries];
        saveToStorage(LS_DELETED_IDS, next);
        return { _deletedIds: next };
      });
    },

    untrackDeletion: (quoteIds) => {
      const idSet = new Set(quoteIds);
      set(state => {
        const next = state._deletedIds.filter(e => !idSet.has(e.id));
        saveToStorage(LS_DELETED_IDS, next);
        return { _deletedIds: next };
      });
    },

    getDeletedIds: () => get()._deletedIds,

    // ── Cloud sync merge ──
    handleCloudData: (cloudQuotes, cloudCats, cloudCollections) => {
      const state = get();

      // First load — no local data
      if (state.initialLoading && state.quotes.length === 0) {
        set({
          quotes: cloudQuotes,
          customCats: cloudCats,
          initialLoading: false,
        });
        if (cloudCollections?.length > 0) {
          set({ collections: cloudCollections });
          saveToStorage(LS_COLLECTIONS, cloudCollections);
        }
        saveToStorage(LS_QUOTES, cloudQuotes);
        saveToStorage(LS_CATS, cloudCats);
        return;
      }

      // Returning user — merge
      set(state => {
        const updates = {};
        if (cloudQuotes?.length > 0) {
          updates.quotes = mergeByTimestamp(state.quotes, cloudQuotes, "updatedAt");
        }
        if (cloudCats?.length > 0) {
          const catSet = new Set(state.customCats);
          const newCats = cloudCats.filter(c => !catSet.has(c));
          if (newCats.length > 0) {
            updates.customCats = [...state.customCats, ...newCats];
          }
        }
        if (cloudCollections?.length > 0) {
          updates.collections = mergeByTimestamp(state.collections, cloudCollections, "createdAt");
        }
        return updates;
      });
    },

    // ── Collection helpers ──
    createCollection: (name) => {
      const sanitized = sanitizeName(name);
      if (!sanitized) return { error: "invalid" };

      let result = null;
      set(state => {
        if (state.collections.some(c => c.name.toLowerCase() === sanitized.toLowerCase())) {
          result = { error: "duplicate", name: sanitized };
          return state;
        }
        const newCol = { id: generateId(), name: sanitized, quoteIds: [], createdAt: Date.now() };
        result = newCol;
        return { collections: [...state.collections, newCol] };
      });
      return result;
    },

    deleteCollection: (id) => {
      set(state => ({
        collections: state.collections.filter(c => c.id !== id),
        activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId,
      }));
    },

    restoreCollection: (col) => {
      set(state => {
        if (state.collections.some(c => c.id === col.id)) return state;
        return { collections: [...state.collections, col] };
      });
    },

    renameCollection: (id, name) => {
      const sanitized = sanitizeName(name);
      if (!sanitized) return;
      set(state => ({
        collections: state.collections.map(c => c.id === id ? { ...c, name: sanitized } : c),
      }));
    },

    addToCollection: (collectionId, quoteIds) => {
      set(state => ({
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          const existing = new Set(c.quoteIds);
          const newIds = quoteIds.filter(id => !existing.has(id));
          if (newIds.length === 0) return c;
          return { ...c, quoteIds: [...c.quoteIds, ...newIds] };
        }),
      }));
    },

    removeFromCollection: (collectionId, quoteIds) => {
      const toRemove = new Set(quoteIds);
      set(state => ({
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          return { ...c, quoteIds: c.quoteIds.filter(id => !toRemove.has(id)) };
        }),
      }));
    },

    updateCollectionIcon: (id, icon) => {
      set(state => ({
        collections: state.collections.map(c => c.id === id ? { ...c, icon } : c),
      }));
    },

    cleanCollectionRefs: (deletedQuoteIds) => {
      const toRemove = new Set(deletedQuoteIds);
      set(state => {
        let changed = false;
        const next = state.collections.map(c => {
          const filtered = c.quoteIds.filter(id => !toRemove.has(id));
          if (filtered.length !== c.quoteIds.length) { changed = true; return { ...c, quoteIds: filtered }; }
          return c;
        });
        return changed ? { collections: next } : {};
      });
    },
  })),
);

// ── Persistence subscribers ──
// These fire when specific slices change, replacing the useEffect-based
// persistence in the old QuotesContext.

useQuotesStore.subscribe(
  state => ({ quotes: state.quotes, customCats: state.customCats, isSharedView: state.isSharedView }),
  (current) => schedulePersist(useQuotesStore.getState()),
  { equalityFn: (a, b) => a.quotes === b.quotes && a.customCats === b.customCats },
);

useQuotesStore.subscribe(
  state => state.collections,
  (collections) => { saveToStorage(LS_COLLECTIONS, collections); },
);

// ── Cross-tab sync ──
// When another tab writes to localStorage, pick up the changes.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    try {
      if (e.key === LS_QUOTES && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) useQuotesStore.setState({ quotes: parsed });
      } else if (e.key === LS_CATS && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) useQuotesStore.setState({ customCats: parsed });
      } else if (e.key === LS_COLLECTIONS && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) useQuotesStore.setState({ collections: parsed });
      }
    } catch { /* ignore corrupt data */ }
  });
}

// ── Selector helpers ──
// Use these in components for fine-grained subscriptions.
// Example: const quotes = useQuotesStore(selectQuotes)
export const selectQuotes = s => s.quotes;
export const selectCustomCats = s => s.customCats;
export const selectCollections = s => s.collections;
export const selectSyncStatus = s => s.syncStatus;
export const selectLastSynced = s => s.lastSynced;
export const selectInitialLoading = s => s.initialLoading;
export const selectIsSharedView = s => s.isSharedView;
export const selectActiveCollectionId = s => s.activeCollectionId;
export const selectColumnOrder = s => s.columnOrder;
