// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BulkBar from "../BulkBar";
import { ResultsProvider } from "../../contexts/ResultsContext";

afterEach(cleanup);

function renderBar(overrides = {}, barProps = {}) {
  const value = {
    selected: new Set(["q1", "q2"]), setSelected: vi.fn(),
    allCats: ["Book", "Film"], applyBulk: vi.fn(),
    reidentifyingIds: new Set(),
    onFav: vi.fn(),
    collections: [{ id: "c1", name: "Stoic mornings", quoteIds: [] }],
    activeCollectionId: null, isMobile: false,
    onAddToCollection: vi.fn(), onRemoveFromCollection: vi.fn(),
    onBulkCopy: vi.fn(),
    ...overrides,
  };
  const props = { onDelete: vi.fn(), onBatchReIdentify: vi.fn(), ...barProps };
  render(<ResultsProvider value={value}><BulkBar {...props} /></ResultsProvider>);
  return { value, props };
}

describe("BulkBar", () => {
  it("shows the selection count and clears it", () => {
    const { value } = renderBar();
    expect(screen.getByRole("toolbar", { name: "Bulk actions" }).textContent).toContain("2 selected");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(value.setSelected).toHaveBeenCalledWith(new Set());
  });

  it("applies a category straight from the menu", () => {
    const { value } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: /Category/ }));
    fireEvent.click(screen.getByText("Film"));
    expect(value.applyBulk).toHaveBeenCalledWith({ category: "Film" });
  });

  it("adds the selection to a collection from the menu", () => {
    const { value } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: /Collection/ }));
    fireEvent.click(screen.getByText("Stoic mornings"));
    expect(value.onAddToCollection).toHaveBeenCalledWith("c1", ["q1", "q2"]);
  });

  it("runs quick actions and delete", () => {
    const { value, props } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: /Favorite/ }));
    expect(value.onFav).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(value.onBulkCopy).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
    expect(props.onDelete).toHaveBeenCalledOnce();
  });
});
