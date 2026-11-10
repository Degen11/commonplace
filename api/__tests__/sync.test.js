import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Fake Supabase for device_data: one stored row (what select() reads), a
// record of every select and upsert, and optional errors for each.
const db = { row: null, upserts: [], selects: [], readError: null, failWith: null };
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: () => Promise.resolve({ data: true, error: null }),
    from: () => ({
      select: (columns) => ({
        eq: (column, value) => {
          db.selects.push({ columns, column, value });
          return { maybeSingle: () => Promise.resolve({ data: db.readError ? null : db.row, error: db.readError }) };
        },
      }),
      upsert: (row, opts) => {
        db.upserts.push({ ...row, _opts: opts });
        return Promise.resolve({ error: db.failWith ? { message: db.failWith } : null });
      },
    }),
  }),
}));

const { default: sync, mergeQuotes } = await import("../sync.js");

const DEVICE = "6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const q = (id, updatedAt, text = `Quote ${id}`) => ({ id, text, updatedAt });

function mockReq(body, { method = "POST", headers = {}, query = {} } = {}) {
  return {
    method,
    headers: {
      origin: "https://commonplace.pro",
      "x-requested-with": "CommonplaceApp",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.9",
      ...headers,
    },
    query,
    body,
  };
}
function mockRes() {
  const res = { statusCode: 200, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.end = () => res;
  return res;
}

describe("mergeQuotes", () => {
  it("unions client and cloud quotes", () => {
    const merged = mergeQuotes([q("a", 1)], [q("b", 1)], []);
    expect(merged.map(x => x.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps the newer copy on conflict (last write wins, either side)", () => {
    const clientNewer = mergeQuotes([q("a", 20, "client")], [q("a", 10, "cloud")], []);
    expect(clientNewer).toEqual([q("a", 20, "client")]);
    const cloudNewer = mergeQuotes([q("a", 10, "client")], [q("a", 20, "cloud")], []);
    expect(cloudNewer).toEqual([q("a", 20, "cloud")]);
  });

  it("lets the client win a tie", () => {
    expect(mergeQuotes([q("a", 10, "client")], [q("a", 10, "cloud")], [])[0].text).toBe("client");
  });

  it("treats a missing updatedAt as 0", () => {
    const noStamp = { id: "a", text: "no stamp" };
    // Cloud has a timestamp, client doesn't: cloud is newer
    expect(mergeQuotes([noStamp], [q("a", 5, "cloud")], [])[0].text).toBe("cloud");
    // Neither has one: tie, client wins
    expect(mergeQuotes([noStamp], [{ id: "a", text: "cloud" }], [])[0].text).toBe("no stamp");
  });

  it("deletes a quote when its tombstone is at least as new", () => {
    const merged = mergeQuotes([q("a", 10)], [q("b", 10)], [
      { id: "a", deletedAt: 15 },
      { id: "b", deletedAt: 10 },
    ]);
    expect(merged).toEqual([]);
  });

  it("keeps a quote edited after its tombstone", () => {
    const merged = mergeQuotes([], [q("a", 30)], [{ id: "a", deletedAt: 20 }]);
    expect(merged).toEqual([q("a", 30)]);
  });

  it("treats a tombstone without deletedAt as 0, deleting only unstamped quotes", () => {
    const merged = mergeQuotes([{ id: "a", text: "x" }, q("b", 5)], [], [{ id: "a" }, { id: "b" }]);
    expect(merged.map(x => x.id)).toEqual(["b"]);
  });

  it("ignores malformed quotes and tombstones", () => {
    const merged = mergeQuotes([null, { text: "no id" }, q("a", 1)], [undefined, q("b", 1)], [null, { id: 5 }]);
    expect(merged.map(x => x.id).sort()).toEqual(["a", "b"]);
    expect(mergeQuotes([q("a", 1)], [], undefined)).toEqual([q("a", 1)]);
  });
});

function setupDb() {
  beforeEach(() => {
    process.env.SUPABASE_SECRET_KEY = "test";
    db.row = null; db.upserts = []; db.selects = []; db.readError = null; db.failWith = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    delete process.env.SUPABASE_SECRET_KEY;
    vi.restoreAllMocks();
  });
}

describe("POST /api/sync", () => {
  setupDb();

  it("merges with the stored quotes and upserts the full row", async () => {
    db.row = { quotes: [q("a", 10, "cloud"), q("c", 10)] };
    const res = mockRes();
    await sync(mockReq({
      device_id: DEVICE,
      quotes: [q("a", 20, "client"), q("b", 5)],
      customCategories: ["Mine"],
      collections: [{ id: "col1", name: "Favorites" }],
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, count: 3, merged: true });
    expect(db.selects[0]).toMatchObject({ column: "device_id", value: DEVICE });
    expect(db.upserts).toHaveLength(1);
    const row = db.upserts[0];
    expect(row).toMatchObject({
      device_id: DEVICE,
      custom_categories: ["Mine"],
      collections: [{ id: "col1", name: "Favorites" }],
      _opts: { onConflict: "device_id" },
    });
    const byId = Object.fromEntries(row.quotes.map(x => [x.id, x]));
    expect(Object.keys(byId).sort()).toEqual(["a", "b", "c"]);
    expect(byId.a.text).toBe("client");
  });

  it("removes stored quotes whose tombstone is newer, keeping later edits", async () => {
    db.row = { quotes: [q("gone", 10), q("edited", 50)] };
    const res = mockRes();
    await sync(mockReq({
      device_id: DEVICE,
      quotes: [],
      deletedIds: [{ id: "gone", deletedAt: 30 }, { id: "edited", deletedAt: 30 }],
    }), res);
    expect(res.statusCode).toBe(200);
    expect(db.upserts[0].quotes.map(x => x.id)).toEqual(["edited"]);
  });

  it("starts from nothing when the device has no row yet", async () => {
    const res = mockRes();
    await sync(mockReq({ device_id: DEVICE, quotes: [q("a", 1)] }), res);
    expect(res.statusCode).toBe(200);
    expect(db.upserts[0]).toMatchObject({ custom_categories: [], collections: [] });
    expect(db.upserts[0].quotes.map(x => x.id)).toEqual(["a"]);
  });

  it("refuses to save more than 50,000 quotes after the merge", async () => {
    db.row = { quotes: Array.from({ length: 50_000 }, (_, i) => q(`cloud${i}`, 1)) };
    const res = mockRes();
    await sync(mockReq({ device_id: DEVICE, quotes: [q("one-more", 1)] }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Too many quotes after merge");
    expect(db.upserts).toEqual([]);
  });

  it("returns 500 when the upsert fails", async () => {
    db.failWith = "connection reset";
    const res = mockRes();
    await sync(mockReq({ device_id: DEVICE, quotes: [q("a", 1)] }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to save data");
  });

  it("rejects an invalid device id", async () => {
    const res = mockRes();
    await sync(mockReq({ device_id: "not-a-uuid", quotes: [] }), res);
    expect(res.statusCode).toBe(400);
    expect(db.upserts).toEqual([]);
  });
});

describe("GET /api/sync", () => {
  setupDb();
  const get = async (opts) => {
    const res = mockRes();
    await sync(mockReq(undefined, { method: "GET", ...opts }), res);
    return res;
  };

  it("returns the stored row for the X-Device-Id header", async () => {
    db.row = {
      quotes: [q("a", 1)], custom_categories: ["Mine"],
      collections: [{ id: "col1", name: "Favorites", quoteIds: ["a"] }], updated_at: "2026-01-01T00:00:00Z",
    };
    const res = await get({ headers: { "x-device-id": DEVICE } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      quotes: [q("a", 1)], customCategories: ["Mine"],
      collections: [{ id: "col1", name: "Favorites", quoteIds: ["a"] }], updatedAt: "2026-01-01T00:00:00Z",
    });
    expect(db.selects[0]).toMatchObject({ column: "device_id", value: DEVICE });
  });

  it("still accepts the legacy device_id query param", async () => {
    db.row = { quotes: [], updated_at: null };
    const res = await get({ query: { device_id: DEVICE } });
    expect(res.statusCode).toBe(200);
    expect(db.selects[0].value).toBe(DEVICE);
  });

  it("returns empty data for an unknown device", async () => {
    const res = await get({ headers: { "x-device-id": DEVICE } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ quotes: [], customCategories: [], collections: [], updatedAt: null });
  });

  it("rejects a missing or invalid device id", async () => {
    expect((await get({})).statusCode).toBe(400);
    expect((await get({ headers: { "x-device-id": "nope" } })).statusCode).toBe(400);
    expect(db.selects).toEqual([]);
  });

  it("returns 500 when the read fails", async () => {
    db.readError = { message: "timeout" };
    const res = await get({ headers: { "x-device-id": DEVICE } });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to load data");
  });
});
