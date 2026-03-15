import { useState, useMemo, useEffect } from "react";
import { normalize } from "../utils/textFormatting";
import { smartRestore } from "../utils/smartRestore";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

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

  // Score every entry by word overlap, ignoring stop words
  let best = null; let bestScore = 0;
  for (const entry of db) {
    if (entry.t === norm) return null; // exact match — no suggestion needed
    const wa = new Set(norm.split(" ").filter(w => w.length > 2 && !STOP_WORDS.has(w)));
    const wb = new Set(entry.t.split(" ").filter(w => w.length > 2 && !STOP_WORDS.has(w)));
    if (wa.size < 2 || wb.size < 2) continue;
    let overlap = 0;
    wa.forEach(w => { if (wb.has(w)) overlap++; });
    if (overlap < 2) continue;
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

  const formatSuggestionText = (t) => smartRestore(t);

  const applySuggestion = () => {
    setText(formatSuggestionText(suggestion.t));
    setSource(suggestion.s);
    setCategory(suggestion.c);
    setDismissed(true);
  };

  return (
    <div
      className="flex flex-col gap-1.5"
      style={{ marginTop: inCard ? 8 : 0 }}
      onClick={e => e.stopPropagation()}
    >
      <Textarea
        className="min-h-[40px] text-[13px] resize-y"
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
          <div className="flex items-center gap-2 flex-wrap rounded-md text-xs"
            style={{
              padding:"6px 10px",
              background:"var(--cp-suggest-bg)",
              border:"1px solid var(--cp-suggest-border)",
              marginTop: suggestion ? 0 : -1,
            }}>
            <span className="text-muted-foreground shrink-0 inline-flex items-center gap-1">
              <Lightbulb size={13} strokeWidth={2} /> Did you mean:
            </span>
            <span className="text-secondary-foreground italic flex-1">
              {suggestion ? `"${formatSuggestionText(suggestion.t)}" — ${suggestion.s}` : ""}
            </span>
            <Button
              size="sm"
              onClick={applySuggestion}
              className="h-6 px-2.5 text-[11px]"
              style={{ background:"var(--cp-suggest-btn)" }}
            >
              Use this
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 text-muted-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 items-center flex-wrap">
        <Input
          className="flex-1 min-w-0 h-8 text-[13px]"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source..."
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
            if (e.key === "Enter") { e.preventDefault(); onSave(q.id, text, source, category); }
          }}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-auto min-w-[120px] h-8 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => onSave(q.id, text, source, category)}>Save</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
