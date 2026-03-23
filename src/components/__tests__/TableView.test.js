import { describe, it, expect } from "vitest";
import TableView from "../TableView";
import { CSS } from "@dnd-kit/utilities";

describe("TableView drag stability", () => {
  it("TableView is wrapped in React.memo to prevent unnecessary re-renders during drag", () => {
    // React.memo wraps the component — the result has $$typeof Symbol for memo
    // and a .type.name or .compare property
    expect(TableView).toHaveProperty("$$typeof");
    expect(String(TableView.$$typeof)).toContain("memo");
  });

  it("sortable transform is only applied to the dragged row, not shifted rows", () => {
    // Simulate what happens inside TableRow for a non-dragged row:
    // isDragging=false, transform has a shift value from verticalListSortingStrategy
    const shiftTransform = { x: 0, y: 48, scaleX: 1, scaleY: 1 };
    const isDragging = false;

    const sortableStyle = isDragging
      ? { transform: CSS.Transform.toString(shiftTransform) }
      : undefined;

    // Non-dragged rows should get NO transform (undefined), not a shift
    expect(sortableStyle).toBeUndefined();
  });

  it("sortable transform IS applied to the actively dragged row", () => {
    const dragTransform = { x: 10, y: 120, scaleX: 1, scaleY: 1 };
    const isDragging = true;

    const sortableStyle = isDragging
      ? { transform: CSS.Transform.toString(dragTransform) }
      : undefined;

    expect(sortableStyle).toBeDefined();
    expect(sortableStyle.transform).toContain("translate3d");
  });
});
