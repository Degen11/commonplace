import { smartSplit } from "../utils/helpers";
import { Z } from "./styles";

export default function AddMorePanel({
  addMoreInput, setAddMoreInput,
  addMoreFormatting, setAddMoreFormatting,
  addMoreRef,
  onAddMore,
  onCancel,
}) {
  return (
    <>
      <textarea ref={addMoreRef} style={{ ...Z.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
        placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <label className="ui-tip ui-tip-below" data-tip="Normalize quotes, dashes, and whitespace" style={Z.fmtToggleWrap} onClick={() => setAddMoreFormatting(p => !p)}>
            <div style={{ ...Z.fmtToggleTrack, background: addMoreFormatting ? "#1A1814" : "#E0DCD4" }}>
              <div style={{ ...Z.fmtToggleThumb, left: addMoreFormatting ? 15 : 2 }} />
            </div>
            Clean up formatting
          </label>
          <span style={{ fontSize: 12, color: "#9B9A97" }}>
            {addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={Z.editCancel} onClick={onCancel}>Cancel</button>
          <button style={{ ...Z.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={onAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
        </div>
      </div>
    </>
  );
}
