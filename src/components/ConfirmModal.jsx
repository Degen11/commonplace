import { styles } from "./styles";

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
    <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div style={{ ...styles.confirmBox, borderTop: `3px solid ${borderColor}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {icon}
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{title}</p>
        </div>
        <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 20, lineHeight: 1.5 }}>{description}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="confirm-cancel" style={{ ...styles.confirmCancel, padding: "8px 20px" }} onClick={onCancel}>{cancelLabel}</button>
          <button className="confirm-yes" style={styles.confirmYes} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
