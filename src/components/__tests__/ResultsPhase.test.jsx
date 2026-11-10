// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Browser API stubs ─────────────────────────────────────────────────────────

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = MockIntersectionObserver;

// ResizeObserver: used by some subcomponents
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver;

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("motion/react", async () => {
  const React = await import("react");
  return {
    motion: new Proxy({}, {
      get(_, key) {
        return function MockMotion({ children, layoutId, initial, animate, exit, transition, variants, whileHover, whileTap, ...props }) {
          return React.createElement(key || "div", props, children);
        };
      },
    }),
    AnimatePresence: ({ children }) => children ?? null,
    LayoutGroup: ({ children }) => children ?? null,
  };
});

// Virtualization: requires DOM measurements not available in jsdom
vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
    measure: vi.fn(),
    options: { scrollMargin: 0 },
  })),
}));

// DnD: requires pointer events
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }) => children,
  DragOverlay: () => null,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCenter: vi.fn(),
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }) => children,
  useSortable: () => ({
    attributes: {}, listeners: {}, setNodeRef: vi.fn(),
    transform: null, isDragging: false,
  }),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: "vertical",
  rectSortingStrategy: "rect",
}));

// Contexts
vi.mock("../../contexts/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../contexts/ResultsContext", () => ({
  ResultsProvider: ({ value, children }) =>
    React.createElement(React.createContext(value).Provider, { value }, children),
  useResultsContext: () => ({}),
}));

// ── Sub-components that pull in heavy deps ─────────────────────────────────────

vi.mock("../TableView", () => ({
  default: React.memo(function MockTableView({ visible }) {
    return React.createElement("div", { "data-testid": "table-view" },
      visible?.map(q => React.createElement("div", { key: q.id, "data-testid": `row-${q.id}` }, q.text)),
    );
  }),
}));

vi.mock("../CardItem", () => ({
  default: function MockCardItem({ quote }) {
    return React.createElement("div", { "data-testid": `card-${quote.id}` }, quote.text);
  },
}));

vi.mock("../HeaderBar", () => ({
  default: function MockHeaderBar({ search, onSearchChange }) {
    return React.createElement("div", { "data-testid": "header-bar" },
      React.createElement("input", {
        "data-testid": "search-input",
        value: search,
        onChange: e => onSearchChange(e.target.value),
        placeholder: "Search",
      }),
    );
  },
}));

vi.mock("../NotificationBars", () => ({ default: () => null, AttentionNotice: () => null }));
vi.mock("../ResultsModals", () => ({ default: () => null }));
vi.mock("../CollectionsSidebar", () => ({ default: () => null }));
vi.mock("../MiniHeader", () => ({ default: () => null }));
vi.mock("../StatsOverlay", () => ({ default: () => null }));
vi.mock("../AddMorePanel", () => ({ default: () => null }));
vi.mock("../ExportDropdown", () => ({ default: () => null }));
vi.mock("../EmptyState", () => ({
  default: function MockEmptyState() {
    return React.createElement("div", { "data-testid": "empty-state" }, "No quotes yet");
  },
}));
vi.mock("../QuickAddBar", () => ({ default: () => null }));
vi.mock("../MobileSheet", () => ({ default: () => null }));
vi.mock("../Footer", () => ({ default: () => null }));
vi.mock("../BulkBar", () => ({ default: () => null }));
vi.mock("../ToolbarSection", () => ({
  default: function MockToolbarSection({ children }) { return children ?? null; },
}));

// ── Store mock ────────────────────────────────────────────────────────────────

const makeQuote = (overrides = {}) => ({
  id: "q1",
  text: "Test quote text",
  source: "Test Author",
  category: "Book",
  confidence: "high",
  favorite: false,
  updatedAt: Date.now(),
  ...overrides,
});

const storeState = {
  quotes: [],
  customCats: [],
  setCustomCats: vi.fn(),
  activeCollectionId: null,
  collections: [],
  isSharedView: false,
  initialLoading: false,
  syncStatus: "idle",
  lastSynced: null,
  setQuotes: vi.fn(),
  createCollection: vi.fn(),
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
  renameCollection: vi.fn(),
  deleteCollection: vi.fn(),
  updateCollectionIcon: vi.fn(),
  setActiveCollectionId: vi.fn(),
  cleanCollectionRefs: vi.fn(),
  columnOrder: ["text", "source", "category"],
  setColumnOrder: vi.fn(),
  trackDeletion: vi.fn(),
};

vi.mock("../../stores/quotesStore", () => ({
  useQuotesStore: vi.fn((selector) => {
    if (typeof selector === "function") return selector(storeState);
    return storeState;
  }),
}));

// ── Default props ─────────────────────────────────────────────────────────────

function makeProps(overrides = {}) {
  return {
    apiError: null,
    failedEntries: [],
    stats: null,
    retryFailed: vi.fn(),
    dismissApiError: vi.fn(),
    dismissStats: vi.fn(),
    processEntries: vi.fn(),
    autoGroup: vi.fn(),
    deletingId: null,
    copiedId: null,
    reidentifyingIds: new Set(),
    handleDelete: vi.fn(),
    copyQuote: vi.fn(),
    reIdentify: vi.fn(),
    batchReIdentify: vi.fn(),
    handleFileImport: vi.fn(),
    dark: false,
    toggleTheme: vi.fn(),
    themeMode: "auto",
    importCollections: vi.fn(),
    onClearReset: vi.fn(),
    ...overrides,
  };
}

// ── Import component after mocks ──────────────────────────────────────────────

import ResultsPhase from "../ResultsPhase";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ResultsPhase — empty state", () => {
  it("shows empty state when quotes array is empty", () => {
    storeState.quotes = [];
    render(<ResultsPhase {...makeProps()} />);
    expect(screen.getByTestId("empty-state")).toBeDefined();
  });

  it("shows header bar even when no quotes", () => {
    storeState.quotes = [];
    render(<ResultsPhase {...makeProps()} />);
    expect(screen.getByTestId("header-bar")).toBeDefined();
  });
});

describe("ResultsPhase — with quotes", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Force desktop mode so table view is active (jsdom defaults to 0px width)
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1200 });
    storeState.quotes = [
      makeQuote({ id: "q1", text: "First quote" }),
      makeQuote({ id: "q2", text: "Second quote" }),
    ];
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalInnerWidth });
  });

  it("renders the header bar with search input", () => {
    render(<ResultsPhase {...makeProps()} />);
    expect(screen.getByTestId("header-bar")).toBeDefined();
    expect(screen.getByTestId("search-input")).toBeDefined();
  });

  it("does not show empty state when quotes exist", () => {
    render(<ResultsPhase {...makeProps()} />);
    expect(screen.queryByTestId("empty-state")).toBeNull();
  });

  it("renders the table view container in desktop mode", () => {
    render(<ResultsPhase {...makeProps()} />);
    // TableView is rendered; rows depend on the virtual list (mocked as empty)
    expect(screen.getByTestId("table-view")).toBeDefined();
  });
});
