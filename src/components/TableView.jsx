import { useState, useCallback, useEffect, useRef, memo } from "react";
import EditForm from "./EditForm";
import useLongPress from "../hooks/useLongPress";
import { FavBtn, OverflowMenu, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/export";
import { getCatColor, CONF_LABELS } from "../data/constants";
import { styles } from "./styles";
import { Pencil, ChevronDown, GripVertical } from "lucide-react";

// ── Inline source text input ──
function InlineSourceInput({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <input
        style={styles.inlineSrcInput}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onSave(val); }
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
        }}
        onBlur={() => { if (val !== initial) onSave(val); else onCancel(); }}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.target.select()}
        autoFocus
      />
      <span style={{ fontSize: 10, color: "var(--cp-text-faint)", userSelect: "none" }}>Enter to save · Esc to cancel</span>
    </div>
  );
}

// ── Inline category select (pill picker) with viewport-aware positioning ──
function InlineCategorySelect({ current, allCats, onSave, onCancel, customCats }) {
  const ref = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const [flipUp, setFlipUp] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8) {
        setFlipUp(true);
      }
      if (rect.right > window.innerWidth - 8) {
        setFlipLeft(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") { e.stopPropagation(); onCancelRef.current(); } };
    const handleClickOutside = e => { if (ref.current && !ref.current.contains(e.target)) onCancelRef.current(); };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{
      position: "absolute",
      ...(flipUp ? { bottom: "100%", top: "auto" } : { top: "100%", bottom: "auto" }),
      ...(flipLeft ? { right: 0, left: "auto" } : { left: 0 }),
      zIndex: 100,
      background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 8,
      boxShadow: "var(--cp-shadow-md)", padding: 6,
      display: "flex", flexWrap: "wrap", gap: 4, width: 220,
      animation: "slideD .12s ease",
    }}>
      {[...allCats].sort((a, b) => a.localeCompare(b)).map(c => {
        const col = getCatColor(c, customCats);
        const isActive = c === current;
        return (
          <button key={c} onClick={() => onSave(c)} style={{
            ...styles.tag, background: col.bg, color: col.text,
            border: isActive ? `1.5px solid ${col.text}` : "1.5px solid transparent",
            cursor: "pointer", fontFamily: "inherit",
            fontSize: 11, padding: "3px 8px", borderRadius: 4,
          }}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

// Column configuration — original flex-based layout
const COL_BASE = {
  content:  { flex: 1, minWidth: 200, paddingLeft: 0, paddingRight: 16, display: "flex", alignItems: "center" },
  source:   { flex: "0 1 220px", minWidth: 100, maxWidth: 220, paddingLeft: 10, paddingRight: 12, display: "flex", alignItems: "center", borderLeft: "1px solid rgba(0,0,0,0.04)" },
  category: { flex: "0 1 140px", minWidth: 80, paddingLeft: 10, paddingRight: 8, display: "flex", alignItems: "center", borderLeft: "1px solid rgba(0,0,0,0.04)" },
};

const COL_CONFIG = {
  content:  { label: "Content",  style: { ...COL_BASE.content, textAlign: "left" } },
  source:   { label: "Source",   style: { ...COL_BASE.source, textAlign: "left" } },
  category: { label: "Category", style: { ...COL_BASE.category, textAlign: "left" } },
};


// ── Memoized row component — only re-renders when its own data changes ──
const MemoTableRow = memo(function TableRow({
  q, isSel, isEd, needsAtt, sortBy, isMobile,
  isInlineEditing, inlineEditField,
  isDragging, isDeleting, isSavedPulse, savedPulseField,
  isMenuOpen, insertClass,
  columnOrder, compact, allCats, customCats, actionProps,
  toggleSel, setEditingId, setInlineEdit, saveEdit, saveInlineField,
  handleDragStart, handleDragOver, handleDragEnd, setOpenMenuId,
}) {
  const longPress = useLongPress(
    useCallback(() => toggleSel(q.id), [toggleSel, q.id]),
    400
  );

  const col = getCatColor(q.category, customCats);

  const renderColumn = (colKey) => {
    switch(colKey) {
      case "content":
        return (
          <div key="content" style={COL_BASE.content}
            onClick={() => { if (!isEd) setEditingId(q.id); }}>
            {isEd
              ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} />
              : <p style={compact ? styles.entryTextCompact : styles.entryText}>{displayText(q)}</p>
            }
          </div>
        );
      case "source":
        return (
          <div key="source" className={`src-col${isSavedPulse && savedPulseField === "source" ? " save-pulse" : ""}`} style={COL_BASE.source}>
            {isInlineEditing && inlineEditField === "source"
              ? <div style={{ flex: 1, minWidth: 0 }}><InlineSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} /></div>
              : <>
                  <span
                    className="inline-src"
                    style={{ ...styles.srcText, ...(compact ? { fontSize: 11 } : {}) }}
                    title={q.source}
                    onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "source" }); }}
                  >{q.source}</span>
                  <Pencil className="edit-hint" size={11} strokeWidth={1.5} color="var(--cp-text-faint)" />
                </>
            }
          </div>
        );
      case "category":
        return (
          <div key="category" className={isSavedPulse && savedPulseField === "category" ? "save-pulse" : ""} style={{ ...COL_BASE.category, gap: 6, overflow: "visible", position: "relative" }}>
            <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
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

  return (
    <div className={`qrow ${insertClass}`}
      data-id={q.id}
      draggable={!isEd && !isInlineEditing}
      onDragStart={e => { e.dataTransfer.setData("text/x-quote-id", q.id); handleDragStart(q.id); }}
      onDragOver={e => handleDragOver(e, q.id)}
      onDragEnd={handleDragEnd}
      {...(isMobile ? longPress : {})}
      style={{
        ...(compact ? styles.rowCompact : styles.row),
        ...(isSel ? { background: "var(--cp-bg-selected)" } : {}),
        ...(q.favorite ? styles.favRow : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "var(--cp-bg-attention)" } : {}),
        ...(isDragging ? { opacity: .4 } : {}),
        ...(isDeleting ? { animation: "exitFade .18s ease forwards" } : {}),
      }}
    >
      <div className="drag-handle" style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <GripVertical size={14} strokeWidth={1.5} />
      </div>
      <div className="checkbox" style={{ ...styles.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
        <div
          className="checkbox-visual"
          style={{ ...styles.check, ...(isSel ? styles.checkOn : {}) }}
          onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id, e.shiftKey); }}
          role="checkbox"
          aria-checked={isSel}
          tabIndex={0}
          onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleSel(q.id, e.shiftKey); } }}
        >
          {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
        </div>
      </div>

      {columnOrder.map(colKey => renderColumn(colKey))}

      <div className="row-actions" style={styles.rowAct}>
        <FavBtn q={q} onFav={actionProps.onFav} />
        <OverflowMenu
          q={q}
          actionProps={actionProps}
          isOpen={isMenuOpen}
          onToggle={() => setOpenMenuId(prev => prev === q.id ? null : q.id)}
        />
      </div>
    </div>
  );
}, (prev, next) => {
  if (prev.q !== next.q) return false;
  if (prev.isSel !== next.isSel) return false;
  if (prev.isEd !== next.isEd) return false;
  if (prev.compact !== next.compact) return false;
  if (prev.sortBy !== next.sortBy) return false;
  if (prev.needsAtt !== next.needsAtt) return false;
  if (prev.columnOrder !== next.columnOrder) return false;
  if (prev.isInlineEditing !== next.isInlineEditing) return false;
  if (prev.inlineEditField !== next.inlineEditField) return false;
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.isDeleting !== next.isDeleting) return false;
  if (prev.isSavedPulse !== next.isSavedPulse) return false;
  if (prev.savedPulseField !== next.savedPulseField) return false;
  if (prev.isMenuOpen !== next.isMenuOpen) return false;
  if (prev.insertClass !== next.insertClass) return false;
  if ((prev.actionProps.copiedId === prev.q.id) !== (next.actionProps.copiedId === next.q.id)) return false;
  if (prev.actionProps.reidentifying.has(prev.q.id) !== next.actionProps.reidentifying.has(next.q.id)) return false;
  return true;
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
  dragId,
  dragInsert,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  columnOrder,
  setColumnOrder,
  sortBy,
  isMobile,
  savedPulse,
  deletingId,
}) {
  const [dragColId, setDragColId] = useState(null);
  const [dragColOver, setDragColOver] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleDown = (e) => {
      if (!e.target.closest(".overflow-btn") && !e.target.closest("[data-overflow-menu]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [openMenuId]);

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

  const allSelected = filtered.length > 0 && filtered.every(q => selected.has(q.id));

  return (
    <div style={{ overflowX: "visible" }}>
      {filtered.length > 0 && (
        <div style={styles.tHead}>
          <div style={{ width: 20, flexShrink: 0 }} />
          <div className="ui-tip ui-tip-below" data-tip="Select all" style={styles.chkW}>
            <div
              className="checkbox-visual"
              style={{ ...styles.check, ...(allSelected ? styles.checkOn : {}) }}
              onClick={(e) => { e.currentTarget.blur(); selAll(); }}
              role="checkbox"
              aria-checked={allSelected}
              tabIndex={0}
              onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); selAll(); } }}
            >
              {allSelected && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
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
          <div style={{ flex: "0 0 68px" }} />
        </div>
      )}

      {filtered.map(q => {
        const isSel = selected.has(q.id);
        const isEd = editingId === q.id;
        const needsAtt = q.confidence === "low" || q.category === "Unknown";
        const isInlineEditing = inlineEdit?.id === q.id;
        const inlineEditField = isInlineEditing ? inlineEdit.field : null;
        const isDragging = dragId === q.id;
        const isDeleting = deletingId === q.id;
        const isSavedPulse = savedPulse?.id === q.id;
        const savedPulseField = isSavedPulse ? savedPulse.field : null;
        const isMenuOpen = openMenuId === q.id;
        const insertClass = dragInsert?.id === q.id
          ? (dragInsert.pos === "above" ? "drag-insert-above" : "drag-insert-below")
          : "";
        return (
          <MemoTableRow
            key={q.id}
            q={q}
            isSel={isSel}
            isEd={isEd}
            needsAtt={needsAtt}
            sortBy={sortBy}
            isMobile={isMobile}
            isInlineEditing={isInlineEditing}
            inlineEditField={inlineEditField}
            isDragging={isDragging}
            isDeleting={isDeleting}
            isSavedPulse={isSavedPulse}
            savedPulseField={savedPulseField}
            isMenuOpen={isMenuOpen}
            insertClass={insertClass}
            columnOrder={columnOrder}
            compact={compact}
            allCats={allCats}
            customCats={customCats}
            actionProps={actionProps}
            toggleSel={toggleSel}
            setEditingId={setEditingId}
            setInlineEdit={setInlineEdit}
            saveEdit={saveEdit}
            saveInlineField={saveInlineField}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            setOpenMenuId={setOpenMenuId}
          />
        );
      })}
    </div>
  );
}
