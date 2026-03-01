import { useState, useMemo, useEffect } from "react";
import { Z } from "./styles";
import { normalize } from "../utils/helpers";
import { Lightbulb } from "lucide-react";

// Finds the closest local DB match to the current text.
// db is null until the dynamic import resolves (gracefully returns null then).
function findSuggestion(text, db) {
  if (!db || !text || text.length < 8) return null;
  const norm = normalize(text);

  // Score every entry by word overlap
  let best = null; let bestScore = 0;
  for (const entry of db) {
    if (entry.t === norm) return null; // exact match — no suggestion needed
    const wa = new Set(norm.split(" ").filter(w => w.length > 2));
    const wb = new Set(entry.t.split(" ").filter(w => w.length > 2));
    if (!wa.size || !wb.size) continue;
    let overlap = 0;
    wa.forEach(w => { if (wb.has(w)) overlap++; });
    const score = (overlap * 2) / (wa.size + wb.size);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  // Only suggest if similarity is meaningful but not exact
  if (bestScore >= 0.55 && bestScore < 1) return best;
  return null;
}

export default function EditForm({ q, allCats, onSave, onCancel, inCard }) {
  const [text, setText] = useState(q.text);
  const [source, setSource] = useState(q.source);
  const [category, setCategory] = useState(q.category);
  const [dismissed, setDismissed] = useState(false);
  const [localDb, setLocalDb] = useState(null);

  // Lazy-load the local DB — already cached in the module registry after
  // the first processing run, so this resolves instantly in practice.
  useEffect(() => {
    import("../data/localQuotes").then(m => setLocalDb(m.default));
  }, []);

  const suggestion = useMemo(() => {
    if (dismissed) return null;
    return findSuggestion(text, localDb);
  }, [text, dismissed, localDb]);

  const applySuggestion = () => {
    setText(suggestion.t.charAt(0).toUpperCase() + suggestion.t.slice(1));
    setSource(suggestion.s);
    setCategory(suggestion.c);
    setDismissed(true);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: inCard ? 8 : 0 }}
      onClick={e => e.stopPropagation()}
    >
      <textarea
        style={{ ...Z.textarea, minHeight: 40, fontSize: 13, padding: 8 }}
        value={text}
        onChange={e => { setText(e.target.value); setDismissed(false); }}
        onKeyDown={e => {
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSave(q.id, text, source, category); }
        }}
        autoFocus
      />

   {suggestion && (
  <div style={{
    display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
    padding:"6px 10px",
    background:"#ECFDF5",          // soft green background
    borderRadius:6,
    border:"1px solid #A7F3D0",    // subtle green border
    fontSize:12,
  }}>
    <span style={{ color:"#065F46", flexShrink:0, display:"inline-flex", alignItems:"center", gap:4 }}><Lightbulb size={13} strokeWidth={2} /> Did you mean:</span>
    <span style={{ color:"#064E3B", fontStyle:"italic", flex:1 }}>
      "{suggestion.t.charAt(0).toUpperCase() + suggestion.t.slice(1)}" — {suggestion.s}
    </span>
    <button
      onClick={applySuggestion}
      style={{
        padding:"2px 10px",
        borderRadius:5,
        border:"none",
        cursor:"pointer",
        background:"#059669",      // dark green button
        color:"#fff",
        fontSize:11,
        fontWeight:600,
        fontFamily:"inherit",
        flexShrink:0,
      }}
    >
      Use this
    </button>
    <button
      onClick={() => setDismissed(true)}
      style={{
        padding:"2px 6px",
        borderRadius:5,
        border:"none",
        cursor:"pointer",
        background:"transparent",
        color:"#065F46",
        fontSize:11,
        fontFamily:"inherit",
      }}
    >
      ✕
    </button>
  </div>
)}


      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={Z.editIn}
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source..."
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
            if (e.key === "Enter") { e.preventDefault(); onSave(q.id, text, source, category); }
          }}
        />
        <select
          style={Z.editSel}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={Z.editSave} onClick={() => onSave(q.id, text, source, category)}>Save</button>
        <button style={Z.editCancel} onClick={onCancel}>Cancel</button>
      </div>

    </div>
  );
}