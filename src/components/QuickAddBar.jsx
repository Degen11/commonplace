import { useState, useRef, useEffect } from "react";
import { similarity } from "../utils/textFormatting";
import { DUPE_SIMILARITY_THRESHOLD } from "../config";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
    <div className="bg-card border-b border-border animate-in fade-in slide-in-from-top-1 duration-250">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-2.5"
      >
        <Plus size={14} strokeWidth={2} className="text-muted-foreground shrink-0" />
        <Input
          ref={textRef}
          value={text}
          onChange={e => { setText(e.target.value); setDupeMatch(null); }}
          placeholder="Quote text…"
          className="flex-1 min-w-0 h-8 text-[13px]"
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <Input
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source (optional)"
          className="w-40 h-8 text-[13px]"
          onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim()}
        >
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground"
        >
          <X size={14} strokeWidth={2} />
        </Button>
      </form>
      {dupeMatch && (
        <div className="flex items-center gap-2 px-4 py-1.5 pb-2.5 text-xs flex-wrap"
          style={{
            color: "var(--cp-warning-text)",
            background: "var(--cp-warning-bg)",
          }}
        >
          <AlertTriangle size={13} strokeWidth={2} className="shrink-0" />
          <span className="flex-1 min-w-0">
            Similar to: "{dupeMatch.text.length > 60 ? dupeMatch.text.slice(0, 60) + "\u2026" : dupeMatch.text}"
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={doAdd}
            className="h-6 text-[11px]"
            style={{
              borderColor: "var(--cp-warning-border)",
              color: "var(--cp-warning-text)",
            }}
          >
            Add anyway
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDupeMatch(null)}
            className="h-6 text-[11px] opacity-70"
            style={{ color: "var(--cp-warning-text)" }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
