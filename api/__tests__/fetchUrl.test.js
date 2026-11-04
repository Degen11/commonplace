import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import { gzipSync } from "node:zlib";

// Two independent resolvers, so a test can make them disagree the way a
// rebinding DNS server would: the pre-check sees a public address, the
// connection's own lookup gets a private one.
const dnsState = { precheck: [], connect: [] };
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => dnsState.precheck),
}));
vi.mock("node:dns", async (importOriginal) => ({
  ...(await importOriginal()),
  lookup: vi.fn((host, opts, cb) => cb(null, dnsState.connect)),
}));

const { default: fetchUrl, pinnedLookup, get, decodedBody } = await import("../fetch-url.js");

const PUBLIC = [{ address: "93.184.216.34", family: 4 }];
const LOOPBACK = [{ address: "127.0.0.1", family: 4 }];

function mockReq(url) {
  return {
    method: "POST",
    headers: {
      origin: "https://commonplace.pro",
      "x-requested-with": "CommonplaceApp",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.50",
    },
    body: { url, extractMode: "all" },
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

let server, port, hits;
beforeAll(async () => {
  server = http.createServer((req, res) => {
    hits++;
    if (req.url === "/gzip") {
      res.writeHead(200, { "content-type": "text/plain", "content-encoding": "gzip" });
      return res.end(gzipSync("hello from a compressed page"));
    }
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("internal secret");
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
afterAll(() => new Promise(r => server.close(r)));
beforeEach(() => { hits = 0; });

describe("fetch-url DNS rebinding", () => {
  it("never connects when the connection's lookup returns a private address", async () => {
    dnsState.precheck = PUBLIC;   // checkHost is satisfied…
    dnsState.connect = LOOPBACK;  // …but the socket's own lookup rebinds to loopback
    const res = mockRes();
    await fetchUrl(mockReq(`http://rebind.test:${port}/`), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/private/);
    expect(hits).toBe(0);
  });
});

describe("pinnedLookup", () => {
  const resolveTo = (addresses) => (host, opts, cb) => cb(null, addresses);
  const run = (addresses, options = {}) => new Promise(resolve => {
    pinnedLookup("example.test", options, (...args) => resolve(args), resolveTo(addresses));
  });

  it("refuses private addresses", async () => {
    const [err] = await run(LOOPBACK);
    expect(err.code).toBe("EPRIVATEHOST");
  });

  it("refuses when any resolved address is private", async () => {
    const [err] = await run([...PUBLIC, { address: "10.0.0.5", family: 4 }]);
    expect(err.code).toBe("EPRIVATEHOST");
  });

  it("refuses an empty answer", async () => {
    const [err] = await run([]);
    expect(err.code).toBe("EPRIVATEHOST");
  });

  it("hands back the checked public address", async () => {
    expect(await run(PUBLIC)).toEqual([null, "93.184.216.34", 4]);
    expect(await run(PUBLIC, { all: true })).toEqual([null, PUBLIC]);
  });

  it("passes resolver errors through", async () => {
    const err = new Error("ENOTFOUND");
    const args = await new Promise(resolve => pinnedLookup("x", {}, (...a) => resolve(a), (h, o, cb) => cb(err)));
    expect(args[0]).toBe(err);
  });
});

describe("get + decodedBody", () => {
  // A permissive lookup, only so the test can reach its own local server
  const local = (host, opts, cb) => opts?.all ? cb(null, LOOPBACK) : cb(null, "127.0.0.1", 4);

  it("decompresses gzip bodies", async () => {
    const response = await get(new URL(`http://local.test:${port}/gzip`), { lookup: local });
    let text = "";
    for await (const chunk of decodedBody(response)) text += chunk;
    expect(response.statusCode).toBe(200);
    expect(text).toBe("hello from a compressed page");
  });

  it("uses pinnedLookup by default", async () => {
    dnsState.connect = LOOPBACK;
    await expect(get(new URL(`http://local.test:${port}/`))).rejects.toMatchObject({ code: "EPRIVATEHOST" });
    expect(hits).toBe(0);
  });
});
