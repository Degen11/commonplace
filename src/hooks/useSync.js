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
  const r = await fetch(`/api/sync?device_id=${deviceId}`, {
    headers: { "X-Requested-With": "CommonplaceApp" },
  });
  if (!r.ok) return null;
  return r.json();
}

async function pushSyncData(payload) {
  const r = await fetch("/api/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "CommonplaceApp",
    },
    body: JSON.stringify({ device_id: deviceId, ...payload }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Sync failed (${r.status}): ${body}`);
  }
  return r.json();
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

  // Refs for latest data — schedulePush updates these, mutation reads them.
  // TanStack Query handles retries, but the mutation function needs current data.
  const latestPayload = useRef(null);

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
    mutationFn: pushSyncData,
    retry: SYNC_MAX_RETRIES,
    retryDelay: (attempt) => SYNC_INITIAL_DELAY_MS * Math.pow(2, attempt),
    onMutate: () => {
      // Optimistic: show "synced" immediately so the UI feels instant
      setSyncStatus("synced");
      setLastSynced(new Date());
    },
    onSuccess: () => {
      // Confirm the optimistic update
      consecutiveFailures.current = 0;
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

  // ── Debounced push — same API as before ──
  const schedulePush = useCallback((quotes, customCats, deletedIds, collections) => {
    // Always capture latest data
    const payload = {
      quotes,
      customCategories: customCats,
      collections: collections || [],
    };
    if (deletedIds?.length > 0) {
      payload.deletedIds = deletedIds;
    }
    latestPayload.current = payload;

    // Debounce: clear pending push, schedule new one
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (!initialLoadDone.current) return;
      if (!deviceId) return;
      const p = latestPayload.current;
      if (!p || (p.quotes.length === 0 && !p.deletedIds?.length)) return;
      pushMutate(p);
    }, SYNC_DEBOUNCE_MS);
  }, [pushMutate]);

  // Manual sync — push immediately with fresh retries
  const manualPush = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    consecutiveFailures.current = 0;
    const p = latestPayload.current;
    if (p) pushMutate(p);
  }, [pushMutate]);

  // Register manualPush in Zustand store so components can access it directly
  const setManualPush = useQuotesStore(s => s.setManualPush);
  useEffect(() => { setManualPush(manualPush); }, [manualPush, setManualPush]);

  // Sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (latestPayload.current && initialLoadDone.current) {
        pushMutate(latestPayload.current);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [pushMutate]);

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
