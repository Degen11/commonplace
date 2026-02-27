import { useState, useRef, useEffect } from "react";

const TAG_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: "1px 7px",
  borderRadius: 3,
  fontSize: 11,
  fontWeight: 500,
  background: "#F0EDE6",
  color: "#6A6660",
  whiteSpace: "nowrap",
  lineHeight: "18px",
};

const TAG_REMOVE = {
  background: "none",
  border: "none",
  color: "#9B9A97",
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  fontFamily: "inherit",
};

const ADD_BTN = {
  background: "none",
  border: "1px dashed #D3D3D0",
  borderRadius: 3,
  color: "#9B9A97",
  cursor: "pointer",
  fontSize: 11,
  padding: "1px 6px",
  lineHeight: "18px",
  fontFamily: "inherit",
};

const INPUT_STYLE = {
  border: "1px solid #D3D3D0",
  borderRadius: 3,
  padding: "1px 6px",
  fontSize: 11,
  fontFamily: "inherit",
  color: "#37352F",
  width: 80,
  lineHeight: "18px",
  background: "#fff",
  outline: "none",
};

export default function TagInput({ tags = [], onChange, allTags = [] }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/[,;]/g, "");
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
      {tags.map(tag => (
        <span key={tag} style={TAG_STYLE}>
          {tag}
          <button style={TAG_REMOVE} onClick={(e) => { e.stopPropagation(); removeTag(tag); }} title="Remove tag">&times;</button>
        </span>
      ))}
      {editing ? (
        <input
          ref={inputRef}
          style={INPUT_STYLE}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              e.stopPropagation();
              if (input.trim()) addTag(input);
            }
            if (e.key === "Backspace" && !input && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
              setInput("");
            }
          }}
          onBlur={() => {
            if (input.trim()) addTag(input);
            setEditing(false);
          }}
          placeholder="tag..."
          onClick={e => e.stopPropagation()}
          list="tag-sugg"
        />
      ) : (
        <button
          style={ADD_BTN}
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="Add tag"
        >
          + tag
        </button>
      )}
      {allTags.length > 0 && (
        <datalist id="tag-sugg">
          {allTags.filter(t => !tags.includes(t)).slice(0, 8).map(s => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  );
}

// Lightweight read-only display for table rows
export function TagPills({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 2 }}>
      {tags.map(tag => (
        <span key={tag} style={{ ...TAG_STYLE, fontSize: 10, padding: "0px 5px", lineHeight: "16px" }}>
          {tag}
        </span>
      ))}
    </div>
  );
}
