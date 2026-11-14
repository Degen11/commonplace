// ── Cloud sync hook — TanStack Query edition ──
// Replaces hand-rolled retry/backoff/debounce/ref patterns with
// TanStack Query's built-in mutation retry and query caching.
//
// External API: { deviceId, pull, schedulePush, manualPush, markReady }
// syncStatus, lastSynced, initialLoading are written directly to the Zustand
// store — consumers read them via useQuotesStore.

import { useRef, useCallback, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateId } from "../utils/uuid";
import { useQuotesStore } from "../stores/quotesStore";
import {
  SYNC_DEBOUNCE_MS, SYNC_MAX_RETRIES, SYNC_INITIAL_DELAY_MS,
  SYNC_ERROR_THROTTLE_MS, LS_DEVICE_ID, LS_SYNC_ENGAGED,
} from "../config";
import { loadString, saveString } from "../utils/storage";
import { apiRequest } from "../utils/api";

function getOrCreateDeviceId() {
  const existing = loadString(LS_DEVICE_ID);
  if (existing) return existing;
  const id = generateId();
  // If the write fails (private mode, quota), sync is disabled for the session
  return saveString(LS_DEVICE_ID, id) ? id : null;
}

const deviceId = getOrCreateDeviceId();

// ── API functions (pure, no hooks) ──

async function fetchSyncData() {
  if (!deviceId) return null;
  // Header, not query string: the device ID is the credential for this data,
  // and URLs end up in request logs.
  try {
    return await apiRequest("/api/sync", { headers: { "X-Device-Id": deviceId } });
  } catch (err) {
    if (err.status) return null;
    throw err;
  }
}

async function pushSyncData(payload) {
  return apiRequest("/api/sync", { body: { device_id: deviceId, ...payload } });
}

// ── Hook ──

export default function useSync({ onCloudData, onSyncError }) {
  const queryClient = useQueryClient();
  const setSyncStatus = useQuotesStore(s => s.setSyncStatus);
  const setLastSynced = useQuotesStore(s => s.setLastSynced);
  const setInitialLoading = useQuotesStore(s => s.setInitialLoading);
  const initialLoadDone = useRef(false);
  const pushTimer = useRef(null);
  const lastErrorNotified = useRef(0);
  const consecutiveFailures = useRef(0);

  // Latest store data — schedulePush updates it, the push timer reads it.
  const latestData = useRef(null);
  // What the cloud already has from this device, so a routine push can send
  // only the quotes that changed instead of the whole collection. Quotes are
  // never mutated in place (every edit spreads a new object), so a reference
  // check is an exact "changed since last push" test. The server merges by ID,
  // so a partial list is safe; deletions travel separately as tombstones.
  const pushedQuotes = useRef(new Map());
  const pushedMeta = useRef(null);

  const markReady = useCallback(() => {
    initialLoadDone.current = true;
    setInitialLoading(false);
  }, [setInitialLoading]);

  const pull = useCallback(async () => {
    if (!deviceId) return;
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["sync", "pull"],
        queryFn: fetchSyncData,
        staleTime: 0, // Force fresh fetch
      });
      if (result?.quotes?.length > 0) {
        onCloudData(result.quotes, result.customCategories || [], result.collections || []);
        // Restoring quotes from the cloud means sync is doing real work for
        // this user (a returning or linked device) — from here on a failed
        // backup is worth surfacing as an error rather than staying silent.
        saveString(LS_SYNC_ENGAGED, "1");
      }
      initialLoadDone.current = true;
    } catch {
      setSyncStatus("error");
    } finally {
      setInitialLoading(false);
    }
  }, [onCloudData, queryClient, setSyncStatus, setInitialLoading]);

  // ── Push: TanStack Query mutation with exponential backoff ──
  const pushMutation = useMutation({
    mutationFn: ({ payload }) => pushSyncData(payload),
    retry: SYNC_MAX_RETRIES,
    retryDelay: (attempt) => SYNC_INITIAL_DELAY_MS * Math.pow(2, attempt),
    onMutate: () => {
      // Optimistic: show "synced" immediately so the UI feels instant
      setSyncStatus("synced");
      setLastSynced(new Date());
    },
    onSuccess: (_data, { sent, meta }) => {
      // Confirm the optimistic update
      consecutiveFailures.current = 0;
      for (const q of sent) pushedQuotes.current.set(q.id, q);
      pushedMeta.current = meta;
    },
    onError: () => {
      setSyncStatus("error");
      consecutiveFailures.current++;

      // Nobody explicitly asked for cloud sync — it's a silent best-effort
      // backup from the first device. Don't toast about it failing unless
      // the user has actually engaged with sync (see SyncPill for the same
      // gate on the header pill); still log it so it's visible in devtools.
      if (loadString(LS_SYNC_ENGAGED) !== "1") {
        console.warn("[Commonplace] Background sync failed (not yet surfaced — sync not engaged).");
        return;
      }

      const now = Date.now();
      if (now - lastErrorNotified.current > SYNC_ERROR_THROTTLE_MS) {
        lastErrorNotified.current = now;
        if (onSyncError) {
          onSyncError(
            consecutiveFailures.current > 1
              ? "Cloud backup unavailable \u2014 your data is saved locally."
              : "Couldn't back up to cloud \u2014 will retry on next change."
          );
        }
      }
    },
  });

  // mutate is a stable reference in TanStack Query v5 (the mutation object is not) —
  // destructure it so the callbacks below can list it as a dep without churning
  const { mutate: pushMutate } = pushMutation;

  // Build a push from the latest data. `full` sends every quote (manual sync,
  // reconnects); otherwise only quotes the cloud hasn't seen this version of.
  // Returns null when there's nothing to send.
  const buildPush = useCallback((full) => {
    const d = latestData.current;
    if (!d) return null;
    const { quotes, customCats, deletedIds, collections } = d;
    // Never push an empty collection: it would wipe the cloud copy
    if (quotes.length === 0 && !deletedIds?.length) return null;

    const sent = full ? quotes : quotes.filter(q => pushedQuotes.current.get(q.id) !== q);
    const meta = { customCats, collections, deletedIds };
    const prev = pushedMeta.current;
    const metaChanged = !prev || prev.customCats !== customCats
      || prev.collections !== collections || prev.deletedIds !== deletedIds;
    if (!full && sent.length === 0 && !metaChanged) return null;

    const payload = {
      quotes: sent,
      customCategories: customCats,
      collections: collections || [],
    };
    if (deletedIds?.length > 0) payload.deletedIds = deletedIds;
    return { payload, sent, meta };
  }, []);

  // ── Debounced push — same API as before ──
  const schedulePush = useCallback((quotes, customCats, deletedIds, collections) => {
    latestData.current = { quotes, customCats, deletedIds, collections };

    // Debounce: clear pending push, schedule new one
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (!initialLoadDone.current) return;
      if (!deviceId) return;
      const push = buildPush(false);
      if (push) pushMutate(push);
    }, SYNC_DEBOUNCE_MS);
  }, [pushMutate, buildPush]);

  // Manual sync — push everything immediately with fresh retries
  const manualPush = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    consecutiveFailures.current = 0;
    const push = buildPush(true);
    if (push) pushMutate(push);
  }, [pushMutate, buildPush]);

  // Register manualPush in Zustand store so components can access it directly
  const setManualPush = useQuotesStore(s => s.setManualPush);
  useEffect(() => { setManualPush(manualPush); }, [manualPush, setManualPush]);

  // Sync when coming back online
  useEffect(() => {
    // Full push: anything that failed while offline goes up in one go
    const handleOnline = () => {
      if (!initialLoadDone.current) return;
      const push = buildPush(true);
      if (push) pushMutate(push);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [pushMutate, buildPush]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, []);

  return {
    deviceId,
    pull,
    schedulePush,
    manualPush,
    markReady,
  };
}
