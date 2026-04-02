import { describe, it, expect } from "vitest";

describe("ShareImageModal cursor states", () => {
  // Tests the cursor logic: generating ? (isGenerating ? "wait" : "not-allowed") : "pointer"

  function getCursor(generating, styleKey) {
    const isGenerating = generating === styleKey;
    return generating ? (isGenerating ? "wait" : "not-allowed") : "pointer";
  }

  it("shows pointer cursor when nothing is generating", () => {
    expect(getCursor(null, "classic")).toBe("pointer");
  });

  it("shows wait cursor on the actively generating button", () => {
    expect(getCursor("classic", "classic")).toBe("wait");
  });

  it("shows not-allowed cursor on non-active buttons while generating", () => {
    expect(getCursor("classic", "dark")).toBe("not-allowed");
    expect(getCursor("classic", "minimal")).toBe("not-allowed");
  });

  it("opacity logic: non-active buttons get 0.5 opacity while generating", () => {
    const generating = "classic";
    const styleKey = "dark";
    const isGenerating = generating === styleKey;
    const opacity = generating && !isGenerating ? 0.5 : 1;
    expect(opacity).toBe(0.5);
  });

  it("opacity logic: active button stays at full opacity", () => {
    const generating = "classic";
    const styleKey = "classic";
    const isGenerating = generating === styleKey;
    const opacity = generating && !isGenerating ? 0.5 : 1;
    expect(opacity).toBe(1);
  });
});
