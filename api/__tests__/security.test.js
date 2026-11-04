import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Fake Supabase: records rate-limit RPC keys and quote_cache writes.
const db = { rpcCalls: [], upserts: [], highRows: [], allow: true };
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: (name, args) => {
      db.rpcCalls.push({ name, ...args });
      // `allow` can be a function of the bucket key, to deny one bucket only
      const data = typeof db.allow === "function" ? db.allow(args.p_ip) : db.allow;
      return Promise.resolve({ data, error: null });
    },
    from: () => ({
      select: () => ({
        in: () => ({ eq: () => Promise.resolve({ data: db.highRows, error: null }) }),
      }),
      upsert: (rows) => {
        db.upserts.push(...rows);
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

const { checkRateLimit, checkAiDailyCap, RATE_LIMITS, ERROR_MESSAGES } = await import("../_shared.js");
const { default: identify } = await import("../identify.js");
const { checkHost, isPrivateAddress } = await import("../fetch-url.js");

function mockReq(body) {
  return {
    method: "POST",
    headers: {
      origin: "https://commonplace.pro",
      "x-requested-with": "CommonplaceApp",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.7",
    },
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

function anthropicOk(results) {
  // The model continues the '[' prefill, so its text omits the opening bracket
  const text = JSON.stringify(results).slice(1);
  return { ok: true, status: 200, json: () => Promise.resolve({ content: [{ type: "text", text }] }) };
}

describe("rate limiting", () => {
  beforeEach(() => { db.rpcCalls = []; db.allow = true; });

  it("gives each endpoint its own bucket per IP", async () => {
    const supabase = (await import("@supabase/supabase-js")).createClient();
    await checkRateLimit(`${RATE_LIMITS.OG.name}:1.2.3.4`, RATE_LIMITS.OG.limit, supabase);
    await checkRateLimit(`${RATE_LIMITS.IDENTIFY.name}:1.2.3.4`, RATE_LIMITS.IDENTIFY.limit, supabase);
    expect(db.rpcCalls.map(c => c.p_ip)).toEqual(["og:1.2.3.4", "identify:1.2.3.4"]);
    expect(db.rpcCalls.map(c => c.p_limit)).toEqual([120, 30]);
  });

  it("in-memory fallback keeps buckets separate and honors the window", async () => {
    const key = `test:${Math.random()}`;
    expect(await checkRateLimit(key, 1, null)).toBe(true);
    expect(await checkRateLimit(key, 1, null)).toBe(false);
    expect(await checkRateLimit(`other-${key}`, 1, null)).toBe(true);
  });
});

describe("/api/identify", () => {
  const originalFetch = globalThis.fetch;
  let anthropicBody;

  beforeEach(() => {
    process.env.SUPABASE_SECRET_KEY = "test";
    process.env.ANTHROPIC_API_KEY = "test";
    db.rpcCalls = []; db.upserts = []; db.highRows = []; db.allow = true;
    anthropicBody = null;
    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      anthropicBody = JSON.parse(opts.body);
      return Promise.resolve(anthropicOk([
        { i: 0, source: "The Dark Knight (2008) - The Joker", category: "Film", confidence: "high" },
        { i: 1, source: "Unknown source", category: "Aphorism", confidence: "low" },
      ]));
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("builds the prompt server-side from structured items", async () => {
    const res = mockRes();
    await identify(mockReq({ items: [
      { text: "Why so serious", hint: null, candidate: { source: "Guessed Movie (1999)", category: "Film" } },
      { text: "Another quote here", hint: "Someone" },
    ] }), res);
    expect(res.statusCode).toBe(200);
    const content = anthropicBody.messages[0].content;
    expect(content).toContain("[0] Why so serious (unverified match found online: \"Guessed Movie (1999)\" as Film");
    expect(content).toContain("[1] Another quote here (attributed to: Someone)");
    expect(anthropicBody.max_tokens).toBe(4096);
  });

  it("caches identified sources itself, skipping unknown and low-confidence results", async () => {
    await identify(mockReq({ items: [{ text: "Why so serious" }, { text: "Another quote here" }] }), mockRes());
    expect(db.upserts).toEqual([
      expect.objectContaining({ normalized_text: "why so serious", source: "The Dark Knight (2008) - The Joker", confidence: "high" }),
    ]);
  });

  it("never overwrites an existing high-confidence cache row", async () => {
    db.highRows = [{ normalized_text: "why so serious" }];
    await identify(mockReq({ items: [{ text: "Why so serious" }] }), mockRes());
    expect(db.upserts).toEqual([]);
  });

  it("still accepts the legacy messages shape, without caching", async () => {
    const res = mockRes();
    await identify(mockReq({ messages: [{ role: "user", content: "Identify these:\n[0] Why so serious" }] }), res);
    expect(res.statusCode).toBe(200);
    expect(db.upserts).toEqual([]);
  });

  it("stops at the daily AI cap without calling Anthropic", async () => {
    db.allow = false;
    const res = mockRes();
    await identify(mockReq({ items: [{ text: "Why so serious" }] }), res);
    expect(res.statusCode).toBe(429);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("checks the caller's own daily AI bucket before the global one", async () => {
    const res = mockRes();
    await identify(mockReq({ items: [{ text: "Why so serious" }] }), res);
    expect(res.statusCode).toBe(200);
    const keys = db.rpcCalls.map(c => c.p_ip);
    expect(keys.indexOf("ai-daily:203.0.113.7")).toBeGreaterThanOrEqual(0);
    expect(keys.indexOf("ai-daily:203.0.113.7")).toBeLessThan(keys.indexOf("global:ai-daily"));
    expect(db.rpcCalls.find(c => c.p_ip === "ai-daily:203.0.113.7").p_window_sec).toBe(86400);
  });

  it("a client over its own daily share is refused without spending the global cap", async () => {
    db.allow = (key) => key !== "ai-daily:203.0.113.7";
    const res = mockRes();
    await identify(mockReq({ items: [{ text: "Why so serious" }] }), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe(ERROR_MESSAGES.AI_DAILY_LIMIT_PER_IP);
    expect(db.rpcCalls.map(c => c.p_ip)).not.toContain("global:ai-daily");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reports the site-wide cap when the global bucket is empty", async () => {
    db.allow = (key) => key !== "global:ai-daily";
    const res = mockRes();
    await identify(mockReq({ items: [{ text: "Why so serious" }] }), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe(ERROR_MESSAGES.AI_DAILY_LIMIT);
  });

  it("doesn't spend the daily cap on invalid requests (e.g. the pre-warm ping)", async () => {
    const res = mockRes();
    await identify(mockReq({ messages: [] }), res);
    expect(res.statusCode).toBe(400);
    expect(db.rpcCalls.map(c => c.p_ip)).not.toContain("global:ai-daily");
  });

  it("rejects prompts over the size limit", async () => {
    const res = mockRes();
    await identify(mockReq({ items: [{ text: "x".repeat(9990) }, { text: "y".repeat(100) }] }), res);
    expect(res.statusCode).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("AI daily caps", () => {
  afterEach(() => {
    delete process.env.AI_DAILY_LIMIT;
    delete process.env.AI_DAILY_LIMIT_PER_IP;
  });

  it("one IP exhausting its share doesn't lock out other users", async () => {
    // In-memory buckets (no Supabase); unique IPs keep this test's buckets apart
    process.env.AI_DAILY_LIMIT_PER_IP = "2";
    process.env.AI_DAILY_LIMIT = "1000";
    const heavy = `198.51.100.${Date.now() % 250}`;
    expect(await checkAiDailyCap(null, heavy)).toBeNull();
    expect(await checkAiDailyCap(null, heavy)).toBeNull();
    expect(await checkAiDailyCap(null, heavy)).toBe(ERROR_MESSAGES.AI_DAILY_LIMIT_PER_IP);
    expect(await checkAiDailyCap(null, `${heavy}-other`)).toBeNull();
  });
});

describe("fetch-url SSRF checks", () => {
  it("blocks private, loopback, link-local and IPv4-mapped addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254",
      "100.100.100.200", "0.0.0.0", "::1", "::", "fd12::1", "fe80::1", "::ffff:7f00:1", "::ffff:a9fe:a9fe"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700::1111"]) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });

  it("rejects bracketed IPv6 literals that the old string check missed", async () => {
    expect(await checkHost("[::ffff:7f00:1]")).toMatch(/private/);
    expect(await checkHost("[fd12::1]")).toMatch(/private/);
    expect(await checkHost("[::]")).toMatch(/private/);
    expect(await checkHost("localhost")).toMatch(/private/);
  });

  it("allows a public IP literal", async () => {
    expect(await checkHost("93.184.216.34")).toBeNull();
  });
});
