// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// useSync talks to /api/sync only through apiRequest — stub it so the hook's
// real debounce, guards, mutation retry and error throttling all run.
vi.mock("../../utils/api", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "../../utils/api";
import useSync from "../useSync";
import { useQuotesStore } from "../../stores/quotesStore";
import {
  SYNC_DEBOUNCE_MS, SYNC_ERROR_THROTTLE_MS, LS_DEVICE_ID, LS_SYNC_ENGAGED,
} from "../../config";

// Long enough for every retry of a failing push (2s, 4s, 8s, 16s backoff)
const ALL_RETRIES_MS = 60_000;

const q = (id, text = `Quote ${id}`) => ({ id, text, source: "Author", category: "Book" });

function setup({ onCloudData = vi.fn(), onSyncError = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }) => createElement(QueryClientProvider, { client: queryClient }, children);
  const hook = renderHook(() => useSync({ onCloudData, onSyncError }), { wrapper });
  return { ...hook, onCloudData, onSyncError, queryClient };
}

// The hook gates pushes on the initial load having finished
async function ready(result) {
  await act(async () => { result.current.markReady(); });
}

async function advance(ms) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

const pushCalls = () => apiRequest.mock.calls.filter(([, opts]) => opts?.body !== undefined);

beforeEach(() => {
  vi.useFakeTimers();
  apiRequest.mockReset();
  localStorage.removeItem(LS_SYNC_ENGAGED);
  useQuotesStore.setState({ syncStatus: "idle", lastSynced: null, initialLoading: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useSync — device ID", () => {
  it("creates and persists a device ID", () => {
    const { result } = setup();
    expect(result.current.deviceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(LS_DEVICE_ID)).toBe(result.current.deviceId);
  });
});

describe("useSync — pull", () => {
  it("sends the device ID as a header and hands cloud quotes to onCloudData", async () => {
    const cloud = { quotes: [q("a")], customCategories: ["Mine"], collections: [{ id: "c1" }] };
    apiRequest.mockResolvedValue(cloud);
    const { result, onCloudData } = setup();

    await act(async () => { await result.current.pull(); });

    expect(apiRequest).toHaveBeenCalledWith("/api/sync", { headers: { "X-Device-Id": result.current.deviceId } });
    expect(onCloudData).toHaveBeenCalledWith(cloud.quotes, ["Mine"], [{ id: "c1" }]);
    expect(localStorage.getItem(LS_SYNC_ENGAGED)).toBe("1");
    expect(useQuotesStore.getState().initialLoading).toBe(false);
  });

  it("does not call onCloudData or engage sync when the cloud is empty", async () => {
    apiRequest.mockResolvedValue({ quotes: [] });
    const { result, onCloudData } = setup();

    await act(async () => { await result.current.pull(); });

    expect(onCloudData).not.toHaveBeenCalled();
    expect(localStorage.getItem(LS_SYNC_ENGAGED)).toBeNull();
    expect(useQuotesStore.getState().initialLoading).toBe(false);
  });

  it("treats an HTTP error as 'no cloud data' (status stays idle)", async () => {
    apiRequest.mockRejectedValue(Object.assign(new Error("Not found"), { status: 404 }));
    const { result, onCloudData } = setup();

    await act(async () => { await result.current.pull(); });

    expect(onCloudData).not.toHaveBeenCalled();
    expect(useQuotesStore.getState().syncStatus).toBe("idle");
    expect(useQuotesStore.getState().initialLoading).toBe(false);
  });

  it("sets syncStatus to error on a network failure", async () => {
    apiRequest.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = setup();

    await act(async () => { await result.current.pull(); });

    expect(useQuotesStore.getState().syncStatus).toBe("error");
    expect(useQuotesStore.getState().initialLoading).toBe(false);
  });

  it("a successful pull unlocks pushes", async () => {
    apiRequest.mockResolvedValue({ quotes: [] });
    const { result } = setup();
    await act(async () => { await result.current.pull(); });
    apiRequest.mockClear();

    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS);

    expect(pushCalls()).toHaveLength(1);
  });
});

describe("useSync — debounced push", () => {
  it("pushes only the latest payload once the debounce elapses", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);

    act(() => {
      result.current.schedulePush([q("a")], [], [], []);
      result.current.schedulePush([q("a"), q("b")], ["Mine"], [{ id: "x", deletedAt: 1 }], [{ id: "c1" }]);
    });

    await advance(SYNC_DEBOUNCE_MS - 1);
    expect(pushCalls()).toHaveLength(0);

    await advance(1);
    expect(pushCalls()).toHaveLength(1);
    expect(pushCalls()[0]).toEqual(["/api/sync", {
      body: {
        device_id: result.current.deviceId,
        quotes: [q("a"), q("b")],
        customCategories: ["Mine"],
        collections: [{ id: "c1" }],
        deletedIds: [{ id: "x", deletedAt: 1 }],
      },
    }]);
    expect(useQuotesStore.getState().syncStatus).toBe("synced");
    expect(useQuotesStore.getState().lastSynced).toBeInstanceOf(Date);
  });

  it("omits deletedIds when there are none and defaults collections to []", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);

    act(() => { result.current.schedulePush([q("a")], [], [], undefined); });
    await advance(SYNC_DEBOUNCE_MS);

    const { body } = pushCalls()[0][1];
    expect(body).not.toHaveProperty("deletedIds");
    expect(body.collections).toEqual([]);
  });

  it("does not push before the initial load has finished", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();

    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS * 2);

    expect(pushCalls()).toHaveLength(0);
  });

  it("never pushes an empty collection (would wipe the cloud copy)", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);

    act(() => { result.current.schedulePush([], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS * 2);

    expect(pushCalls()).toHaveLength(0);
    expect(useQuotesStore.getState().syncStatus).toBe("idle");
  });

  it("does push an empty quote list when it carries deletions", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);

    act(() => { result.current.schedulePush([], [], [{ id: "x", deletedAt: 1 }], []); });
    await advance(SYNC_DEBOUNCE_MS);

    expect(pushCalls()).toHaveLength(1);
    expect(pushCalls()[0][1].body.deletedIds).toEqual([{ id: "x", deletedAt: 1 }]);
  });

  it("manualPush sends the latest payload immediately and cancels the pending debounce", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);

    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await act(async () => { result.current.manualPush(); });
    await advance(0);
    expect(pushCalls()).toHaveLength(1);

    await advance(SYNC_DEBOUNCE_MS * 2);
    expect(pushCalls()).toHaveLength(1);
  });

  it("registers manualPush in the store", () => {
    const { result } = setup();
    expect(useQuotesStore.getState().manualPush).toBe(result.current.manualPush);
  });
});

describe("useSync — push failures", () => {
  async function failPush(result) {
    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS + ALL_RETRIES_MS);
  }

  it("retries with backoff, then sets syncStatus to error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    apiRequest.mockRejectedValue(new Error("Server down"));
    const { result } = setup();
    await ready(result);

    await failPush(result);

    // 1 attempt + SYNC_MAX_RETRIES (4) retries
    expect(pushCalls()).toHaveLength(5);
    expect(useQuotesStore.getState().syncStatus).toBe("error");
  });

  it("stays silent (no onSyncError) until the user has engaged with sync", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    apiRequest.mockRejectedValue(new Error("Server down"));
    const { result, onSyncError } = setup();
    await ready(result);

    await failPush(result);

    expect(onSyncError).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/sync not engaged/));
  });

  it("throttles onSyncError to one toast per SYNC_ERROR_THROTTLE_MS once engaged", async () => {
    localStorage.setItem(LS_SYNC_ENGAGED, "1");
    apiRequest.mockRejectedValue(new Error("Server down"));
    const { result, onSyncError } = setup();
    await ready(result);

    await failPush(result);
    expect(onSyncError).toHaveBeenCalledTimes(1);
    expect(onSyncError).toHaveBeenLastCalledWith("Couldn't back up to cloud — will retry on next change.");

    // A second failure inside the throttle window is not surfaced
    await failPush(result);
    expect(onSyncError).toHaveBeenCalledTimes(1);

    // Once the window passes, the next failure is surfaced — and since it's
    // no longer the first in a row, with the "unavailable" wording
    await advance(SYNC_ERROR_THROTTLE_MS);
    await failPush(result);
    expect(onSyncError).toHaveBeenCalledTimes(2);
    expect(onSyncError).toHaveBeenLastCalledWith("Cloud backup unavailable — your data is saved locally.");
  });

  it("a success resets the consecutive-failure count", async () => {
    localStorage.setItem(LS_SYNC_ENGAGED, "1");
    apiRequest.mockRejectedValue(new Error("Server down"));
    const { result, onSyncError } = setup();
    await ready(result);

    await failPush(result);
    apiRequest.mockResolvedValue({ ok: true });
    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS);
    expect(useQuotesStore.getState().syncStatus).toBe("synced");

    apiRequest.mockRejectedValue(new Error("Server down"));
    await advance(SYNC_ERROR_THROTTLE_MS);
    await failPush(result);
    expect(onSyncError).toHaveBeenCalledTimes(2);
    expect(onSyncError).toHaveBeenLastCalledWith("Couldn't back up to cloud — will retry on next change.");
  });

  it("re-pushes the latest payload when the browser comes back online", async () => {
    apiRequest.mockResolvedValue({ ok: true });
    const { result } = setup();
    await ready(result);
    act(() => { result.current.schedulePush([q("a")], [], [], []); });
    await advance(SYNC_DEBOUNCE_MS);
    expect(pushCalls()).toHaveLength(1);

    await act(async () => { window.dispatchEvent(new Event("online")); });
    await advance(0);

    expect(pushCalls()).toHaveLength(2);
    expect(pushCalls()[1][1].body.quotes).toEqual([q("a")]);
  });
});
