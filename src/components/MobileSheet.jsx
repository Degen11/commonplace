import { Sheet } from "react-modal-sheet";

// Mobile-only bottom sheet wrapper using react-modal-sheet.
// Desktop rendering is unchanged — this component is only
// rendered inside `isMobile` conditional paths.

export default function MobileSheet({ isOpen, onClose, children, snapPoints, initialSnap = 0 }) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
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
          <Sheet.Scroller>
            {children}
          </Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} style={{ background: "var(--cp-overlay)" }} />
    </Sheet>
  );
}
