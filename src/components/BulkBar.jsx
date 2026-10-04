import { useState } from "react";
import clsx from "clsx";
import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { styles } from "./styles";
import { sourceInputProps } from "./InlineEditors";
import { Z } from "../data/constants";
import { X, RefreshCw, FolderMinus, FolderPlus, Folder, Trash2, Star, Copy, Tag, PenLine, ChevronDown } from "lucide-react";
import { useResultsContext } from "../contexts/ResultsContext";

function Divider() {
  return <div aria-hidden="true" style={styles.bulkDivider} />;
}

// Bulk actions grouped by job: change fields (category, source, collection),
// quick actions (favorite, copy, re-identify), then Delete on its own. Every
// control is the same ghost button; the field changes open small menus so no
// half-filled input sits in the bar.
export default function BulkBar({ onDelete, onBatchReIdentify }) {
  const {
    selected, setSelected,
    allCats, applyBulk,
    reidentifyingIds,
    onFav,
    collections, activeCollectionId, isMobile,
    onAddToCollection, onRemoveFromCollection,
    onBulkCopy,
  } = useResultsContext();
  const [catOpen, setCatOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [srcOpen, setSrcOpen] = useState(false);
  const [srcDraft, setSrcDraft] = useState("");
  const isReidentifying = reidentifyingIds.size > 0;
  const hasCollections = collections && collections.length > 0;
  const iconSize = 14;

  const applySource = () => {
    if (!srcDraft.trim()) return;
    applyBulk({ source: srcDraft });
    setSrcDraft("");
    setSrcOpen(false);
  };

  const popupPositioner = { side: "top", align: "start", sideOffset: 8, style: { zIndex: Z.BULK_BAR + 1 } };

  return (
    <div className={clsx({ "bulk-bar-mobile": isMobile })} style={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
      {/* ── Count + clear ── */}
      <span style={styles.bulkN}><strong style={styles.bulkNCount}>{selected.size}</strong> selected</span>
      {!isMobile && (
        <button className="bulk-btn" style={styles.bulkClear} onClick={() => setSelected(new Set())}>Clear</button>
      )}

      {!isMobile && <Divider />}

      {/* ── Change fields ── */}
      <Menu.Root open={catOpen} onOpenChange={setCatOpen}>
        <Menu.Trigger className="bulk-btn" style={styles.bulkBtn}>
          <Tag size={iconSize} strokeWidth={1.75} /> Category <ChevronDown size={12} strokeWidth={2} style={{ opacity: .5 }} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner {...popupPositioner}>
            <Menu.Popup style={styles.bulkMenu}>
              {allCats.map(c => (
                <Menu.Item key={c} className="dd-opt" style={styles.sortOpt} onClick={() => applyBulk({ category: c })}>{c}</Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {!isMobile && (
        <Popover.Root open={srcOpen} onOpenChange={setSrcOpen}>
          <Popover.Trigger className="bulk-btn" style={styles.bulkBtn}>
            <PenLine size={iconSize} strokeWidth={1.75} /> Source
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner {...popupPositioner}>
              <Popover.Popup style={{ ...styles.bulkMenu, padding: 8, display: "flex", gap: 6, width: 280 }}>
                <input
                  autoFocus
                  {...sourceInputProps}
                  enterKeyHint="done"
                  aria-label="Source for selected quotes"
                  placeholder="Author, book, film…"
                  value={srcDraft}
                  onChange={e => setSrcDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") applySource(); }}
                  style={styles.bulkSrcIn}
                />
                <button className="bulk-apply" style={{ ...styles.editSave, borderRadius: 4, opacity: srcDraft.trim() ? 1 : .4 }} disabled={!srcDraft.trim()} onClick={applySource}>Apply</button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}

      {!isMobile && hasCollections && (
        <Menu.Root open={colOpen} onOpenChange={setColOpen}>
          <Menu.Trigger className="bulk-btn" style={styles.bulkBtn}>
            <Folder size={iconSize} strokeWidth={1.75} /> Collection <ChevronDown size={12} strokeWidth={2} style={{ opacity: .5 }} />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner {...popupPositioner}>
              <Menu.Popup style={styles.bulkMenu}>
                {collections.map(c => (
                  <Menu.Item key={c.id} className="dd-opt" style={{ ...styles.sortOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => onAddToCollection(c.id, [...selected])}>
                    <FolderPlus size={13} strokeWidth={1.5} style={{ opacity: .6, flexShrink: 0 }} />{c.name}
                  </Menu.Item>
                ))}
                {activeCollectionId && (
                  <>
                    <div style={styles.overflowMenuDivider} />
                    <Menu.Item className="dd-opt" style={{ ...styles.sortOpt, display: "flex", alignItems: "center", gap: 8 }} onClick={() => onRemoveFromCollection(activeCollectionId, [...selected])}>
                      <FolderMinus size={13} strokeWidth={1.5} style={{ opacity: .6, flexShrink: 0 }} />Remove from this collection
                    </Menu.Item>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}

      {!isMobile && <Divider />}

      {/* ── Quick actions ── */}
      <button className="bulk-btn" aria-label={isMobile ? "Toggle favorite on selected" : undefined} style={styles.bulkBtn} onClick={() => { for (const id of selected) onFav(id); }}>
        <Star size={iconSize} strokeWidth={1.75} />{!isMobile && " Favorite"}
      </button>
      {!isMobile && (
        <>
          <button className="bulk-btn" style={styles.bulkBtn} onClick={onBulkCopy}>
            <Copy size={iconSize} strokeWidth={1.75} /> Copy
          </button>
          <button className="bulk-btn" style={{ ...styles.bulkBtn, opacity: isReidentifying ? 0.5 : 1 }} onClick={onBatchReIdentify} disabled={isReidentifying}>
            <RefreshCw size={iconSize} strokeWidth={1.75} className={clsx({ spin: isReidentifying })} />
            {isReidentifying ? " Re-identifying…" : " Re-identify"}
          </button>
        </>
      )}

      {!isMobile && <Divider />}

      {/* ── Destructive ── */}
      <button className="bulk-btn bulk-del" aria-label={isMobile ? "Delete selected" : undefined} style={styles.bulkDelBtn} onClick={onDelete}>
        <Trash2 size={iconSize} strokeWidth={1.75} />{!isMobile && " Delete"}
      </button>
      {isMobile && (
        <button className="bulk-btn" aria-label="Clear selection" style={styles.bulkBtn} onClick={() => setSelected(new Set())}>
          <X size={iconSize} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
