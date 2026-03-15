import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { loadFromStorage, saveToStorage } from "../storage";

// Minimal localStorage mock for Node environment
const store = {};
const localStorageMock = {
  getItem: (key) => key in store ? store[key] : null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};
globalThis.localStorage = localStorageMock;

describe("loadFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns parsed array from valid JSON", () => {
    localStorage.setItem("test_key", JSON.stringify([1, 2, 3]));
    expect(loadFromStorage("test_key")).toEqual([1, 2, 3]);
  });

  it("returns fallback for missing key", () => {
    expect(loadFromStorage("missing_key")).toEqual([]);
  });

  it("returns fallback for corrupt JSON", () => {
    localStorage.setItem("bad_json", "{not valid json");
    expect(loadFromStorage("bad_json")).toEqual([]);
  });

  it("returns fallback when validation fails", () => {
    localStorage.setItem("not_array", JSON.stringify("a string"));
    expect(loadFromStorage("not_array")).toEqual([]);
  });

  it("supports custom validator", () => {
    localStorage.setItem("obj", JSON.stringify({ a: 1 }));
    const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
    expect(loadFromStorage("obj", isObj, {})).toEqual({ a: 1 });
  });

  it("rejects value that fails custom validator", () => {
    localStorage.setItem("obj", JSON.stringify([1, 2]));
    const isString = (v) => typeof v === "string";
    expect(loadFromStorage("obj", isString, "default")).toBe("default");
  });

  it("calls fallback function when provided", () => {
    const fallbackFn = vi.fn(() => ["generated"]);
    const result = loadFromStorage("missing", Array.isArray, fallbackFn);
    expect(result).toEqual(["generated"]);
    expect(fallbackFn).toHaveBeenCalledOnce();
  });

  it("does not call fallback function when key exists and is valid", () => {
    localStorage.setItem("exists", JSON.stringify([1]));
    const fallbackFn = vi.fn(() => ["wrong"]);
    const result = loadFromStorage("exists", Array.isArray, fallbackFn);
    expect(result).toEqual([1]);
    expect(fallbackFn).not.toHaveBeenCalled();
  });

  it("handles null stored value", () => {
    expect(loadFromStorage("nope")).toEqual([]);
  });
});

describe("saveToStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and returns true on success", () => {
    expect(saveToStorage("key", { a: 1 })).toBe(true);
    expect(JSON.parse(localStorage.getItem("key"))).toEqual({ a: 1 });
  });

  it("saves arrays", () => {
    saveToStorage("arr", [1, 2, 3]);
    expect(JSON.parse(localStorage.getItem("arr"))).toEqual([1, 2, 3]);
  });

  it("returns false on quota error", () => {
    const orig = localStorage.setItem;
    localStorage.setItem = () => { throw new DOMException("quota exceeded"); };
    expect(saveToStorage("key", "value")).toBe(false);
    localStorage.setItem = orig;
  });
});
