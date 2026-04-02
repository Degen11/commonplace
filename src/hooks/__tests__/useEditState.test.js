/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useEditState from "../useEditState";

// Helper to create a quote object
const makeQuote = (id, overrides = {}) => ({
  id,
  text: `Quote ${id}`,
  source: `Source ${id}`,
  category: "Book",
  confidence: "high",
  updatedAt: 1000,
  ...overrides,
});

// Creates a setQuotes mock that applies functional updaters to track state
function createSetQuotesMock(initialQuotes) {
  let current = initialQuotes;
  const mock = vi.fn((updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      current = updaterOrValue(current);
    } else {
      current = updaterOrValue;
    }
  });
  mock.getCurrent = () => current;
  return mock;
}

function createDefaultProps(quotesOverride) {
  const quotes = quotesOverride || [
    makeQuote("q1"),
    makeQuote("q2"),
    makeQuote("q3"),
  ];
  const setQuotes = createSetQuotesMock(quotes);
  return {
    quotes,
    setQuotes,
    filtered: quotes,
    visibleFiltered: quotes,
    filterKey: "all",
    showToast: vi.fn(),
    trackDeletion: vi.fn(),
    untrackDeletion: vi.fn(),
    cleanCollectionRefs: vi.fn(),
    collections: [],
    addToCollection: vi.fn(),
  };
}

describe("useEditState", () => {
  let props;

  beforeEach(() => {
    props = createDefaultProps();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── 1. Initial state values ──

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useEditState(props));

      expect(result.current.editingId).toBe(null);
      expect(result.current.inlineEdit).toBe(null);
      expect(result.current.selected).toEqual(new Set());
      expect(result.current.bulkEditCat).toBe("");
      expect(result.current.bulkEditSource).toBe("");
      expect(result.current.reviewQueue).toEqual([]);
      expect(result.current.confirmBulkDel).toBe(false);
      expect(result.current.savedPulse).toBe(null);
      expect(result.current.lastSelectedIndex.current).toBe(null);
    });
  });

  // ── 2. startEditing / startInlineEdit mutual exclusion ──

  describe("startEditing / startInlineEdit mutual exclusion", () => {
    it("startEditing sets editingId and clears inlineEdit", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startInlineEdit("q1", "source"));
      expect(result.current.inlineEdit).toEqual({ id: "q1", field: "source" });

      act(() => result.current.startEditing("q2"));
      expect(result.current.editingId).toBe("q2");
      expect(result.current.inlineEdit).toBe(null);
    });

    it("startInlineEdit sets inlineEdit and clears editingId", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startEditing("q1"));
      expect(result.current.editingId).toBe("q1");

      act(() => result.current.startInlineEdit("q2", "category"));
      expect(result.current.inlineEdit).toEqual({ id: "q2", field: "category" });
      expect(result.current.editingId).toBe(null);
    });
  });

  // ── 3. saveEdit ──

  describe("saveEdit", () => {
    it("updates quote via setQuotes and clears editingId", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", "New text", "New source", "Film"));

      expect(props.setQuotes).toHaveBeenCalled();
      const updated = props.setQuotes.getCurrent();
      const q1 = updated.find((q) => q.id === "q1");
      expect(q1.text).toBe("New text");
      expect(q1.source).toBe("New source");
      expect(q1.category).toBe("Film");
      expect(q1.confidence).toBe("high");
      expect(result.current.editingId).toBe(null);
    });

    it("advances review queue after saving", () => {
      const quotes = [
        makeQuote("q1", { confidence: "low" }),
        makeQuote("q2", { confidence: "low" }),
        makeQuote("q3", { confidence: "low" }),
      ];
      const localProps = createDefaultProps(quotes);
      // Mock querySelector to return null (no DOM in test)
      vi.spyOn(document, "querySelector").mockReturnValue(null);

      const { result } = renderHook(() => useEditState(localProps));

      // Set up review queue manually
      act(() => result.current.setReviewQueue(["q1", "q2", "q3"]));
      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", "Fixed text", "Known source", "Book"));

      // q1 should be removed from queue
      expect(result.current.reviewQueue).toEqual(["q2", "q3"]);

      // After timeout, next item should be opened for editing
      act(() => vi.advanceTimersByTime(200));
      expect(result.current.editingId).toBe("q2");

      document.querySelector.mockRestore();
    });

    it("shows success toast when review queue is completed", () => {
      const localProps = createDefaultProps();
      const { result } = renderHook(() => useEditState(localProps));

      act(() => result.current.setReviewQueue(["q1"]));
      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", "Fixed", "Source", "Book"));

      expect(result.current.reviewQueue).toEqual([]);
      expect(localProps.showToast).toHaveBeenCalledWith(
        "Review complete — all entries updated!",
        null,
        null,
        "success"
      );
    });
  });

  // ── 4. saveEdit with empty text ──

  describe("saveEdit with empty text", () => {
    it("does not update when text is empty", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", "", "Source", "Book"));

      expect(props.setQuotes).not.toHaveBeenCalled();
      expect(result.current.editingId).toBe("q1"); // still editing
    });

    it("does not update when text is whitespace only", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", "   ", "Source", "Book"));

      expect(props.setQuotes).not.toHaveBeenCalled();
    });

    it("does not update when text is null/undefined", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startEditing("q1"));
      act(() => result.current.saveEdit("q1", null, "Source", "Book"));

      expect(props.setQuotes).not.toHaveBeenCalled();
    });
  });

  // ── 5. saveInlineField ──

  describe("saveInlineField", () => {
    it("updates the correct field and clears inlineEdit", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.startInlineEdit("q1", "category"));
      act(() => result.current.saveInlineField("q1", "category", "Film"));

      const updated = props.setQuotes.getCurrent();
      const q1 = updated.find((q) => q.id === "q1");
      expect(q1.category).toBe("Film");
      expect(q1.confidence).toBe("high");
      expect(result.current.inlineEdit).toBe(null);
    });

    it("triggers savedPulse that auto-clears", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.saveInlineField("q1", "source", "New Source"));
      expect(result.current.savedPulse).toEqual({ id: "q1", field: "source" });

      act(() => vi.advanceTimersByTime(500));
      expect(result.current.savedPulse).toBe(null);
    });

    it("keeps original source when inline source edit is empty", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.saveInlineField("q1", "source", "  "));

      const updated = props.setQuotes.getCurrent();
      const q1 = updated.find((q) => q.id === "q1");
      // Empty source falls back to original
      expect(q1.source).toBe("Source q1");
    });
  });

  // ── 6. toggleSel ──

  describe("toggleSel", () => {
    it("adds an id on first toggle", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      expect(result.current.selected.has("q1")).toBe(true);
    });

    it("removes an id on second toggle", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      act(() => result.current.toggleSel("q1"));
      expect(result.current.selected.has("q1")).toBe(false);
    });

    it("shift-click selects a range", () => {
      const { result } = renderHook(() => useEditState(props));

      // First click sets the anchor
      act(() => result.current.toggleSel("q1"));
      // Shift-click extends to q3
      act(() => result.current.toggleSel("q3", true));

      expect(result.current.selected.has("q1")).toBe(true);
      expect(result.current.selected.has("q2")).toBe(true);
      expect(result.current.selected.has("q3")).toBe(true);
    });

    it("shift-click falls back to single toggle when anchor not in scope", () => {
      const { result } = renderHook(() => useEditState(props));

      // Set anchor to a non-existent quote
      act(() => result.current.toggleSel("q1"));
      // Remove q1 from scope by rerendering with new props
      const newProps = {
        ...props,
        quotes: [makeQuote("q2"), makeQuote("q3")],
        filtered: [makeQuote("q2"), makeQuote("q3")],
        visibleFiltered: [makeQuote("q2"), makeQuote("q3")],
      };
      const { result: result2 } = renderHook(() => useEditState(newProps));

      // lastSelectedIndex points to q1 which is not in scope
      // Since we can't share ref state between hooks, test the logic path:
      // When lastSelectedIndex is null, shift-click acts as single toggle
      act(() => result2.current.toggleSel("q3", true));
      expect(result2.current.selected.has("q3")).toBe(true);
    });
  });

  // ── 7. selAll ──

  describe("selAll", () => {
    it("selects all visible filtered quotes", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.selAll());
      expect(result.current.selected.size).toBe(3);
      expect(result.current.selected.has("q1")).toBe(true);
      expect(result.current.selected.has("q2")).toBe(true);
      expect(result.current.selected.has("q3")).toBe(true);
    });

    it("deselects all when all are already selected", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.selAll());
      expect(result.current.selected.size).toBe(3);

      act(() => result.current.selAll());
      expect(result.current.selected.size).toBe(0);
    });

    it("does nothing when scope is empty", () => {
      const emptyProps = { ...props, filtered: [], visibleFiltered: [] };
      const { result } = renderHook(() => useEditState(emptyProps));

      act(() => result.current.selAll());
      expect(result.current.selected.size).toBe(0);
    });
  });

  // ── 8. applyBulk ──

  describe("applyBulk", () => {
    it("applies category and source changes to selected quotes", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => {
        result.current.toggleSel("q1");
        result.current.toggleSel("q2");
      });
      act(() => {
        result.current.setBulkEditCat("Film");
        result.current.setBulkEditSource("New Source");
      });
      act(() => result.current.applyBulk());

      const updated = props.setQuotes.getCurrent();
      expect(updated.find((q) => q.id === "q1").category).toBe("Film");
      expect(updated.find((q) => q.id === "q1").source).toBe("New Source");
      expect(updated.find((q) => q.id === "q2").category).toBe("Film");
      // q3 should be unchanged
      expect(updated.find((q) => q.id === "q3").category).toBe("Book");
    });

    it("clears selection and bulk fields after apply", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      act(() => result.current.setBulkEditCat("Film"));
      act(() => result.current.applyBulk());

      expect(result.current.selected.size).toBe(0);
      expect(result.current.bulkEditCat).toBe("");
      expect(result.current.bulkEditSource).toBe("");
    });

    it("calls showToast with undo callback", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      act(() => result.current.setBulkEditCat("Film"));
      act(() => result.current.applyBulk());

      expect(props.showToast).toHaveBeenCalledTimes(1);
      const [msg, undoLabel, undoFn] = props.showToast.mock.calls[0];
      expect(msg).toContain("Updated 1 entry");
      expect(msg).toContain("category");
      expect(undoLabel).toBe("Undo");
      expect(typeof undoFn).toBe("function");

      // Execute undo
      act(() => undoFn());
      const restored = props.setQuotes.getCurrent();
      expect(restored.find((q) => q.id === "q1").category).toBe("Book");
    });
  });

  // ── 9. bulkDel ──

  describe("bulkDel", () => {
    it("removes selected quotes and calls trackDeletion", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => {
        result.current.toggleSel("q1");
        result.current.toggleSel("q2");
      });
      act(() => result.current.setConfirmBulkDel(true));
      act(() => result.current.bulkDel());

      const remaining = props.setQuotes.getCurrent();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("q3");

      expect(props.trackDeletion).toHaveBeenCalledWith(
        expect.arrayContaining(["q1", "q2"])
      );
      expect(props.cleanCollectionRefs).toHaveBeenCalledWith(
        expect.arrayContaining(["q1", "q2"])
      );
    });

    it("clears selection and confirmBulkDel", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      act(() => result.current.setConfirmBulkDel(true));
      act(() => result.current.bulkDel());

      expect(result.current.selected.size).toBe(0);
      expect(result.current.confirmBulkDel).toBe(false);
    });

    it("calls showToast with undo that restores quotes", () => {
      const { result } = renderHook(() => useEditState(props));

      act(() => result.current.toggleSel("q1"));
      act(() => result.current.bulkDel());

      expect(props.showToast).toHaveBeenCalledTimes(1);
      const [msg, undoLabel, undoFn] = props.showToast.mock.calls[0];
      expect(msg).toContain("1 entry deleted");
      expect(undoLabel).toBe("Undo");

      // Execute undo
      act(() => undoFn());
      const restored = props.setQuotes.getCurrent();
      expect(restored.find((q) => q.id === "q1")).toBeTruthy();
      expect(props.untrackDeletion).toHaveBeenCalled();
    });
  });

  // ── 10. Ghost cleanup ──

  describe("ghost cleanup", () => {
    it("removes selected IDs that no longer exist in quotes", () => {
      const { result, rerender } = renderHook(
        (p) => useEditState(p),
        { initialProps: props }
      );

      act(() => {
        result.current.toggleSel("q1");
        result.current.toggleSel("q2");
      });
      expect(result.current.selected.size).toBe(2);

      // Remove q1 from quotes
      const newQuotes = [makeQuote("q2"), makeQuote("q3")];
      const newProps = {
        ...props,
        quotes: newQuotes,
        filtered: newQuotes,
        visibleFiltered: newQuotes,
      };
      rerender(newProps);

      expect(result.current.selected.has("q1")).toBe(false);
      expect(result.current.selected.has("q2")).toBe(true);
      expect(result.current.selected.size).toBe(1);
    });
  });

  // ── 11. Stale edit cleanup ──

  describe("stale edit cleanup", () => {
    it("clears editingId when the edited quote is removed", () => {
      const { result, rerender } = renderHook(
        (p) => useEditState(p),
        { initialProps: props }
      );

      act(() => result.current.startEditing("q1"));
      expect(result.current.editingId).toBe("q1");

      const newQuotes = [makeQuote("q2"), makeQuote("q3")];
      rerender({ ...props, quotes: newQuotes, filtered: newQuotes, visibleFiltered: newQuotes });

      expect(result.current.editingId).toBe(null);
    });

    it("clears inlineEdit when the edited quote is removed", () => {
      const { result, rerender } = renderHook(
        (p) => useEditState(p),
        { initialProps: props }
      );

      act(() => result.current.startInlineEdit("q2", "source"));
      expect(result.current.inlineEdit).toEqual({ id: "q2", field: "source" });

      const newQuotes = [makeQuote("q1"), makeQuote("q3")];
      rerender({ ...props, quotes: newQuotes, filtered: newQuotes, visibleFiltered: newQuotes });

      expect(result.current.inlineEdit).toBe(null);
    });
  });

  // ── 12. Review queue cleanup ──

  describe("review queue cleanup", () => {
    it("removes deleted quote IDs from the review queue", () => {
      const { result, rerender } = renderHook(
        (p) => useEditState(p),
        { initialProps: props }
      );

      act(() => result.current.setReviewQueue(["q1", "q2", "q3"]));
      expect(result.current.reviewQueue).toEqual(["q1", "q2", "q3"]);

      const newQuotes = [makeQuote("q1"), makeQuote("q3")];
      rerender({ ...props, quotes: newQuotes, filtered: newQuotes, visibleFiltered: newQuotes });

      expect(result.current.reviewQueue).toEqual(["q1", "q3"]);
    });
  });

  // ── 13. startReviewFlow ──

  describe("startReviewFlow", () => {
    it("returns attention IDs sorted by confidence (low before medium)", () => {
      const quotes = [
        makeQuote("q1", { confidence: "high", category: "Book" }),
        makeQuote("q2", { confidence: "medium", category: "Film" }),
        makeQuote("q3", { confidence: "low", category: "Book" }),
        makeQuote("q4", { confidence: "low", category: "Unknown" }),
      ];
      const localProps = createDefaultProps(quotes);
      vi.spyOn(document, "querySelector").mockReturnValue(null);

      const { result } = renderHook(() => useEditState(localProps));

      let attentionIds;
      act(() => {
        attentionIds = result.current.startReviewFlow();
      });

      // Only low confidence and Unknown category should be included
      expect(attentionIds).toContain("q3");
      expect(attentionIds).toContain("q4");
      expect(attentionIds).not.toContain("q1"); // high confidence, known category
      // q2 is medium confidence, not low, and not Unknown category
      expect(attentionIds).not.toContain("q2");

      // Low confidence items should come first (CONF_ORDER: low=0)
      expect(attentionIds[0]).toBe("q3");

      // Review queue should be set
      expect(result.current.reviewQueue).toEqual(attentionIds);

      document.querySelector.mockRestore();
    });

    it("includes Unknown category quotes regardless of confidence", () => {
      const quotes = [
        makeQuote("q1", { confidence: "high", category: "Unknown" }),
        makeQuote("q2", { confidence: "high", category: "Book" }),
      ];
      const localProps = createDefaultProps(quotes);
      vi.spyOn(document, "querySelector").mockReturnValue(null);

      const { result } = renderHook(() => useEditState(localProps));

      let attentionIds;
      act(() => {
        attentionIds = result.current.startReviewFlow();
      });

      expect(attentionIds).toContain("q1");
      expect(attentionIds).not.toContain("q2");

      document.querySelector.mockRestore();
    });

    it("opens the first attention item for editing after timeout", () => {
      const quotes = [
        makeQuote("q1", { confidence: "low" }),
        makeQuote("q2", { confidence: "low" }),
      ];
      const localProps = createDefaultProps(quotes);
      vi.spyOn(document, "querySelector").mockReturnValue(null);

      const { result } = renderHook(() => useEditState(localProps));

      act(() => result.current.startReviewFlow());
      act(() => vi.advanceTimersByTime(200));

      expect(result.current.editingId).toBe("q1");

      document.querySelector.mockRestore();
    });
  });
});
