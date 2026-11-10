// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useQuotesStore } from "../quotesStore";

const store = () => useQuotesStore.getState();
const col = (id, name, quoteIds = []) => ({ id, name, quoteIds, createdAt: 1 });

beforeEach(() => {
  localStorage.clear();
  useQuotesStore.setState({
    quotes: [], customCats: [], collections: [], _deletedIds: [],
    initialLoading: true, isSharedView: false, activeCollectionId: null,
  });
});

describe("quotesStore — createCollection", () => {
  it("creates an empty collection with a sanitized name", () => {
    const created = store().createCollection("  <b>Stoic's</b> \"picks\"  ");
    expect(created).toMatchObject({ name: "bStoics/b picks", quoteIds: [] });
    expect(typeof created.id).toBe("string");
    expect(typeof created.createdAt).toBe("number");
    expect(store().collections).toEqual([created]);
  });

  it("caps names at 50 characters", () => {
    expect(store().createCollection("x".repeat(80)).name).toHaveLength(50);
  });

  it("rejects names that are empty after sanitizing", () => {
    expect(store().createCollection("   ")).toEqual({ error: "invalid" });
    expect(store().createCollection("<>&")).toEqual({ error: "invalid" });
    expect(store().collections).toEqual([]);
  });

  it("rejects a duplicate name, case-insensitively", () => {
    store().createCollection("Favorites");
    expect(store().createCollection("  favorites ")).toEqual({ error: "duplicate", name: "favorites" });
    expect(store().collections).toHaveLength(1);
  });
});

describe("quotesStore — renameCollection / deleteCollection", () => {
  beforeEach(() => {
    useQuotesStore.setState({ collections: [col("a", "Alpha"), col("b", "Beta")] });
  });

  it("renames only the target collection, sanitizing the name", () => {
    store().renameCollection("a", " <i>Gamma</i> ");
    expect(store().collections.map(c => c.name)).toEqual(["iGamma/i", "Beta"]);
  });

  it("ignores a rename to an empty name", () => {
    store().renameCollection("a", "   ");
    expect(store().collections[0].name).toBe("Alpha");
  });

  it("deletes a collection and clears it if it was active", () => {
    useQuotesStore.setState({ activeCollectionId: "a" });
    store().deleteCollection("a");
    expect(store().collections.map(c => c.id)).toEqual(["b"]);
    expect(store().activeCollectionId).toBeNull();
  });

  it("keeps a different active collection when deleting", () => {
    useQuotesStore.setState({ activeCollectionId: "b" });
    store().deleteCollection("a");
    expect(store().activeCollectionId).toBe("b");
  });

  it("restoreCollection re-adds a deleted collection once", () => {
    const alpha = store().collections[0];
    store().deleteCollection("a");
    store().restoreCollection(alpha);
    store().restoreCollection(alpha);
    expect(store().collections.map(c => c.id)).toEqual(["b", "a"]);
  });
});

describe("quotesStore — addToCollection / removeFromCollection", () => {
  beforeEach(() => {
    useQuotesStore.setState({ collections: [col("a", "Alpha", ["q1"]), col("b", "Beta")] });
  });

  it("adds new ids and counts the ones already there as skipped", () => {
    expect(store().addToCollection("a", ["q1", "q2", "q3"])).toEqual({ added: 2, skipped: 1 });
    expect(store().collections[0].quoteIds).toEqual(["q1", "q2", "q3"]);
    expect(store().collections[1].quoteIds).toEqual([]);
  });

  it("changes nothing when every id is already in the collection", () => {
    const before = store().collections;
    expect(store().addToCollection("a", ["q1"])).toEqual({ added: 0, skipped: 1 });
    expect(store().collections).toBe(before);
  });

  it("removes ids from one collection only", () => {
    store().addToCollection("b", ["q1"]);
    store().removeFromCollection("a", ["q1"]);
    expect(store().collections.map(c => c.quoteIds)).toEqual([[], ["q1"]]);
  });
});

describe("quotesStore — cleanCollectionRefs", () => {
  it("strips deleted quote ids from every collection", () => {
    useQuotesStore.setState({
      collections: [col("a", "Alpha", ["q1", "q2"]), col("b", "Beta", ["q2", "q3"]), col("c", "Gamma", ["q4"])],
    });
    store().cleanCollectionRefs(["q2", "q4", "missing"]);
    expect(store().collections.map(c => c.quoteIds)).toEqual([["q1"], ["q3"], []]);
  });

  it("leaves state alone when no collection references the ids", () => {
    useQuotesStore.setState({ collections: [col("a", "Alpha", ["q1"])] });
    const before = store().collections;
    store().cleanCollectionRefs(["q9"]);
    expect(store().collections).toBe(before);
  });
});
