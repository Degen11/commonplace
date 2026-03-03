import { useState, useCallback, useEffect } from "react";
import useLongPress from "../hooks/useLongPress";
import EditForm from "./EditForm";
import { FavBtn, OverflowMenu, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/helpers";
import { CONF_LABELS } from "../data/constants";
import { Z, CZ } from "./styles";
import { Pencil, ChevronDown } from "lucide-react";

// ── Inline source input with local state (saves on blur/Enter) ──
function CardSourceInput({ initial, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  return (
    <input
      style={Z.inlineSrcInput}
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

// ── Card item component with long-press support (change #8) ──
export default function CardItem({
  q, col, isSel, isEd, needsAtt, sortBy, dragId, isMobile,
  inlineEdit, allCats, actionProps,
  toggleSel, startEditing, startInlineEdit,
  saveEdit, saveInlineField, setInlineEdit, setEditingId,
  handleDragStart, handleDragOver, handleDragEnd,
  savedPulse, deletingId,
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

  const isDeleting = deletingId === q.id;

  return (
    <div
      className="qcard"
      data-id={q.id}
      draggable={!isEd && inlineEdit?.id !== q.id}
      onDragStart={() => handleDragStart(q.id)}
      onDragOver={e => handleDragOver(e, q.id)}
      onDragEnd={handleDragEnd}
      {...(isMobile ? longPress : {})}
      style={{
        ...CZ.card,
        ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}),
        ...(q.favorite ? CZ.favCard : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}),
        ...(dragId === q.id ? { opacity: .4 } : {}),
        ...(isDeleting ? { animation: "exitFade .18s ease forwards" } : {}),
      }}
      onMouseEnter={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 1; }}
      onMouseLeave={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 0; }}
    >
      <div style={CZ.top}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="check-div" style={{ ...Z.check, ...(isSel ? Z.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id); }}>
            {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
          </div>
          {inlineEdit?.id === q.id && inlineEdit?.field === "category"
            ? <select style={Z.inlineCatSel} value={q.category} onChange={e => saveInlineField(q.id, "category", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus>
                {allCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            : <span className={`inline-cat${savedPulse?.id === q.id && savedPulse?.field === "category" ? " save-pulse" : ""}`} style={{ ...Z.tag, background: col.bg, color: col.text, display: "inline-flex", alignItems: "center", gap: 2 }} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "category"); }} title="Click to change category">{q.category}<ChevronDown className="edit-hint" size={10} strokeWidth={2} color="currentColor" /></span>
          }
        </div>
        <div className="ca" style={{ ...CZ.acts, ...(isMobile ? { opacity: 1 } : {}) }}>
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
            <p style={{ ...CZ.txt, cursor: "text" }} onClick={() => { if (!isEd) startEditing(q.id); }}>{displayText(q)}</p>
            <div style={CZ.srcRow}>
              <span style={{ color: "#D3D3D0" }}>—</span>
              {inlineEdit?.id === q.id && inlineEdit?.field === "source"
                ? <CardSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} />
                : <><span className={`inline-src${savedPulse?.id === q.id && savedPulse?.field === "source" ? " save-pulse" : ""}`} style={CZ.src} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "source"); }}>{q.source}</span><Pencil className="edit-hint" size={10} strokeWidth={1.5} color="#C8C4BC" /></>
              }
              <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
            </div>
          </>
        )
      }
    </div>
  );
}
