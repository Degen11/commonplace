import { Z } from "./styles";
import { X } from "lucide-react";

export default function BulkBar({
  selected, setSelected,
  bulkEditCat, setBulkEditCat,
  bulkEditSource, setBulkEditSource,
  allCats,
  applyBulk,
  onDelete,
}) {
  return (
    <div style={Z.bulkBar}>
      <span style={Z.bulkN}>{selected.size} selected</span>
      <div style={Z.bulkF}>
        <select style={Z.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input style={Z.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
        <button className="ui-tip" data-tip="Apply to selected" style={{ ...Z.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
        <button className="ui-tip" data-tip="Delete selected entries" style={Z.bulkDelBtn} onClick={onDelete}>Delete</button>
        <button className="ui-tip" data-tip="Clear selection" style={Z.bulkX} onClick={() => setSelected(new Set())}><X size={14} strokeWidth={2} /></button>
      </div>
    </div>
  );
}
