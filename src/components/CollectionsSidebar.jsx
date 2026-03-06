import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, FolderOpen, Library, Pencil, Check, X } from "lucide-react";
import { CP_ACCENT } from "./styles";

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  setActiveCollectionId,
  createCollection,
  deleteCollection,
  renameCollection,
  quoteCounts,
  totalQuotes,
  collapsed,
  setCollapsed,
}) {
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  const handleCreate = () => {
    const result = createCollection(newName);
    if (result) {
      setNewName("");
      setIsCreating(false);
    }
  };

  const handleRename = (id) => {
    renameCollection(id, editName);
    setEditingId(null);
    setEditName("");
  };

  if (collapsed) {
    return (
      <div style={{
        width: 40, flexShrink: 0, borderRight: "1px solid var(--cp-border)",
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 8,
      }}>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cp-text-muted)", padding: 4, borderRadius: 4,
          }}
          title="Expand sidebar"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button
          onClick={() => setActiveCollectionId(null)}
          style={{
            background: activeCollectionId === null ? "var(--cp-bg-hover)" : "none",
            border: "none", cursor: "pointer",
            color: activeCollectionId === null ? CP_ACCENT : "var(--cp-text-muted)",
            padding: 6, borderRadius: 6,
          }}
          title="All quotes"
        >
          <Library size={16} strokeWidth={1.5} />
        </button>
        {collections.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCollectionId(c.id)}
            style={{
              background: activeCollectionId === c.id ? "var(--cp-bg-hover)" : "none",
              border: "none", cursor: "pointer",
              color: activeCollectionId === c.id ? CP_ACCENT : "var(--cp-text-muted)",
              padding: 6, borderRadius: 6,
            }}
            title={c.name}
          >
            <FolderOpen size={16} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: 220, flexShrink: 0, borderRight: "1px solid var(--cp-border)",
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans',-apple-system,sans-serif",
      animation: "slideD .15s ease",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 12px 8px", borderBottom: "1px solid var(--cp-border-light)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: CP_ACCENT }}>
          Collections
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2, borderRadius: 4 }}
          title="Collapse sidebar"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
      </div>

      {/* All Quotes */}
      <div style={{ padding: "4px 8px" }}>
        <button
          onClick={() => setActiveCollectionId(null)}
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "8px 8px", border: "none", borderRadius: 6,
            background: activeCollectionId === null ? "var(--cp-bg-hover)" : "transparent",
            color: activeCollectionId === null ? CP_ACCENT : "var(--cp-text-secondary)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: activeCollectionId === null ? 600 : 400,
            textAlign: "left", transition: "background .12s",
          }}
        >
          <Library size={15} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>All Quotes</span>
          <span style={{ fontSize: 11, color: "var(--cp-text-faint)" }}>{totalQuotes}</span>
        </button>
      </div>

      {/* Collections list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {collections.map(c => {
          const isActive = activeCollectionId === c.id;
          const isEditing = editingId === c.id;
          const count = quoteCounts[c.id] || 0;

          if (isEditing) {
            return (
              <div key={c.id} style={{ display: "flex", gap: 4, padding: "4px 0", alignItems: "center" }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") setEditingId(null); }}
                  style={{
                    flex: 1, padding: "4px 6px", fontSize: 12, fontFamily: "inherit",
                    border: `1px solid ${CP_ACCENT}`, borderRadius: 4, background: "var(--cp-bg-card)",
                    color: "var(--cp-text)",
                  }}
                  autoFocus
                />
                <button onClick={() => handleRename(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#16A34A", padding: 2 }}>
                  <Check size={14} strokeWidth={2} />
                </button>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 8px", borderRadius: 6, cursor: "pointer",
                background: isActive ? "var(--cp-bg-hover)" : "transparent",
                transition: "background .12s",
              }}
              onClick={() => setActiveCollectionId(c.id)}
            >
              <FolderOpen size={14} strokeWidth={1.5} color={isActive ? CP_ACCENT : "var(--cp-text-muted)"} />
              <span style={{
                flex: 1, fontSize: 13, color: isActive ? CP_ACCENT : "var(--cp-text-secondary)",
                fontWeight: isActive ? 600 : 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {c.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--cp-text-faint)", flexShrink: 0 }}>{count}</span>
              <button
                onClick={e => { e.stopPropagation(); setEditingId(c.id); setEditName(c.name); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-faint)", padding: 2, opacity: 0, transition: "opacity .12s" }}
                className="coll-edit-btn"
                title="Rename"
              >
                <Pencil size={12} strokeWidth={1.5} />
              </button>
              {confirmDeleteId === c.id ? (
                <button
                  onClick={e => { e.stopPropagation(); deleteCollection(c.id); setConfirmDeleteId(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 2, fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-faint)", padding: 2, opacity: 0, transition: "opacity .12s" }}
                  className="coll-edit-btn"
                  title="Delete"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create new */}
      <div style={{ padding: "8px 8px 12px", borderTop: "1px solid var(--cp-border-light)" }}>
        {isCreating ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setIsCreating(false); setNewName(""); } }}
              placeholder="Collection name..."
              style={{
                flex: 1, padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
                border: `1px solid ${CP_ACCENT}`, borderRadius: 4, background: "var(--cp-bg-card)",
                color: "var(--cp-text)",
              }}
            />
            <button
              onClick={handleCreate}
              style={{
                background: CP_ACCENT, border: "none", borderRadius: 4,
                color: "#fff", padding: "4px 8px", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, width: "100%",
              padding: "7px 8px", border: "1px dashed var(--cp-border-dim)", borderRadius: 6,
              background: "transparent", color: "var(--cp-text-muted)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 500, textAlign: "left",
            }}
          >
            <Plus size={14} strokeWidth={2} /> New collection
          </button>
        )}
      </div>
    </div>
  );
}
