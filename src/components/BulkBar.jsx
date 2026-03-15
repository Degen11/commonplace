import { styles } from "./styles";
import { X, RefreshCw, FolderMinus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
          <option value="">Category</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input
          className="h-7 text-xs bg-[var(--cp-bulk-input-bg)] border-[var(--cp-bulk-input-border)] text-[var(--cp-bulk-text)] placeholder:text-[var(--cp-bulk-muted)] w-28"
          placeholder="Source"
          value={bulkEditSource}
          onChange={e => setBulkEditSource(e.target.value)}
        />
        <Button
          size="sm"
          className="ui-tip h-7 bg-white text-primary hover:bg-white/90"
          data-tip="Apply to selected"
          onClick={applyBulk}
          disabled={!bulkEditCat && !bulkEditSource.trim()}
        >
          Apply
        </Button>
      </div>

      <Divider />

      {/* ── Actions group: re-identify + collections ── */}
      <div style={styles.bulkGroup}>
        <Button
          variant="outline"
          size="sm"
          className="ui-tip h-7 text-xs border-[var(--cp-bulk-input-border)] text-[var(--cp-bulk-text)] bg-transparent hover:bg-white/10"
          data-tip="Re-identify selected with AI"
          onClick={onBatchReIdentify}
          disabled={isReidentifying}
        >
          <RefreshCw size={12} strokeWidth={2} className={isReidentifying ? "spin" : ""} />
          {isReidentifying ? "Re-identifying..." : "Re-identify"}
        </Button>

        {hasCollections && activeCollectionId && (
          <Button
            variant="outline"
            size="sm"
            className="ui-tip h-7 text-xs border-[var(--cp-bulk-input-border)] text-[var(--cp-bulk-text)] bg-transparent hover:bg-white/10"
            data-tip="Remove from this collection"
            onClick={() => onRemoveFromCollection(activeCollectionId, [...selected])}
          >
            <FolderMinus size={12} strokeWidth={2} />
            Remove
          </Button>
        )}

        {hasCollections && (
          <select
            className="ui-tip"
            data-tip="Add selected to collection"
            style={{
              padding: "5px 24px 5px 8px", borderRadius: 6,
              border: "1px solid var(--cp-bulk-input-border)",
              background: "var(--cp-bulk-input-bg)", color: "var(--cp-bulk-text)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap",
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

      <Divider />

      {/* ── Destructive + dismiss ── */}
      <div style={styles.bulkGroup}>
        <Button
          variant="destructive"
          size="icon"
          className="ui-tip h-7 w-7"
          data-tip="Delete selected"
          onClick={onDelete}
        >
          <Trash2 size={13} strokeWidth={2} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ui-tip h-7 w-7 text-[var(--cp-bulk-muted)] hover:text-[var(--cp-bulk-text)]"
          data-tip="Clear selection"
          onClick={() => setSelected(new Set())}
        >
          <X size={14} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
