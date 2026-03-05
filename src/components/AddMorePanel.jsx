import { useState } from "react";
import { smartSplit } from "../utils/textFormatting";
import { styles } from "./styles";
import { Pencil, Bot } from "lucide-react";

export default function AddMorePanel({
  addMoreInput, setAddMoreInput,
  addMoreFormatting, setAddMoreFormatting,
  addMoreRef,
  onAddMore,
  onQuickAdd,
  onCancel,
  allCats,
}) {
  const [tab, setTab] = useState("identify");
  const [quickText, setQuickText] = useState("");
  const [quickSource, setQuickSource] = useState("");
  const [quickCategory, setQuickCategory] = useState("Unknown");

  const handleQuickAdd = () => {
    if (!quickText.trim()) return;
    onQuickAdd(quickText.trim(), quickSource.trim(), quickCategory);
    setQuickText("");
    setQuickSource("");
    setQuickCategory("Unknown");
  };

  const tabStyle = (active) => ({
    flex: 1, padding: "5px 0", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
    background: active ? "var(--cp-bg-card)" : "transparent",
    color: active ? "var(--cp-text)" : "var(--cp-text-muted)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  });

  return (
    <>
      <div style={{ display: "flex", gap: 2, marginBottom: 10, background: "var(--cp-bg-tab)", borderRadius: 6, padding: 2 }}>
        <button style={tabStyle(tab === "identify")} onClick={() => setTab("identify")}>
          <Bot size={13} strokeWidth={1.5} /> Paste & identify
        </button>
        <button style={tabStyle(tab === "quick")} onClick={() => setTab("quick")}>
          <Pencil size={13} strokeWidth={1.5} /> Quick add
        </button>
      </div>

      {tab === "identify" ? (
        <>
          <textarea ref={addMoreRef} style={{ ...styles.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
            placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <label className="ui-tip ui-tip-below" data-tip="Normalize quotes, dashes, and whitespace" style={styles.fmtToggleWrap} onClick={() => setAddMoreFormatting(p => !p)}>
                <div style={{ ...styles.fmtToggleTrack, background: addMoreFormatting ? "var(--cp-text)" : "var(--cp-toggle-off)" }}>
                  <div style={{ ...styles.fmtToggleThumb, left: addMoreFormatting ? 15 : 2 }} />
                </div>
                Clean up formatting
              </label>
              <span style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                {addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
              <button style={{ ...styles.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={onAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            style={{ ...styles.textarea, minHeight: 60 }}
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            placeholder="Type or paste a single quote..."
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleQuickAdd(); }
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              style={{ ...styles.editIn, flex: 1, minWidth: 140 }}
              value={quickSource}
              onChange={e => setQuickSource(e.target.value)}
              placeholder="Source (author, film, book...)"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleQuickAdd(); } }}
            />
            <select
              style={styles.editSel}
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value)}
            >
              {allCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--cp-text-faint)" }}>
              {"\u2318"}+Enter to save
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
              <button
                style={{ ...styles.editSave, opacity: !quickText.trim() ? .4 : 1 }}
                onClick={handleQuickAdd}
                disabled={!quickText.trim()}
              >
                Add quote
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
