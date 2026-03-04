import { styles } from "./styles";
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
    <div style={styles.bulkBar}>
      <span style={styles.bulkN}>{selected.size} selected</span>
      <div style={styles.bulkF}>
        <select style={styles.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input style={styles.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
        <button className="ui-tip" data-tip="Apply to selected" style={{ ...styles.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
        <button className="ui-tip" data-tip="Delete selected entries" style={styles.bulkDelBtn} onClick={onDelete}>Delete</button>
        <button className="ui-tip" data-tip="Clear selection" style={styles.bulkX} onClick={() => setSelected(new Set())}><X size={14} strokeWidth={2} /></button>
      </div>
    </div>
  );
}
