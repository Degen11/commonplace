import { useState, useRef, useEffect } from "react";
import useClickOutside from "../hooks/useClickOutside";
import { getCatColor } from "../data/constants";
import { styles } from "./styles";
import { ChevronDown } from "lucide-react";

// ── Inline source text input (shared by TableView and CardItem) ──
export function InlineSourceInput({ initial, onSave, onCancel, showHint = true }) {
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
      {showHint && <span style={{ fontSize: 10, color: "var(--cp-text-faint)", userSelect: "none" }}>Enter to save · Esc to cancel</span>}
    </div>
  );
}

// ── Inline category picker with viewport-aware positioning ──
export function InlineCategorySelect({ current, allCats, onSave, onCancel, customCats }) {
  const ref = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const [flipUp, setFlipUp] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8) setFlipUp(true);
      if (rect.right > window.innerWidth - 8) setFlipLeft(true);
    }
  }, []);

  useClickOutside(ref, true, () => onCancelRef.current());

  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") { e.stopPropagation(); onCancelRef.current(); } };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{
      position: "absolute",
      ...(flipUp ? { bottom: "100%", top: "auto" } : { top: "100%", bottom: "auto" }),
      ...(flipLeft ? { right: 0, left: "auto" } : { left: 0 }),
      zIndex: 100,
      background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 6,
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
