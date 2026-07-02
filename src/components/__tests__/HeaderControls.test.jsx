// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HeaderBar from "../HeaderBar";
import MiniHeader from "../MiniHeader";
import { ThemeToggleButton, ViewToggle } from "../HeaderControls";

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
  };
});

afterEach(cleanup);

function headerProps(overrides = {}) {
  return {
    view: "table", compact: false, setView: vi.fn(), setCompact: vi.fn(),
    showStats: false, setShowStats: vi.fn(),
    showAddMore: false, setShowAddMore: vi.fn(),
    isMobile: false,
    setConfirmClear: vi.fn(),
    addMoreRef: { current: null },
    headerRef: { current: null },
    exportDropdownContent: null,
    syncStatus: "idle", lastSynced: null, onManualSync: vi.fn(),
    dark: false, toggleTheme: vi.fn(), themeMode: "light",
    showConfidence: true, setShowConfidence: vi.fn(),
    onShowShortcuts: vi.fn(),
    ...overrides,
  };
}

describe("ThemeToggleButton", () => {
  it("labels the current mode and cycles on click", () => {
    const toggleTheme = vi.fn();
    render(<ThemeToggleButton dark={false} themeMode="light" toggleTheme={toggleTheme} />);
    const btn = screen.getByRole("button", { name: "Light mode" });
    fireEvent.click(btn);
    expect(toggleTheme).toHaveBeenCalledOnce();
  });

  it("shows auto label in auto mode and dark label when dark", () => {
    const { rerender } = render(<ThemeToggleButton dark themeMode="auto" toggleTheme={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Auto (system)" })).toBeTruthy();
    rerender(<ThemeToggleButton dark themeMode="dark" toggleTheme={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Dark mode" })).toBeTruthy();
  });
});

describe("ViewToggle", () => {
  it("switches to compact table view", () => {
    const setView = vi.fn(), setCompact = vi.fn();
    render(<ViewToggle view="table" compact={false} setView={setView} setCompact={setCompact} />);
    fireEvent.click(screen.getByRole("button", { name: "Compact view" }));
    expect(setView).toHaveBeenCalledWith("table");
    expect(setCompact).toHaveBeenCalledWith(true);
  });

  it("runs onSwitch before changing to card view and leaves compact untouched", () => {
    const calls = [];
    render(
      <ViewToggle
        view="table" compact={false}
        setView={(v) => calls.push(`setView:${v}`)}
        setCompact={() => calls.push("setCompact")}
        onSwitch={() => calls.push("onSwitch")}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(calls).toEqual(["onSwitch", "setView:cards"]);
  });
});

describe("HeaderBar", () => {
  it("desktop: renders theme toggle, view toggle, and overflow menu with all sections", () => {
    render(<HeaderBar {...headerProps()} />);
    expect(screen.getByRole("button", { name: "Light mode" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Table view" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByText("Full stats")).toBeTruthy();
    expect(screen.getByText("Hide confidence")).toBeTruthy();
    expect(screen.getByText("Keyboard shortcuts")).toBeTruthy();
    expect(screen.getByText("New batch")).toBeTruthy();
    // Desktop menu has no mobile-only Layout section
    expect(screen.queryByText("Layout")).toBeNull();
  });

  it("mobile: overflow menu gains theme item and layout section", () => {
    const props = headerProps({ isMobile: true });
    render(<HeaderBar {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByText("Layout")).toBeTruthy();
    expect(screen.getByText("Card view")).toBeTruthy();

    fireEvent.click(screen.getByText("Dark mode")); // light → dark action label
    expect(props.toggleTheme).toHaveBeenCalledOnce();
  });

  it("menu actions dispatch: stats toggle and new batch", () => {
    const props = headerProps();
    render(<HeaderBar {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByText("Full stats"));
    expect(props.setShowStats).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByText("New batch"));
    expect(props.setConfirmClear).toHaveBeenCalledWith(true);
  });
});

describe("MiniHeader", () => {
  const miniProps = (overrides = {}) => headerProps({ preserveScroll: vi.fn(), ...overrides });

  it("desktop: view switch preserves scroll first; menu shows shortcuts but no export section", () => {
    const calls = [];
    const props = miniProps({
      preserveScroll: () => calls.push("preserveScroll"),
      setView: (v) => calls.push(`setView:${v}`),
    });
    render(<MiniHeader {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(calls).toEqual(["preserveScroll", "setView:cards"]);

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByText("Keyboard shortcuts")).toBeTruthy();
    expect(screen.queryByText("Export")).toBeNull();
  });

  it("mobile: menu contains theme item and export section; hides shortcuts", () => {
    const props = miniProps({ isMobile: true, exportDropdownContent: <div>export-content</div> });
    render(<MiniHeader {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Export")).toBeTruthy();
    expect(screen.getByText("export-content")).toBeTruthy();
    expect(screen.queryByText("Keyboard shortcuts")).toBeNull();
  });

  it("omits the Data section when setConfirmClear is not provided", () => {
    const props = miniProps({ setConfirmClear: undefined });
    render(<MiniHeader {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByText("Full stats")).toBeTruthy();
    expect(screen.queryByText("New batch")).toBeNull();
  });
});
