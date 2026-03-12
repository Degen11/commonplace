import { describe, it, expect } from "vitest";
import { mergeByTimestamp } from "../sync";

describe("mergeByTimestamp", () => {
  it("returns local unchanged when cloud is empty", () => {
    const local = [{ id: "1", text: "a", updatedAt: 100 }];
    const result = mergeByTimestamp(local, [], "updatedAt");
    expect(result).toBe(local); // same reference
  });

  it("returns local unchanged when cloud is null", () => {
    const local = [{ id: "1", text: "a", updatedAt: 100 }];
    const result = mergeByTimestamp(local, null, "updatedAt");
    expect(result).toBe(local);
  });

  it("adds new items from cloud", () => {
    const local = [{ id: "1", text: "a", updatedAt: 100 }];
    const cloud = [{ id: "2", text: "b", updatedAt: 200 }];
    const result = mergeByTimestamp(local, cloud, "updatedAt");
    expect(result).toHaveLength(2);
    expect(result.find(i => i.id === "2")).toBeTruthy();
  });

  it("keeps newer cloud item over older local", () => {
    const local = [{ id: "1", text: "old", updatedAt: 100 }];
    const cloud = [{ id: "1", text: "new", updatedAt: 200 }];
    const result = mergeByTimestamp(local, cloud, "updatedAt");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("new");
  });

  it("keeps newer local item over older cloud", () => {
    const local = [{ id: "1", text: "newer", updatedAt: 300 }];
    const cloud = [{ id: "1", text: "older", updatedAt: 100 }];
    const result = mergeByTimestamp(local, cloud, "updatedAt");
    expect(result).toBe(local); // unchanged
    expect(result[0].text).toBe("newer");
  });

  it("preserves local order with cloud additions appended", () => {
    const local = [
      { id: "1", text: "a", updatedAt: 100 },
      { id: "2", text: "b", updatedAt: 100 },
    ];
    const cloud = [{ id: "3", text: "c", updatedAt: 200 }];
    const result = mergeByTimestamp(local, cloud, "updatedAt");
    expect(result.map(i => i.id)).toEqual(["1", "2", "3"]);
  });

  it("handles missing timestamp gracefully", () => {
    const local = [{ id: "1", text: "a" }];
    const cloud = [{ id: "1", text: "b", updatedAt: 100 }];
    const result = mergeByTimestamp(local, cloud, "updatedAt");
    // Cloud has updatedAt:100, local has undefined (treated as 0), cloud wins
    expect(result[0].text).toBe("b");
  });

  it("works with createdAt timestamp key", () => {
    const local = [{ id: "1", name: "old", createdAt: 100 }];
    const cloud = [{ id: "1", name: "new", createdAt: 200 }];
    const result = mergeByTimestamp(local, cloud, "createdAt");
    expect(result[0].name).toBe("new");
  });
});
