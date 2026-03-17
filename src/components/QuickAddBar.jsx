import { useState, useRef, useEffect } from "react";
import { Popover } from "@base-ui/react/popover";
import { similarity } from "../utils/textFormatting";
import { DUPE_SIMILARITY_THRESHOLD } from "../config";
import { getCatColor } from "../data/constants";
import { styles } from "./styles";
import { AlertTriangle, ChevronDown, Plus, X } from "lucide-react";

export default function QuickAddBar({ onAdd, onClose, allCats, customCats, quotes }) {
  const textRef = useRef(null);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [dupeMatch, setDupeMatch] = useState(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const doAdd = () => {
    onAdd(text.trim(), source.trim() || undefined, category || undefined, { skipDupeCheck: true });
    setText("");
    setSource("");
    setDupeMatch(null);
    textRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const match = quotes.find(q => similarity(q.text, text.trim()) > DUPE_SIMILARITY_THRESHOLD);
    if (match) {
      setDupeMatch(match);
      return;
    }
    doAdd();
  };

  const catColor = category ? getCatColor(category, customCats) : null;

  return (
    <div style={{ background: "var(--cp-bg-card)", borderBottom: "1px solid var(--cp-border)", animation: "fadeUp .25s ease" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px" }}
      >
        <Plus size={14} strokeWidth={2} style={{ color: "var(--cp-text-muted)", flexShrink: 0 }} />
        <input
          ref={textRef}
          value={text}
          onChange={e => { setText(e.target.value); setDupeMatch(null); }}
          placeholder="Quote text…"
          style={{
            flex: 1, minWidth: 0, padding: "6px 10px", fontSize: 13, fontFamily: "inherit",
            border: "1px solid var(--cp-border)", borderRadius: 6,
            background: "var(--cp-bg)", color: "var(--cp-text)", outline: "none",
          }}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <input
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source (optional)"
          style={{
            width: 160, padding: "6px 10px", fontSize: 13, fontFamily: "inherit",
            border: "1px solid var(--cp-border)", borderRadius: 6,
            background: "var(--cp-bg)", color: "var(--cp-text)", outline: "none",
          }}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <Popover.Root open={showCatPicker} onOpenChange={setShowCatPicker}>
          <Popover.Trigger
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 8px", fontSize: 12, fontFamily: "inherit",
              border: "1px solid var(--cp-border)", borderRadius: 4,
              background: catColor ? catColor.bg : "var(--cp-bg)",
              color: catColor ? catColor.text : "var(--cp-text-muted)",
              cursor: "pointer", fontWeight: category ? 500 : 400,
              whiteSpace: "nowrap", letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {category || "Category\u2026"}
            <ChevronDown size={12} strokeWidth={2} />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
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
                  const isActive = c === category;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCategory(c); setShowCatPicker(false); }}
                      style={{
                        ...styles.tag, background: col.bg, color: col.text,
                        border: isActive ? `1.5px solid ${col.text}` : "1.5px solid transparent",
                        cursor: "pointer", fontFamily: "inherit",
                        fontSize: 11, padding: "3px 8px", borderRadius: 4,
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            padding: "6px 14px", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            background: text.trim() ? "var(--cp-accent)" : "var(--cp-bg-tab)",
            color: text.trim() ? "#fff" : "var(--cp-text-muted)",
            border: "none", borderRadius: 6, cursor: text.trim() ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cp-text-muted)", padding: 4, borderRadius: 4, flexShrink: 0,
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </form>
      {dupeMatch && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 16px 10px",
          fontSize: 12, color: "var(--cp-warning-text)",
          background: "var(--cp-warning-bg)",
          flexWrap: "wrap",
        }}>
          <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            Similar to: "{dupeMatch.text.length > 60 ? dupeMatch.text.slice(0, 60) + "\u2026" : dupeMatch.text}"
          </span>
          <button
            onClick={doAdd}
            style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid var(--cp-warning-border)",
              background: "transparent", color: "var(--cp-warning-text)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            Add anyway
          </button>
          <button
            onClick={() => setDupeMatch(null)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--cp-warning-text)", padding: 2, fontSize: 11, fontFamily: "inherit",
              opacity: 0.7,
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
