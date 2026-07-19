// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useQuotesStore } from "../quotesStore";
import { LS_QUOTES, LS_DELETED_IDS } from "../../config";

const q = (id, text, updatedAt = 1) => ({ id, text, source: "S", category: "Reflection", updatedAt });

beforeEach(() => {
  localStorage.clear();
  useQuotesStore.setState({
    quotes: [], customCats: [], collections: [], _deletedIds: [],
    initialLoading: true, isSharedView: false, activeCollectionId: null,
  });
});

describe("quotesStore — tombstones", () => {
  it("trackDeletion adds and untrackDeletion removes tombstones (undo path)", () => {
    const s = useQuotesStore.getState();
    s.trackDeletion(["q1", "q2"]);
    expect(useQuotesStore.getState()._deletedIds.map(e => e.id).sort()).toEqual(["q1", "q2"]);
    s.untrackDeletion(["q1"]);
    expect(useQuotesStore.getState()._deletedIds.map(e => e.id)).toEqual(["q2"]);
  });
});

describe("quotesStore — cloud merge (handleCloudData)", () => {
  it("drops tombstoned cloud quotes on first load", () => {
    useQuotesStore.setState({
      _deletedIds: [{ id: "x", deletedAt: Date.now() }], initialLoading: true, quotes: [],
    });
    useQuotesStore.getState().handleCloudData([q("x", "deleted"), q("y", "kept")], [], []);
    const ids = useQuotesStore.getState().quotes.map(o => o.id);
    expect(ids).toContain("y");
    expect(ids).not.toContain("x"); // deleted quote must not resurrect from the cloud
  });

  it("merges cloud into local for a returning user, still filtering tombstones", () => {
    useQuotesStore.setState({
      quotes: [q("a", "A", 5)],
      _deletedIds: [{ id: "x", deletedAt: Date.now() }],
      initialLoading: false,
    });
    useQuotesStore.getState().handleCloudData([q("x", "deleted", 9), q("y", "kept", 2)], [], []);
    expect(useQuotesStore.getState().quotes.map(o => o.id).sort()).toEqual(["a", "y"]);
  });
});

describe("quotesStore — cross-tab storage sync", () => {
  it("merges quotes written by another tab", () => {
    useQuotesStore.setState({ quotes: [q("a", "A", 1)] });
    window.dispatchEvent(new StorageEvent("storage", {
      key: LS_QUOTES, newValue: JSON.stringify([q("b", "B", 2)]),
    }));
    expect(useQuotesStore.getState().quotes.map(o => o.id).sort()).toEqual(["a", "b"]);
  });

  it("applies a tombstone from another tab and removes the matching quote", () => {
    useQuotesStore.setState({ quotes: [q("a", "A", 1)], _deletedIds: [] });
    window.dispatchEvent(new StorageEvent("storage", {
      key: LS_DELETED_IDS, newValue: JSON.stringify([{ id: "a", deletedAt: Date.now() }]),
    }));
    const st = useQuotesStore.getState();
    expect(st.quotes.map(o => o.id)).not.toContain("a");
    expect(st._deletedIds.map(e => e.id)).toContain("a");
  });

  it("ignores malformed cross-tab quote payloads", () => {
    useQuotesStore.setState({ quotes: [q("a", "A", 1)] });
    window.dispatchEvent(new StorageEvent("storage", {
      key: LS_QUOTES, newValue: JSON.stringify([{ nope: true }]),
    }));
    expect(useQuotesStore.getState().quotes.map(o => o.id)).toEqual(["a"]);
  });
});
