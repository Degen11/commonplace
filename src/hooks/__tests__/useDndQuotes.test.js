// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDndQuotes from "../useDndQuotes";
import { useQuotesStore } from "../../stores/quotesStore";

const quote = (id) => ({ id, text: `Quote ${id}`, source: "S", category: "Reflection" });

// Wire the hook to the real store's collection actions, so the drop counts
// come from the real addToCollection.
function setup({ selected = new Set() } = {}) {
  const showToast = vi.fn();
  const s = useQuotesStore.getState();
  const props = {
    selected,
    collections: s.collections,
    addToCollection: s.addToCollection,
    removeFromCollection: s.removeFromCollection,
    setQuotes: s.setQuotes,
    showToast,
  };
  const { result } = renderHook(() => useDndQuotes(props));
  return { result, showToast };
}

const end = (result, activeId, overId) => act(() => {
  result.current.handleDndEnd({ active: { id: activeId }, over: overId == null ? null : { id: overId } });
});
const ids = () => useQuotesStore.getState().quotes.map(q => q.id);
const colQuoteIds = (id) => useQuotesStore.getState().collections.find(c => c.id === id).quoteIds;

beforeEach(() => {
  localStorage.clear();
  useQuotesStore.setState({
    quotes: ["q1", "q2", "q3", "q4"].map(quote),
    collections: [{ id: "c1", name: "Stoics", quoteIds: ["q3"], createdAt: 1 }],
    customCats: [], _deletedIds: [], activeCollectionId: null, isSharedView: false,
  });
});

describe("useDndQuotes — handleDndEnd, collection drop", () => {
  it("adds the dragged quote and offers undo", () => {
    const { result, showToast } = setup();
    end(result, "q1", "collection:c1");
    expect(colQuoteIds("c1")).toEqual(["q3", "q1"]);
    expect(showToast).toHaveBeenCalledWith('Added 1 quote to "Stoics"', "Undo", expect.any(Function), "success");
    act(() => showToast.mock.calls[0][2]());
    expect(colQuoteIds("c1")).toEqual(["q3"]);
  });

  it("drops the whole selection when the dragged quote is part of it", () => {
    const { result, showToast } = setup({ selected: new Set(["q1", "q2", "q3"]) });
    end(result, "q2", "collection:c1");
    expect(colQuoteIds("c1")).toEqual(["q3", "q1", "q2"]);
    expect(showToast).toHaveBeenCalledWith('1 quote already in "Stoics", 2 added', "Undo", expect.any(Function), "success");
  });

  it("drops only the dragged quote when it isn't in the selection", () => {
    const { result } = setup({ selected: new Set(["q1", "q2"]) });
    end(result, "q4", "collection:c1");
    expect(colQuoteIds("c1")).toEqual(["q3", "q4"]);
  });

  it("reports quotes that were already there, without undo", () => {
    const { result, showToast } = setup();
    end(result, "q3", "collection:c1");
    expect(colQuoteIds("c1")).toEqual(["q3"]);
    expect(showToast).toHaveBeenCalledWith('1 quote already in "Stoics"', undefined, undefined, "success");
  });

  it("doesn't reorder quotes on a collection drop", () => {
    const { result } = setup();
    end(result, "q1", "collection:c1");
    expect(ids()).toEqual(["q1", "q2", "q3", "q4"]);
    expect(result.current.dndReorderRef.current).toBe(false);
  });
});

describe("useDndQuotes — handleDndEnd, reorder", () => {
  it("moves the dragged quote to the drop target's position", () => {
    const { result } = setup();
    end(result, "q1", "q3");
    expect(ids()).toEqual(["q2", "q3", "q1", "q4"]);
    expect(result.current.dndReorderRef.current).toBe(true);
    end(result, "q4", "q2");
    expect(ids()).toEqual(["q4", "q2", "q3", "q1"]);
  });

  it("does nothing when dropped on itself or outside any target", () => {
    const { result, showToast } = setup();
    const before = useQuotesStore.getState().quotes;
    end(result, "q1", "q1");
    end(result, "q1", null);
    expect(useQuotesStore.getState().quotes).toBe(before);
    expect(showToast).not.toHaveBeenCalled();
  });

  it("leaves the list alone when an id isn't in it", () => {
    const { result } = setup();
    const before = useQuotesStore.getState().quotes;
    end(result, "q1", "gone");
    expect(useQuotesStore.getState().quotes).toBe(before);
  });

  it("clears the active and over drag ids", () => {
    const { result } = setup();
    act(() => result.current.handleDndStart({ active: { id: "q1" } }));
    act(() => result.current.handleDndOver({ over: { id: "q2" } }));
    expect(result.current.activeDragId).toBe("q1");
    expect(result.current.overDragId).toBe("q2");
    end(result, "q1", "q2");
    expect(result.current.activeDragId).toBeNull();
    expect(result.current.overDragId).toBeNull();
  });
});
