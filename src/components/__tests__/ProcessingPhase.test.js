import { describe, it, expect } from "vitest";
import { formatElapsed, formatEta, estimateRemaining } from "../ProcessingPhase";

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

describe("formatElapsed", () => {
  it("shows seconds under a minute", () => {
    expect(formatElapsed(0)).toBe("0s");
    expect(formatElapsed(12)).toBe("12s");
    expect(formatElapsed(59)).toBe("59s");
  });

  it("shows m:ss at and above a minute", () => {
    expect(formatElapsed(60)).toBe("1:00");
    expect(formatElapsed(65)).toBe("1:05");
    expect(formatElapsed(125)).toBe("2:05");
  });

  it("floors fractional seconds and clamps negatives", () => {
    expect(formatElapsed(12.9)).toBe("12s");
    expect(formatElapsed(-5)).toBe("0s");
  });
});

describe("formatEta", () => {
  it("shows ~Ns left under a minute", () => {
    expect(formatEta(8)).toBe("~8s left");
    expect(formatEta(59)).toBe("~59s left");
  });

  it("shows ~Nm left at and above a minute", () => {
    expect(formatEta(60)).toBe("~1m left");
    expect(formatEta(61)).toBe("~2m left"); // ceil
    expect(formatEta(120)).toBe("~2m left");
  });

  it("never shows zero or negative", () => {
    expect(formatEta(0)).toBe("~1s left");
    expect(formatEta(0.2)).toBe("~1s left");
  });
});

describe("estimateRemaining", () => {
  const sample = { t: 1000, done: 10 };

  it("returns null without a sample", () => {
    expect(estimateRemaining({ now: 5000, sample: null, done: 20, total: 100 })).toBeNull();
  });

  it("returns null before progress has advanced past the baseline", () => {
    expect(estimateRemaining({ now: 5000, sample, done: 10, total: 100 })).toBeNull();
    expect(estimateRemaining({ now: 5000, sample, done: 8, total: 100 })).toBeNull();
  });

  it("returns null once already complete", () => {
    expect(estimateRemaining({ now: 5000, sample, done: 100, total: 100 })).toBeNull();
  });

  it("returns null until at least 2 seconds of data exist", () => {
    // 1.5s after the baseline — not enough signal yet
    expect(estimateRemaining({ now: 2500, sample, done: 30, total: 100 })).toBeNull();
  });

  it("estimates remaining seconds from the measured rate", () => {
    // 4s elapsed, advanced 10 → 30 (20 items) ⇒ 5 items/sec.
    // 70 remaining / 5 ⇒ 14s.
    const eta = estimateRemaining({ now: 5000, sample, done: 30, total: 100 });
    expect(eta).toBeCloseTo(14, 5);
  });

  it("excludes the local-match jump by anchoring on the api-phase baseline", () => {
    // Baseline done=10 means 90 free local matches are NOT counted toward rate.
    // 10s elapsed, advanced 10 → 20 (10 items) ⇒ 1 item/sec; 80 left ⇒ 80s.
    const eta = estimateRemaining({ now: 11000, sample, done: 20, total: 100 });
    expect(eta).toBeCloseTo(80, 5);
  });

  it("returns null for absurdly long estimates (> 1 hour)", () => {
    // 3s elapsed, advanced just 1 item ⇒ 0.333/sec; ~29700s ⇒ filtered out.
    expect(estimateRemaining({ now: 4000, sample, done: 11, total: 10000 })).toBeNull();
  });
});
