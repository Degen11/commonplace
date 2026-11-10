// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// jsdom has no layout, so the real window virtualizer would render no rows —
// hand back one virtual item per quote instead.
vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: ({ count }) => ({
    getVirtualItems: () => Array.from({ length: count }, (_, i) => ({ index: i, start: i * 48, end: (i + 1) * 48 })),
    getTotalSize: () => count * 48,
    options: { scrollMargin: 0 },
    measureElement: () => {},
  }),
}));

// Drive dnd-kit's per-row state: one row is being dragged, and the sorting
// strategy hands every other row a shift transform.
const dnd = vi.hoisted(() => ({ draggingId: null }));
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: ({ id }) => {
    const isDragging = id === dnd.draggingId;
    return {
      attributes: {}, listeners: {}, setNodeRef: () => {},
      isDragging,
      transform: isDragging ? { x: 10, y: 120, scaleX: 1, scaleY: 1 } : { x: 0, y: 48, scaleX: 1, scaleY: 1 },
    };
  },
}));

const ctx = vi.hoisted(() => ({ value: null }));
vi.mock("../../contexts/ResultsContext", () => ({ useResultsContext: () => ctx.value }));

import TableView from "../TableView";
import { DEFAULT_CATEGORIES } from "../../data/constants";

const quote = (id) => ({ id, text: `Quote ${id}`, source: `Source ${id}`, category: "Book", confidence: "high", favorite: false });
const QUOTES = [quote("a"), quote("b"), quote("c")];

function renderTable(filtered = QUOTES) {
  const { container } = render(<TableView filtered={filtered} />);
  const row = (id) => container.querySelector(`.qrow[data-id="${id}"]`);
  return { container, row };
}

beforeEach(() => {
  dnd.draggingId = null;
  ctx.value = {
    selected: new Set(), toggleSel: vi.fn(), selAll: vi.fn(),
    editingId: null, setEditingId: vi.fn(),
    inlineEdit: null, setInlineEdit: vi.fn(),
    saveEdit: vi.fn(), saveInlineField: vi.fn(),
    allCats: DEFAULT_CATEGORIES, customCats: [],
    actionProps: { onCopy: vi.fn(), onShareImage: vi.fn(), onFav: vi.fn() },
    compact: false, showConfidence: true,
    columnOrder: ["content", "source", "category"], setColumnOrder: vi.fn(),
    sortBy: "default", isMobile: false,
    savedPulse: null, deletingId: null,
    searchTerm: "", newQuoteHighlight: null,
  };
});
afterEach(cleanup);

describe("TableView — rows", () => {
  it("renders one row per quote with its text and the column headers", () => {
    const { container, row } = renderTable();
    expect(container.querySelectorAll(".qrow")).toHaveLength(3);
    for (const q of QUOTES) expect(row(q.id).textContent).toContain(q.text);
    expect(container.querySelector(".thead-row").textContent).toContain("Quote");
    expect(container.querySelector(".thead-row").textContent).toContain("Source");
    expect(container.querySelector(".thead-row").textContent).toContain("Category");
  });

  it("renders no header or rows for an empty list", () => {
    const { container } = renderTable([]);
    expect(container.querySelector(".thead-row")).toBeNull();
    expect(container.querySelectorAll(".qrow")).toHaveLength(0);
  });
});

describe("TableView — drag stability", () => {
  it("rows that are only being shifted by the sorting strategy get no transform", () => {
    dnd.draggingId = "a";
    const { row } = renderTable();

    // useSortable handed rows b and c a translate(0, 48px) shift; applying it
    // would fight the virtualizer's padding-based layout and shake the table
    expect(row("b").style.transform).toBe("");
    expect(row("c").style.transform).toBe("");
    expect(row("b").style.opacity).toBe("");
  });

  it("the dragged source row stays in place, dimmed (the DragOverlay follows the pointer)", () => {
    dnd.draggingId = "a";
    const { row } = renderTable();

    expect(row("a").style.opacity).toBe("0.35");
    expect(row("a").style.transform).toBe("scale(0.98)");
    expect(row("a").style.filter).toBe("grayscale(0.3)");
  });

  it("no row is transformed when nothing is being dragged", () => {
    const { container } = renderTable();
    for (const el of container.querySelectorAll(".qrow")) expect(el.style.transform).toBe("");
  });

  it("TableView is wrapped in React.memo", () => {
    // memo (see the comment in TableView.jsx) keeps ResultsPhase's per-frame
    // drag updates from re-rendering the whole table
    expect(String(TableView.$$typeof)).toContain("memo");
  });
});
