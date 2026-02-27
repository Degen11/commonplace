import { useState, useEffect, useMemo } from "react";
import { Z } from "./styles";
import LOCAL_DB from "../data/localQuotes";
import { normalize } from "../utils/helpers";

// Finds the closest local DB match to the current text.
// Returns null if nothing is close enough to be worth suggesting.
function findSuggestion(text) {
  if (!text || text.length < 8) return null;
  const norm = normalize(text);

  // Score every entry by word overlap
  let best = null; let bestScore = 0;
  for (const entry of LOCAL_DB) {
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

const TAG_PILL = {
  display: "inline-flex", alignItems: "center", gap: 3,
  padding: "1px 7px", borderRadius: 3, fontSize: 11, fontWeight: 500,
  background: "#F0EDE6", color: "#6A6660", whiteSpace: "nowrap", lineHeight: "18px",
};

const TAG_INPUT = {
  border: "1px solid #D3D3D0", borderRadius: 4, padding: "2px 6px",
  fontSize: 11, fontFamily: "inherit", color: "#37352F", width: 90,
  background: "#fff", outline: "none",
};

export default function EditForm({ q, allCats, onSave, onCancel, inCard, allTags = [] }) {
  const [text, setText] = useState(q.text);
  const [source, setSource] = useState(q.source);
  const [category, setCategory] = useState(q.category);
  const [tags, setTags] = useState(q.tags || []);
  const [dismissed, setDismissed] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const suggestion = useMemo(() => {
    if (dismissed) return null;
    return findSuggestion(text);
  }, [text, dismissed]);

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
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSave(q.id, text, source, category, tags); }
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
    <span style={{ color:"#065F46", flexShrink:0 }}>💡 Did you mean:</span>
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
            if (e.key === "Enter") { e.preventDefault(); onSave(q.id, text, source, category, tags); }
          }}
        />
        <select
          style={Z.editSel}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={Z.editSave} onClick={() => onSave(q.id, text, source, category, tags)}>Save</button>
        <button style={Z.editCancel} onClick={onCancel}>Cancel</button>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#9B9A97", marginRight: 2 }}>Tags:</span>
        {tags.map(tag => (
          <span key={tag} style={TAG_PILL}>
            {tag}
            <button
              onClick={() => setTags(prev => prev.filter(t => t !== tag))}
              style={{ background: "none", border: "none", color: "#9B9A97", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1, fontFamily: "inherit" }}
            >&times;</button>
          </span>
        ))}
        <input
          style={TAG_INPUT}
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              e.stopPropagation();
              if (tagInput.trim()) { const tag = tagInput.trim().toLowerCase().replace(/[,;]/g, ""); if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]); setTagInput(""); }
            }
            if (e.key === "Backspace" && !tagInput && tags.length > 0) {
              setTags(prev => prev.slice(0, -1));
            }
            if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          }}
          onBlur={() => { if (tagInput.trim()) { const tag = tagInput.trim().toLowerCase().replace(/[,;]/g, ""); if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]); setTagInput(""); } }}
          placeholder="add tag..."
          list="edit-tag-sugg"
        />
        {allTags.length > 0 && (
          <datalist id="edit-tag-sugg">
            {allTags.filter(t => !tags.includes(t)).slice(0, 8).map(s => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>
    </div>
  );
}