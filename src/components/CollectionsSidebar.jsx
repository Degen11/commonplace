import { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Library, Pencil, Check, X,
  FolderOpen, Heart, Bookmark, Star, Flame, Zap, Lightbulb, BookOpen,
  Coffee, Music, Feather, Leaf, Globe, Sparkles, GraduationCap, Rocket,
  Quote, Compass, Crown, Gem, Wand2, Loader2,
} from "lucide-react";
import { CP_ACCENT } from "./styles";

// Icon set for the picker
const ICON_OPTIONS = [
  { name: "FolderOpen", Component: FolderOpen },
  { name: "Bookmark", Component: Bookmark },
  { name: "Heart", Component: Heart },
  { name: "Star", Component: Star },
  { name: "Flame", Component: Flame },
  { name: "Zap", Component: Zap },
  { name: "Lightbulb", Component: Lightbulb },
  { name: "BookOpen", Component: BookOpen },
  { name: "Coffee", Component: Coffee },
  { name: "Music", Component: Music },
  { name: "Feather", Component: Feather },
  { name: "Leaf", Component: Leaf },
  { name: "Globe", Component: Globe },
  { name: "Sparkles", Component: Sparkles },
  { name: "GraduationCap", Component: GraduationCap },
  { name: "Rocket", Component: Rocket },
  { name: "Quote", Component: Quote },
  { name: "Compass", Component: Compass },
  { name: "Crown", Component: Crown },
  { name: "Gem", Component: Gem },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(i => [i.name, i.Component]));

function getIcon(iconName) {
  return ICON_MAP[iconName] || FolderOpen;
}

// ── Icon picker popup — positioned above the icon ──
function IconPicker({ anchorRef, current, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [onClose]);

  // Position above the anchor icon using a portal-like fixed position
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ left: rect.left, bottom: window.innerHeight - rect.top + 6 });
    }
  }, [anchorRef]);

  if (!pos) return null;

  return (
    <div ref={ref} style={{
      position: "fixed", left: pos.left, bottom: pos.bottom, zIndex: 100,
      background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 8,
      boxShadow: "var(--cp-shadow-md)", padding: 8,
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2,
      width: 180, animation: "slideD .12s ease",
    }}>
      {ICON_OPTIONS.map(({ name, Component }) => (
        <button
          key={name}
          onClick={() => { onSelect(name); onClose(); }}
          style={{
            background: current === name ? "var(--cp-bg-hover)" : "transparent",
            border: current === name ? "1.5px solid var(--cp-accent)" : "1.5px solid transparent",
            borderRadius: 6, padding: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: current === name ? "var(--cp-accent)" : "var(--cp-text-muted)",
            transition: "all .1s",
          }}
          title={name}
        >
          <Component size={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

// ── Single collection row ──
function CollectionRow({
  c, isActive, isEditing, editName, setEditName, handleRename, setEditingId,
  confirmDeleteId, setConfirmDeleteId, deleteCollection, setActiveCollectionId,
  iconPickerId, setIconPickerId, updateCollectionIcon, quoteCounts,
  onDropQuote,
}) {
  const count = quoteCounts[c.id] || 0;
  const Icon = getIcon(c.icon);
  const iconRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (isEditing) {
    return (
      <div style={{ display: "flex", gap: 4, padding: "4px 8px", alignItems: "center" }}>
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") setEditingId(null); }}
          style={{
            flex: 1, padding: "4px 6px", fontSize: 12, fontFamily: "inherit",
            border: "1px solid var(--cp-accent)", borderRadius: 4, background: "var(--cp-bg-card)",
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
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 8px", borderRadius: 6, cursor: "pointer",
        background: dragOver ? "rgba(60,87,117,0.12)" : isActive ? "var(--cp-bg-hover)" : "transparent",
        transition: "background .12s",
        position: "relative",
        ...(dragOver ? { outline: "2px solid var(--cp-accent)", outlineOffset: -2 } : {}),
      }}
      onClick={() => setActiveCollectionId(c.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (confirmDeleteId === c.id) setConfirmDeleteId(null); }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (onDropQuote) onDropQuote(c.id, e); }}
    >
      <span
        ref={iconRef}
        style={{ display: "flex", alignItems: "center", flexShrink: 0, cursor: "pointer" }}
        onClick={e => { e.stopPropagation(); setIconPickerId(prev => prev === c.id ? null : c.id); }}
        title="Change icon"
      >
        <Icon size={14} strokeWidth={1.5} color={isActive ? "var(--cp-accent)" : "var(--cp-text-muted)"} />
      </span>
      {iconPickerId === c.id && (
        <IconPicker
          anchorRef={iconRef}
          current={c.icon || "FolderOpen"}
          onSelect={iconName => updateCollectionIcon(c.id, iconName)}
          onClose={() => setIconPickerId(null)}
        />
      )}
      <span style={{
        flex: 1, fontSize: 13, color: isActive ? "var(--cp-accent)" : "var(--cp-text-secondary)",
        fontWeight: isActive ? 600 : 400,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {c.name}
      </span>
      {/* Count — always in the same spot */}
      <span style={{
        fontSize: 11, color: "var(--cp-text-faint)", flexShrink: 0, minWidth: 20, textAlign: "right",
        opacity: hovered ? 0 : 1, transition: "opacity .1s",
      }}>
        {count}
      </span>
      {/* Edit/delete overlay — appears on hover in same position as count */}
      <div style={{
        position: "absolute", right: 6, top: 0, bottom: 0,
        display: "flex", alignItems: "center", gap: 2,
        opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none",
        transition: "opacity .1s",
      }}>
        {confirmDeleteId === c.id ? (
          <button
            onClick={e => { e.stopPropagation(); deleteCollection(c.id); setConfirmDeleteId(null); }}
            style={{
              background: "none", border: "none", cursor: "pointer", color: "#DC2626",
              padding: "2px 4px", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Confirm?
          </button>
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); setEditingId(c.id); setEditName(c.name); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}
              title="Rename"
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}
              title="Delete"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Collapsed icon with drop target ──
function CollapsedDropTarget({ c, isActive, setActiveCollectionId, onDropQuote, Icon }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <button
      onClick={() => setActiveCollectionId(c.id)}
      style={{
        background: dragOver ? "rgba(60,87,117,0.12)" : isActive ? "var(--cp-bg-hover)" : "none",
        border: "none", cursor: "pointer",
        color: isActive ? "var(--cp-accent)" : "var(--cp-text-muted)",
        padding: 6, borderRadius: 6,
        ...(dragOver ? { outline: "2px solid var(--cp-accent)", outlineOffset: -2 } : {}),
      }}
      title={c.name}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (onDropQuote) onDropQuote(c.id, e); }}
    >
      <Icon size={16} strokeWidth={1.5} />
    </button>
  );
}

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  setActiveCollectionId,
  createCollection,
  deleteCollection,
  renameCollection,
  updateCollectionIcon,
  quoteCounts,
  totalQuotes,
  collapsed,
  setCollapsed,
  onDropQuote,
  onAutoGroup,
}) {
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [iconPickerId, setIconPickerId] = useState(null);
  const inputRef = useRef(null);
  const [isSmartGrouping, setIsSmartGrouping] = useState(false);
  const [smartTheme, setSmartTheme] = useState("");
  const [smartGroupLoading, setSmartGroupLoading] = useState(false);
  const [smartGroupError, setSmartGroupError] = useState(null);
  const smartInputRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  useEffect(() => {
    if (isSmartGrouping && smartInputRef.current) smartInputRef.current.focus();
  }, [isSmartGrouping]);

  const handleSmartGroup = async () => {
    const theme = smartTheme.trim();
    if (!theme || !onAutoGroup) return;
    setSmartGroupLoading(true);
    setSmartGroupError(null);
    try {
      await onAutoGroup(theme);
      setSmartTheme("");
      setIsSmartGrouping(false);
    } catch (err) {
      setSmartGroupError(err.message || "Failed to auto-group");
    } finally {
      setSmartGroupLoading(false);
    }
  };

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
        width: 48, flexShrink: 0, paddingRight: 8,
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 8,
        position: "sticky", top: 44, alignSelf: "flex-start",
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
            color: activeCollectionId === null ? "var(--cp-accent)" : "var(--cp-text-muted)",
            padding: 6, borderRadius: 6,
          }}
          title="All quotes"
        >
          <Library size={16} strokeWidth={1.5} />
        </button>
        {collections.map(c => {
          const Icon = getIcon(c.icon);
          return (
            <CollapsedDropTarget key={c.id} c={c} isActive={activeCollectionId === c.id} setActiveCollectionId={setActiveCollectionId} onDropQuote={onDropQuote} Icon={Icon} />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      width: 220, flexShrink: 0, paddingRight: 16,
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans',-apple-system,sans-serif",
      animation: "slideD .15s ease",
      overflowX: "hidden",
      overflowY: "hidden",
      position: "sticky", top: 44, alignSelf: "flex-start",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 12px 8px 0",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--cp-accent)" }}>
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

      {/* Create new — at the top */}
      <div style={{ padding: "0 8px 6px 0" }}>
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
                border: "1px solid var(--cp-accent)", borderRadius: 4, background: "var(--cp-bg-card)",
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
              padding: "6px 8px", border: "1px dashed var(--cp-border-dim)", borderRadius: 6,
              background: "transparent", color: "var(--cp-text-muted)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, fontWeight: 500, textAlign: "left",
            }}
          >
            <Plus size={14} strokeWidth={2} /> New collection
          </button>
        )}
      </div>

      {/* Smart Group — AI auto-collection */}
      {onAutoGroup && (
        <div style={{ padding: "0 8px 6px 0" }}>
          {isSmartGrouping ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input
                  ref={smartInputRef}
                  value={smartTheme}
                  onChange={e => { setSmartTheme(e.target.value); setSmartGroupError(null); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !smartGroupLoading) handleSmartGroup();
                    if (e.key === "Escape") { setIsSmartGrouping(false); setSmartTheme(""); setSmartGroupError(null); }
                  }}
                  placeholder='Theme, e.g. "love" or "mortality"'
                  disabled={smartGroupLoading}
                  style={{
                    flex: 1, padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
                    border: `1px solid ${smartGroupError ? "#DC2626" : "var(--cp-accent)"}`, borderRadius: 4,
                    background: "var(--cp-bg-card)", color: "var(--cp-text)",
                    opacity: smartGroupLoading ? 0.6 : 1,
                  }}
                />
                <button
                  onClick={handleSmartGroup}
                  disabled={smartGroupLoading || !smartTheme.trim()}
                  style={{
                    background: CP_ACCENT, border: "none", borderRadius: 4,
                    color: "#fff", padding: "4px 8px", fontSize: 11, fontWeight: 600,
                    cursor: smartGroupLoading ? "wait" : "pointer", fontFamily: "inherit",
                    opacity: smartGroupLoading || !smartTheme.trim() ? 0.5 : 1,
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  {smartGroupLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Go
                </button>
              </div>
              {smartGroupError && (
                <span style={{ fontSize: 11, color: "#DC2626", paddingLeft: 2 }}>{smartGroupError}</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsSmartGrouping(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                padding: "6px 8px", border: "1px dashed var(--cp-border-dim)", borderRadius: 6,
                background: "transparent", color: "var(--cp-text-muted)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: 500, textAlign: "left",
              }}
            >
              <Wand2 size={14} strokeWidth={2} /> Smart group
            </button>
          )}
        </div>
      )}

      {/* All Quotes */}
      <div style={{ padding: "2px 8px 2px 0" }}>
        <button
          onClick={() => setActiveCollectionId(null)}
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "8px 8px", border: "none", borderRadius: 6,
            background: activeCollectionId === null ? "var(--cp-bg-hover)" : "transparent",
            color: activeCollectionId === null ? "var(--cp-accent)" : "var(--cp-text-secondary)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: activeCollectionId === null ? 600 : 400,
            textAlign: "left", transition: "background .12s",
          }}
        >
          <Library size={15} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>All Quotes</span>
          <span style={{ fontSize: 11, color: "var(--cp-text-faint)", minWidth: 20, textAlign: "right" }}>{totalQuotes}</span>
        </button>
      </div>

      {/* Collections list — only scroll vertically when many items */}
      <div style={{
        padding: "0 8px 8px 0",
        overflowX: "hidden",
        overflowY: collections.length > 12 ? "auto" : "hidden",
        maxHeight: collections.length > 12 ? 420 : "none",
      }}>
        {collections.map(c => (
          <CollectionRow
            key={c.id}
            c={c}
            isActive={activeCollectionId === c.id}
            isEditing={editingId === c.id}
            editName={editName}
            setEditName={setEditName}
            handleRename={handleRename}
            setEditingId={setEditingId}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            deleteCollection={deleteCollection}
            setActiveCollectionId={setActiveCollectionId}
            iconPickerId={iconPickerId}
            setIconPickerId={setIconPickerId}
            updateCollectionIcon={updateCollectionIcon}
            quoteCounts={quoteCounts}
            onDropQuote={onDropQuote}
          />
        ))}
      </div>
    </div>
  );
}
