import { useState } from "react";
import EditForm from "./EditForm";
import { FavBtn, DelBtn, CopyBtn, ReidentifyBtn, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/helpers";
import { getCatColor, CONF_LABELS, REORDERABLE_COLS } from "../data/constants";
import { Z } from "./styles";

// ── Inline source text input ──
function InlineSourceInput({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
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
  );
}

// ── Inline category select ──
function InlineCategorySelect({ current, allCats, onSave, onCancel }) {
  const [val, setVal] = useState(current);
  return (
    <select
      style={Z.inlineCatSel}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      onKeyDown={e => {
        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onSave(val); }
        if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
      }}
      onClick={e => e.stopPropagation()}
      autoFocus
    >
      {allCats.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

// Column configuration
const COL_CONFIG = {
  content:  { label: "Content",  style: { flex: 1, minWidth: 200, paddingLeft: 0, paddingRight: 18, textAlign: "left" } },
  source:   { label: "Source",   style: { width: 200, paddingLeft: 0, paddingRight: 18, textAlign: "left" } },
  category: { label: "Category", style: { width: 80, paddingLeft: 0, paddingRight: 12, textAlign: "left" } },
};

// Performance: Extract inline style object
const CATEGORY_CELL_STYLE = { width: 80, display: 'flex', alignItems: 'center', gap: 6 };

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
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  columnOrder,
  setColumnOrder,
  sortBy,
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
          <div key="content" style={{ ...COL_CONFIG.content.style, paddingRight: 18 }}
            onClick={() => { if (!isEd) setEditingId(q.id); }}>
            {isEd
              ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} />
              : <p style={compact ? Z.entryTextCompact : Z.entryText}>{displayText(q)}</p>
            }
          </div>
        );
      case "source":
        return (
          <div key="source" className="src-col" style={Z.srcCol}>
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
        );
      case "category":
  return (
    <div key="category" style={CATEGORY_CELL_STYLE}>
      {inlineEdit?.id === q.id && inlineEdit?.field === "category" ? (
        <>
          <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
          <InlineCategorySelect current={q.category} allCats={allCats} onSave={val => saveInlineField(q.id, "category", val)} onCancel={() => setInlineEdit(null)} />
        </>
      ) : (
        <>
          <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
          <span
            className="inline-cat"
            style={{ ...Z.tag, background: col.bg, color: col.text }}
            onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "category" }); }}
            title="Click to change category"
          >{q.category}</span>
        </>
      )}
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      {filtered.length > 0 && (
        <div style={Z.tHead}>
          <div style={Z.chkW}>
            <div
              style={{ ...Z.check, ...(filtered.length > 0 && filtered.every(q => selected.has(q.id)) ? Z.checkOn : {}) }}
              onClick={selAll}
              onMouseDown={e => e.preventDefault()}
              title="Select all"
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
          <div style={{ width: 110 }} />
        </div>
      )}

      {filtered.map(q => {
        const isSel = selected.has(q.id);
        const isEd = editingId === q.id;
        const needsAtt = q.confidence === "low" || q.category === "Unknown";
        return (
          <div key={q.id} className="qrow"
            draggable={!isEd && inlineEdit?.id !== q.id}
            onDragStart={() => handleDragStart(q.id)}
            onDragOver={e => handleDragOver(e, q.id)}
            onDragEnd={handleDragEnd}
            style={{
              ...(compact ? Z.rowCompact : Z.row),
              ...(isSel ? { background: "#F0F7FF" } : {}),
              ...(q.favorite ? Z.favRow : {}),
              ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}),
              ...(dragId === q.id ? { opacity: .4 } : {}),
              animation: "fadeUp .25s ease",
            }}
          >
            <div className="checkbox" style={{ ...Z.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
              <div
                style={{ ...Z.check, ...(isSel ? Z.checkOn : {}) }}
                onClick={(e) => toggleSel(q.id, e.shiftKey)}
                onMouseDown={e => e.preventDefault()}
              >
                {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
              </div>
            </div>

            {columnOrder.map(colKey => renderColCell(colKey, q, isEd))}

            <div className="row-actions" style={Z.rowAct}>
              <FavBtn q={q} onFav={actionProps.onFav} />
              <CopyBtn q={q} onCopy={actionProps.onCopy} />
              <ReidentifyBtn q={q} onReidentify={actionProps.onReidentify} loading={actionProps.reidentifying === q.id} />
              <DelBtn q={q} onDelete={actionProps.onDelete} />
            </div>
          </div>
        );
      })}
    </div>
  );
}