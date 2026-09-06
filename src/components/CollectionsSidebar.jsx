import { useState, useRef, useEffect, createElement } from "react";
import { AnimatePresence, motion, stagger, useAnimate } from "motion/react";
import { Popover } from "@base-ui/react/popover";
import { useDroppable } from "@dnd-kit/core";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Library, Pencil, Check, X,
  FolderOpen, Heart, Bookmark, Star, Flame, Zap, Lightbulb, BookOpen,
  Coffee, Music, Feather, Leaf, Globe, Sparkles, GraduationCap, Rocket,
  Quote, Compass, Crown, Gem, Wand2, Loader2, Copy, Download,
} from "lucide-react";
import { CP_ACCENT, CP_ACCENT_MUTED, FONT_SANS, styles, CLR_RED, CLR_AMBER, CLR_GREEN } from "./styles";
import AnimatedNumber from "./AnimatedNumber";

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

// ── Icon picker grid — rendered inside a Popover.Popup by CollectionRow ──
function IconPickerGrid({ current, onSelect, onClose }) {
  return ICON_OPTIONS.map(({ name, Component }) => (
    <button
      key={name}
      className="ui-tip"
      data-tip={name}
      aria-label={name}
      onClick={() => { onSelect(name); onClose(); }}
      style={{
        background: current === name ? "var(--cp-bg-hover)" : "transparent",
        border: current === name ? "1.5px solid var(--cp-accent)" : "1.5px solid transparent",
        borderRadius: 6, padding: 6, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: current === name ? "var(--cp-accent)" : "var(--cp-text-muted)",
        transition: "all .1s",
      }}
    >
      <Component size={16} strokeWidth={1.5} />
    </button>
  ));
}

// ── Single collection row ──
function CollectionRow({
  c, isActive, isEditing, editName, setEditName, handleRename, setEditingId,
  confirmDeleteId, setConfirmDeleteId, deleteCollection, setActiveCollectionId,
  iconPickerId, setIconPickerId, updateCollectionIcon, quoteCounts,
  onExportCollection,
}) {
  const count = quoteCounts[c.id] || 0;
  const icon = getIcon(c.icon);
  const [hovered, setHovered] = useState(false);
  const { setNodeRef, isOver: dragOver } = useDroppable({ id: `collection:${c.id}` });

  if (isEditing) {
    return (
      <div style={{ display: "flex", gap: 4, padding: "4px 8px", alignItems: "center" }}>
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleRename(c.id); if (e.key === "Escape") setEditingId(null); }}
          style={{
            flex: 1, padding: "4px 6px", fontSize: 12, fontFamily: "inherit",
            border: "1px solid var(--cp-accent)", borderRadius: 6, background: "var(--cp-bg-card)",
            color: "var(--cp-text)",
          }}
          autoFocus
        />
        <button onClick={() => handleRename(c.id)} aria-label="Save name" style={{ background: "none", border: "none", cursor: "pointer", color: CLR_GREEN, padding: 2 }}>
          <Check size={14} strokeWidth={2} />
        </button>
        <button onClick={() => setEditingId(null)} aria-label="Cancel rename" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 8px", borderRadius: 6, cursor: "pointer",
        background: dragOver ? CP_ACCENT_MUTED : isActive ? "var(--cp-bg-hover)" : "transparent",
        transition: "background .12s, transform .15s ease",
        position: "relative",
        ...(dragOver ? { transform: "scale(1.03)", outline: "2px solid var(--cp-drag-insert)", outlineOffset: -2, animation: "dropGlow .8s ease infinite" } : {}),
      }}
      onClick={() => setActiveCollectionId(c.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (confirmDeleteId === c.id) setConfirmDeleteId(null); }}
    >
      <Popover.Root open={iconPickerId === c.id} onOpenChange={(open) => { if (!open) setIconPickerId(null); }}>
        <Popover.Trigger
          render={<span />}
          className="ui-tip"
          data-tip="Change icon"
          aria-label="Change icon"
          style={{ display: "flex", alignItems: "center", flexShrink: 0, cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); setIconPickerId(prev => prev === c.id ? null : c.id); }}
        >
          {createElement(icon, { size: 14, strokeWidth: 1.5, color: isActive ? "var(--cp-accent)" : "var(--cp-text-muted)" })}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="top" align="start" sideOffset={6} style={{ zIndex: 100 }}>
            <Popover.Popup style={{
              background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 6,
              boxShadow: "var(--cp-shadow-md)", padding: 8,
              display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2,
              width: 180, animation: "slideD .12s ease",
            }}>
              <IconPickerGrid
                current={c.icon || "FolderOpen"}
                onSelect={iconName => updateCollectionIcon(c.id, iconName)}
                onClose={() => setIconPickerId(null)}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
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
        position: "absolute", right: 0, top: 0, bottom: 0,
        display: "flex", alignItems: "center", gap: 2,
        paddingLeft: 12, paddingRight: 6,
        background: dragOver ? CP_ACCENT_MUTED : isActive ? "var(--cp-bg-hover)" : "var(--cp-bg)",
        opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none",
        transition: "opacity .1s",
      }}>
        {confirmDeleteId === c.id ? (
          <button
            onClick={e => { e.stopPropagation(); deleteCollection(c.id); setConfirmDeleteId(null); }}
            style={{
              background: "none", border: "none", cursor: "pointer", color: CLR_RED,
              padding: "2px 4px", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Delete? ({count})
          </button>
        ) : (
          <>
            {onExportCollection && count > 0 && (
              <button
                className="ui-tip ui-tip-left"
                data-tip="Export as CSV"
                aria-label={`Export ${c.name} as CSV`}
                onClick={e => { e.stopPropagation(); onExportCollection(c.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}
              >
                <Download size={12} strokeWidth={1.5} />
              </button>
            )}
            <button
              className="ui-tip ui-tip-left"
              data-tip="Rename"
              aria-label="Rename collection"
              onClick={e => { e.stopPropagation(); setEditingId(c.id); setEditName(c.name); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
            <button
              className="ui-tip ui-tip-left"
              data-tip="Delete"
              aria-label="Delete collection"
              onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 2 }}
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
function CollapsedDropTarget({ c, isActive, setActiveCollectionId, Icon }) {
  const { setNodeRef, isOver: dragOver } = useDroppable({ id: `collection:${c.id}` });
  return (
    <button
      ref={setNodeRef}
      className="ui-tip ui-tip-right"
      data-tip={c.name}
      aria-label={c.name}
      onClick={() => setActiveCollectionId(c.id)}
      style={{
        background: dragOver ? CP_ACCENT_MUTED : isActive ? "var(--cp-bg-hover)" : "none",
        border: "none", cursor: "pointer",
        color: isActive ? "var(--cp-accent)" : "var(--cp-text-muted)",
        padding: 6, borderRadius: 6,
        transition: "transform .15s ease",
        ...(dragOver ? { transform: "scale(1.1)", outline: "2px solid var(--cp-drag-insert)", outlineOffset: -2, animation: "dropGlow .8s ease infinite" } : {}),
      }}
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
  onAutoGroup,
  onFindDupes,
  uniqueSources,
  favCount,
  toolbarHeight = 44,
  isMobileSheet = false,
  onExportCollection,
}) {
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
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
  const createWrapRef = useRef(null);
  const smartWrapRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) inputRef.current.focus();
  }, [isCreating]);

  useEffect(() => {
    if (isSmartGrouping && smartInputRef.current) smartInputRef.current.focus();
  }, [isSmartGrouping]);

  // Close input fields on outside click
  useEffect(() => {
    const handler = (e) => {
      if (isCreating && createWrapRef.current && !createWrapRef.current.contains(e.target)) {
        setIsCreating(false); setNewName(""); setCreateError(null);
      }
      if (isSmartGrouping && !smartGroupLoading && smartWrapRef.current && !smartWrapRef.current.contains(e.target)) {
        setIsSmartGrouping(false); setSmartTheme(""); setSmartGroupError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isCreating, isSmartGrouping, smartGroupLoading]);

  // Reset input fields when sidebar collapses. Uses the setState-during-render
  // pattern (keyed on prevCollapsed) instead of a setState-in-effect to avoid a
  // cascading re-render and keep the component React Compiler-compatible.
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    if (collapsed) {
      setIsCreating(false); setNewName(""); setCreateError(null);
      setIsSmartGrouping(false); setSmartTheme(""); setSmartGroupError(null);
    }
  }

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
    if (result?.error) {
      setCreateError(result.error === "duplicate"
        ? `"${result.name}" already exists`
        : "Invalid collection name");
      return;
    }
    if (result) {
      setNewName("");
      setIsCreating(false);
      setCreateError(null);
    }
  };

  const handleRename = (id) => {
    renameCollection(id, editName);
    setEditingId(null);
    setEditName("");
  };

  if (collapsed && !isMobileSheet) {
    return (
      <motion.div
        key="collapsed"
        className="sidebar-rail"
        initial={{ width: 220, opacity: 0 }}
        animate={{ width: 48, opacity: 1, transition: { width: { type: "spring", stiffness: 400, damping: 30 }, opacity: { duration: 0.15, delay: 0.1 } } }}
        style={{
          flexShrink: 0, paddingRight: 8,
          display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 8,
          position: "sticky", top: toolbarHeight, alignSelf: "flex-start",
          overflow: "hidden",
        }}
      >
        <button
          className="ui-tip ui-tip-right"
          data-tip="Expand sidebar"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Expand sidebar"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cp-text-muted)", padding: 4, borderRadius: 4,
          }}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        {/* Collapsed entry count badge */}
        <div
          className="ui-tip ui-tip-right"
          data-tip={`${totalQuotes} entries`}
          style={{
            fontSize: 10, fontWeight: 700, color: "var(--cp-text-muted)",
            background: "var(--cp-bg-tab)", borderRadius: 4, padding: "2px 5px",
            lineHeight: 1.2, textAlign: "center", cursor: "default",
          }}
        >
          <AnimatedNumber value={totalQuotes} />
        </div>
        <button
          className="ui-tip ui-tip-right"
          data-tip="All quotes"
          aria-label="All quotes"
          onClick={() => setActiveCollectionId(null)}
          style={{
            background: activeCollectionId === null ? "var(--cp-bg-hover)" : "none",
            border: "none", cursor: "pointer",
            color: activeCollectionId === null ? "var(--cp-accent)" : "var(--cp-text-muted)",
            padding: 6, borderRadius: 6,
          }}
        >
          <Library size={16} strokeWidth={1.5} />
        </button>
        {collections.map(c => {
          const Icon = getIcon(c.icon);
          return (
            <CollapsedDropTarget key={c.id} c={c} isActive={activeCollectionId === c.id} setActiveCollectionId={setActiveCollectionId} Icon={Icon} />
          );
        })}
      </motion.div>
    );
  }

  const expandedStyle = isMobileSheet
    ? { display: "flex", flexDirection: "column", fontFamily: FONT_SANS, width: "100%" }
    : {
        flexShrink: 0, padding: "0 12px 0 4px",
        display: "flex", flexDirection: "column",
        fontFamily: FONT_SANS,
        overflow: "visible",
        position: "sticky", top: toolbarHeight, alignSelf: "flex-start",
      };

  return (
    <motion.div
      key="expanded"
      initial={isMobileSheet ? false : { width: 48, opacity: 0 }}
      animate={isMobileSheet ? { opacity: 1 } : { width: 220, opacity: 1, transition: { width: { type: "spring", stiffness: 400, damping: 30 }, opacity: { duration: 0.15, delay: 0.05 } } }}
      style={expandedStyle}
    >
      {/* Overview card */}
      <div style={styles.sidebarOverview}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={styles.sidebarOverviewLabel}>Overview</span>
          {!isMobileSheet && (
          <button
            className="ui-tip ui-tip-below"
            data-tip="Collapse sidebar"
            onClick={() => setCollapsed(true)}
            aria-expanded={true}
            aria-label="Collapse sidebar"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 1, borderRadius: 4, display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          )}
        </div>
        <div style={styles.sidebarOverviewRow}>
          <span style={{ ...styles.sidebarOverviewMuted, display: "flex", alignItems: "center", gap: 6 }}><Library size={13} strokeWidth={1.5} /> Entries</span>
          <span style={styles.sidebarOverviewValue}><AnimatedNumber value={totalQuotes} /></span>
        </div>
        <div style={styles.sidebarOverviewRow}>
          <span style={{ ...styles.sidebarOverviewMuted, display: "flex", alignItems: "center", gap: 6 }}><Globe size={13} strokeWidth={1.5} /> Sources</span>
          <span style={styles.sidebarOverviewValue}><AnimatedNumber value={uniqueSources || 0} /></span>
        </div>
        {favCount > 0 && (
          <div style={styles.sidebarOverviewRow}>
            <span style={{ ...styles.sidebarOverviewMuted, display: "flex", alignItems: "center", gap: 6 }}><Star size={13} strokeWidth={1.5} /> Favorites</span>
            <span style={{ ...styles.sidebarOverviewValue, color: CLR_AMBER }}><AnimatedNumber value={favCount} /></span>
          </div>
        )}
        {onFindDupes && (
          <div style={{ marginTop: 6 }}>
            <button className="sidebar-dupes-btn" style={styles.sidebarDupesBtn} onClick={onFindDupes}>
              <Copy size={13} strokeWidth={2} />
              Find duplicates
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--cp-accent)" }}>Collections</span>
      </div>

      {/* Create new — at the top */}
      <div ref={createWrapRef} style={{ padding: "0 0 6px 0" }}>
        {isCreating ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{
              display: "flex", gap: 0, alignItems: "center",
              border: `1px solid ${createError ? CLR_RED : "var(--cp-accent)"}`, borderRadius: 6,
              background: "var(--cp-bg-card)", overflow: "hidden",
            }}>
              <input
                ref={inputRef}
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError(null); }}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setIsCreating(false); setNewName(""); setCreateError(null); } }}
                placeholder="Collection name..."
                style={{
                  flex: 1, minWidth: 0, padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
                  border: "none", outline: "none", background: "transparent",
                  color: "var(--cp-text)",
                }}
                autoFocus
              />
              <button
                onClick={handleCreate}
                style={{
                  flexShrink: 0, background: CP_ACCENT, border: "none", borderRadius: 4,
                  color: "#fff", padding: "4px 8px", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", margin: 2,
                }}
              >
                Add
              </button>
            </div>
            {createError && (
              <span style={{ fontSize: 11, color: CLR_RED, paddingLeft: 2 }}>{createError}</span>
            )}
          </div>
        ) : (
          <button
            className="hdr-btn"
            onClick={() => setIsCreating(true)}
            style={styles.sidebarActionBtn}
          >
            <Plus size={13} strokeWidth={2} /> New collection
          </button>
        )}
      </div>

      {/* Smart Group — AI auto-collection */}
      {onAutoGroup && (
        <div ref={smartWrapRef} style={{ padding: "0 0 6px 0" }}>
          {isSmartGrouping ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{
                display: "flex", gap: 0, alignItems: "center",
                border: `1px solid ${smartGroupError ? CLR_RED : "var(--cp-accent)"}`,
                borderRadius: 6, background: "var(--cp-bg-card)",
                opacity: smartGroupLoading ? 0.6 : 1,
                overflow: "hidden",
              }}>
                <input
                  ref={smartInputRef}
                  value={smartTheme}
                  onChange={e => { setSmartTheme(e.target.value); setSmartGroupError(null); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !smartGroupLoading) handleSmartGroup();
                    if (e.key === "Escape") { setIsSmartGrouping(false); setSmartTheme(""); setSmartGroupError(null); }
                  }}
                  placeholder='Theme, e.g. "love"'
                  disabled={smartGroupLoading}
                  style={{
                    flex: 1, padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
                    border: "none", outline: "none", background: "transparent",
                    color: "var(--cp-text)", minWidth: 0,
                  }}
                />
                <button
                  onClick={handleSmartGroup}
                  disabled={smartGroupLoading || !smartTheme.trim()}
                  style={{
                    background: "transparent", border: "none",
                    color: smartGroupLoading || !smartTheme.trim() ? "var(--cp-text-faint)" : "var(--cp-accent)",
                    padding: "5px 8px",
                    cursor: smartGroupLoading ? "wait" : "pointer",
                    display: "flex", alignItems: "center",
                    flexShrink: 0, transition: "color .12s",
                  }}
                >
                  {smartGroupLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={14} strokeWidth={2} />}
                </button>
              </div>
              {smartGroupError && (
                <span style={{ fontSize: 11, color: CLR_RED, paddingLeft: 2 }}>{smartGroupError}</span>
              )}
            </div>
          ) : (
            <button
              className="hdr-btn"
              onClick={() => setIsSmartGrouping(true)}
              style={styles.sidebarActionBtn}
            >
              <Wand2 size={13} strokeWidth={2} /> Smart group
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
          <span style={{ fontSize: 11, color: "var(--cp-text-faint)", minWidth: 20, textAlign: "right" }}><AnimatedNumber value={totalQuotes} /></span>
        </button>
      </div>

      {/* Empty state when no collections exist */}
      {collections.length === 0 && (
        <div style={{
          padding: "16px 12px", textAlign: "center",
          color: "var(--cp-text-faint)", fontSize: 12, lineHeight: 1.5,
        }}>
          <Bookmark size={20} strokeWidth={1.2} style={{ margin: "0 auto 8px", display: "block", opacity: 0.5 }} />
          <span>Group quotes into collections to keep things organized</span>
        </div>
      )}

      {/* Collections list — overflow:visible when short so row tooltips can escape; clips only when scrollable */}
      {collections.length > 0 && (
      <div style={{
        padding: "0 8px 8px 4px",
        overflowX: collections.length > 12 ? "hidden" : "visible",
        overflowY: collections.length > 12 ? "auto" : "visible",
        maxHeight: collections.length > 12 ? 420 : "none",
      }}>
        {collections.map((c, i) => (
          <motion.div
            key={c.id}
            initial={isMobileSheet ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2, ease: "easeOut" }}
          >
            <CollectionRow
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
              onExportCollection={onExportCollection}
            />
          </motion.div>
        ))}
      </div>
      )}

    </motion.div>
  );
}
