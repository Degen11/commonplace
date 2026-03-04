import { smartSplit } from "../utils/textFormatting";
import { styles } from "./styles";

export default function AddMorePanel({
  addMoreInput, setAddMoreInput,
  addMoreFormatting, setAddMoreFormatting,
  addMoreRef,
  onAddMore,
  onCancel,
}) {
  return (
    <>
      <textarea ref={addMoreRef} style={{ ...styles.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
        placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <label className="ui-tip ui-tip-below" data-tip="Normalize quotes, dashes, and whitespace" style={styles.fmtToggleWrap} onClick={() => setAddMoreFormatting(p => !p)}>
            <div style={{ ...styles.fmtToggleTrack, background: addMoreFormatting ? "#1A1814" : "#E0DCD4" }}>
              <div style={{ ...styles.fmtToggleThumb, left: addMoreFormatting ? 15 : 2 }} />
            </div>
            Clean up formatting
          </label>
          <span style={{ fontSize: 12, color: "#9B9A97" }}>
            {addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
          <button style={{ ...styles.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={onAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
        </div>
      </div>
    </>
  );
}
