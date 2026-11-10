// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Drive dnd-kit's per-item state for the card under test
const dnd = vi.hoisted(() => ({ isOver: false, activeId: null, draggingId: null }));
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: ({ id }) => ({
    attributes: {}, listeners: {}, setNodeRef: () => {},
    isDragging: id === dnd.draggingId,
    isOver: dnd.isOver,
    active: dnd.activeId ? { id: dnd.activeId } : null,
  }),
}));

import CardItem from "../CardItem";
import { DEFAULT_CATEGORIES, getCatColor } from "../../data/constants";

const q = { id: "a", text: "A quote worth keeping", source: "Someone - Somewhere", category: "Book", confidence: "high", favorite: false };

function renderCard() {
  const noop = vi.fn();
  const { container } = render(
    <CardItem
      q={q} col={getCatColor("Book", [])} isSel={false} isEd={false} needsAtt={false}
      showConfidence sortBy="default" isMobile={false}
      isInlineEditing={false} inlineEditField={null} isSavedPulse={false} savedPulseField={null}
      allCats={DEFAULT_CATEGORIES} customCats={[]}
      actionProps={{ onCopy: noop, onShareImage: noop, onFav: noop, onDelete: noop, onReidentify: noop, reidentifying: new Set() }}
      toggleSel={noop} startEditing={noop} startInlineEdit={noop}
      saveEdit={noop} saveInlineField={noop} setInlineEdit={noop} setEditingId={noop}
      isDeleting={false} searchTerm=""
    />,
  );
  return container.querySelector(".qcard");
}

beforeEach(() => { dnd.isOver = false; dnd.activeId = null; dnd.draggingId = null; });
afterEach(cleanup);

describe("CardItem drop-target highlight", () => {
  it("highlights when another card is dragged over it", () => {
    dnd.isOver = true; dnd.activeId = "b";
    expect(renderCard().style.boxShadow).toContain("inset");
  });

  it("doesn't highlight when nothing is dragged over it", () => {
    dnd.activeId = "b";
    expect(renderCard().style.boxShadow).toBe("");
  });

  it("doesn't highlight the card being dragged over its own slot", () => {
    dnd.isOver = true; dnd.activeId = "a"; dnd.draggingId = "a";
    expect(renderCard().style.boxShadow).toBe("");
  });
});
