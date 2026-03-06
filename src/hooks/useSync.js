import { useRef, useCallback, useEffect, useState } from "react";

const LS_DEVICE_ID = "commonplace_device_id";
const SYNC_DEBOUNCE = 2000; // 2s after last change before pushing
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3s before retry

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (id) return id;
    id = crypto.randomUUID();
    localStorage.setItem(LS_DEVICE_ID, id);
    return id;
  } catch {
    return null;
  }
}

export default function useSync({ onCloudData, onSyncError }) {
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [lastSynced, setLastSynced] = useState(null);
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
    }
  }, [onCloudData]);

  // ── Push: send current state to Supabase (with retry) ──
  // Reads from refs so retries always push the latest data, not stale closure values.
  const push = useCallback(async (retriesLeft = MAX_RETRIES) => {
    if (!deviceId.current) return;
    if (!initialLoadDone.current) return;
    if (!mountedRef.current) return;

    const quotes = latestQuotes.current;
    const customCats = latestCustomCats.current;
    const deletedIds = latestDeletedIds.current;
    const collections = latestCollections.current;

    if (quotes.length === 0) return;

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
        throw new Error(`Sync failed (${r.status})`);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      // Retry with delay — re-reads latest data from refs on next attempt
      if (retriesLeft > 0) {
        retryTimer.current = setTimeout(() => {
          if (mountedRef.current) push(retriesLeft - 1);
        }, RETRY_DELAY);
        return;
      }

      // All retries exhausted
      setSyncStatus("error");
      consecutiveFailures.current++;

      // Notify user on first failure, then throttle to once per 5 minutes
      const now = Date.now();
      if (now - lastErrorNotified.current > 5 * 60 * 1000) {
        lastErrorNotified.current = now;
        if (onSyncError) {
          onSyncError(
            consecutiveFailures.current > 1
              ? "Cloud backup unavailable — your data is saved locally."
              : "Couldn't back up to cloud — will retry on next change."
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
    }, SYNC_DEBOUNCE);
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
    pull,
    schedulePush,
    markReady,
  };
}
