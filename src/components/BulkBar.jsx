import { styles, CP_ACCENT } from "./styles";
import { X, RefreshCw, FolderPlus, FolderMinus } from "lucide-react";

export default function BulkBar({
  selected, setSelected,
  bulkEditCat, setBulkEditCat,
  bulkEditSource, setBulkEditSource,
  allCats,
  applyBulk,
  onDelete,
  onBatchReIdentify,
  isReidentifying,
  collections,
  onAddToCollection,
  onRemoveFromCollection,
  activeCollectionId,
}) {
  return (
    <div style={styles.bulkBar}>
      <span style={styles.bulkN}>{selected.size} selected</span>
      <div style={styles.bulkF}>
        <select style={styles.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input style={styles.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
        <button className="ui-tip" data-tip="Apply to selected" style={{ ...styles.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
        <button
          className="ui-tip"
          data-tip="Re-identify selected with AI"
          style={{
            padding: "5px 12px", borderRadius: 6,
            border: `1px solid ${CP_ACCENT}`,
            background: "var(--cp-bg-card)", color: CP_ACCENT,
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 4,
            opacity: isReidentifying ? 0.5 : 1,
          }}
          onClick={onBatchReIdentify}
          disabled={isReidentifying}
        >
          <RefreshCw size={12} strokeWidth={2} className={isReidentifying ? "spin" : ""} />
          {isReidentifying ? "Re-identifying..." : "Re-identify"}
        </button>
        {collections && collections.length > 0 && (
          <>
            {activeCollectionId && (
              <button
                className="ui-tip"
                data-tip="Remove selected from this collection"
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  border: "1px solid var(--cp-border)",
                  background: "var(--cp-bg-card)", color: "var(--cp-text-secondary)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
                onClick={() => onRemoveFromCollection(activeCollectionId, [...selected])}
              >
                <FolderMinus size={12} strokeWidth={2} />
                Remove from collection
              </button>
            )}
            <select
              className="ui-tip"
              data-tip="Add selected to collection"
              style={{
                padding: "5px 8px", borderRadius: 6,
                border: `1px solid var(--cp-border)`,
                background: "var(--cp-bg-card)", color: "var(--cp-text)",
                fontSize: 12, fontFamily: "inherit", cursor: "pointer",
              }}
              value=""
              onChange={e => {
                if (e.target.value) {
                  onAddToCollection(e.target.value, [...selected]);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Add to collection...</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </>
        )}
        <button className="ui-tip" data-tip="Delete selected entries" style={styles.bulkDelBtn} onClick={onDelete}>Delete</button>
        <button className="ui-tip" data-tip="Clear selection" style={styles.bulkX} onClick={() => setSelected(new Set())}><X size={14} strokeWidth={2} /></button>
      </div>
    </div>
  );
}
