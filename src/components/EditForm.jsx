import { useState } from "react";
import { Z } from "./styles";

// Standalone component with its own local state.
// Previously this was defined INSIDE the parent render function,
// which caused React to treat it as a new component type on every
// keystroke → unmount/remount → only one character could be typed.
export default function EditForm({ q, allCats, onSave, onCancel, inCard }) {
  const [text, setText] = useState(q.text);
  const [source, setSource] = useState(q.source);
  const [category, setCategory] = useState(q.category);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: inCard ? 8 : 0 }}
      onClick={e => e.stopPropagation()}
    >
      <textarea
        style={{ ...Z.textarea, minHeight: 40, fontSize: 13, padding: 8 }}
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input
          style={Z.editIn}
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source..."
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
