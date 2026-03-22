import { useState, useRef, useEffect } from "react";
import { getCatColor } from "../data/constants";
import { styles } from "./styles";
import { ChevronDown } from "lucide-react";

// ── Inline source text input (shared by TableView and CardItem) ──
export function InlineSourceInput({ initial, onSave, onCancel, showHint = true }) {
  const [val, setVal] = useState(initial);
  // Track whether blur was triggered by an intentional user action (Enter/Tab/click-away)
  // vs. the virtualizer unmounting the row during scroll. When unmounted by the
  // virtualizer, onBlur fires but we should cancel rather than save partial edits.
  const unmountingRef = useRef(false);
  useEffect(() => () => { unmountingRef.current = true; }, []);
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
        onBlur={() => {
          if (unmountingRef.current) return;
          if (val !== initial) onSave(val); else onCancel();
        }}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.target.select()}
        autoFocus
      />
      {showHint && <span style={{ fontSize: 10, color: "var(--cp-text-faint)", userSelect: "none" }}>Enter to save · Esc to cancel</span>}
    </div>
  );
}

// ── Inline category picker with viewport-aware positioning ──
export function InlineCategorySelect({ current, allCats, onSave, onCancel, customCats }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onCancel(); } };
    const handleClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onCancel(); };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("mousedown", handleClick); };
  }, [onCancel]);

  return (
    <div
      ref={boxRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", top: "100%", left: 0, zIndex: 100,
        background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 6,
        boxShadow: "var(--cp-shadow-md)", padding: 6,
        display: "flex", flexWrap: "wrap", gap: 4, width: "min(220px, 80vw)",
        maxHeight: "60vh", overflowY: "auto", WebkitOverflowScrolling: "touch",
        animation: "slideD .12s ease",
      }}
    >
      {[...allCats].sort((a, b) => a.localeCompare(b)).map(c => {
        const col = getCatColor(c, customCats);
        const isActive = c === current;
        return (
          <button key={c} onClick={() => onSave(c)} style={{
            ...styles.tag, background: col.bg, color: col.text,
            border: isActive ? `1.5px solid ${col.text}` : "1.5px solid transparent",
            cursor: "pointer", fontFamily: "inherit",
            fontSize: 11, padding: "5px 10px", borderRadius: 4,
            minHeight: 30,
          }}>
            {c}
          </button>
        );
      })}
    </div>
  );
}
