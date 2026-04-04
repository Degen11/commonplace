import { describe, it, expect } from "vitest";
import {
  pluralize, groupBy, countBy,
  addToSet, removeFromSet, toggleInSet, addAllToSet, removeAllFromSet,
} from "../helpers";

describe("pluralize", () => {
  it("returns singular for count of 1", () => {
    expect(pluralize(1, "quote")).toBe("1 quote");
  });

  it("returns plural for count of 0", () => {
    expect(pluralize(0, "quote")).toBe("0 quotes");
  });

  it("returns plural for count > 1", () => {
    expect(pluralize(5, "quote")).toBe("5 quotes");
  });

  it("supports custom plural form", () => {
    expect(pluralize(1, "entry", "entries")).toBe("1 entry");
    expect(pluralize(3, "entry", "entries")).toBe("3 entries");
  });
});

describe("groupBy", () => {
  it("groups items by a key", () => {
    const items = [
      { category: "Film", text: "a" },
      { category: "Book", text: "b" },
      { category: "Film", text: "c" },
    ];
    const result = groupBy(items, "category");
    expect(Object.keys(result)).toEqual(["Film", "Book"]);
    expect(result.Film).toHaveLength(2);
    expect(result.Book).toHaveLength(1);
  });

  it("returns empty object for empty array", () => {
    expect(groupBy([], "key")).toEqual({});
  });

  it("handles items with undefined key", () => {
    const items = [{ a: 1 }, { b: 2 }];
    const result = groupBy(items, "a");
    expect(result[1]).toEqual([{ a: 1 }]);
    expect(result["undefined"]).toEqual([{ b: 2 }]);
  });
});

describe("countBy", () => {
  it("counts occurrences of each value", () => {
    const items = [
      { category: "Film" },
      { category: "Book" },
      { category: "Film" },
      { category: "Film" },
    ];
    const result = countBy(items, "category");
    expect(result).toEqual({ Film: 3, Book: 1 });
  });

  it("returns empty object for empty array", () => {
    expect(countBy([], "key")).toEqual({});
  });
});

describe("addToSet", () => {
  it("returns a new Set with the item added", () => {
    const original = new Set(["a", "b"]);
    const result = addToSet(original, "c");
    expect(result.has("c")).toBe(true);
    expect(result.size).toBe(3);
    expect(original.has("c")).toBe(false);
  });

  it("does not duplicate existing items", () => {
    const result = addToSet(new Set(["a"]), "a");
    expect(result.size).toBe(1);
  });
});

describe("removeFromSet", () => {
  it("returns a new Set without the item", () => {
    const original = new Set(["a", "b", "c"]);
    const result = removeFromSet(original, "b");
    expect(result.has("b")).toBe(false);
    expect(result.size).toBe(2);
    expect(original.has("b")).toBe(true);
  });

  it("handles removing a non-existent item", () => {
    const original = new Set(["a"]);
    const result = removeFromSet(original, "z");
    expect(result.size).toBe(1);
    expect(result.has("a")).toBe(true);
  });
});

describe("toggleInSet", () => {
  it("adds item if not present", () => {
    const result = toggleInSet(new Set(["a"]), "b");
    expect(result.has("b")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("removes item if present", () => {
    const result = toggleInSet(new Set(["a", "b"]), "b");
    expect(result.has("b")).toBe(false);
    expect(result.size).toBe(1);
  });
});

describe("addAllToSet", () => {
  it("adds multiple items at once", () => {
    const result = addAllToSet(new Set(["a"]), ["b", "c", "d"]);
    expect(result.size).toBe(4);
    expect([...result]).toEqual(["a", "b", "c", "d"]);
  });

  it("deduplicates against existing items", () => {
    const result = addAllToSet(new Set(["a", "b"]), ["b", "c"]);
    expect(result.size).toBe(3);
  });
});

describe("removeAllFromSet", () => {
  it("removes multiple items at once", () => {
    const result = removeAllFromSet(new Set(["a", "b", "c", "d"]), ["b", "d"]);
    expect(result.size).toBe(2);
    expect(result.has("a")).toBe(true);
    expect(result.has("c")).toBe(true);
  });

  it("ignores items not in the set", () => {
    const result = removeAllFromSet(new Set(["a"]), ["x", "y"]);
    expect(result.size).toBe(1);
    expect(result.has("a")).toBe(true);
  });
});
