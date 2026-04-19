// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import InputPhase from "../InputPhase";

// ── Browser API stubs not present in jsdom ────────────────────────────────────

// IntersectionObserver: used by useScrollReveal in InputPhase
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = MockIntersectionObserver;

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

vi.mock("../HowItWorksAnimation", () => ({ default: () => null }));
vi.mock("../UrlImportPanel", () => ({
  default: function UrlImportPanel({ onLoad }) {
    return React.createElement("button", {
      "data-testid": "url-import-btn",
      onClick: () => onLoad("url-content"),
    }, "Load from URL");
  },
}));
vi.mock("../Logo", () => ({
  default: () => React.createElement("span", { "data-testid": "logo" }, "Commonplace"),
}));
vi.mock("../Footer", () => ({
  default: () => React.createElement("footer", { "data-testid": "footer" }, "Footer"),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProps(overrides = {}) {
  return {
    rawInput: "",
    setRawInput: vi.fn(),
    inputTab: "paste",
    setInputTab: vi.fn(),
    isDragOver: false,
    setIsDragOver: vi.fn(),
    importedFileName: null,
    formattingEnabled: false,
    setFormattingEnabled: vi.fn(),
    isProcessing: false,
    initialLoading: false,
    onProcess: vi.fn(),
    onFileImport: vi.fn(),
    fileInputRef: { current: null },
    dark: false,
    toggleTheme: vi.fn(),
    themeMode: "auto",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("InputPhase rendering", () => {
  it("renders the hero section headline", () => {
    render(<InputPhase {...makeProps()} />);
    // getAllByText handles multiple matches (hero text appears in heading and possibly meta)
    expect(screen.getAllByText(/Your personal/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders logo", () => {
    render(<InputPhase {...makeProps()} />);
    expect(screen.getByTestId("logo")).toBeDefined();
  });

  it("renders footer", () => {
    render(<InputPhase {...makeProps()} />);
    expect(screen.getByTestId("footer")).toBeDefined();
  });

  it("shows the paste textarea in paste tab", () => {
    render(<InputPhase {...makeProps({ inputTab: "paste" })} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDefined();
  });

  it("shows trust message in hero", () => {
    render(<InputPhase {...makeProps()} />);
    expect(screen.getAllByText(/No signup/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe("InputPhase textarea interaction", () => {
  it("calls setRawInput when typing", () => {
    const setRawInput = vi.fn();
    render(<InputPhase {...makeProps({ setRawInput })} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "some new text" } });
    expect(setRawInput).toHaveBeenCalledWith("some new text");
  });

  it("reflects rawInput value in the textarea", () => {
    render(<InputPhase {...makeProps({ rawInput: "hello world" })} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.value).toBe("hello world");
  });
});

describe("InputPhase process button", () => {
  it("is disabled when rawInput is empty", () => {
    render(<InputPhase {...makeProps({ rawInput: "" })} />);
    const btn = screen.getByRole("button", { name: /Organize my collection/i });
    expect(btn.disabled).toBe(true);
  });

  it("is enabled when rawInput has content", () => {
    render(<InputPhase {...makeProps({ rawInput: "some quote text" })} />);
    const btn = screen.getByRole("button", { name: /Organize my collection/i });
    expect(btn.disabled).toBe(false);
  });

  it("calls onProcess when clicked with content", () => {
    const onProcess = vi.fn();
    render(<InputPhase {...makeProps({ rawInput: "some quote", onProcess })} />);
    const btn = screen.getByRole("button", { name: /Organize my collection/i });
    fireEvent.click(btn);
    expect(onProcess).toHaveBeenCalledOnce();
  });

  it("shows processing spinner when isProcessing is true", () => {
    render(<InputPhase {...makeProps({ isProcessing: true, rawInput: "some quote" })} />);
    expect(screen.getAllByText(/Processing/i).length).toBeGreaterThanOrEqual(1);
  });

  it("is disabled while isProcessing regardless of input", () => {
    render(<InputPhase {...makeProps({ isProcessing: true, rawInput: "some quote" })} />);
    const btn = screen.getByRole("button", { name: /Processing/i });
    expect(btn.disabled).toBe(true);
  });
});

describe("InputPhase examples button", () => {
  it("shows 'Try with examples' when input is empty in paste tab", () => {
    render(<InputPhase {...makeProps({ rawInput: "", inputTab: "paste" })} />);
    expect(screen.getByRole("button", { name: /Try with examples/i })).toBeDefined();
  });

  it("hides 'Try with examples' when input has content", () => {
    render(<InputPhase {...makeProps({ rawInput: "something" })} />);
    const btn = screen.queryByRole("button", { name: /Try with examples/i });
    expect(btn).toBeNull();
  });

  it("calls setRawInput with example quotes when clicked", () => {
    const setRawInput = vi.fn();
    render(<InputPhase {...makeProps({ rawInput: "", setRawInput })} />);
    const btn = screen.getByRole("button", { name: /Try with examples/i });
    fireEvent.click(btn);
    expect(setRawInput).toHaveBeenCalledOnce();
    // Should set a non-empty string of example quotes
    const arg = setRawInput.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg.length).toBeGreaterThan(0);
  });
});

describe("InputPhase tab switching", () => {
  it("calls setInputTab('import') when Import File tab is clicked", () => {
    const setInputTab = vi.fn();
    render(<InputPhase {...makeProps({ setInputTab })} />);
    const importTab = screen.getByRole("button", { name: /Import File/i });
    fireEvent.click(importTab);
    expect(setInputTab).toHaveBeenCalledWith("import");
  });

  it("calls setInputTab('paste') when Type / Paste tab is clicked", () => {
    const setInputTab = vi.fn();
    render(<InputPhase {...makeProps({ inputTab: "import", setInputTab })} />);
    const pasteTab = screen.getByRole("button", { name: /Type \/ Paste/i });
    fireEvent.click(pasteTab);
    expect(setInputTab).toHaveBeenCalledWith("paste");
  });

  it("shows URL import panel when in import tab", () => {
    render(<InputPhase {...makeProps({ inputTab: "import" })} />);
    expect(screen.getByTestId("url-import-btn")).toBeDefined();
  });

  it("does not show textarea in import tab", () => {
    render(<InputPhase {...makeProps({ inputTab: "import" })} />);
    const textarea = screen.queryByRole("textbox");
    expect(textarea).toBeNull();
  });
});

describe("InputPhase entry count display", () => {
  it("shows entry count when input contains quotes", () => {
    render(<InputPhase {...makeProps({ rawInput: "First quote\nSecond quote" })} />);
    // smartSplit detects 2 entries
    expect(screen.getByText(/entries? detected/i)).toBeDefined();
  });

  it("shows default prompt when input is empty", () => {
    render(<InputPhase {...makeProps({ rawInput: "" })} />);
    expect(screen.getByText(/Quotes, phrases, expressions/i)).toBeDefined();
  });
});

describe("InputPhase theme toggle", () => {
  it("calls toggleTheme when the theme button is clicked", () => {
    const toggleTheme = vi.fn();
    render(<InputPhase {...makeProps({ toggleTheme })} />);
    // Find theme toggle button in nav (has data-tip attribute)
    const allButtons = screen.getAllByRole("button");
    const themeBtn = allButtons.find(b => b.getAttribute("data-tip") !== null);
    expect(themeBtn).toBeDefined();
    fireEvent.click(themeBtn);
    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});

describe("InputPhase cloud restore indicator", () => {
  it("shows restoring indicator when initialLoading is true", () => {
    render(<InputPhase {...makeProps({ initialLoading: true })} />);
    expect(screen.getByText(/Restoring from cloud/i)).toBeDefined();
  });

  it("hides restoring indicator when initialLoading is false", () => {
    render(<InputPhase {...makeProps({ initialLoading: false })} />);
    const el = screen.queryByText(/Restoring from cloud/i);
    expect(el).toBeNull();
  });
});

describe("InputPhase connection pre-warming", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("fires a pre-warm fetch to /api/identify on first keystroke via idle callback", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    globalThis.fetch = fetchSpy;

    // Mock requestIdleCallback to call synchronously for test
    globalThis.requestIdleCallback = vi.fn((cb) => { cb(); return 0; });

    const { rerender } = render(<InputPhase {...makeProps({ rawInput: "" })} />);

    // Simulate first keystroke
    await act(async () => {
      rerender(<InputPhase {...makeProps({ rawInput: "a" })} />);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/identify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not pre-warm when rawInput is empty", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    globalThis.fetch = fetchSpy;
    globalThis.requestIdleCallback = vi.fn((cb) => { cb(); return 0; });

    render(<InputPhase {...makeProps({ rawInput: "" })} />);

    // Empty input must never trigger the pre-warm
    const identifyCalls = fetchSpy.mock.calls.filter(([url]) => url === "/api/identify");
    expect(identifyCalls).toHaveLength(0);
  });
});
