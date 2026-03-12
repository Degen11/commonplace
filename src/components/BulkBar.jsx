import { styles } from "./styles";
import { X, RefreshCw, FolderPlus, FolderMinus, Trash2 } from "lucide-react";

function Divider() {
  return <div style={styles.bulkDivider} />;
}

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
  const hasCollections = collections && collections.length > 0;

  return (
    <div style={styles.bulkBar}>
      {/* ── Count badge ── */}
      <span style={styles.bulkN}>{selected.size} selected</span>

      <Divider />

      {/* ── Edit group: category + source + apply ── */}
      <div style={styles.bulkGroup}>
        <select style={styles.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}>
          <option value="">Category...</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={styles.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
        <button
          className="ui-tip bulk-apply"
          data-tip="Apply to selected"
          style={{ ...styles.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }}
          onClick={applyBulk}
          disabled={!bulkEditCat && !bulkEditSource.trim()}
        >
          Apply
        </button>
      </div>

      <Divider />

      {/* ── Actions group: re-identify + collections ── */}
      <div style={styles.bulkGroup}>
        <button
          className="ui-tip bulk-reidentify"
          data-tip="Re-identify selected with AI"
          style={{
            padding: "5px 10px", borderRadius: 6,
            border: "1px solid var(--cp-accent)",
            background: "transparent", color: "var(--cp-accent)",
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

        {hasCollections && activeCollectionId && (
          <button
            className="ui-tip"
            data-tip="Remove from this collection"
            style={{
              padding: "5px 10px", borderRadius: 6,
              border: "1px solid var(--cp-border)",
              background: "transparent", color: "var(--cp-text-secondary)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
            onClick={() => onRemoveFromCollection(activeCollectionId, [...selected])}
          >
            <FolderMinus size={12} strokeWidth={2} />
            Remove
          </button>
        )}

        {hasCollections && (
          <select
            className="ui-tip"
            data-tip="Add selected to collection"
            style={{
              padding: "5px 8px", borderRadius: 6,
              border: "1px solid var(--cp-border)",
              background: "transparent", color: "var(--cp-text)",
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
        )}
      </div>

      <Divider />

      {/* ── Destructive + dismiss ── */}
      <div style={styles.bulkGroup}>
        <button className="ui-tip bulk-del" data-tip="Delete selected" style={styles.bulkDelBtn} onClick={onDelete}>
          <Trash2 size={13} strokeWidth={2} />
        </button>
        <button className="ui-tip" data-tip="Clear selection" style={styles.bulkX} onClick={() => setSelected(new Set())}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
