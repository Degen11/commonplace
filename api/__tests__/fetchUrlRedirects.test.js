import { describe, it, expect, vi, beforeEach } from "vitest";

// fetch-url follows redirects itself, one node:http(s).get per hop. Stub those
// at the module layer: each call takes the next scripted response. DNS
// pre-checks (checkHost) resolve every name to a public address, so only the
// redirect-hop checks decide the outcome.
const net = { responses: [], requested: [] };
function fakeGet(url, opts, onResponse) {
  net.requested.push(url.href);
  const next = net.responses.shift() ?? { statusCode: 200, headers: { "content-type": "text/plain" } };
  const response = { resume: vi.fn(), destroy: vi.fn(), ...next };
  net.lastResponse = response;
  Promise.resolve().then(() => onResponse(response));
  return { on: vi.fn() };
}
vi.mock("node:http", () => ({ default: { get: vi.fn(fakeGet) } }));
vi.mock("node:https", () => ({ default: { get: vi.fn(fakeGet) } }));
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

const { default: fetchUrl } = await import("../fetch-url.js");

const redirect = (location, statusCode = 302) => ({ statusCode, headers: { location } });

function mockReq(url) {
  return {
    method: "POST",
    headers: {
      origin: "https://commonplace.pro",
      "x-requested-with": "CommonplaceApp",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.51",
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

async function run(url) {
  const res = mockRes();
  await fetchUrl(mockReq(url), res);
  return res;
}

beforeEach(() => {
  net.responses = [];
  net.requested = [];
});

describe("fetch-url redirect handling", () => {
  it("blocks a redirect to the cloud metadata address without requesting it", async () => {
    net.responses = [redirect("http://169.254.169.254/latest/meta-data/")];
    const res = await run("https://example.com/start");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Redirect to private/internal address blocked");
    expect(net.requested).toEqual(["https://example.com/start"]);
  });

  it("blocks a redirect to a localhost name", async () => {
    net.responses = [redirect("http://localhost:8080/admin", 307)];
    const res = await run("https://example.com/");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Redirect to private/internal address blocked");
    expect(net.requested).toHaveLength(1);
  });

  it("refuses a redirect to a non-http(s) protocol", async () => {
    net.responses = [redirect("file:///etc/passwd")];
    const res = await run("https://example.com/");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Redirect to unsupported protocol");
    expect(net.requested).toHaveLength(1);
  });

  it("stops after the redirect cap", async () => {
    net.responses = Array.from({ length: 10 }, (_, i) => redirect(`/hop${i + 1}`));
    const res = await run("https://example.com/hop0");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Too many redirects");
    // The first request plus MAX_REDIRECTS (5) followed hops
    expect(net.requested).toEqual([0, 1, 2, 3, 4, 5].map(i => `https://example.com/hop${i}`));
  });

  it("follows a relative redirect to a public host and returns its content", async () => {
    net.responses = [
      redirect("/final", 301),
      {
        statusCode: 200,
        headers: { "content-type": "text/plain" },
        async *[Symbol.asyncIterator]() { yield Buffer.from("A line long enough to keep\n"); },
      },
    ];
    const res = await run("http://example.com/start");
    expect(res.statusCode).toBe(200);
    expect(net.requested).toEqual(["http://example.com/start", "http://example.com/final"]);
    expect(res.body.lines).toEqual(["A line long enough to keep"]);
  });
});
