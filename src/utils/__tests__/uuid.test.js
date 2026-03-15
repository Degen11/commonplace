import { describe, it, expect, vi } from "vitest";
import { generateId } from "../uuid";

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateId", () => {
  it("returns a valid UUID v4 format", () => {
    const id = generateId();
    expect(id).toMatch(UUID_V4_RE);
  });

  it("generates unique IDs across calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("produces valid UUID v4 from polyfill when crypto.randomUUID is unavailable", () => {
    const orig = crypto.randomUUID;
    crypto.randomUUID = undefined;
    try {
      const id = generateId();
      expect(id).toMatch(UUID_V4_RE);
    } finally {
      crypto.randomUUID = orig;
    }
  });

  it("polyfill generates unique IDs", () => {
    const orig = crypto.randomUUID;
    crypto.randomUUID = undefined;
    try {
      const ids = new Set(Array.from({ length: 50 }, () => generateId()));
      expect(ids.size).toBe(50);
    } finally {
      crypto.randomUUID = orig;
    }
  });
});
