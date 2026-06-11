import clsx from "clsx";
import { styles } from "./styles";
import { X, RefreshCw, FolderMinus, Trash2, Star, Copy } from "lucide-react";
import { useResultsContext } from "../contexts/ResultsContext";

function Divider() {
  return <div style={styles.bulkDivider} />;
}

export default function BulkBar({ onDelete, onBatchReIdentify }) {
  const {
    selected, setSelected,
    bulkEditCat, setBulkEditCat,
    bulkEditSource, setBulkEditSource,
    allCats, applyBulk,
    reidentifyingIds,
    onFav,
    collections, activeCollectionId, isMobile,
    onAddToCollection, onRemoveFromCollection,
    onBulkCopy,
  } = useResultsContext();
  const isReidentifying = reidentifyingIds.size > 0;
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
    <div className={clsx({ "bulk-bar-mobile": isMobile })} style={styles.bulkBar}>
      {/* ── Count badge ── */}
      <span style={styles.bulkN}>{selected.size} selected</span>

      {!isMobile && <Divider />}

      {/* ── Edit group: category + source + apply ── */}
      <div style={{ ...styles.bulkGroup, ...(isMobile ? { flex: "1 1 auto", minWidth: 0 } : {}) }}>
        <select style={{ ...styles.bulkSel, ...(isMobile ? { flex: 1, minWidth: 0 } : {}) }} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}>
          <option value="">Category</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {!isMobile && <input style={styles.bulkIn} placeholder="Source" value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />}
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

      {!isMobile && <Divider />}

      {/* ── Actions group: favorite + re-identify + collections ── */}
      {!isMobile && (
        <div style={styles.bulkGroup}>
          <button
            className="ui-tip bulk-fav"
            data-tip="Toggle favorite on selected"
            style={btnBase}
            onClick={() => { for (const id of selected) onFav(id); }}
          >
            <Star size={12} strokeWidth={2} />
            Favorite
          </button>
          <button
            className="ui-tip bulk-copy"
            data-tip="Copy selected to clipboard"
            style={btnBase}
            onClick={onBulkCopy}
          >
            <Copy size={12} strokeWidth={2} />
            Copy
          </button>
          <button
            className="ui-tip bulk-reidentify"
            data-tip="Re-identify selected with AI"
            style={{ ...btnBase, opacity: isReidentifying ? 0.5 : 1 }}
            onClick={onBatchReIdentify}
            disabled={isReidentifying}
          >
            <RefreshCw size={12} strokeWidth={2} className={clsx({ spin: isReidentifying })} />
            {isReidentifying ? "Re-identifying..." : "Re-identify"}
          </button>

          {hasCollections && activeCollectionId && (
            <button
              className="ui-tip"
              data-tip="Remove from this collection"
              style={btnBase}
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
                ...btnBase, ...styles.selectReset, padding: "5px 24px 5px 8px",
                backgroundColor: "var(--cp-bulk-input-bg)",
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
          )}
        </div>
      )}

      {!isMobile && <Divider />}

      {/* ── Destructive + dismiss ── */}
      <div style={{ ...styles.bulkGroup, ...(isMobile ? { marginLeft: "auto" } : {}) }}>
        {isMobile && (
          <button className="ui-tip bulk-fav" data-tip="Toggle favorite" style={{ ...styles.bulkX, minHeight: 36, minWidth: 36 }} onClick={() => { for (const id of selected) onFav(id); }}>
            <Star size={13} strokeWidth={2} />
          </button>
        )}
        <button className="ui-tip bulk-del" data-tip="Delete selected" style={{ ...styles.bulkDelBtn, minHeight: isMobile ? 36 : undefined, minWidth: isMobile ? 36 : undefined }} onClick={onDelete}>
          <Trash2 size={13} strokeWidth={2} />
        </button>
        <button className="ui-tip" data-tip="Clear selection" style={{ ...styles.bulkX, minHeight: isMobile ? 36 : undefined, minWidth: isMobile ? 36 : undefined }} onClick={() => setSelected(new Set())}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
