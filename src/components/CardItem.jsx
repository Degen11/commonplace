import { useState, useCallback, useEffect, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import useLongPress from "../hooks/useLongPress";
import useSwipe from "../hooks/useSwipe";
import EditForm from "./EditForm";
import { InlineSourceInput } from "./InlineEditors";
import { FavBtn, OverflowMenu, ConfDot } from "./QuoteActions";
import { displayText } from "../utils/export";
import { CONF_LABELS } from "../data/constants";
import { styles, cardStyles } from "./styles";
import { Pencil, ChevronDown, Trash2, Heart } from "lucide-react";
import HighlightText from "./HighlightText";

const MemoCardItem = memo(function CardItem({
  q, col, isSel, isEd, needsAtt, sortBy, isMobile,
  isInlineEditing, inlineEditField,
  isSavedPulse, savedPulseField,
  allCats, customCats, actionProps,
  toggleSel, startEditing, startInlineEdit,
  saveEdit, saveInlineField, setInlineEdit, setEditingId,
  isDeleting,
  searchTerm,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: q.id, transition: null });

  const longPress = useLongPress(
    useCallback(() => toggleSel(q.id), [toggleSel, q.id]),
    400
  );

  const swipeEnabled = isMobile && !isEd && !isInlineEditing;
  const { offsetX, swipeHandlers } = useSwipe({
    onSwipeLeft: useCallback(() => actionProps.onDelete(q.id), [actionProps.onDelete, q.id]),
    onSwipeRight: useCallback(() => actionProps.onFav(q.id), [actionProps.onFav, q.id]),
    enabled: swipeEnabled,
  });

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

  // Swipe visual hints
  const isSwipingLeft = offsetX < -20;
  const isSwipingRight = offsetX > 20;
  const swipeProgress = Math.min(Math.abs(offsetX) / 80, 1);

  // On desktop, use dnd-kit listeners on the card; on mobile, use long-press + swipe
  const interactionProps = isMobile
    ? { ...longPress, ...swipeHandlers }
    : { ...(isEd || isInlineEditing ? {} : listeners) };

  return (
    <div ref={setNodeRef} style={{ position: "relative", borderRadius: 8, ...(isDragging ? { opacity: 0.35 } : {}) }}>
      {/* Swipe hint background — only rendered during active swipe */}
      {(isSwipingLeft || isSwipingRight) && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 8,
          background: isSwipingLeft
            ? `rgba(220,38,38,${0.08 + swipeProgress * 0.10})`
            : `rgba(245,158,11,${0.08 + swipeProgress * 0.10})`,
          display: "flex", alignItems: "center",
          justifyContent: isSwipingLeft ? "flex-end" : "flex-start",
          padding: "0 20px",
          color: isSwipingLeft ? "#DC2626" : "#F59E0B",
          fontSize: 12, fontWeight: 600, gap: 6, opacity: swipeProgress,
        }}>
          {isSwipingLeft ? <><Trash2 size={15} /> Delete</> : <><Heart size={15} /> Favorite</>}
        </div>
      )}
    <div
      className="qcard"
      data-id={q.id}
      {...interactionProps}
      {...attributes}
      style={{
        ...cardStyles.card,
        ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}),
        ...(q.favorite ? cardStyles.favCard : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "var(--cp-bg-attention)" } : {}),
        ...(isDeleting ? { animation: "exitFade .18s ease forwards" } : {}),
        ...(offsetX !== 0 ? { transform: `translateX(${offsetX}px)`, transition: "none" } : { transition: "transform .2s ease" }),
        ...(!isMobile && !isEd && !isInlineEditing ? { touchAction: "none" } : {}),
      }}
      onMouseEnter={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 1; }}
      onMouseLeave={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 0; }}
    >
      <div style={cardStyles.top}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="check-div" style={{ ...styles.check, ...(isSel ? styles.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }} onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id, e.shiftKey); }}>
            {isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
          </div>
          {isInlineEditing && inlineEditField === "category"
            ? <select style={styles.inlineCatSel} value={q.category} onChange={e => saveInlineField(q.id, "category", e.target.value)} onBlur={() => setInlineEdit(null)} autoFocus>
                {[...allCats, ...customCats.filter(c => !allCats.includes(c))].map(c => <option key={c} value={c}>{c}</option>)}
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
            <p style={{ ...cardStyles.txt, cursor: "text" }} onClick={() => { if (!isEd) startEditing(q.id); }}><HighlightText text={displayText(q)} term={searchTerm} /></p>
            <div style={cardStyles.srcRow}>
              <span style={{ color: "var(--cp-text-faint)" }}>—</span>
              {isInlineEditing && inlineEditField === "source"
                ? <InlineSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} showHint={false} />
                : <><span className={`inline-src${isSavedPulse && savedPulseField === "source" ? " save-pulse" : ""}`} style={cardStyles.src} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "source"); }}><HighlightText text={q.source} term={searchTerm} /></span><Pencil className="edit-hint" size={10} strokeWidth={1.5} color="var(--cp-text-faint)" /></>
              }
              <ConfDot q={q} CONF_LABELS={CONF_LABELS} />
            </div>
          </>
        )
      }
    </div>
    </div>
  );
}, (prev, next) => {
  if (prev.q !== next.q) return false;
  if (prev.isSel !== next.isSel) return false;
  if (prev.isEd !== next.isEd) return false;
  if (prev.needsAtt !== next.needsAtt) return false;
  if (prev.sortBy !== next.sortBy) return false;
  if (prev.isInlineEditing !== next.isInlineEditing) return false;
  if (prev.inlineEditField !== next.inlineEditField) return false;
  if (prev.isDeleting !== next.isDeleting) return false;
  if (prev.isSavedPulse !== next.isSavedPulse) return false;
  if (prev.savedPulseField !== next.savedPulseField) return false;
  if (prev.searchTerm !== next.searchTerm) return false;
  if (prev.allCats !== next.allCats) return false;
  if (prev.customCats !== next.customCats) return false;  if ((prev.actionProps.copiedId === prev.q.id) !== (next.actionProps.copiedId === next.q.id)) return false;
  if (prev.actionProps.reidentifying.has(prev.q.id) !== next.actionProps.reidentifying.has(next.q.id)) return false;
  return true;
});

export default MemoCardItem;
