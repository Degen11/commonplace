import { describe, it, expect } from "vitest";
import { getPublicShareId, isPublicSharePath } from "../shareLinks";

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
