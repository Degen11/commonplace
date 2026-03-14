import { useState, useRef, useEffect } from "react";
import { similarity } from "../utils/textFormatting";
import { DUPE_SIMILARITY_THRESHOLD } from "../config";
import { AlertTriangle, Plus, X } from "lucide-react";

export default function QuickAddBar({ onAdd, onClose, allCats, quotes }) {
  const textRef = useRef(null);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [dupeMatch, setDupeMatch] = useState(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const doAdd = () => {
    onAdd(text.trim(), source.trim() || undefined, undefined, { skipDupeCheck: true });
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

  return (
    <div style={{ background: "var(--cp-bg-card)", borderBottom: "1px solid var(--cp-border)", animation: "fadeUp .2s ease" }}>
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
              padding: "3px 10px", borderRadius: 5, border: "1px solid var(--cp-warning-border)",
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
