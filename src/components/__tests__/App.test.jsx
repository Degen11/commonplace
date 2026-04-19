// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act } from "@testing-library/react";

// ── Browser API stubs ─────────────────────────────────────────────────────────

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = MockIntersectionObserver;

// ── Module mocks — must be hoisted before imports ─────────────────────────────

vi.mock("motion/react", async () => {
  const React = await import("react");
  return {
    motion: new Proxy({}, {
      get(_, key) {
        return function MockMotion({ children, layoutId, initial, animate, exit, transition, variants, ...props }) {
          return React.createElement(key || "div", props, children);
        };
      },
    }),
    AnimatePresence: ({ children, mode }) => children ?? null,
    LayoutGroup: ({ children }) => children ?? null,
  };
});

// Analytics / speed-insights — fire-and-forget, must not render real script tags
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: () => null }));

// Heavy lazy-loaded phase components
vi.mock("../ResultsPhase", () => ({
  default: function MockResultsPhase() {
    return React.createElement("div", { "data-testid": "results-phase" }, "Results Phase");
  },
}));
vi.mock("../OnboardingModal", () => ({
  default: function MockOnboardingModal() { return null; },
}));
vi.mock("../DupeModal", () => ({
  default: function MockDupeModal({ pendingDupes }) {
    if (!pendingDupes?.length) return null;
    return React.createElement("div", { "data-testid": "dupe-modal" }, "Dupe Modal");
  },
}));
vi.mock("../EntryReviewModal", () => ({
  default: function MockEntryReviewModal({ lines, onConfirm, onCancel }) {
    return React.createElement("div", { "data-testid": "review-modal" },
      React.createElement("button", { onClick: () => onConfirm(lines) }, "Confirm"),
      React.createElement("button", { onClick: onCancel }, "Cancel"),
    );
  },
}));

// Input / Processing phase components
vi.mock("../InputPhase", () => ({
  default: function MockInputPhase({ onProcess, rawInput }) {
    return React.createElement("div", { "data-testid": "input-phase" },
      React.createElement("button", {
        "data-testid": "process-btn",
        onClick: onProcess,
        disabled: !rawInput?.trim(),
      }, "Process"),
    );
  },
}));
vi.mock("../ProcessingPhase", () => ({
  default: function MockProcessingPhase() {
    return React.createElement("div", { "data-testid": "processing-phase" }, "Processing…");
  },
}));
vi.mock("../SectionErrorBoundary", () => ({
  default: function MockSEB({ children }) { return children; },
}));

// ── Store mock — isolates App from Supabase/localStorage side effects ─────────

const storeState = {
  quotes: [],
  setQuotes: vi.fn(),
  customCats: [],
  setCustomCats: vi.fn(),
  initialLoading: false,
  trackDeletion: vi.fn(),
  untrackDeletion: vi.fn(),
  collections: [],
  createCollection: vi.fn(),
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
  updateCollectionIcon: vi.fn(),
  cleanCollectionRefs: vi.fn(),
};

vi.mock("../../stores/quotesStore", () => ({
  useQuotesStore: vi.fn((selector) => {
    if (typeof selector === "function") return selector(storeState);
    return storeState;
  }),
}));

// ── Hook mocks ────────────────────────────────────────────────────────────────

vi.mock("../../hooks/useProcessing", () => ({
  default: vi.fn(() => ({
    isProcessing: false,
    processingDone: false,
    progress: null,
    identifiedFeed: [],
    apiError: null,
    failedEntries: [],
    stats: null,
    pendingDupes: [],
    dupeDecisions: {},
    formattingEnabled: false,
    setDupeDecision: vi.fn(),
    setFormattingEnabled: vi.fn(),
    processEntries: vi.fn(),
    handleDupesContinue: vi.fn(),
    retryFailed: vi.fn(),
    identifyBatch: vi.fn(),
    autoGroup: vi.fn(),
    cancelProcessing: vi.fn(),
    resetProcessingState: vi.fn(),
    dismissApiError: vi.fn(),
    dismissStats: vi.fn(),
  })),
}));

vi.mock("../../hooks/useQuoteActions", () => ({
  default: vi.fn(() => ({
    deletingId: null,
    copiedId: null,
    reidentifyingIds: new Set(),
    handleDelete: vi.fn(),
    copyQuote: vi.fn(),
    reIdentify: vi.fn(),
    batchReIdentify: vi.fn(),
    handleFileImport: vi.fn(),
  })),
}));

vi.mock("../../hooks/useTheme", () => ({
  default: vi.fn(() => ({
    dark: false,
    cycleTheme: vi.fn(),
    themeMode: "auto",
  })),
}));

// ── Context mocks ─────────────────────────────────────────────────────────────

vi.mock("../../contexts/ToastContext", () => ({
  useToastContext: vi.fn(() => ({ showToast: vi.fn() })),
  ToastProvider: ({ children }) => children,
}));

vi.mock("../../contexts/QuotesContext", () => ({
  QuotesProvider: ({ children }) => children,
}));

// ── Import App under test (after mocks) ──────────────────────────────────────

import App from "../App";

// ── Test wrapper providing required contexts ──────────────────────────────────

function renderApp() {
  return render(<App />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("App — phase management", () => {
  beforeEach(() => {
    // Reset store state to empty (input phase) before each test
    storeState.quotes = [];
    storeState.initialLoading = false;
  });

  it("renders the input phase when no quotes exist", async () => {
    storeState.quotes = [];
    renderApp();
    await act(async () => {});
    expect(screen.getByTestId("input-phase")).toBeDefined();
  });

  it("renders the results phase when quotes already exist in the store", async () => {
    storeState.quotes = [
      { id: "1", text: "test quote", source: "Author", category: "Book", confidence: "high" },
    ];
    renderApp();
    await act(async () => {});
    expect(screen.getByTestId("results-phase")).toBeDefined();
  });

  it("does not show results phase when store is empty", async () => {
    storeState.quotes = [];
    renderApp();
    await act(async () => {});
    expect(screen.queryByTestId("results-phase")).toBeNull();
  });

  it("does not show processing phase on initial render", async () => {
    storeState.quotes = [];
    renderApp();
    await act(async () => {});
    expect(screen.queryByTestId("processing-phase")).toBeNull();
  });
});

describe("App — draft persistence", () => {
  let originalLocalStorage;

  beforeEach(() => {
    storeState.quotes = [];
    originalLocalStorage = globalThis.localStorage;
    const store = {};
    globalThis.localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
    };
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it("renders without crashing when localStorage is available", async () => {
    renderApp();
    await act(async () => {});
    expect(screen.getByTestId("input-phase")).toBeDefined();
  });

  it("renders without crashing when localStorage is unavailable", async () => {
    globalThis.localStorage = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
      removeItem: () => {},
      clear: () => {},
    };
    // App should not crash — it swallows storage errors
    let error = null;
    try {
      renderApp();
      await act(async () => {});
    } catch (e) {
      error = e;
    }
    expect(error).toBeNull();
  });
});

describe("App — document title", () => {
  beforeEach(() => {
    storeState.quotes = [];
    document.title = "Commonplace";
  });

  it("sets base title when no quotes exist", async () => {
    storeState.quotes = [];
    renderApp();
    await act(async () => {});
    expect(document.title).toBe("Commonplace");
  });

  it("includes quote count in title when quotes exist", async () => {
    storeState.quotes = [
      { id: "1", text: "test quote", source: "Author", category: "Book", confidence: "high" },
      { id: "2", text: "another quote", source: "Author", category: "Book", confidence: "high" },
    ];
    renderApp();
    await act(async () => {});
    // Title should include the count: "(2) Commonplace"
    expect(document.title).toContain("2");
    expect(document.title).toContain("Commonplace");
  });
});

describe("App — review modal", () => {
  beforeEach(() => {
    storeState.quotes = [];
  });

  it("does not show review modal on initial render", async () => {
    renderApp();
    await act(async () => {});
    expect(screen.queryByTestId("review-modal")).toBeNull();
  });
});
