// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SyncPill from "../SyncPill";
import { syncPillStyles } from "../styles";
import { LS_SYNC_ENGAGED } from "../../config";

afterEach(cleanup);

const pillStyles = syncPillStyles.full;

// Most tests below exercise the "error" pill, which only renders once the
// user has actively engaged with sync (see the dedicated describe block for
// the pre-engagement behavior). Simulate that engagement by default here.
beforeEach(() => { localStorage.setItem(LS_SYNC_ENGAGED, "1"); });
afterEach(() => { localStorage.removeItem(LS_SYNC_ENGAGED); });

describe("SyncPill", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<SyncPill syncStatus="idle" pillStyles={pillStyles} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the status label per state", () => {
    const { rerender } = render(<SyncPill syncStatus="syncing" pillStyles={pillStyles} />);
    expect(screen.getByText("Saving...")).toBeTruthy();
    rerender(<SyncPill syncStatus="synced" lastSynced={new Date()} pillStyles={pillStyles} />);
    expect(screen.getByText("Saved")).toBeTruthy();
    rerender(<SyncPill syncStatus="error" pillStyles={pillStyles} />);
    expect(screen.getByText("Sync error")).toBeTruthy();
  });

  it("is a non-interactive span when no handlers are provided", () => {
    render(<SyncPill syncStatus="synced" lastSynced={new Date()} pillStyles={pillStyles} />);
    const el = screen.getByText("Saved");
    expect(el.tagName).toBe("SPAN");
  });

  it("renders an accessible button when onOpenSync is provided", () => {
    render(<SyncPill syncStatus="synced" onOpenSync={vi.fn()} pillStyles={pillStyles} />);
    const btn = screen.getByRole("button", { name: "Cloud sync options" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("type")).toBe("button");
    expect(btn.getAttribute("aria-live")).toBe("polite");
  });

  it("clicking the pill opens the sync panel in any state", () => {
    const onOpenSync = vi.fn();
    render(<SyncPill syncStatus="synced" onOpenSync={onOpenSync} pillStyles={pillStyles} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpenSync).toHaveBeenCalledTimes(1);
  });

  it("error state without onOpenSync falls back to onManualSync retry", () => {
    const onManualSync = vi.fn();
    render(<SyncPill syncStatus="error" onManualSync={onManualSync} pillStyles={pillStyles} />);
    const btn = screen.getByRole("button", { name: "Sync failed — retry" });
    fireEvent.click(btn);
    expect(onManualSync).toHaveBeenCalledTimes(1);
  });

  it("onOpenSync takes precedence over onManualSync in the error state", () => {
    const onOpenSync = vi.fn();
    const onManualSync = vi.fn();
    render(
      <SyncPill syncStatus="error" onOpenSync={onOpenSync} onManualSync={onManualSync} pillStyles={pillStyles} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sync failed — open cloud sync options" }));
    expect(onOpenSync).toHaveBeenCalledTimes(1);
    expect(onManualSync).not.toHaveBeenCalled();
  });
});

describe("SyncPill — before the user has engaged with sync", () => {
  it("hides the error pill for a background backup nobody opted into", () => {
    localStorage.removeItem(LS_SYNC_ENGAGED);
    const { container } = render(<SyncPill syncStatus="error" pillStyles={pillStyles} />);
    expect(container.firstChild).toBeNull();
  });

  it("still shows syncing/synced — those aren't alarming", () => {
    localStorage.removeItem(LS_SYNC_ENGAGED);
    const { rerender } = render(<SyncPill syncStatus="syncing" pillStyles={pillStyles} />);
    expect(screen.getByText("Saving...")).toBeTruthy();
    rerender(<SyncPill syncStatus="synced" lastSynced={new Date()} pillStyles={pillStyles} />);
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("shows the error pill again once sync has been engaged", () => {
    localStorage.removeItem(LS_SYNC_ENGAGED);
    localStorage.setItem(LS_SYNC_ENGAGED, "1");
    render(<SyncPill syncStatus="error" pillStyles={pillStyles} />);
    expect(screen.getByText("Sync error")).toBeTruthy();
  });
});
