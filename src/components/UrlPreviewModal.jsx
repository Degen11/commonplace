import { useState } from "react";
import { X, Check, Eye, Filter } from "lucide-react";
import { styles } from "./styles";

const EXTRACT_MODES = [
  { value: "all", label: "Everything", desc: "All text content from the page" },
  { value: "quotes", label: "Quotes only", desc: "Blockquotes and quoted passages" },
  { value: "main", label: "Main content", desc: "Article body, paragraphs, and key sections" },
  { value: "headings", label: "Headings", desc: "Section headings and titles only" },
];

export default function UrlPreviewModal({ preview, onConfirm, onCancel, onRefetch, currentMode }) {
  const [selectedLines, setSelectedLines] = useState(() => new Set(preview.lines.map((_, i) => i)));
  const [mode, setMode] = useState(currentMode || "all");
  const [refetching, setRefetching] = useState(false);

  const toggleLine = (i) => {
    setSelectedLines(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelectedLines(new Set(preview.lines.map((_, i) => i)));
  const selectNone = () => setSelectedLines(new Set());

  const handleModeChange = async (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (onRefetch) {
      setRefetching(true);
      await onRefetch(newMode);
      setRefetching(false);
    }
  };

  const selectedCount = selectedLines.size;
  const lines = preview.lines;

  return (
    <div style={styles.dupeModalOverlay} onClick={onCancel}>
      <div
        style={{ ...styles.dupeModalBox, maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.dupeModalHeader}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={styles.dupeModalTitle}>
                <Eye size={15} strokeWidth={2} style={{ marginRight: 6, verticalAlign: -2 }} />
                Preview extracted content
              </div>
              {preview.title && (
                <div style={{ ...styles.dupeModalSub, marginTop: 2 }}>{preview.title}</div>
              )}
            </div>
            <button
              onClick={onCancel}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4 }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Extraction mode selector */}
          <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
            {EXTRACT_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => handleModeChange(m.value)}
                className="ui-tip ui-tip-below"
                data-tip={m.desc}
                style={{
                  padding: "4px 10px",
                  borderRadius: 50,
                  border: mode === m.value ? "1px solid var(--cp-accent, #3C5775)" : "1px solid var(--cp-border)",
                  background: mode === m.value ? "rgba(60,87,117,0.10)" : "var(--cp-bg-card)",
                  color: mode === m.value ? "var(--cp-accent, #3C5775)" : "var(--cp-text-muted)",
                  fontSize: 11,
                  fontWeight: mode === m.value ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {m.value === "quotes" && <Filter size={10} strokeWidth={2} />}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.dupeList, gap: 2, padding: "8px 12px" }}>
          {refetching ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--cp-text-muted)", fontSize: 13 }}>
              Re-extracting content...
            </div>
          ) : lines.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--cp-text-muted)", fontSize: 13 }}>
              No content found with this extraction mode. Try a different mode.
            </div>
          ) : (
            lines.map((line, i) => (
              <div
                key={i}
                onClick={() => toggleLine(i)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: selectedLines.has(i) ? "var(--cp-bg-card)" : "transparent",
                  opacity: selectedLines.has(i) ? 1 : 0.45,
                  transition: "all .12s",
                  borderBottom: "1px solid var(--cp-border-light)",
                }}
              >
                <div
                  style={{
                    ...styles.check,
                    ...(selectedLines.has(i) ? styles.checkOn : {}),
                    marginTop: 2,
                    flexShrink: 0,
                    width: 14,
                    height: 14,
                  }}
                >
                  {selectedLines.has(i) && <Check size={10} strokeWidth={3} color="#fff" />}
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
            ))
          )}
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
            <span>{selectedCount} of {lines.length} selected</span>
            <span style={{ color: "var(--cp-border-dim)" }}>|</span>
            <button
              onClick={selectAll}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-accent, #3C5775)", fontSize: 11, fontWeight: 500, fontFamily: "inherit", padding: 0 }}
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
              style={{ ...styles.editSave, opacity: selectedCount === 0 ? 0.4 : 1, padding: "6px 16px" }}
              disabled={selectedCount === 0}
              onClick={() => {
                const selected = lines.filter((_, i) => selectedLines.has(i));
                onConfirm(selected);
              }}
            >
              Use {selectedCount} {selectedCount === 1 ? "entry" : "entries"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { EXTRACT_MODES };
