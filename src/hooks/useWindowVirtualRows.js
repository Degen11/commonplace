import { useWindowVirtualizer } from "@tanstack/react-virtual";

// Window-scrolled virtual rows for a list rendered in normal document flow:
// returns the rows to render plus the spacer heights above and below them
// (padding divs, not absolute positioning, so dnd-kit's sortable transforms
// keep working).
//
// The TanStack virtualizer is a stable, mutable instance. If the React
// Compiler memoized `virtualizer.getVirtualItems()` it would cache it on that
// unchanging reference and hand back stale rows (the cards→table switch once
// left the table empty until a resize). So this hook alone opts out of the
// compiler: it reads fresh values on every render, and the components that
// call it stay compiled.
export default function useWindowVirtualRows({ count, estimateSize, overscan, scrollMargin }) {
  "use no memo";
  const virtualizer = useWindowVirtualizer({ count, estimateSize, overscan, scrollMargin });
  const virtualItems = virtualizer.getVirtualItems();
  const topPad = virtualItems.length > 0
    ? virtualItems[0].start - (virtualizer.options.scrollMargin ?? 0)
    : 0;
  const bottomPad = virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;
  return { virtualItems, topPad, bottomPad, measureElement: virtualizer.measureElement };
}
