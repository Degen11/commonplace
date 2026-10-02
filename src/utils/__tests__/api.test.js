import { describe, it, expect, vi, afterEach } from "vitest";
import { apiRequest, TIMEOUT_MESSAGE } from "../api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const jsonResponse = (data, ok = true, status = 200) => ({ ok, status, json: () => Promise.resolve(data) });

describe("apiRequest", () => {
  it("POSTs JSON with the shared headers and returns parsed data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ lines: ["a"] }));
    vi.stubGlobal("fetch", fetchMock);
    const data = await apiRequest("/api/fetch-url", { body: { url: "https://x.com" } });
    expect(data).toEqual({ lines: ["a"] });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/fetch-url");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ url: "https://x.com" }));
    expect(opts.headers["X-Requested-With"]).toBe("CommonplaceApp");
  });

  it("sends a GET without a body and merges extra headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await apiRequest("/api/sync", { headers: { "X-Device-Id": "abc" } });
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe("GET");
    expect(opts.body).toBeUndefined();
    expect(opts.headers["X-Device-Id"]).toBe("abc");
    expect(opts.headers["X-Requested-With"]).toBe("CommonplaceApp");
  });

  it("throws the server's error message with the status attached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "URL returned no content" }, false, 422)));
    await expect(apiRequest("/api/fetch-url", { body: {} })).rejects.toMatchObject({
      message: "URL returned no content",
      status: 422,
    });
  });

  it("throws a TimeoutError when the request runs past the limit", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const pending = apiRequest("/api/fetch-url", { body: {}, timeoutMs: 1000 });
    const check = expect(pending).rejects.toMatchObject({ name: "TimeoutError", message: TIMEOUT_MESSAGE });
    await vi.advanceTimersByTimeAsync(1000);
    await check;
  });

  it("keeps AbortError when the caller cancels", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const controller = new AbortController();
    const pending = apiRequest("/api/fetch-url", { body: {}, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
