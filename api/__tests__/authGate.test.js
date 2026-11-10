import { describe, it, expect, vi, beforeEach } from "vitest";
import { withApiHandler, ERROR_MESSAGES } from "../_shared.js";

function mockReq(headers = {}, method = "POST") {
  return {
    method,
    headers: {
      "x-requested-with": "CommonplaceApp",
      "content-type": "application/json",
      ...headers,
    },
    body: {},
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

describe("withApiHandler auth gate", () => {
  let inner, handler;
  beforeEach(() => {
    inner = vi.fn((req, res) => res.status(200).json({ ok: true }));
    handler = withApiHandler(inner);
  });

  async function call(headers) {
    const res = mockRes();
    await handler(mockReq(headers), res);
    return res;
  }

  it("rejects a foreign Origin", async () => {
    const res = await call({ origin: "https://evil.example" });
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: ERROR_MESSAGES.FORBIDDEN });
    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(inner).not.toHaveBeenCalled();
  });

  it("rejects a Referer on a look-alike subdomain", async () => {
    const res = await call({ referer: "https://commonplace.pro.evil.com/page" });
    expect(res.statusCode).toBe(403);
    expect(inner).not.toHaveBeenCalled();
  });

  it("rejects a Referer that only has the allowed origin as a prefix or in its path", async () => {
    for (const referer of ["https://commonplace.pro@evil.com/", "https://evil.com/https://commonplace.pro", "not a url"]) {
      const res = await call({ referer });
      expect(res.statusCode).toBe(403);
    }
    expect(inner).not.toHaveBeenCalled();
  });

  it("rejects a request with neither Origin nor Referer", async () => {
    const res = await call({});
    expect(res.statusCode).toBe(403);
    expect(inner).not.toHaveBeenCalled();
  });

  it("rejects an allowed origin without the X-Requested-With header", async () => {
    const res = mockRes();
    const req = mockReq({ origin: "https://commonplace.pro" });
    delete req.headers["x-requested-with"];
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(inner).not.toHaveBeenCalled();
  });

  it("lets an allowed Origin through to the handler", async () => {
    const res = await call({ origin: "https://commonplace.pro" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://commonplace.pro");
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("lets an allowed Referer through when Origin is absent", async () => {
    const res = await call({ referer: "https://commonplace.pro/c/abcd1234" });
    expect(res.statusCode).toBe(200);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("skips the gate when requireAuth returns false for the request", async () => {
    const open = withApiHandler(inner, { methods: ["GET"], requireAuth: (req) => req.method !== "GET" });
    const res = mockRes();
    const req = mockReq({}, "GET");
    delete req.headers["x-requested-with"];
    await open(req, res);
    expect(res.statusCode).toBe(200);
    expect(inner).toHaveBeenCalledTimes(1);
  });
});
