import { describe, it, expect } from "vitest";
import { pluralize, groupBy, countBy, propsEqual } from "../helpers";

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

describe("propsEqual", () => {
  it("returns true when listed props are equal", () => {
    const compare = propsEqual("a", "b");
    expect(compare({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 99 })).toBe(true);
  });

  it("returns false when a listed prop differs", () => {
    const compare = propsEqual("a", "b");
    expect(compare({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it("uses strict equality (not deep)", () => {
    const compare = propsEqual("obj");
    const arr = [1, 2];
    expect(compare({ obj: arr }, { obj: arr })).toBe(true);
    expect(compare({ obj: [1, 2] }, { obj: [1, 2] })).toBe(false);
  });

  it("supports custom comparator tuples", () => {
    const compare = propsEqual(
      "id",
      ["data", (prev, next) => prev.data.x === next.data.x],
    );
    expect(compare(
      { id: 1, data: { x: 10, y: 20 } },
      { id: 1, data: { x: 10, y: 99 } },
    )).toBe(true);
    expect(compare(
      { id: 1, data: { x: 10 } },
      { id: 1, data: { x: 11 } },
    )).toBe(false);
  });

  it("handles the CardItem actionProps comparator pattern", () => {
    // In real usage, React.memo passes the same q object reference when it
    // hasn't changed, so propsEqual("q", ...) checks reference equality.
    // Here we simulate that by sharing the same q reference.
    const compare = propsEqual(
      "q",
      ["actionProps", (prev, next) =>
        (prev.actionProps.copiedId === prev.q.id) === (next.actionProps.copiedId === next.q.id)],
    );

    const q = { id: "a" };

    // Both not copied → equal
    expect(compare(
      { q, actionProps: { copiedId: null } },
      { q, actionProps: { copiedId: null } },
    )).toBe(true);

    // One becomes copied → not equal
    expect(compare(
      { q, actionProps: { copiedId: null } },
      { q, actionProps: { copiedId: "a" } },
    )).toBe(false);

    // Both copied → equal
    expect(compare(
      { q, actionProps: { copiedId: "a" } },
      { q, actionProps: { copiedId: "a" } },
    )).toBe(true);

    // Different quote is copied (not this one) → still equal (both false)
    expect(compare(
      { q, actionProps: { copiedId: "b" } },
      { q, actionProps: { copiedId: "c" } },
    )).toBe(true);
  });
});
