import { useState } from "react";
import { PointerSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, closestCenter } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { pluralize } from "../utils/helpers";

/**
 * Encapsulates all drag-and-drop state and handlers for quote reordering
 * and drag-to-collection. Used by ResultsPhase.
 */
export default function useDndQuotes({ selected, collections, addToCollection, removeFromCollection, showToast, setQuotes }) {
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [activeDragId, setActiveDragId] = useState(null);
  const [overDragId, setOverDragId] = useState(null);

  const collisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    const collectionHit = pointerHits.find(c => typeof c.id === "string" && c.id.startsWith("collection:"));
    if (collectionHit) return [collectionHit];
    return closestCenter(args);
  };

  const handleDndStart = ({ active }) => {
    setActiveDragId(active.id);
  };

  const anchorToCursor = ({ transform, activatorEvent, activeNodeRect }) => {
    if (!activatorEvent || !activeNodeRect) return transform;
    const offsetX = activatorEvent.clientX - activeNodeRect.left;
    const offsetY = activatorEvent.clientY - activeNodeRect.top;
    return { ...transform, x: transform.x + offsetX - 20, y: transform.y + offsetY - 16 };
  };

  const handleDndOver = ({ over }) => {
    setOverDragId(over?.id ?? null);
  };

  const handleDndEnd = ({ active, over }) => {
    setActiveDragId(null);
    setOverDragId(null);
    if (!over || active.id === over.id) return;

    // Drop onto a collection
    if (typeof over.id === "string" && over.id.startsWith("collection:")) {
      const collectionId = over.id.replace("collection:", "");
      const ids = selected.has(active.id) && selected.size > 1
        ? [...selected]
        : [active.id];
      addToCollection(collectionId, ids);
      const col = collections.find(c => c.id === collectionId);
      if (col) showToast(`Added ${pluralize(ids.length, "quote")} to "${col.name}"`, "Undo", () => removeFromCollection(collectionId, ids), "success");
      return;
    }

    // Sortable reorder
    setQuotes(prev => {
      const oldIndex = prev.findIndex(q => q.id === active.id);
      const newIndex = prev.findIndex(q => q.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return {
    sensors,
    activeDragId,
    overDragId,
    collisionDetection,
    handleDndStart,
    handleDndOver,
    handleDndEnd,
    anchorToCursor,
  };
}
