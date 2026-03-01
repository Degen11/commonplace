import { useState, useCallback, useEffect, useRef } from "react";
import EditForm from "./EditForm";
import useLongPress from "../hooks/useLongPress";
import { FavBtn, DelBtn, CopyBtn, ReidentifyBtn, ConfDot, ShareImageBtn } from "./QuoteActions";
import { displayText } from "../utils/helpers";
import { getCatColor, CONF_LABELS } from "../data/constants";
import { Z } from "./styles";

// ── Inline source text input ──
function InlineSourceInput({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <input
        style={Z.inlineSrcInput}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onSave(val); }
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
        }}
        onBlur={() => onSave(val)}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.target.select()}
        autoFocus
      />
      <span style={{ fontSize: 10, color: "#C8C4BC", userSelect: "none" }}>Enter to save · Esc to cancel</span>
    </div>
  );
}

// ── Inline category select (pill picker) ──
function InlineCategorySelect({ current, allCats, onSave, onCancel, customCats }) {
  const ref = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") { e.stopPropagation(); onCancelRef.current(); } };
    const handleClickOutside = e => { if (ref.current && !ref.current.contains(e.target)) onCancelRef.current(); };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{
      position: "absolute", top: "100%", left: 0, zIndex: 200,
      background: "#fff", border: "1px solid #E3E2DE", borderRadius: 8,
      boxShadow: "0 4px 16px rgba(0,0,0,.1)", padding: 6,
      display: "flex", flexWrap: "wrap", gap: 4, width: 220,
      animation: "slideD .12s ease",
    }}>
      {[...allCats].sort((a, b) => a.localeCompare(b)).map(c => {
        const col = getCatColor(c, customCats);
        const isActive = c === current;
        return (
          <button key={c} onClick={() => onSave(c)} style={{
            ...Z.tag, background: col.bg, color: col.text,
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

// Column configuration
const COL_CONFIG = {
  content:  { label: "Content",  style: { flex: 1, minWidth: 200, paddingLeft: 0, paddingRight: 12, textAlign: "left" } },
  source:   { label: "Source",   style: { flex: "0 1 180px", minWidth: 100, maxWidth: 180, paddingLeft: 0, paddingRight: 6, textAlign: "left" } },
  category: { label: "Category", style: { flex: "0 1 140px", minWidth: 60, paddingLeft: 0, paddingRight: 8, textAlign: "left" } },
};

// Performance: Extract inline style object
const CATEGORY_CELL_STYLE = { flex: "0 1 140px", minWidth: 60, display: 'flex', alignItems: 'center', gap: 6, overflow: 'visible', paddingRight: 8 };

// ── Row component with long-press support (change #8) ──
function TableRow({
  q, isSel, isEd, needsAtt, sortBy, dragId, dragInsert, isMobile,
  inlineEdit, columnOrder, compact, actionProps,
  toggleSel,
  handleDragStart, handleDragOver, handleDragEnd, renderColCell,
  deletingId,
}) {
  const longPress = useLongPress(
    useCallback(() => toggleSel(q.id), [toggleSel, q.id]),
    400
  );

  const insertClass = dragInsert?.id === q.id
    ? (dragInsert.pos === "above" ? "drag-insert-above" : "drag-insert-below")
    : "";

  return (
    <div className={`qrow ${insertClass}`}
      data-id={q.id}
      draggable={!isEd && inlineEdit?.id !== q.id}
      onDragStart={() => handleDragStart(q.id)}
      onDragOver={e => handleDragOver(e, q.id)}
      onDragEnd={handleDragEnd}
      {...(isMobile ? longPress : {})}
      style={{
        ...(compact ? Z.rowCompact : Z.row),
        ...(isSel ? { background: "#F0F7FF" } : {}),
        ...(q.favorite ? Z.favRow : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}),
        ...(dragId === q.id ? { opacity: .4 } : {}),
        ...(deletingId === q.id ? { animation: "exitFade .18s ease forwards" } : {}),
      }}
    >
      <div className="checkbox" style={{ ...Z.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
        <div
          style={{ ...Z.check, ...(isSel ? Z.checkOn : {}) }}
          onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id, e.shiftKey); }}
        >
          {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
        </div>
      </div>

      {columnOrder.map(colKey => renderColCell(colKey, q, isEd))}

      <div className="row-actions" style={Z.rowAct}>
        <FavBtn q={q} onFav={actionProps.onFav} />
        <CopyBtn q={q} onCopy={actionProps.onCopy} copiedId={actionProps.copiedId} />
        <ShareImageBtn q={q} onShareImage={actionProps.onShareImage} />
        <ReidentifyBtn q={q} onReidentify={actionProps.onReidentify} loading={actionProps.reidentifying.has(q.id)} />
        <DelBtn q={q} onDelete={actionProps.onDelete} />
      </div>
    </div>
  );
}

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

  const renderColCell = (colKey, q, isEd) => {
  const col = getCatColor(q.category, customCats);
  switch(colKey) {
    case "content":
      return (
        <div key="content" style={{ ...COL_CONFIG.content.style, paddingRight: 12 }}
          onClick={() => { if (!isEd) setEditingId(q.id); }}>
          {isEd
            ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} />
            : <p style={compact ? Z.entryTextCompact : Z.entryText}>{displayText(q)}</p>
          }
        </div>
      );
    case "source":
      return (
        <div key="source" className={`src-col${savedPulse?.id === q.id && savedPulse?.field === "source" ? " save-pulse" : ""}`} style={Z.srcCol}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, minWidth: 0 }}>
            {inlineEdit?.id === q.id && inlineEdit?.field === "source"
              ? <InlineSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} />
              : <span
                  className="inline-src"
                  style={{ ...Z.srcText, ...(compact ? { fontSize: 11 } : {}) }}
                  title={q.source}
                  onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "source" }); }}
                >{q.source}</span>
            }
          </div>
        </div>
      );
    case "category":
      return (
        <div key="category" className={savedPulse?.id === q.id && savedPulse?.field === "category" ? "save-pulse" : ""} style={{ ...CATEGORY_CELL_STYLE, position: "relative" }}>
          <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
          <span
            className="inline-cat"
            style={{ ...Z.tag, background: col.bg, color: col.text, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110, minWidth: 0, flex: "1 1 auto", cursor: "pointer" }}
            onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "category" }); }}
            title="Click to change category"
          >{q.category}</span>
          {inlineEdit?.id === q.id && inlineEdit?.field === "category" && (
            <InlineCategorySelect current={q.category} allCats={allCats} customCats={customCats} onSave={val => saveInlineField(q.id, "category", val)} onCancel={() => setInlineEdit(null)} />
          )}
        </div>
      );
    default:
      return null;
  }
};
  return (
    <div style={{ overflowX: "visible" }}>
      {filtered.length > 0 && (
        <div style={Z.tHead}>
          <div className="ui-tip ui-tip-below" data-tip="Select all" style={Z.chkW}>
            <div
              style={{ ...Z.check, ...(filtered.length > 0 && filtered.every(q => selected.has(q.id)) ? Z.checkOn : {}) }}
              onClick={(e) => { e.currentTarget.blur(); selAll(); }}
            >
              {filtered.length > 0 && filtered.every(q => selected.has(q.id)) && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
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
          <div style={{ flex: "0 0 130px" }} />
        </div>
      )}

      {filtered.map(q => {
        const isSel = selected.has(q.id);
        const isEd = editingId === q.id;
        const needsAtt = q.confidence === "low" || q.category === "Unknown";
        return (
          <TableRow
            key={q.id}
            q={q}
            isSel={isSel}
            isEd={isEd}
            needsAtt={needsAtt}
            sortBy={sortBy}
            dragId={dragId}
            dragInsert={dragInsert}
            isMobile={isMobile}
            inlineEdit={inlineEdit}
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
            renderColCell={renderColCell}
            deletingId={deletingId}
          />
        );
      })}
    </div>
  );
}
