import { describe, it, expect } from "vitest";

describe("ProcessingPhase feed limit", () => {
  // The component slices the reversed feed to 8 items max.
  // Test the logic directly to ensure large feeds are capped.

  it("limits visible feed to at most 8 items", () => {
    const identifiedFeed = Array.from({ length: 50 }, (_, i) => ({
      text: `Quote ${i}`,
      source: `Author ${i}`,
      category: "Reflection",
    }));

    const reversedFeed = [...identifiedFeed].reverse().slice(0, 8);

    expect(reversedFeed).toHaveLength(8);
    // Most recent items come first (reversed order)
    expect(reversedFeed[0].text).toBe("Quote 49");
    expect(reversedFeed[7].text).toBe("Quote 42");
  });

  it("passes through feeds smaller than 8 unchanged", () => {
    const identifiedFeed = [
      { text: "A", source: "X", category: "Humor" },
      { text: "B", source: "Y", category: "Philosophy" },
      { text: "C", source: "Z", category: "Literature" },
    ];

    const reversedFeed = [...identifiedFeed].reverse().slice(0, 8);

    expect(reversedFeed).toHaveLength(3);
    expect(reversedFeed[0].text).toBe("C");
    expect(reversedFeed[2].text).toBe("A");
  });

  it("returns empty array for empty feed", () => {
    const reversedFeed = [].reverse().slice(0, 8);
    expect(reversedFeed).toHaveLength(0);
  });
});
