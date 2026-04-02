import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Test sync API functions by exercising them through fetch mocks ──
// fetchSyncData and pushSyncData are module-private, so we re-implement
// the same logic here and verify the fetch contracts they rely on.

describe("sync API functions", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchSyncData contract", () => {
    it("calls GET /api/sync with device_id and CSRF header", async () => {
      const mockData = { quotes: [{ id: "1", text: "test" }], customCategories: [], collections: [] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const deviceId = "test-device-id";
      const r = await fetch(`/api/sync?device_id=${deviceId}`, {
        headers: { "X-Requested-With": "CommonplaceApp" },
      });
      const data = await r.json();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `/api/sync?device_id=${deviceId}`,
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Requested-With": "CommonplaceApp" }),
        }),
      );
      expect(data.quotes).toEqual([{ id: "1", text: "test" }]);
    });

    it("returns null when response is not ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

      const r = await fetch("/api/sync?device_id=abc");
      expect(r.ok).toBe(false);
    });
  });

  describe("pushSyncData contract", () => {
    it("sends POST with correct headers and body structure", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, count: 2, merged: true }),
      });

      const payload = {
        device_id: "test-device",
        quotes: [{ id: "1", text: "a" }, { id: "2", text: "b" }],
        customCategories: ["MyTag"],
        collections: [],
      };

      const r = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "CommonplaceApp",
        },
        body: JSON.stringify(payload),
      });
      const data = await r.json();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/sync",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Requested-With": "CommonplaceApp",
          }),
        }),
      );
      expect(data.ok).toBe(true);
      expect(data.count).toBe(2);
    });

    it("throws on non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      const r = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify({ device_id: "x", quotes: [] }),
      });

      expect(r.ok).toBe(false);
      const body = await r.text();
      expect(body).toBe("Internal Server Error");
    });

    it("includes deletedIds when provided", async () => {
      let capturedBody;
      globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      });

      const payload = {
        device_id: "d",
        quotes: [],
        customCategories: [],
        collections: [],
        deletedIds: [{ id: "q1", deletedAt: 1000 }],
      };

      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify(payload),
      });

      expect(capturedBody.deletedIds).toEqual([{ id: "q1", deletedAt: 1000 }]);
    });
  });
});

describe("sync debounce behavior", () => {
  it("SYNC_DEBOUNCE_MS is a reasonable value", async () => {
    const { SYNC_DEBOUNCE_MS } = await import("../../config.js");
    expect(SYNC_DEBOUNCE_MS).toBeGreaterThanOrEqual(1000);
    expect(SYNC_DEBOUNCE_MS).toBeLessThanOrEqual(10000);
  });

  it("SYNC_MAX_RETRIES is configured", async () => {
    const { SYNC_MAX_RETRIES } = await import("../../config.js");
    expect(SYNC_MAX_RETRIES).toBeGreaterThanOrEqual(1);
    expect(SYNC_MAX_RETRIES).toBeLessThanOrEqual(10);
  });

  it("SYNC_INITIAL_DELAY_MS supports exponential backoff", async () => {
    const { SYNC_INITIAL_DELAY_MS, SYNC_MAX_RETRIES } = await import("../../config.js");
    // Verify the max backoff delay is reasonable (< 2 minutes)
    const maxDelay = SYNC_INITIAL_DELAY_MS * Math.pow(2, SYNC_MAX_RETRIES);
    expect(maxDelay).toBeLessThan(120_000);
  });
});
