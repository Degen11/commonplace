import { Sheet } from "react-modal-sheet";

// Mobile-only bottom sheet wrapper using react-modal-sheet.
// Desktop rendering is unchanged — this component is only
// rendered inside `isMobile` conditional paths.

// react-modal-sheet v5 requires snapPoints to be ascending and include 0 (closed)
// and 1 (fully open). Callers can pass them in any order (e.g. legacy v3 descending
// `[0.6, 0.4]`) with `initialSnap` indexing their own array — we normalize to a valid
// ascending array and remap initialSnap to the fraction the caller wanted to rest at.
export function buildSnapProps(snapPoints, initialSnap) {
  if (!Array.isArray(snapPoints) || snapPoints.length === 0) return null;
  const partials = snapPoints.filter(n => typeof n === "number" && n > 0 && n < 1);
  const desired = snapPoints[initialSnap] ?? partials[partials.length - 1];
  const ascending = [...new Set([0, ...partials, 1])].sort((a, b) => a - b);
  if (ascending.length < 2) return null;
  const idx = ascending.indexOf(desired);
  return { snapPoints: ascending, initialSnap: idx < 0 ? ascending.length - 1 : idx };
}

export default function MobileSheet({ isOpen, onClose, children, snapPoints, initialSnap = 0, detent = "content" }) {
  // When no valid snapPoints are given, let `detent` (default "content") size the
  // sheet to its content height.
  const snapProps = buildSnapProps(snapPoints, initialSnap) || {};
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent={detent}
      {...snapProps}
      tweenConfig={{ ease: "easeOut", duration: 0.25 }}
    >
      <Sheet.Container style={{
        background: "var(--cp-bg)",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
      }}>
        <Sheet.Header style={{ paddingTop: 8, paddingBottom: 4 }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: "var(--cp-text-faint)",
            margin: "0 auto", opacity: 0.5,
          }} />
        </Sheet.Header>
        <Sheet.Content style={{ padding: "0 16px 16px", overflow: "auto" }}>
          {children}
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} style={{ background: "var(--cp-overlay)" }} />
    </Sheet>
  );
}
