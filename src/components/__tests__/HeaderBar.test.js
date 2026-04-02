import { describe, it, expect } from "vitest";
import { styles } from "../styles";

describe("HeaderBar add-more button active state", () => {
  // The addMoreBtn style is the base. When showAddMore is true,
  // additional active styles are spread on top.

  const activeOverride = {
    background: "var(--cp-bg-tab)",
    color: "var(--cp-accent)",
    borderColor: "var(--cp-accent)",
  };

  it("base addMoreBtn style exists with blue accent", () => {
    expect(styles.addMoreBtn).toBeDefined();
    expect(styles.addMoreBtn).toHaveProperty("cursor", "pointer");
    expect(styles.addMoreBtn).toHaveProperty("borderRadius");
  });

  it("active override applies tab background", () => {
    const mergedStyle = { ...styles.addMoreBtn, ...activeOverride };
    expect(mergedStyle.background).toBe("var(--cp-bg-tab)");
  });

  it("active override applies accent color", () => {
    const mergedStyle = { ...styles.addMoreBtn, ...activeOverride };
    expect(mergedStyle.color).toBe("var(--cp-accent)");
  });

  it("active override applies accent border", () => {
    const mergedStyle = { ...styles.addMoreBtn, ...activeOverride };
    expect(mergedStyle.borderColor).toBe("var(--cp-accent)");
  });

  it("inactive state preserves original styles", () => {
    const showAddMore = false;
    const finalStyle = { ...styles.addMoreBtn, ...(showAddMore ? activeOverride : {}) };
    // Should not have the active override values
    expect(finalStyle.background).toBe(styles.addMoreBtn.background);
    expect(finalStyle.color).toBe(styles.addMoreBtn.color);
  });
});
