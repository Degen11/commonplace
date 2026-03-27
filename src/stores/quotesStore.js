// ── Zustand store for quotes, collections, and sync state ──
// Replaces QuotesContext's React Context + useState + useRef patterns.
//
// Key benefits over the old Context:
// - Selective re-renders: components subscribe to individual slices
// - No stale closures: getState() always returns current values
// - Built-in persist middleware replaces manual localStorage debounce
// - No Provider wrapper needed

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { REORDERABLE_COLS, sanitizeName } from "../data/constants";
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
    .filter(e => e && typeof e.deletedAt === 'number' && now - e.deletedAt < TOMBSTONE_TTL_MS);
}

// ── Debounced localStorage persistence ──
// Zustand's built-in persist middleware serializes the entire store.
// We need fine-grained control: persist only specific keys, debounced,
// and skip writes for shared views. This custom subscriber handles it.

let persistTimer = null;

function schedulePersist(state) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (state.isSharedView) return;
    try {
      if (state.quotes.length === 0) {
        // Clear stored quotes so they don't resurrect on next load
        localStorage.removeItem(LS_QUOTES);
        localStorage.removeItem(LS_CATS);
        return;
      }
      const quotesJson = JSON.stringify(state.quotes);
      const catsJson = JSON.stringify(state.customCats);

      // Warn if approaching localStorage limits
      if (quotesJson.length + catsJson.length > STORAGE_WARN_BYTES) {
        // Flag will be read by components that show toasts
        state._storageLimitHit = true;
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
    quotes: isShareHash() ? [] : loadFromStorage(LS_QUOTES, a => Array.isArray(a) && a.length > 0)
      .filter(q => q && typeof q.id === 'string' && typeof q.text === 'string'),
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
      const tombstoneIds = new Set(state._deletedIds.map(e => e.id));

      // Filter out locally-deleted quotes from incoming cloud data
      const filteredCloudQuotes = tombstoneIds.size > 0 && cloudQuotes?.length > 0
        ? cloudQuotes.filter(q => !tombstoneIds.has(q.id))
        : cloudQuotes;

      // First load — no local data
      if (state.initialLoading && state.quotes.length === 0) {
        const updates = {
          quotes: filteredCloudQuotes || [],
          customCats: cloudCats || [],
          initialLoading: false,
        };
        if (cloudCollections?.length > 0) {
          updates.collections = cloudCollections;
          saveToStorage(LS_COLLECTIONS, cloudCollections);
        }
        set(updates);
        saveToStorage(LS_QUOTES, updates.quotes);
        saveToStorage(LS_CATS, updates.customCats);
        return;
      }

      // Returning user — merge
      set(state => {
        const updates = {};
        if (filteredCloudQuotes?.length > 0) {
          updates.quotes = mergeByTimestamp(state.quotes, filteredCloudQuotes, "updatedAt");
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
  state => ({ quotes: state.quotes, customCats: state.customCats }),
  () => schedulePersist(useQuotesStore.getState()),
  { equalityFn: (a, b) => a.quotes === b.quotes && a.customCats === b.customCats },
);

useQuotesStore.subscribe(
  state => state.collections,
  (collections) => { saveToStorage(LS_COLLECTIONS, collections); },
);

// ── Cross-tab sync ──
// When another tab writes to localStorage, merge changes into current state
// instead of blindly overwriting (which would lose in-flight local edits).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    try {
      if (e.key === LS_QUOTES && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          // Apply the same validation as initial load (line 76) — cross-tab
          // writes can contain malformed entries from bad imports or extensions.
          const valid = parsed.filter(q => q && typeof q.id === 'string' && typeof q.text === 'string');
          if (valid.length === 0) return;
          useQuotesStore.setState(state => {
            const merged = mergeByTimestamp(state.quotes, valid, "updatedAt");
            return merged !== state.quotes ? { quotes: merged } : {};
          });
        }
      } else if (e.key === LS_CATS && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          useQuotesStore.setState(state => {
            const existing = new Set(state.customCats);
            const incoming = parsed.filter(c => !existing.has(c));
            return incoming.length > 0
              ? { customCats: [...state.customCats, ...incoming] }
              : {};
          });
        }
      } else if (e.key === LS_COLLECTIONS && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          useQuotesStore.setState(state => {
            const merged = mergeByTimestamp(state.collections, parsed, "createdAt");
            return merged !== state.collections ? { collections: merged } : {};
          });
        }
      } else if (e.key === LS_DELETED_IDS && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          useQuotesStore.setState(state => {
            const existing = new Set(state._deletedIds.map(entry => entry.id));
            const incoming = parsed.filter(entry => entry?.id && !existing.has(entry.id));
            if (incoming.length === 0) return {};
            const merged = [...state._deletedIds, ...incoming];
            const deletedSet = new Set(incoming.map(entry => entry.id));
            const quotes = state.quotes.filter(q => !deletedSet.has(q.id));
            return {
              _deletedIds: merged,
              ...(quotes.length !== state.quotes.length ? { quotes } : {}),
            };
          });
        }
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
