import { Dialog } from "@base-ui/react/dialog";
import { styles } from "./styles";
import ModalShell from "./ModalShell";

export default function ConfirmModal({
  icon,
  iconBg,
  borderColor,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <ModalShell
      onClose={onCancel}
      popupStyle={{ ...styles.confirmBox, borderTop: `3px solid ${borderColor}` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <Dialog.Title render={<p />} style={{ fontSize: 15, fontWeight: 600 }}>{title}</Dialog.Title>
      </div>
      <Dialog.Description style={{ fontSize: 13, color: "var(--cp-text-muted)", marginBottom: 20, lineHeight: 1.5 }}>{description}</Dialog.Description>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="confirm-cancel" style={{ ...styles.confirmCancel, padding: "8px 20px" }} onClick={onCancel}>{cancelLabel}</button>
        <button className="confirm-yes" style={styles.confirmYes} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}
