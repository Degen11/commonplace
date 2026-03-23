import { useState, useRef, useEffect, memo } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Menu } from "@base-ui/react/menu";
import EditForm from "./EditForm";
import { InlineSourceInput, InlineCategorySelect } from "./InlineEditors";
import useLongPress from "../hooks/useLongPress";
import { displayText } from "../utils/export";
import { getCatColor, CONF_LABELS } from "../data/constants";
import clsx from "clsx";
import { styles } from "./styles";
import { QUOTE_TRUNCATE_CHARS } from "../config";
import { Pencil, ChevronDown, GripVertical, Check, Star, Copy, Share2, Ellipsis } from "lucide-react";
import HighlightText from "./HighlightText";


// Column configuration — original flex-based layout
const COL_BASE = {
  content:  { flex: 1, minWidth: 200, paddingLeft: 0, paddingRight: 16, display: "flex", alignItems: "center" },
  source:   { flex: "0 1 220px", minWidth: 100, maxWidth: 220, paddingLeft: 10, paddingRight: 12, display: "flex", alignItems: "center", borderLeft: "1px solid var(--cp-border-light)" },
  category: { flex: "0 1 140px", minWidth: 80, paddingLeft: 10, paddingRight: 8, display: "flex", alignItems: "center", borderLeft: "1px solid var(--cp-border-light)" },
};

const COL_CONFIG = {
  content:  { label: "Content",  style: { ...COL_BASE.content, textAlign: "left" } },
  source:   { label: "Source",   style: { ...COL_BASE.source, textAlign: "left" } },
  category: { label: "Category", style: { ...COL_BASE.category, textAlign: "left" } },
};

const ROW_HEIGHT_ESTIMATE = 48;
const ROW_HEIGHT_COMPACT_ESTIMATE = 34;
const VIRTUALIZER_OVERSCAN = 15;


// ── Slim row actions — ··· button with fav/copy/share dropdown ──
function RowActions({ q, actionProps, isOpen, onToggle }) {
  const [localCopied, setLocalCopied] = useState(false);

  const menuContentStyle = {
    background: "var(--cp-bg-card)",
    borderRadius: 6,
    boxShadow: "0 4px 16px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)",
    minWidth: 172,
    zIndex: 100,
    padding: 4,
    animation: "menuIn .14s ease",
    transformOrigin: "var(--transform-origin)",
  };

  return (
    <div style={styles.rowAct}>
      <Menu.Root open={isOpen} onOpenChange={(open) => { if (open !== isOpen) { onToggle(); if (open) setLocalCopied(false); } }}>
        <Menu.Trigger
          className="overflow-btn act-btn"
          style={{ ...styles.actBtn, "--hover-color": "var(--cp-text-secondary)" }}
          onClick={e => e.stopPropagation()}
        >
          <Ellipsis size={16} strokeWidth={2} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
            <Menu.Popup style={menuContentStyle} onClick={e => e.stopPropagation()}>
              <Menu.Item
                className="overflow-menu-item overflow-copy"
                closeOnClick={false}
                style={{ ...styles.overflowMenuItem, ...(localCopied ? { color: "#059669" } : {}) }}
                onClick={() => { if (!localCopied) { setLocalCopied(true); actionProps.onCopy(q); } }}
              >
                {localCopied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
                <span>{localCopied ? "Copied!" : "Copy"}</span>
              </Menu.Item>
              <Menu.Item
                className="overflow-menu-item overflow-share"
                closeOnClick={false}
                style={styles.overflowMenuItem}
                onClick={() => { actionProps.onShareImage(q); }}
              >
                <Share2 size={14} strokeWidth={1.5} />
                <span>Share as image</span>
              </Menu.Item>
              <Menu.Separator style={styles.overflowMenuDivider} />
              <Menu.Item
                className={clsx({ "overflow-menu-item-fav": q.favorite, "overflow-menu-item": !q.favorite })}
                style={styles.overflowMenuItem}
                onClick={() => { actionProps.onFav(q.id); }}
              >
                <Star size={14} fill={q.favorite ? "#F59E0B" : "none"} color={q.favorite ? "#F59E0B" : "currentColor"} strokeWidth={1.5} className="fav-pop" />
                <span>{q.favorite ? "Unfavorite" : "Favorite"}</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

const CONF_STRIPE = { high: "var(--cp-conf-high)", medium: "var(--cp-conf-medium)", low: "var(--cp-conf-low)" };

// React.memo is required here — the compiler's internal caching does NOT prevent
// useSortable from being called, which returns new transform/transition values for
// every row during drag. Without memo, all ~15-30 visible rows re-render per drag
// frame, causing virtualizer measurement churn and visible table jank.
const TableRow = memo(function TableRow({
  q, isSel, isEd, needsAtt, sortBy, isMobile,
  isInlineEditing, inlineEditField,
  isDeleting, isSavedPulse, savedPulseField,
  isMenuOpen,
  columnOrder, compact, showConfidence, allCats, customCats, actionProps,
  toggleSel, setEditingId, setInlineEdit, saveEdit, saveInlineField,
  setOpenMenuId,
  searchTerm,
  isNewQuote,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: q.id, transition: null });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
  };

  const [expanded, setExpanded] = useState(false);

  const longPress = useLongPress(
    () => toggleSel(q.id),
    400
  );

  const col = getCatColor(q.category, customCats);

  const renderColumn = (colKey) => {
    switch(colKey) {
      case "content": {
        const full = displayText(q);
        const truncatable = !compact && full.length > QUOTE_TRUNCATE_CHARS;
        const shown = truncatable && !expanded
          ? full.slice(0, QUOTE_TRUNCATE_CHARS).replace(/\s+\S*$/, "") + "\u2026"
          : full;
        return (
          <div key="content" style={COL_BASE.content}
            onClick={() => { if (!isEd) setEditingId(q.id); }}>
            {isEd
              ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} />
              : compact
                ? <p style={{ ...styles.entryTextCompact, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><HighlightText text={full} term={searchTerm} /></p>
                : <p style={styles.entryText}>
                    <HighlightText text={shown} term={searchTerm} />
                    {truncatable && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                        style={{ background: "none", border: "none", color: "var(--cp-text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: "0 4px", marginLeft: 4, opacity: 0.7 }}
                      >
                        {expanded ? "less" : "more"}
                      </button>
                    )}
                  </p>
            }
          </div>
        );
      }
      case "source":
        return (
          <div key="source" className={clsx("src-col", { "save-pulse": isSavedPulse && savedPulseField === "source" })} style={COL_BASE.source}>
            {isInlineEditing && inlineEditField === "source"
              ? <div style={{ flex: 1, minWidth: 0 }}><InlineSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} /></div>
              : <>
                  <span
                    className="inline-src"
                    style={{ ...styles.srcText, ...(compact ? { fontSize: 11 } : {}) }}
                    title={q.source}
                    onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "source" }); }}
                  ><HighlightText text={q.source} term={searchTerm} /></span>
                  <Pencil className="edit-hint" size={11} strokeWidth={1.5} color="var(--cp-text-faint)" />
                </>
            }
          </div>
        );
      case "category":
        return (
          <div key="category" className={clsx({ "save-pulse": isSavedPulse && savedPulseField === "category" })} style={{ ...COL_BASE.category, gap: 6, overflow: "visible", position: "relative" }}>
            <span
              className="inline-cat"
              style={{ ...styles.tag, background: col.bg, color: col.text, display: "inline-flex", alignItems: "center", gap: 2, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, cursor: "pointer" }}
              onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "category" }); }}
              title="Click to change category"
            >{q.category}<ChevronDown className="edit-hint" size={10} strokeWidth={2} color="currentColor" /></span>
            {isInlineEditing && inlineEditField === "category" && (
              <InlineCategorySelect current={q.category} allCats={allCats} customCats={customCats} onSave={val => saveInlineField(q.id, "category", val)} onCancel={() => setInlineEdit(null)} />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Stripe priority: favorite > confidence (when toggle is on)
  const stripeColor = q.favorite
    ? "var(--cp-fav-accent)"
    : (showConfidence && CONF_STRIPE[q.confidence]) || null;
  const stripeLabel = !q.favorite && showConfidence ? CONF_LABELS[q.confidence] : null;

  return (
    <div
      ref={setNodeRef}
      className={clsx("qrow", { "ui-tip": stripeLabel, "new-quote-pulse": isNewQuote })}
      data-id={q.id}
      {...(stripeLabel ? { "data-tip": stripeLabel } : {})}
      {...(isMobile ? longPress : {})}
      {...(isEd || isInlineEditing ? {} : listeners)}
      {...attributes}
      style={{
        ...sortableStyle,
        ...(compact ? styles.rowCompact : styles.row),
        ...(isSel ? { background: "var(--cp-bg-selected)" } : {}),
        ...(q.favorite ? { background: "var(--cp-bg-fav)" } : {}),
        ...(stripeColor ? { boxShadow: `inset 3px 0 0 ${stripeColor}` } : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "var(--cp-bg-attention)" } : {}),
        ...(isDragging ? { opacity: .4, zIndex: 1 } : {}),
        ...(isDeleting ? { animation: "exitSlideLeft .18s ease forwards" } : {}),
        ...(!isEd && !isInlineEditing ? { touchAction: "none" } : {}),
      }}
    >
      <div
        className="drag-handle"
        style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "grab" }}
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </div>
      <div className="checkbox" style={{ ...styles.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
        <div
          className="checkbox-visual"
          style={{ ...styles.check, ...(isSel ? styles.checkOn : {}) }}
          onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }}
          onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id, e.shiftKey); }}
          role="checkbox"
          aria-checked={isSel}
          tabIndex={0}
          onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleSel(q.id, e.shiftKey); } }}
        >
          {isSel && <Check size={10} strokeWidth={3} color="#fff" />}
        </div>
      </div>

      {columnOrder.map(colKey => renderColumn(colKey))}

      <RowActions
        q={q}
        actionProps={actionProps}
        isOpen={isMenuOpen}
        onToggle={() => setOpenMenuId(prev => prev === q.id ? null : q.id)}
      />
    </div>
  );
});

export default function TableView({
  filtered,
  selected,
  toggleSel,
  selAll,
  editingId,
  setEditingId,
  inlineEdit,
  setInlineEdit,
  saveEdit,
  saveInlineField,
  allCats,
  customCats,
  actionProps,
  compact,
  showConfidence,
  columnOrder,
  setColumnOrder,
  sortBy,
  isMobile,
  savedPulse,
  deletingId,
  searchTerm,
  toolbarHeight = 44,
  newQuoteHighlight,
}) {
  const [dragColId, setDragColId] = useState(null);
  const [dragColOver, setDragColOver] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const listRef = useRef(null);
  const outerRef = useRef(null);

  // Stagger-in animation on initial mount — class removed after animations complete
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    el.classList.add("stagger-in");
    const t = setTimeout(() => el.classList.remove("stagger-in"), 500);
    return () => clearTimeout(t);
  }, []);

  // Detect list order changes (sort/filter) and trigger a shuffle animation
  const listFingerprint = filtered.slice(0, 8).map(q => q.id).join(",");
  const prevFingerprintRef = useRef(listFingerprint);
  useEffect(() => {
    if (prevFingerprintRef.current === listFingerprint) return;
    prevFingerprintRef.current = listFingerprint;
    const el = outerRef.current;
    if (!el) return;
    el.classList.remove("list-shuffle");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("list-shuffle");
    const t = setTimeout(() => el.classList.remove("list-shuffle"), 300);
    return () => clearTimeout(t);
  }, [listFingerprint]);

  const handleColDragStart = (e, colId) => {
    e.stopPropagation();
    setDragColId(colId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDragOver = (e, colId) => {
    e.preventDefault();
    e.stopPropagation();
    if (colId !== dragColId) setDragColOver(colId);
  };

  const handleColDrop = (e, targetColId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragColId || dragColId === targetColId) {
      setDragColId(null);
      setDragColOver(null);
      return;
    }
    setColumnOrder(prev => {
      const arr = [...prev];
      const from = arr.indexOf(dragColId);
      const to = arr.indexOf(targetColId);
      if (from < 0 || to < 0) return prev;
      arr.splice(from, 1);
      arr.splice(to, 0, dragColId);
      return arr;
    });
    setDragColId(null);
    setDragColOver(null);
  };

  const handleColDragEnd = () => {
    setDragColId(null);
    setDragColOver(null);
  };

  // ── Track scroll margin in state so the compiler doesn't see ref reads during render ──
  // Only update on mount and window resize — NOT on element resize, which fires
  // during dnd-kit sortable transforms and causes the virtualizer to jump mid-drag.
  const [scrollMargin, setScrollMargin] = useState(0);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => setScrollMargin(el.offsetTop);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Window-based virtualizer — only renders rows near the viewport ──
  // Uses padding divs (not absolute positioning) so items stay in normal
  // document flow. This keeps dnd-kit's sortable transforms working correctly.
  const virtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => compact ? ROW_HEIGHT_COMPACT_ESTIMATE : ROW_HEIGHT_ESTIMATE,
    overscan: VIRTUALIZER_OVERSCAN,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const topPad = virtualItems.length > 0
    ? virtualItems[0].start - (virtualizer.options.scrollMargin ?? 0)
    : 0;
  const bottomPad = virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  const allSelected = filtered.length > 0 && filtered.every(q => selected.has(q.id));

  return (
    <div ref={outerRef} style={{ overflowX: "visible" }}>
      {filtered.length > 0 && (
        <div style={{ ...styles.tHead, top: toolbarHeight }}>
          <div style={{ width: 20, flexShrink: 0 }} />
          <div className="ui-tip ui-tip-below" data-tip="Select all" style={{ ...styles.chkW, ...(allSelected ? { opacity: 1 } : {}) }}>
            <div
              className="checkbox-visual"
              style={{ ...styles.check, ...(allSelected ? styles.checkOn : {}) }}
              onClick={(e) => { e.currentTarget.blur(); selAll(); }}
              role="checkbox"
              aria-checked={allSelected}
              tabIndex={0}
              onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); selAll(); } }}
            >
              {allSelected && <Check size={10} strokeWidth={3} color="#fff" />}
            </div>
          </div>
          {columnOrder.map(colKey => (
            <div
              key={colKey}
              className="col-drag-header"
              style={{
                ...COL_CONFIG[colKey].style,
                opacity: dragColId === colKey ? 0.4 : 1,
                outline: dragColOver === colKey ? "2px dashed rgba(60,87,117,0.4)" : "none",
                outlineOffset: 2,
                borderRadius: 4,
              }}
              draggable
              onDragStart={e => handleColDragStart(e, colKey)}
              onDragOver={e => handleColDragOver(e, colKey)}
              onDrop={e => handleColDrop(e, colKey)}
              onDragEnd={handleColDragEnd}
            >
              {COL_CONFIG[colKey].label}
            </div>
          ))}
          <div style={{ flex: "0 0 36px" }} />
        </div>
      )}

      <div ref={listRef}>
        {topPad > 0 && <div style={{ height: topPad }} />}
        {virtualItems.map(virtualRow => {
          const q = filtered[virtualRow.index];
          const isSel = selected.has(q.id);
          const isEd = editingId === q.id;
          const needsAtt = q.confidence === "low" || q.category === "Unknown";
          const isInlineEditing = inlineEdit?.id === q.id;
          const inlineEditField = isInlineEditing ? inlineEdit.field : null;
          const isDeleting = deletingId === q.id;
          const isSavedPulse = savedPulse?.id === q.id;
          const savedPulseField = isSavedPulse ? savedPulse.field : null;
          const isMenuOpen = openMenuId === q.id;
          return (
            <div key={q.id} data-index={virtualRow.index} ref={virtualizer.measureElement}>
              <TableRow
                q={q}
                isSel={isSel}
                isEd={isEd}
                needsAtt={needsAtt}
                sortBy={sortBy}
                isMobile={isMobile}
                isInlineEditing={isInlineEditing}
                inlineEditField={inlineEditField}
                isDeleting={isDeleting}
                isSavedPulse={isSavedPulse}
                savedPulseField={savedPulseField}
                isMenuOpen={isMenuOpen}
                columnOrder={columnOrder}
                compact={compact}
                showConfidence={showConfidence}
                allCats={allCats}
                customCats={customCats}
                actionProps={actionProps}
                toggleSel={toggleSel}
                setEditingId={setEditingId}
                setInlineEdit={setInlineEdit}
                saveEdit={saveEdit}
                saveInlineField={saveInlineField}
                setOpenMenuId={setOpenMenuId}
                searchTerm={searchTerm}
                isNewQuote={newQuoteHighlight === q.id}
              />
            </div>
          );
        })}
        {bottomPad > 0 && <div style={{ height: bottomPad }} />}
      </div>
    </div>
  );
}
