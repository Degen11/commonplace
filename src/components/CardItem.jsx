import { useCallback } from "react";
import useLongPress from "../hooks/useLongPress";
import EditForm from "./EditForm";
import { FavBtn, DelBtn, CopyBtn, ReidentifyBtn, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/helpers";
import { CONF_LABELS } from "../data/constants";
import { Z, CZ } from "./styles";

// ── Card item component with long-press support (change #8) ──
export default function CardItem({
  q, col, isSel, isEd, needsAtt, sortBy, dragId, isMobile,
  inlineEdit, allCats, actionProps,
  toggleSel, startEditing, startInlineEdit,
  saveEdit, saveInlineField, setInlineEdit, setEditingId,
  handleDragStart, handleDragOver, handleDragEnd,
  savedPulse,
}) {
  const longPress = useLongPress(
    useCallback(() => toggleSel(q.id), [toggleSel, q.id]),
    400
  );

  return (
    <div
      className="qcard"
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
        animation: "fadeUp .3s ease",
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
            : <span className={`inline-cat${savedPulse?.id === q.id && savedPulse?.field === "category" ? " save-pulse" : ""}`} style={{ ...Z.tag, background: col.bg, color: col.text }} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "category"); }} title="Click to change category">{q.category}</span>
          }
        </div>
        <div className="ca" style={{ ...CZ.acts, ...(isMobile ? { opacity: 1 } : {}) }}>
          <FavBtn q={q} onFav={actionProps.onFav} />
          <CopyBtn q={q} onCopy={actionProps.onCopy} copiedId={actionProps.copiedId} />
          <ReidentifyBtn q={q} onReidentify={actionProps.onReidentify} loading={actionProps.reidentifying === q.id} />
          <DelBtn q={q} onDelete={actionProps.onDelete} />
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
                ? <input style={Z.inlineSrcInput} value={q.source} onChange={e => saveInlineField(q.id, "source", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus />
                : <span className={`inline-src${savedPulse?.id === q.id && savedPulse?.field === "source" ? " save-pulse" : ""}`} style={CZ.src} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "source"); }}>{q.source}</span>
              }
              <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
            </div>
          </>
        )
      }
    </div>
  );
}
