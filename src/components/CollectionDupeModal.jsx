import { useRef, useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { styles } from "./styles";
import { Search, Trash2 } from "lucide-react";

export default function CollectionDupeModal(props) {
  if (props.dupeGroups.length === 0) return null;
  return <CollectionDupeModalInner {...props} />;
}

function CollectionDupeModalInner({ dupeGroups, onClose, onDeleteQuotes }) {
  // Track which group index the user has resolved (and which entry ID they kept)
  const [resolved, setResolved] = useState(new Map());
  const resolvedRef = useRef(resolved);
  useEffect(() => { resolvedRef.current = resolved; }, [resolved]);

  const pending = dupeGroups.reduce((acc, group, i) => {
    if (!resolved.has(i)) acc.push({ group, groupIndex: i });
    return acc;
  }, []);

  const allResolved = pending.length === 0;

  // Close after a short delay when all groups are resolved (side-effect in useEffect, not render)
  useEffect(() => {
    if (!allResolved) return;
    const t = setTimeout(onClose, 300);
    return () => clearTimeout(t);
  }, [allResolved, onClose]);

  const keepOne = (groupIndex, keepId) => {
    const group = dupeGroups[groupIndex];
    const toDelete = group.entries.filter(e => e.id !== keepId).map(e => e.id);
    onDeleteQuotes(toDelete);
    setResolved(p => new Map([...p, [groupIndex, keepId]]));
  };

  const ignoreGroup = (groupIndex) => {
    setResolved(p => new Map([...p, [groupIndex, null]]));
  };

  const removeAllDupes = () => {
    const allToDelete = [];
    dupeGroups.forEach((group, i) => {
      if (resolvedRef.current.has(i)) return;
      // Keep the first entry, delete the rest
      const toDelete = group.entries.slice(1).map(e => e.id);
      allToDelete.push(...toDelete);
    });
    if (allToDelete.length > 0) onDeleteQuotes(allToDelete);
    onClose();
  };

  if (allResolved) return null;

  const totalDupeEntries = pending.reduce((sum, { group }) => sum + group.entries.length - 1, 0);

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            animation: "backdropBlurIn .2s ease-out",
          }}
        />
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
          pointerEvents: "none",
          animation: "modalScaleIn .2s ease-out",
        }}>
          <Dialog.Popup style={{ ...styles.dupeModalBox, maxWidth: "min(90vw, 640px)", maxHeight: "85vh", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
            <div style={styles.dupeModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Search size={22} color="var(--cp-text-secondary)" strokeWidth={1.5} />
                <Dialog.Title render={<div />} style={styles.dupeModalTitle}>Duplicates Found</Dialog.Title>
              </div>
              <Dialog.Description style={styles.dupeModalSub}>
                Found {dupeGroups.length} {dupeGroups.length === 1 ? "group" : "groups"} of similar entries
                ({totalDupeEntries} duplicate{totalDupeEntries === 1 ? "" : "s"} to resolve).
              </Dialog.Description>
            </div>

            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
              {pending.map(({ group, groupIndex }) => (
                  <div key={groupIndex} style={{
                    border: "1px solid var(--cp-border)",
                    borderRadius: 6,
                    marginBottom: 16,
                    background: "var(--cp-bg-card)",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}>
                    {/* Header */}
                    <div style={{
                      padding: "8px 16px",
                      background: "var(--cp-bg-panel)",
                      borderBottom: "1px solid var(--cp-border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--cp-text-muted)", letterSpacing: 0.5 }}>
                        {group.entries.length} SIMILAR ENTRIES
                      </span>
                      <span style={{ fontSize: 11, color: "var(--cp-text-faint)" }}>
                        {Math.round(group.minScore * 100)}&ndash;{Math.round(group.maxScore * 100)}% similar
                      </span>
                    </div>

                    {/* Entries — pick one to keep */}
                    {group.entries.map((entry, entryIdx) => (
                      <div key={entry.id} style={{
                        padding: "12px 16px",
                        borderBottom: entryIdx < group.entries.length - 1 ? "1px solid var(--cp-border)" : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: "var(--cp-text)", lineHeight: 1.5, marginBottom: 4 }}>
                            &ldquo;{entry.text}&rdquo;
                          </div>
                          <div style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                            &mdash; {entry.source || "Unknown"}
                            {entry.category && entry.category !== "Unknown" && (
                              <span style={{ color: "var(--cp-text-faint)", marginLeft: 8 }}>{entry.category}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => keepOne(groupIndex, entry.id)}
                          style={{
                            padding: "5px 14px",
                            borderRadius: 20,
                            border: "none",
                            background: "#3C5775",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#2D4259"}
                          onMouseLeave={e => e.currentTarget.style.background = "#3C5775"}
                        >
                          Keep this
                        </button>
                      </div>
                    ))}

                    {/* Ignore action */}
                    <div style={{
                      padding: "8px 16px",
                      borderTop: "1px solid var(--cp-border)",
                      background: "var(--cp-bg-panel)",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}>
                      <button
                        onClick={() => ignoreGroup(groupIndex)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 20,
                          border: "none",
                          background: "var(--cp-bg-card)",
                          color: "var(--cp-text-muted)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--cp-bg-hover)"; e.currentTarget.style.color = "var(--cp-text)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--cp-bg-card)"; e.currentTarget.style.color = "var(--cp-text-muted)"; }}
                      >
                        Ignore group
                      </button>
                    </div>
                  </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid var(--cp-border)",
              background: "var(--cp-bg-card)",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 13,
                color: "var(--cp-text-secondary)",
                fontWeight: 600,
                background: "rgba(60,87,117,0.1)",
                padding: "4px 14px",
                borderRadius: 30,
              }}>
                {pending.length} {pending.length === 1 ? "group" : "groups"} remaining
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={removeAllDupes}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 30,
                    border: "1px solid #EB5757",
                    background: "transparent",
                    color: "#EB5757",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,87,87,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Remove all duplicates
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 28px",
                    borderRadius: 30,
                    border: "none",
                    background: "#3C5775",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2D4259"}
                  onMouseLeave={e => e.currentTarget.style.background = "#3C5775"}
                >
                  Done
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
