import { useState, useCallback, useEffect, memo } from "react";
import useLongPress from "../hooks/useLongPress";
import EditForm from "./EditForm";
import { FavBtn, OverflowMenu, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/export";
import { CONF_LABELS } from "../data/constants";
import { styles, cardStyles } from "./styles";
import { Pencil, ChevronDown } from "lucide-react";

// ── Inline source input with local state (saves on blur/Enter) ──
function CardSourceInput({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
    <input
      style={styles.inlineSrcInput}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") { e.preventDefault(); onSave(val); }
        if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
      }}
      onBlur={() => onSave(val)}
      autoFocus
    />
  );
}

const MemoCardItem = memo(function CardItem({
  q, col, isSel, isEd, needsAtt, sortBy, dragId, isMobile,
  isInlineEditing, inlineEditField,
  isSavedPulse, savedPulseField,
  allCats, actionProps,
  toggleSel, startEditing, startInlineEdit,
  saveEdit, saveInlineField, setInlineEdit, setEditingId,
  handleDragStart, handleDragOver, handleDragEnd,
  isDeleting,
}) {
  const longPress = useLongPress(
    useCallback(() => toggleSel(q.id), [toggleSel, q.id]),
    400
  );

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleDown = (e) => {
      if (!e.target.closest(".overflow-btn") && !e.target.closest("[data-overflow-menu]")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [menuOpen]);

  return (
    <div
      className="qcard"
      data-id={q.id}
      draggable={!isEd && !isInlineEditing}
      onDragStart={() => handleDragStart(q.id)}
      onDragOver={e => handleDragOver(e, q.id)}
      onDragEnd={handleDragEnd}
      {...(isMobile ? longPress : {})}
      style={{
        ...cardStyles.card,
        ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}),
        ...(q.favorite ? cardStyles.favCard : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}),
        ...(dragId === q.id ? { opacity: .4 } : {}),
        ...(isDeleting ? { animation: "exitFade .18s ease forwards" } : {}),
      }}
      onMouseEnter={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 1; }}
      onMouseLeave={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 0; }}
    >
      <div style={cardStyles.top}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="check-div" style={{ ...styles.check, ...(isSel ? styles.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id); }}>
            {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
          </div>
          {isInlineEditing && inlineEditField === "category"
            ? <select style={styles.inlineCatSel} value={q.category} onChange={e => saveInlineField(q.id, "category", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus>
                {allCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            : <span className={`inline-cat${isSavedPulse && savedPulseField === "category" ? " save-pulse" : ""}`} style={{ ...styles.tag, background: col.bg, color: col.text, display: "inline-flex", alignItems: "center", gap: 2 }} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "category"); }} title="Click to change category">{q.category}<ChevronDown className="edit-hint" size={10} strokeWidth={2} color="currentColor" /></span>
          }
        </div>
        <div className="ca" style={{ ...cardStyles.acts, ...(isMobile ? { opacity: 1 } : {}) }}>
          <FavBtn q={q} onFav={actionProps.onFav} />
          <OverflowMenu
            q={q}
            actionProps={actionProps}
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(prev => !prev)}
          />
        </div>
      </div>
      {isEd
        ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} inCard />
        : (
          <>
            <p style={{ ...cardStyles.txt, cursor: "text" }} onClick={() => { if (!isEd) startEditing(q.id); }}>{displayText(q)}</p>
            <div style={cardStyles.srcRow}>
              <span style={{ color: "#D3D3D0" }}>—</span>
              {isInlineEditing && inlineEditField === "source"
                ? <CardSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} />
                : <><span className={`inline-src${isSavedPulse && savedPulseField === "source" ? " save-pulse" : ""}`} style={cardStyles.src} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "source"); }}>{q.source}</span><Pencil className="edit-hint" size={10} strokeWidth={1.5} color="#C8C4BC" /></>
              }
              <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
            </div>
          </>
        )
      }
    </div>
  );
}, (prev, next) => {
  if (prev.q !== next.q) return false;
  if (prev.isSel !== next.isSel) return false;
  if (prev.isEd !== next.isEd) return false;
  if (prev.needsAtt !== next.needsAtt) return false;
  if (prev.sortBy !== next.sortBy) return false;
  if (prev.dragId !== next.dragId) return false;
  if (prev.isInlineEditing !== next.isInlineEditing) return false;
  if (prev.inlineEditField !== next.inlineEditField) return false;
  if (prev.isDeleting !== next.isDeleting) return false;
  if (prev.isSavedPulse !== next.isSavedPulse) return false;
  if (prev.savedPulseField !== next.savedPulseField) return false;
  if ((prev.actionProps.copiedId === prev.q.id) !== (next.actionProps.copiedId === next.q.id)) return false;
  if (prev.actionProps.reidentifying.has(prev.q.id) !== next.actionProps.reidentifying.has(next.q.id)) return false;
  return true;
});

export default MemoCardItem;
