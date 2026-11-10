// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { MAX_SHARE_ITEMS, MAX_QUOTE_TEXT_LENGTH, MAX_SOURCE_LENGTH, MAX_CATEGORY_LENGTH } from "../../config";

// The real ToastProvider renders; only sonner's toast() calls are spied on.
const toastSpy = vi.hoisted(() => ({
  info: vi.fn(), success: vi.fn(), error: vi.fn(), loading: vi.fn(),
}));
vi.mock("sonner", async (importOriginal) => ({ ...(await importOriginal()), toast: toastSpy }));

// The public-link branch fetches through fetchWithTimeout; each test scripts it.
const fetchWithTimeout = vi.hoisted(() => vi.fn());
vi.mock("../../utils/api", async (importOriginal) => ({ ...(await importOriginal()), fetchWithTimeout }));

// useSync needs TanStack Query and the network; the provider only calls these.
const sync = vi.hoisted(() => ({ pull: vi.fn(), schedulePush: vi.fn(), markReady: vi.fn() }));
vi.mock("../../hooks/useSync", () => ({ default: () => sync }));

const { safeDecodeShareData, validateShareQuote, QuotesProvider } = await import("../QuotesContext");
const { ToastProvider } = await import("../ToastContext");
const { useQuotesStore } = await import("../../stores/quotesStore");

// UTF-8 bytes → binary string → base64, the same encoding share links use
const encode = (value) => {
  let bin = "";
  for (const b of new TextEncoder().encode(JSON.stringify(value))) bin += String.fromCharCode(b);
  return btoa(bin);
};

describe("validateShareQuote", () => {
  it("builds a high-confidence quote from a [text, source, category, fav] tuple", () => {
    const q = validateShareQuote(["Be <b>bold</b>", " Someone ", "Reflection", 1]);
    expect(q).toMatchObject({
      text: "Be bold", source: "Someone", category: "Reflection", confidence: "high", favorite: true,
    });
    expect(typeof q.id).toBe("string");
    expect(validateShareQuote(["t", "s", "c"]).favorite).toBe(false);
  });

  it("rejects malformed tuples", () => {
    expect(validateShareQuote("not an array")).toBeNull();
    expect(validateShareQuote(["only", "two"])).toBeNull();
    expect(validateShareQuote([1, "s", "c"])).toBeNull();
    expect(validateShareQuote(["", "s", "c"])).toBeNull();
  });

  it("rejects fields over their length limits", () => {
    expect(validateShareQuote(["x".repeat(MAX_QUOTE_TEXT_LENGTH + 1), "s", "c"])).toBeNull();
    expect(validateShareQuote(["t", "x".repeat(MAX_SOURCE_LENGTH + 1), "c"])).toBeNull();
    expect(validateShareQuote(["t", "s", "x".repeat(MAX_CATEGORY_LENGTH + 1)])).toBeNull();
  });
});

describe("safeDecodeShareData", () => {
  it("decodes valid base64 share data, including non-ASCII text", () => {
    const out = safeDecodeShareData(encode([["Café — naïve", "Author", "Reflection", 0], ["Second", "B", "Humor", 1]]));
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ text: "Café — naïve", source: "Author" });
    expect(out[1].favorite).toBe(true);
  });

  it("drops invalid entries but keeps valid ones", () => {
    const out = safeDecodeShareData(encode([["ok", "s", "c"], ["", "s", "c"], 42]));
    expect(out.map(q => q.text)).toEqual(["ok"]);
  });

  it("returns null when no entry is valid", () => {
    expect(safeDecodeShareData(encode([["", "s", "c"]]))).toBeNull();
  });

  it("returns null for oversized input without decoding it", () => {
    const atobSpy = vi.spyOn(globalThis, "atob");
    expect(safeDecodeShareData("A".repeat(1_000_001))).toBeNull();
    expect(atobSpy).not.toHaveBeenCalled();
    atobSpy.mockRestore();
  });

  it("returns null for JSON that isn't a non-empty array", () => {
    expect(safeDecodeShareData(encode({ text: "x" }))).toBeNull();
    expect(safeDecodeShareData(encode("string"))).toBeNull();
    expect(safeDecodeShareData(encode([]))).toBeNull();
  });

  it("returns null for malformed base64 or non-JSON content", () => {
    expect(safeDecodeShareData("%%%not base64%%%")).toBeNull();
    expect(safeDecodeShareData(btoa("{not json"))).toBeNull();
  });

  it("returns null for more than MAX_SHARE_ITEMS entries", () => {
    const tooMany = Array.from({ length: MAX_SHARE_ITEMS + 1 }, () => ["t", "s", "c"]);
    expect(safeDecodeShareData(encode(tooMany))).toBeNull();
    const atLimit = Array.from({ length: MAX_SHARE_ITEMS }, () => ["t", "s", "c"]);
    expect(safeDecodeShareData(encode(atLimit))).toHaveLength(MAX_SHARE_ITEMS);
  });
});

describe("QuotesProvider — public /c/<id> links", () => {
  const response = (status, body) => ({
    status,
    ok: status >= 200 && status < 300,
    json: () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body)),
  });

  function renderAt(path) {
    window.history.replaceState(null, "", path);
    return render(<ToastProvider><QuotesProvider><div /></QuotesProvider></ToastProvider>);
  }

  async function expectFailure(message) {
    await waitFor(() => expect(sync.pull).toHaveBeenCalledTimes(1));
    expect(toastSpy.error).toHaveBeenCalledWith(message, {});
    expect(sync.markReady).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/");
    const s = useQuotesStore.getState();
    expect(s.isSharedView).toBe(false);
    expect(s.quotes).toEqual([]);
  }

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useQuotesStore.setState({
      quotes: [], customCats: [], collections: [], _deletedIds: [],
      initialLoading: true, isSharedView: false, activeCollectionId: null,
    });
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("requests the share id from the path", async () => {
    fetchWithTimeout.mockResolvedValue(response(404, {}));
    renderAt("/c/abcd1234");
    await waitFor(() => expect(fetchWithTimeout).toHaveBeenCalled());
    expect(fetchWithTimeout.mock.calls[0][0]).toBe("/api/share?id=abcd1234");
  });

  it("shows 'not found' on 404 and falls back to the device's own data", async () => {
    fetchWithTimeout.mockResolvedValue(response(404, { error: "Not found" }));
    renderAt("/c/abcd1234");
    await expectFailure("Shared collection not found.");
  });

  it("shows 'expired' on 410", async () => {
    fetchWithTimeout.mockResolvedValue(response(410, { error: "Expired" }));
    renderAt("/c/abcd1234");
    await expectFailure("This shared link has expired.");
  });

  it("shows a generic error on other failures", async () => {
    fetchWithTimeout.mockResolvedValue(response(500, {}));
    renderAt("/c/abcd1234");
    await expectFailure("Couldn’t load this shared collection.");
  });

  it("shows a generic error when the body isn't JSON", async () => {
    fetchWithTimeout.mockResolvedValue(response(200, new SyntaxError("Unexpected token <")));
    renderAt("/c/abcd1234");
    await expectFailure("Couldn’t load this shared collection.");
  });

  it("treats a body without a quotes array as empty", async () => {
    fetchWithTimeout.mockResolvedValue(response(200, { quotes: "nope" }));
    renderAt("/c/abcd1234");
    await expectFailure("This shared collection is empty.");
  });

  it("treats a body whose quotes are all invalid as empty", async () => {
    fetchWithTimeout.mockResolvedValue(response(200, { quotes: [["", "s", "c"], { text: "no id" }] }));
    renderAt("/c/abcd1234");
    await expectFailure("This shared collection is empty.");
  });

  it("stays quiet when the request is aborted", async () => {
    fetchWithTimeout.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    renderAt("/c/abcd1234");
    await waitFor(() => expect(fetchWithTimeout).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 0));
    expect(toastSpy.error).not.toHaveBeenCalled();
    expect(sync.pull).not.toHaveBeenCalled();
  });

  it("loads a valid collection into the store as a shared view", async () => {
    fetchWithTimeout.mockResolvedValue(response(200, {
      title: "Stoics",
      quotes: [["The obstacle is the way", "Marcus Aurelius", "Philosophy", 1], ["", "bad", "x"]],
    }));
    renderAt("/c/abcd1234");
    await waitFor(() => expect(useQuotesStore.getState().isSharedView).toBe(true));
    const s = useQuotesStore.getState();
    expect(s.quotes).toEqual([expect.objectContaining({
      text: "The obstacle is the way", source: "Marcus Aurelius", favorite: true,
    })]);
    expect(s.initialLoading).toBe(false);
    expect(document.title).toBe("Stoics — Commonplace");
    expect(toastSpy.info).toHaveBeenCalledWith("Viewing \"Stoics\" (1 quote)", {});
    expect(sync.pull).not.toHaveBeenCalled();
  });
});
