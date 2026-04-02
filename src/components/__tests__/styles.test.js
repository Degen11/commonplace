import { describe, it, expect } from "vitest";
import { styles, baseCSS } from "../styles";

describe("CSS animation definitions", () => {
  describe("newQuotePulse animation", () => {
    it("is defined as a keyframe with blue highlight color", () => {
      expect(baseCSS).toContain("@keyframes newQuotePulse");
      expect(baseCSS).toContain("rgba(59,130,246,");
    });

    it("new-quote-pulse class uses newQuotePulse at 1.5s", () => {
      expect(baseCSS).toContain(".new-quote-pulse{animation:newQuotePulse 1.5s ease}");
    });
  });

  describe("savePulse animation", () => {
    it("is defined with a three-stage fade (0%, 60%, 100%)", () => {
      expect(baseCSS).toContain("@keyframes savePulse");
      // Should have a mid-point at 60% for visible hold
      expect(baseCSS).toMatch(/60%\{background-color:rgba\(5,150,105/);
    });

    it("save-pulse class uses 0.6s duration", () => {
      expect(baseCSS).toContain(".save-pulse{animation:savePulse .6s ease}");
    });
  });

  describe("dropZoneActive style", () => {
    it("includes scale transform for visual lift", () => {
      expect(styles.dropZoneActive).toHaveProperty("transform", "scale(1.01)");
    });

    it("includes box-shadow for depth feedback", () => {
      expect(styles.dropZoneActive.boxShadow).toContain("rgba(59,130,246,");
    });

    it("includes transition for smooth activation", () => {
      expect(styles.dropZoneActive).toHaveProperty("transition", "all .2s ease");
    });

    it("preserves the blue border color", () => {
      expect(styles.dropZoneActive).toHaveProperty("borderColor");
    });
  });
});
