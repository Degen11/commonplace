import { describe, it, expect } from "vitest";
import { buildSnapProps } from "../MobileSheet";

describe("buildSnapProps", () => {
  it("returns null for empty / non-array input (falls back to content detent)", () => {
    expect(buildSnapProps(undefined, 0)).toBeNull();
    expect(buildSnapProps([], 0)).toBeNull();
    expect(buildSnapProps("nope", 0)).toBeNull();
  });

  it("normalizes legacy descending v3 points to a valid ascending v5 array", () => {
    // CardItem passes [0.6, 0.4] with initialSnap 0 (v3 style: first = tallest).
    const { snapPoints, initialSnap } = buildSnapProps([0.6, 0.4], 0);
    // ascending, includes 0 (closed) and 1 (fully open)
    expect(snapPoints).toEqual([0, 0.4, 0.6, 1]);
    // initialSnap remaps to the fraction the caller wanted to rest at (0.6 → index 2)
    expect(snapPoints[initialSnap]).toBe(0.6);
  });

  it("dedupes and always includes 0 and 1", () => {
    const { snapPoints } = buildSnapProps([0.5, 0.5, 0.25], 0);
    expect(snapPoints).toEqual([0, 0.25, 0.5, 1]);
  });

  it("drops out-of-range fractions, keeping the [0,1] endpoints", () => {
    // Nothing is a valid partial detent → only the closed/open endpoints remain.
    const { snapPoints } = buildSnapProps([1.5], 0);
    expect(snapPoints).toEqual([0, 1]);
  });

  it("remaps an out-of-range initialSnap index to the caller's partial fraction", () => {
    // snapPoints[9] is undefined → desired falls back to the last partial (0.5).
    const { snapPoints, initialSnap } = buildSnapProps([0.5], 9);
    expect(snapPoints).toEqual([0, 0.5, 1]);
    expect(snapPoints[initialSnap]).toBe(0.5);
  });

  it("falls back to fully-open when the desired fraction isn't a valid detent", () => {
    // desired = 1.5 isn't in the normalized array → open fully (last index).
    const { snapPoints, initialSnap } = buildSnapProps([1.5, 0.5], 0);
    expect(snapPoints).toEqual([0, 0.5, 1]);
    expect(initialSnap).toBe(snapPoints.length - 1);
  });
});
