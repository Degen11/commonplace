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
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);
  const consecutiveFailures = useRef(0);
  const lastErrorNotified = useRef(0);

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
        onCloudData(data.quotes, data.customCategories || []);
      }
      initialLoadDone.current = true;
    } catch {
      // Silent fail — localStorage is still the primary store
    }
  }, [onCloudData]);

  // ── Push: send current state to Supabase (with retry) ──
  const push = useCallback(async (quotes, customCats, deletedIds, retriesLeft = MAX_RETRIES) => {
    if (!deviceId.current) return;
    if (!initialLoadDone.current) return;
    if (quotes.length === 0) return;
    if (!mountedRef.current) return;

    setSyncStatus("syncing");

    try {
      const payload = {
        device_id: deviceId.current,
        quotes,
        customCategories: customCats,
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

      // Retry with delay
      if (retriesLeft > 0) {
        setTimeout(() => {
          if (mountedRef.current) push(quotes, customCats, deletedIds, retriesLeft - 1);
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
  const schedulePush = useCallback((quotes, customCats, deletedIds) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      push(quotes, customCats, deletedIds);
    }, SYNC_DEBOUNCE);
  }, [push]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
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
