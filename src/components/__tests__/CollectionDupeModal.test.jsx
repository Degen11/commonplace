// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import CollectionDupeModal from "../CollectionDupeModal";

const entry = (id, text = `Quote ${id}`) => ({ id, text, source: `Source ${id}`, category: "Book" });

const GROUPS = [
  { entries: [entry("a"), entry("b"), entry("c")], minScore: 0.8, maxScore: 0.9 },
  { entries: [entry("d"), entry("e")], minScore: 0.7, maxScore: 0.85 },
];

function setup(dupeGroups = GROUPS) {
  const onClose = vi.fn();
  const onDeleteQuotes = vi.fn();
  render(<CollectionDupeModal dupeGroups={dupeGroups} onClose={onClose} onDeleteQuotes={onDeleteQuotes} />);
  return { onClose, onDeleteQuotes };
}

// The "Keep this" button inside the row that shows the given entry's text
function keepButtonFor(id) {
  const text = screen.getByText(`“Quote ${id}”`);
  let row = text.parentElement;
  while (row && !row.querySelector("button")) row = row.parentElement;
  return row.querySelector("button");
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CollectionDupeModal", () => {
  it("renders nothing when there are no groups", () => {
    setup([]);
    expect(screen.queryByText("Duplicates Found")).toBeNull();
  });

  it("lists every group and counts the duplicates to resolve", () => {
    setup();
    expect(screen.getByText("Duplicates Found")).toBeDefined();
    expect(screen.getByText(/2 groups of similar quotes/)).toBeDefined();
    expect(screen.getByText(/3 duplicates to resolve/)).toBeDefined();
    expect(screen.getAllByText("Keep this")).toHaveLength(5);
    expect(screen.getByText("2 groups remaining")).toBeDefined();
  });

  it("keeping one entry deletes the others in that group and removes the group", () => {
    const { onDeleteQuotes, onClose } = setup();

    fireEvent.click(keepButtonFor("b"));

    expect(onDeleteQuotes).toHaveBeenCalledTimes(1);
    expect(onDeleteQuotes).toHaveBeenCalledWith(["a", "c"]);
    expect(screen.queryByText("“Quote a”")).toBeNull();
    expect(screen.getByText("1 group remaining")).toBeDefined();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("resolving every group shows the done state and closes after 800ms", () => {
    const { onDeleteQuotes, onClose } = setup();

    fireEvent.click(keepButtonFor("a"));
    fireEvent.click(keepButtonFor("e"));

    expect(onDeleteQuotes.mock.calls).toEqual([[["b", "c"]], [["d"]]]);
    expect(screen.getByText("All duplicates resolved")).toBeDefined();
    expect(screen.getByText("2 groups handled")).toBeDefined();

    act(() => { vi.advanceTimersByTime(799); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignoring a group resolves it without deleting anything", () => {
    const { onDeleteQuotes, onClose } = setup();

    fireEvent.click(screen.getAllByText("Ignore group")[0]);
    fireEvent.click(keepButtonFor("d"));

    expect(onDeleteQuotes).toHaveBeenCalledTimes(1);
    expect(onDeleteQuotes).toHaveBeenCalledWith(["e"]);
    act(() => { vi.advanceTimersByTime(800); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("'Remove all duplicates' keeps the first entry of each unresolved group", () => {
    const { onDeleteQuotes, onClose } = setup();

    // Resolve group 2 first — it must not be touched again
    fireEvent.click(keepButtonFor("e"));
    onDeleteQuotes.mockClear();
    // Let the effect that syncs the resolved-groups ref run
    act(() => {});

    fireEvent.click(screen.getByText("Remove all duplicates"));

    expect(onDeleteQuotes).toHaveBeenCalledTimes(1);
    expect(onDeleteQuotes).toHaveBeenCalledWith(["b", "c"]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
