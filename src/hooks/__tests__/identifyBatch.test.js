// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../../data/localQuotes", () => ({ default: [], localLookup: () => null }));

import useProcessing from "../useProcessing";
import { DEFAULT_CATEGORIES } from "../../data/constants";
import { describeApiError } from "../../utils/apiErrors";

const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

function setup() {
  const { result } = renderHook(() =>
    useProcessing({ quotes: [], setQuotes: vi.fn(), allCats: DEFAULT_CATEGORIES, goPhase: vi.fn() }),
  );
  return result;
}

describe("identifyBatch", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; });
  beforeEach(() => { globalThis.fetch = vi.fn(); });

  it("posts structured items and returns the server's results array", async () => {
    const results = [{ i: 0, source: "Rumi", category: "Person", confidence: "high" }];
    globalThis.fetch.mockResolvedValue(jsonResponse(200, { results }));
    const out = await setup().current.identifyBatch(
      [{ text: "The wound is the place where the light enters you", hint: "Rumi", lookupCandidate: { source: "Rumi", category: "Person" } }],
      true,
    );
    expect(out).toEqual(results);
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("/api/identify");
    expect(opts.headers["X-Requested-With"]).toBe("CommonplaceApp");
    expect(JSON.parse(opts.body)).toEqual({
      formatting: true,
      items: [{ text: "The wound is the place where the light enters you", hint: "Rumi", candidate: { source: "Rumi", category: "Person" } }],
    });
  });

  it("surfaces the server's daily-cap message with the status attached", async () => {
    const message = "Daily AI limit reached for this connection. Please try again tomorrow.";
    globalThis.fetch.mockResolvedValue(jsonResponse(429, { error: message }));
    const err = await setup().current.identifyBatch([{ text: "Why so serious" }]).catch(e => e);
    expect(err.status).toBe(429);
    expect(err.message).toBe(message);
    expect(describeApiError(err)).toBe(message);
  });

  it("rejects a response without a results array", async () => {
    globalThis.fetch.mockResolvedValue(jsonResponse(200, { content: [{ text: "[]" }] }));
    await expect(setup().current.identifyBatch([{ text: "Why so serious" }])).rejects.toThrow("Invalid API response structure");
  });
});
