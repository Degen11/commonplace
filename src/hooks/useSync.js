import { useRef, useCallback, useEffect, useState } from "react";

const LS_DEVICE_ID = "commonplace_device_id";
const SYNC_DEBOUNCE = 2000; // 2s after last change before pushing

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

export default function useSync({ onCloudData }) {
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [lastSynced, setLastSynced] = useState(null);
  const deviceId = useRef(getOrCreateDeviceId());
  const pushTimer = useRef(null);
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);

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

  // ── Push: send current state to Supabase ──
  const push = useCallback(async (quotes, customCats) => {
    if (!deviceId.current) return;
    if (!initialLoadDone.current) return; // Don't push before we've attempted a pull
    if (quotes.length === 0) return;

    if (!mountedRef.current) return;
    setSyncStatus("syncing");

    try {
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "CommonplaceApp",
        },
        body: JSON.stringify({
          device_id: deviceId.current,
          quotes,
          customCategories: customCats,
        }),
      });
      if (!mountedRef.current) return;
      if (r.ok) {
        setSyncStatus("synced");
        setLastSynced(new Date());
      } else {
        setSyncStatus("error");
      }
    } catch {
      if (mountedRef.current) setSyncStatus("error");
    }
  }, []);

  // ── Debounced push — call this whenever quotes/categories change ──
  const schedulePush = useCallback((quotes, customCats) => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      push(quotes, customCats);
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
