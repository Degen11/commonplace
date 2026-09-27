import { describe, it, expect, vi, afterEach } from "vitest";
import { getPublicShareId, isPublicSharePath, canNativeShare, nativeShare } from "../shareLinks";

const loc = (pathname, hash = "") => ({ pathname, hash });

describe("getPublicShareId", () => {
  it("reads /c/<id> share paths", () => {
    expect(getPublicShareId(loc("/c/abc12345"))).toBe("abc12345");
    expect(getPublicShareId(loc("/c/abc12345/"))).toBe("abc12345");
  });

  it("still reads legacy #p=<id> links", () => {
    expect(getPublicShareId(loc("/", "#p=abc12345"))).toBe("abc12345");
  });

  it("rejects malformed IDs", () => {
    expect(getPublicShareId(loc("/c/AB"))).toBeNull();
    expect(getPublicShareId(loc("/c/abc/def"))).toBeNull();
    expect(getPublicShareId(loc("/c/abc!1234"))).toBeNull();
    expect(getPublicShareId(loc("/", "#p=ab"))).toBeNull();
  });

  it("returns null when there's no public share in the URL", () => {
    expect(getPublicShareId(loc("/"))).toBeNull();
    expect(getPublicShareId(loc("/", "#s=eyJ4IjoxfQ"))).toBeNull();
  });
});

describe("isPublicSharePath", () => {
  it("matches only /c/ paths", () => {
    expect(isPublicSharePath(loc("/c/abc12345"))).toBe(true);
    expect(isPublicSharePath(loc("/"))).toBe(false);
    expect(isPublicSharePath(loc("/privacy"))).toBe(false);
  });
});

describe("canNativeShare", () => {
  afterEach(() => vi.unstubAllGlobals());
  const stub = ({ coarse = true, share = vi.fn(), canShare } = {}) => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: coarse }) });
    vi.stubGlobal("navigator", { share, ...(canShare ? { canShare } : {}) });
  };

  it("is true on touch devices with the Web Share API", () => {
    stub();
    expect(canNativeShare({ url: "https://x.test" })).toBe(true);
  });

  it("is false on fine-pointer (desktop) devices", () => {
    stub({ coarse: false });
    expect(canNativeShare()).toBe(false);
  });

  it("is false without navigator.share", () => {
    stub({ share: null });
    expect(canNativeShare()).toBe(false);
  });

  it("respects navigator.canShare for the given data", () => {
    stub({ canShare: () => false });
    expect(canNativeShare({ files: [] })).toBe(false);
  });
});

describe("nativeShare", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves shared on success and cancelled on AbortError", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockResolvedValue() });
    await expect(nativeShare({ url: "u" })).resolves.toBe("shared");
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "AbortError" })) });
    await expect(nativeShare({ url: "u" })).resolves.toBe("cancelled");
  });

  it("rejects on other errors so callers can fall back", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "NotAllowedError" })) });
    await expect(nativeShare({ url: "u" })).rejects.toMatchObject({ name: "NotAllowedError" });
  });
});
