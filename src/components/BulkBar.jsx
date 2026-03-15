import { styles } from "./styles";
import { X, RefreshCw, FolderMinus, Trash2 } from "lucide-react";
import Tooltip from "./Tooltip";

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

  // Shared inline button style for dark-bg context
  const btnBase = {
    padding: "5px 10px", borderRadius: 6,
    border: "1px solid var(--cp-bulk-input-border)",
    background: "transparent", color: "var(--cp-bulk-text)",
    fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 4,
    whiteSpace: "nowrap",
  };

  return (
    <div style={styles.bulkBar}>
      {/* ── Count badge ── */}
      <span style={styles.bulkN}>{selected.size} selected</span>

      <Divider />

      {/* ── Edit group: category + source + apply ── */}
      <div style={styles.bulkGroup}>
        <select style={styles.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}>
          <option value="">Category</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={styles.bulkIn} placeholder="Source" value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
        <Tooltip tip="Apply to selected" placement="top">
          <button
            className="bulk-apply"
            style={{ ...styles.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }}
            onClick={applyBulk}
            disabled={!bulkEditCat && !bulkEditSource.trim()}
          >
            Apply
          </button>
        </Tooltip>
      </div>

      <Divider />

      {/* ── Actions group: re-identify + collections ── */}
      <div style={styles.bulkGroup}>
        <Tooltip tip="Re-identify selected with AI" placement="top">
          <button
            className="bulk-reidentify"
            style={{ ...btnBase, opacity: isReidentifying ? 0.5 : 1 }}
            onClick={onBatchReIdentify}
            disabled={isReidentifying}
          >
            <RefreshCw size={12} strokeWidth={2} className={isReidentifying ? "spin" : ""} />
            {isReidentifying ? "Re-identifying..." : "Re-identify"}
          </button>
        </Tooltip>

        {hasCollections && activeCollectionId && (
          <Tooltip tip="Remove from this collection" placement="top">
            <button
              style={btnBase}
              onClick={() => onRemoveFromCollection(activeCollectionId, [...selected])}
            >
              <FolderMinus size={12} strokeWidth={2} />
              Remove
            </button>
          </Tooltip>
        )}

        {hasCollections && (
          <Tooltip tip="Add selected to collection" placement="top">
            <select
              style={{
                ...btnBase, padding: "5px 24px 5px 8px",
                background: "var(--cp-bulk-input-bg)",
              }}
              value=""
              onChange={e => {
                if (e.target.value) {
                  onAddToCollection(e.target.value, [...selected]);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Add to collection</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Tooltip>
        )}
      </div>

      <Divider />

      {/* ── Destructive + dismiss ── */}
      <div style={styles.bulkGroup}>
        <Tooltip tip="Delete selected" placement="top">
          <button className="bulk-del" style={styles.bulkDelBtn} onClick={onDelete}>
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </Tooltip>
        <Tooltip tip="Clear selection" placement="top">
          <button style={styles.bulkX} onClick={() => setSelected(new Set())}>
            <X size={14} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
