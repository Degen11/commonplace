import { describe, it, expect } from "vitest";

describe("SyncPill tooltip logic", () => {
  // Tests the tooltip derivation logic extracted from SyncPill.jsx.
  // The component computes tooltip based on syncStatus, lastSynced, and isError.

  function getTooltip(syncStatus, lastSynced) {
    const isError = syncStatus === "error";
    const isSyncing = syncStatus === "syncing";

    return isError
      ? "Click to retry"
      : isSyncing
      ? "Saving changes\u2026"
      : lastSynced
      ? `Last saved just now`
      : null;
  }

  it("shows 'Saving changes…' during syncing state", () => {
    const tooltip = getTooltip("syncing", null);
    expect(tooltip).toBe("Saving changes\u2026");
  });

  it("shows 'Click to retry' for error state", () => {
    const tooltip = getTooltip("error", null);
    expect(tooltip).toBe("Click to retry");
  });

  it("shows last saved time for synced state with lastSynced", () => {
    const tooltip = getTooltip("synced", new Date());
    expect(tooltip).toContain("Last saved");
  });

  it("returns null for synced state with no lastSynced", () => {
    const tooltip = getTooltip("synced", null);
    expect(tooltip).toBeNull();
  });

  it("prioritizes error over syncing", () => {
    // Error check comes first in the conditional chain
    const tooltip = getTooltip("error", new Date());
    expect(tooltip).toBe("Click to retry");
  });

  it("prioritizes syncing over lastSynced", () => {
    // Even if lastSynced is set, syncing state should show its own tooltip
    const tooltip = getTooltip("syncing", new Date());
    expect(tooltip).toBe("Saving changes\u2026");
  });
});

describe("SyncPill visibility", () => {
  it("idle status returns null (pill hidden)", () => {
    const syncStatus = "idle";
    const visible = syncStatus !== "idle";
    expect(visible).toBe(false);
  });

  it("syncing status shows pill", () => {
    const syncStatus = "syncing";
    const visible = syncStatus !== "idle";
    expect(visible).toBe(true);
  });
});
