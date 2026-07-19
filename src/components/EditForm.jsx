import { useState, useEffect } from "react";
import { styles } from "./styles";
import { normalize } from "../utils/textFormatting";
import { smartRestore } from "../utils/smartRestore";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { DUPE_SIMILARITY_THRESHOLD } from "../config";
import { Lightbulb } from "lucide-react";

// Finds the closest local DB match to the current text.
// db is null until the dynamic import resolves (gracefully returns null then).
// Common words that inflate similarity scores without meaningful overlap
const STOP_WORDS = new Set([
  "the","and","but","for","are","not","you","all","can","had","her","was","one",
  "our","out","has","have","been","will","more","when","who","how","its","may",
  "did","get","him","his","let","say","she","too","use","with","just","like",
  "that","this","what","from","they","been","than","into","them","then","some",
  "could","would","should","there","their","about","which","being","where","does",
  "dont","your","were","come","make","been","know","take","want","over","such",
  "only","also","back","after","very","most","much","every","never","still",
]);

function findSuggestion(text, db) {
  if (!db || !text || text.length < 8) return null;
  const norm = normalize(text);

  // Build the input's word set ONCE — it only depends on `norm`, not on the
  // entry being compared. Previously this ran on every one of the ~3,700 entries
  // per keystroke.
  const wa = new Set(norm.split(" ").filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  if (wa.size < 2) return null;

  // Score every entry by word overlap, ignoring stop words
  let best = null; let bestScore = 0;
  for (const entry of db) {
    if (entry.t === norm) return null; // exact match — no suggestion needed
    const wb = new Set(entry.t.split(" ").filter(w => w.length > 2 && !STOP_WORDS.has(w)));
    if (wb.size < 2) continue;
    let overlap = 0;
    wa.forEach(w => { if (wb.has(w)) overlap++; });
    if (overlap < 2) continue;
    const score = (overlap * 2) / (wa.size + wb.size);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  // Only suggest if similarity is meaningful but not exact
  if (bestScore >= DUPE_SIMILARITY_THRESHOLD && bestScore < 1) return best;
  return null;
}

export default function EditForm({ q, allCats, onSave, onCancel, inCard, isMobile }) {
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

  const suggestion = dismissed ? null : findSuggestion(text, localDb);

  const formatSuggestionText = (t) => smartRestore(t);

  const applySuggestion = () => {
    setText(formatSuggestionText(suggestion.t));
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
        style={{ ...styles.textarea, minHeight: isMobile ? 100 : 40, fontSize: isMobile ? 15 : 13, padding: isMobile ? 12 : 8, lineHeight: isMobile ? 1.7 : 1.6 }}
        value={text}
        onChange={e => { setText(e.target.value); setDismissed(false); }}
        onKeyDown={e => {
          if (handleRichTextShortcut(e, text, setText)) return;
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSave(q.id, text, source, category); }
        }}
        autoFocus
      />

      <div style={{
        display:"grid",
        gridTemplateRows: suggestion ? "1fr" : "0fr",
        transition:"grid-template-rows .15s ease",
      }}>
        <div style={{ overflow:"hidden" }}>
          <div style={{
            display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
            padding:"6px 10px",
            background:"var(--cp-suggest-bg)",
            borderRadius:6,
            border:"1px solid var(--cp-suggest-border)",
            fontSize:12,
            marginTop: suggestion ? 0 : -1,
          }}>
            <span style={{ color:"var(--cp-text-muted)", flexShrink:0, display:"inline-flex", alignItems:"center", gap:4 }}><Lightbulb size={13} strokeWidth={2} /> Did you mean:</span>
            <span style={{ color:"var(--cp-text-secondary)", fontStyle:"italic", flex:1 }}>
              {suggestion ? `"${formatSuggestionText(suggestion.t)}" — ${suggestion.s}` : ""}
            </span>
            <button
              onClick={applySuggestion}
              style={{
                padding:"2px 10px",
                borderRadius:4,
                border:"none",
                cursor:"pointer",
                background:"var(--cp-suggest-btn)",
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
                borderRadius:4,
                border:"none",
                cursor:"pointer",
                background:"transparent",
                color:"var(--cp-text-muted)",
                fontSize:11,
                fontFamily:"inherit",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>


      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={{ ...styles.editIn, ...(isMobile ? { fontSize: 14, padding: "8px 10px" } : {}) }}
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source..."
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
            if (e.key === "Enter") { e.preventDefault(); onSave(q.id, text, source, category); }
          }}
        />
        <select
          style={{ ...styles.editSel, ...(isMobile ? { fontSize: 14, padding: "8px 26px 8px 10px" } : {}) }}
          value={category}
          onChange={e => setCategory(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onCancel(); } }}
        >
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="edit-save" style={{ ...styles.editSave, ...(isMobile ? { padding: "8px 16px", fontSize: 14, minHeight: 40 } : {}) }} onClick={() => onSave(q.id, text, source, category)}>Save</button>
        <button className="edit-cancel" style={{ ...styles.editCancel, ...(isMobile ? { padding: "8px 12px", fontSize: 14, minHeight: 40 } : {}) }} onClick={onCancel}>Cancel</button>
      </div>

    </div>
  );
}