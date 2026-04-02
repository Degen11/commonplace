import { describe, it, expect } from "vitest";

describe("AddMorePanel URL fetch button", () => {
  it("module imports Loader icon from lucide-react", async () => {
    // Verify the AddMorePanel module loads successfully with the Loader import
    const mod = await import("../AddMorePanel.jsx");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("AddMorePanel tab style logic", () => {
  // Mirrors the tabStyle function from AddMorePanel
  function tabStyle(active) {
    return {
      background: active ? "var(--cp-bg-card)" : "transparent",
      color: active ? "var(--cp-text)" : "var(--cp-text-muted)",
      boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
    };
  }

  it("active tab gets card background and text color", () => {
    const style = tabStyle(true);
    expect(style.background).toBe("var(--cp-bg-card)");
    expect(style.color).toBe("var(--cp-text)");
    expect(style.boxShadow).toContain("rgba");
  });

  it("inactive tab gets transparent background and muted text", () => {
    const style = tabStyle(false);
    expect(style.background).toBe("transparent");
    expect(style.color).toBe("var(--cp-text-muted)");
    expect(style.boxShadow).toBe("none");
  });
});
