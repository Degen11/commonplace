import { useState, useRef, useEffect } from "react";
import { Popover } from "@base-ui/react/popover";
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
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  return (
    <Popover.Root open onOpenChange={(open) => { if (!open) onCancelRef.current(); }}>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={0} style={{ zIndex: 100 }}>
          <Popover.Popup
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--cp-bg-card)", border: "1px solid var(--cp-border)", borderRadius: 6,
              boxShadow: "var(--cp-shadow-md)", padding: 6,
              display: "flex", flexWrap: "wrap", gap: 4, width: 220,
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
                  fontSize: 11, padding: "3px 8px", borderRadius: 4,
                }}>
                  {c}
                </button>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
