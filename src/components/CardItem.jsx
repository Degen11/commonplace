import { useState, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import useLongPress from "../hooks/useLongPress";
import useSwipe from "../hooks/useSwipe";
import EditForm from "./EditForm";
import MobileSheet from "./MobileSheet";
import { InlineSourceInput, InlineCategorySelect } from "./InlineEditors";
import { FavBtn, OverflowMenu } from "./QuoteActions";
import { displayText } from "../utils/export";
import { CONF_LABELS } from "../data/constants";
import { QUOTE_TRUNCATE_CHARS } from "../config";
import clsx from "clsx";
import { styles, cardStyles } from "./styles";
import { Pencil, ChevronDown, Trash2, Heart, Check } from "lucide-react";
import HighlightText from "./HighlightText";

const CONF_STRIPE = { high: "var(--cp-conf-high)", medium: "var(--cp-conf-medium)", low: "var(--cp-conf-low)" };

// React.memo is required — same reason as TableRow. During drag, overDragId
// changes re-render every visible card. Without memo, each calls useSortable()
// which returns new values during an active drag, causing unnecessary work.
const CardItem = memo(function CardItem({
  q, col, isSel, isEd, needsAtt, showConfidence, sortBy, isMobile,
  isInlineEditing, inlineEditField,
  isSavedPulse, savedPulseField,
  allCats, customCats, actionProps,
  toggleSel, startEditing, startInlineEdit,
  saveEdit, saveInlineField, setInlineEdit, setEditingId,
  isDeleting,
  searchTerm,
  isOverTarget,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: q.id, transition: null });

  const longPress = useLongPress(
    () => toggleSel(q.id),
    400
  );

  const swipeEnabled = isMobile && !isEd && !isInlineEditing;
  const { offsetX, swipeHandlers } = useSwipe({
    onSwipeLeft: () => actionProps.onDelete(q.id),
    onSwipeRight: () => actionProps.onFav(q.id),
    enabled: swipeEnabled,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Stripe priority: favorite > confidence (when toggle is on)
  const stripeColor = q.favorite
    ? "var(--cp-fav-accent)"
    : (showConfidence && CONF_STRIPE[q.confidence]) || null;
  const stripeLabel = !q.favorite && showConfidence ? CONF_LABELS[q.confidence] : null;

  // Swipe visual hints
  const isSwipingLeft = offsetX < -20;
  const isSwipingRight = offsetX > 20;
  const swipeProgress = Math.min(Math.abs(offsetX) / 60, 1);

  // On desktop, use dnd-kit listeners on the card; on mobile, use long-press + swipe
  const interactionProps = isMobile
    ? { ...longPress, ...swipeHandlers }
    : { ...(isEd || isInlineEditing ? {} : listeners) };

  return (
    <div ref={setNodeRef} style={{ position: "relative", borderRadius: 6, ...(isDragging ? { opacity: 0.35 } : {}) }}>
      {/* Swipe hint background — only rendered during active swipe */}
      {(isSwipingLeft || isSwipingRight) && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 6,
          background: isSwipingLeft
            ? `rgba(220,38,38,${0.08 + swipeProgress * 0.10})`
            : `rgba(245,158,11,${0.08 + swipeProgress * 0.10})`,
          display: "flex", alignItems: "center",
          justifyContent: isSwipingLeft ? "flex-end" : "flex-start",
          padding: "0 20px",
          color: isSwipingLeft ? "#DC2626" : "#F59E0B",
          fontSize: 13, fontWeight: 600, gap: 6, opacity: swipeProgress,
        }}>
          {isSwipingLeft ? <><Trash2 size={15} /> Delete</> : <><Heart size={15} /> Favorite</>}
        </div>
      )}
    <div
      className={clsx("qcard", { "ui-tip": stripeLabel })}
      data-id={q.id}
      {...(stripeLabel ? { "data-tip": stripeLabel } : {})}
      {...interactionProps}
      {...attributes}
      style={{
        ...cardStyles.card,
        ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}),
        ...(q.favorite ? { background: "var(--cp-bg-fav)" } : {}),
        ...(needsAtt && sortBy === "confidence" ? { background: "var(--cp-bg-attention)" } : {}),
        ...(isDeleting ? { animation: "exitSlideLeft .18s ease forwards" } : {}),
        ...(offsetX !== 0 ? { transform: `translateX(${offsetX}px)`, transition: "none" } : { transition: "transform .2s ease" }),
        ...(!isMobile && !isEd && !isInlineEditing ? { touchAction: "none" } : {}),
        ...{ boxShadow: [stripeColor ? `inset 3px 0 0 ${stripeColor}` : null, isOverTarget ? "inset 0 2px 0 #3C5775" : null].filter(Boolean).join(", ") || undefined },
        ...(isOverTarget ? { transition: "box-shadow .15s ease" } : {}),
      }}
      onMouseEnter={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 1; }}
      onMouseLeave={e => { const a = e.currentTarget.querySelector(".ca"); if (a) a.style.opacity = 0; }}
    >
      <div style={cardStyles.top}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="check-div" style={{ ...styles.check, ...(isSel ? styles.checkOn : {}), width: isMobile ? 22 : 15, height: isMobile ? 22 : 15, borderRadius: isMobile ? 4 : 3 }} onMouseDown={(e) => { if (e.shiftKey) e.preventDefault(); }} onClick={(e) => { e.currentTarget.blur(); toggleSel(q.id, e.shiftKey); }}>
            {isSel && <Check size={isMobile ? 14 : 10} strokeWidth={3} color="#fff" />}
          </div>
          <div style={{ position: "relative" }}>
            <span className={clsx("inline-cat", { "save-pulse": isSavedPulse && savedPulseField === "category" })} style={{ ...styles.tag, background: col.bg, color: col.text, display: "inline-flex", alignItems: "center", gap: 2, ...(isMobile ? { padding: "4px 10px", fontSize: 12 } : {}) }} onClick={e => { e.stopPropagation(); if (!isEd) setInlineEdit({ id: q.id, field: "category" }); }} title="Click to change category">{q.category}<ChevronDown className="edit-hint" size={10} strokeWidth={2} color="currentColor" /></span>
            {isInlineEditing && inlineEditField === "category" && (
              <InlineCategorySelect current={q.category} allCats={allCats} customCats={customCats} onSave={val => saveInlineField(q.id, "category", val)} onCancel={() => setInlineEdit(null)} />
            )}
          </div>
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
      {isEd && !isMobile
        ? <EditForm q={q} allCats={allCats} onSave={saveEdit} onCancel={() => setEditingId(null)} inCard isMobile={false} />
        : isEd && isMobile
        ? <MobileSheet isOpen onClose={() => setEditingId(null)} snapPoints={[0.6, 0.4]} initialSnap={0}>
            <EditForm q={q} allCats={allCats} onSave={(...args) => { saveEdit(...args); setEditingId(null); }} onCancel={() => setEditingId(null)} inCard={false} isMobile={true} />
          </MobileSheet>
        : (
          <>
            <p style={{ ...cardStyles.txt, cursor: "text" }} onClick={() => { if (!isEd) startEditing(q.id); }}>
              {(() => { const full = displayText(q); const truncatable = full.length > QUOTE_TRUNCATE_CHARS; const shown = truncatable && !expanded ? full.slice(0, QUOTE_TRUNCATE_CHARS).replace(/\s+\S*$/, "") + "\u2026" : full; return (<><HighlightText text={shown} term={searchTerm} />{truncatable && (<button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} style={{ background: "none", border: "none", color: "var(--cp-text-muted)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: "0 4px", marginLeft: 4, opacity: 0.7 }}>{expanded ? "less" : "more"}</button>)}</>); })()}
            </p>
            <div style={cardStyles.srcRow}>
              <span style={{ color: "var(--cp-text-faint)" }}>—</span>
              {isInlineEditing && inlineEditField === "source"
                ? <InlineSourceInput initial={q.source} onSave={val => saveInlineField(q.id, "source", val)} onCancel={() => setInlineEdit(null)} showHint={false} />
                : <><span className={clsx("inline-src", { "save-pulse": isSavedPulse && savedPulseField === "source" })} style={cardStyles.src} onClick={e => { e.stopPropagation(); if (!isEd) startInlineEdit(q.id, "source"); }}><HighlightText text={q.source} term={searchTerm} /></span><Pencil className="edit-hint" size={10} strokeWidth={1.5} color="var(--cp-text-faint)" /></>
              }
            </div>
          </>
        )
      }
    </div>
    </div>
  );
});

export default CardItem;
