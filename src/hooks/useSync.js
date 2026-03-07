import { useRef, useCallback, useEffect, useState } from "react";
import { generateId } from "../utils/uuid";
import {
  SYNC_DEBOUNCE_MS, SYNC_MAX_RETRIES, SYNC_INITIAL_DELAY_MS,
  SYNC_ERROR_THROTTLE_MS,
} from "../config";

const LS_DEVICE_ID = "commonplace_device_id";

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (id) return id;
    id = generateId();
    localStorage.setItem(LS_DEVICE_ID, id);
    return id;
  } catch {
    return null;
  }
}

export default function useSync({ onCloudData, onSyncError }) {
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [lastSynced, setLastSynced] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const deviceId = useRef(getOrCreateDeviceId());
  const pushTimer = useRef(null);
  const retryTimer = useRef(null);
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);
  const consecutiveFailures = useRef(0);
  const lastErrorNotified = useRef(0);

  // Refs for latest data — retries always read current values instead of stale closures
  const latestQuotes = useRef([]);
  const latestCustomCats = useRef([]);
  const latestDeletedIds = useRef([]);
  const latestCollections = useRef([]);

  // Allow external callers (e.g. QuotesContext) to mark initial load complete
  // so push is unblocked even when data came from localStorage, not pull().
  const markReady = useCallback(() => {
    initialLoadDone.current = true;
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Pull: fetch from Supabase on mount ──
  const pull = useCallback(async () => {
    if (!deviceId.current) return;
    try {
      const r = await fetch(`/api/sync?device_id=${deviceId.current}`, {
        headers: { "X-Requested-With": "CommonplaceApp" },
      });
      if (!r.ok) return;
      const data = await r.json();
      if (!mountedRef.current) return;

      if (data.quotes?.length > 0) {
        onCloudData(data.quotes, data.customCategories || [], data.collections || []);
      }
      initialLoadDone.current = true;
    } catch {
      // Silent fail — localStorage is still the primary store
    } finally {
      if (mountedRef.current) setInitialLoading(false);
    }
  }, [onCloudData]);

  // ── Push: send current state to Supabase (with exponential backoff) ──
  // Reads from refs so retries always push the latest data, not stale closure values.
  const push = useCallback(async (retriesLeft = SYNC_MAX_RETRIES, delay = SYNC_INITIAL_DELAY_MS) => {
    if (!deviceId.current) return;
    if (!initialLoadDone.current) return;
    if (!mountedRef.current) return;

    const quotes = latestQuotes.current;
    const customCats = latestCustomCats.current;
    const deletedIds = latestDeletedIds.current;
    const collections = latestCollections.current;

    if (quotes.length === 0 && (!deletedIds || deletedIds.length === 0)) return;

    setSyncStatus("syncing");

    try {
      const payload = {
        device_id: deviceId.current,
        quotes,
        customCategories: customCats,
        collections,
      };
      if (deletedIds && deletedIds.length > 0) {
        payload.deletedIds = deletedIds;
      }
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "CommonplaceApp",
        },
        body: JSON.stringify(payload),
      });
      if (!mountedRef.current) return;
      if (r.ok) {
        setSyncStatus("synced");
        setLastSynced(new Date());
        consecutiveFailures.current = 0;
      } else {
        const body = await r.text().catch(() => "");
        throw new Error(`Sync failed (${r.status}): ${body}`);
      }
    } catch (err) {
      console.error("[useSync] push error:", err?.message || err);
      if (!mountedRef.current) return;

      // Exponential backoff: 2s → 4s → 8s → 16s
      if (retriesLeft > 0) {
        retryTimer.current = setTimeout(() => {
          if (mountedRef.current) push(retriesLeft - 1, delay * 2);
        }, delay);
        return;
      }

      // All retries exhausted
      setSyncStatus("error");
      consecutiveFailures.current++;

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
    }
  }, [onSyncError]);

  // ── Debounced push — call this whenever quotes/categories change ──
  const schedulePush = useCallback((quotes, customCats, deletedIds, collections) => {
    // Update refs so push() and retries always see latest data
    latestQuotes.current = quotes;
    latestCustomCats.current = customCats;
    latestDeletedIds.current = deletedIds;
    latestCollections.current = collections || [];

    // Clear any pending push AND any pending retry — the new push supersedes both
    if (pushTimer.current) clearTimeout(pushTimer.current);
    if (retryTimer.current) clearTimeout(retryTimer.current);
    pushTimer.current = setTimeout(() => {
      push();
    }, SYNC_DEBOUNCE_MS);
  }, [push]);

  // Sync when coming back online after being offline
  useEffect(() => {
    const handleOnline = () => {
      if (latestQuotes.current.length > 0 && initialLoadDone.current) {
        push();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [push]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return {
    deviceId: deviceId.current,
    syncStatus,
    lastSynced,
    initialLoading,
    pull,
    schedulePush,
    markReady,
  };
}
