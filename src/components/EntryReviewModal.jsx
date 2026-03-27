import { useState } from "react";
import { X, Check, ListChecks } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { styles, CP_ACCENT } from "./styles";
import ModalShell from "./ModalShell";
import { pluralize } from "../utils/helpers";

export default function EntryReviewModal({ lines, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(() => new Set(lines.map((_, i) => i)));

  const toggle = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(lines.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const count = selected.size;

  return (
    <ModalShell
      onClose={onCancel}
      backdropBg="rgba(0,0,0,.45)"
      backdropExtra={{ backdropFilter: "none", WebkitBackdropFilter: "none", animation: "overlayFade .15s ease-out" }}
      containerExtra={{ animation: "fadeUp .15s ease-out" }}
      popupStyle={{ ...styles.dupeModalBox, maxWidth: "min(90vw, 640px)" }}
    >
      {/* Header */}
      <div style={styles.dupeModalHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Dialog.Title render={<div />} style={styles.dupeModalTitle}>
              <ListChecks size={15} strokeWidth={2} style={{ marginRight: 6, verticalAlign: -2 }} />
              Review entries before processing
            </Dialog.Title>
            <div style={styles.dupeModalSub}>
              Deselect any lines you don't want to process
            </div>
          </div>
          <Dialog.Close
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4 }}
          >
            <X size={16} strokeWidth={2} />
          </Dialog.Close>
        </div>
      </div>

      {/* Entry list */}
      <div style={{ ...styles.dupeList, gap: 2, padding: "8px 12px" }}>
        {lines.map((line, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              background: selected.has(i) ? "var(--cp-bg-card)" : "transparent",
              opacity: selected.has(i) ? 1 : 0.45,
              transition: "all .12s",
              borderBottom: "1px solid var(--cp-border-light)",
            }}
          >
            <div
              style={{
                ...styles.check,
                ...(selected.has(i) ? styles.checkOn : {}),
                marginTop: 2,
                flexShrink: 0,
                width: 14,
                height: 14,
              }}
            >
              {selected.has(i) && <Check size={10} strokeWidth={3} color="#fff" />}
            </div>
            <div style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--cp-text-secondary)",
              wordBreak: "break-word",
            }}>
              {line}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--cp-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--cp-text-muted)" }}>
          <span>{count} of {lines.length} selected</span>
          <span style={{ color: "var(--cp-border-dim)" }}>|</span>
          <button
            onClick={selectAll}
            style={{ background: "none", border: "none", cursor: "pointer", color: CP_ACCENT, fontSize: 11, fontWeight: 500, fontFamily: "inherit", padding: 0 }}
          >
            All
          </button>
          <button
            onClick={selectNone}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", fontSize: 11, fontWeight: 500, fontFamily: "inherit", padding: 0 }}
          >
            None
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.editSave, opacity: count === 0 ? 0.4 : 1, padding: "6px 16px" }}
            disabled={count === 0}
            onClick={() => {
              const kept = lines.filter((_, i) => selected.has(i));
              onConfirm(kept);
            }}
          >
            Process {pluralize(count, "entry", "entries")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
