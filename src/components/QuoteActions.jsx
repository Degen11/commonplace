import { useRef, useEffect, useState } from "react";
import { Star, Copy, Check, RefreshCw, Trash2, Share2, Ellipsis, FolderPlus, FolderMinus, ChevronRight } from "lucide-react";
import { styles } from "./styles";
import { CONF_COLORS } from "../data/constants";

export function FavBtn({ q, onFav }) {
  return (
    <button
      className="act-btn ui-tip"
      data-tip={q.favorite ? "Remove from favorites" : "Add to favorites"}
      style={{ ...styles.actBtn, "--hover-color": "#F59E0B", ...(q.favorite ? { color: "#F59E0B" } : {}) }}
      onClick={e => { e.stopPropagation(); onFav(q.id); }}
    >
      <Star
        size={16}
        fill={q.favorite ? "#F59E0B" : "none"}
        color={q.favorite ? "#F59E0B" : "currentColor"}
        strokeWidth={1.5}
      />
    </button>
  );
}

export function OverflowMenu({ q, actionProps, isOpen, onToggle }) {
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const [copyAnim, setCopyAnim] = useState(false);
  const [shareAnim, setShareAnim] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  const isCopied = actionProps.copiedId === q.id;
  const isReidentifying = actionProps.reidentifying.has(q.id);
  const collections = actionProps.collections || [];

  // Reset submenu when menu closes
  useEffect(() => {
    if (!isOpen) setShowCollections(false);
  }, [isOpen]);

  return (
    <div style={styles.overflowWrap}>
      <button
        ref={btnRef}
        className="overflow-btn act-btn"
        style={{ ...styles.actBtn, "--hover-color": "var(--cp-text-secondary)" }}
        onClick={e => { e.stopPropagation(); onToggle(); }}
      >
        <Ellipsis size={16} strokeWidth={2} />
      </button>
      {isOpen && (
        <div ref={menuRef} data-overflow-menu style={styles.overflowMenu} onClick={e => e.stopPropagation()}>
          <button
            className="overflow-menu-item overflow-copy"
            style={{ ...styles.overflowMenuItem, ...(isCopied ? { color: "#059669" } : {}) }}
            onClick={() => {
              if (!isCopied) {
                setCopyAnim(true);
                setTimeout(() => setCopyAnim(false), 350);
                actionProps.onCopy(q);
              }
            }}
          >
            {isCopied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} className={copyAnim ? "copy-push" : ""} />}
            <span>{isCopied ? "Copied!" : "Copy"}</span>
          </button>
          <button
            className="overflow-menu-item overflow-reidentify"
            style={{ ...styles.overflowMenuItem, ...(isReidentifying ? { opacity: 0.5, cursor: "wait" } : {}) }}
            onClick={() => { if (!isReidentifying) actionProps.onReidentify(q); }}
            disabled={isReidentifying}
          >
            <RefreshCw size={14} strokeWidth={1.5} className={isReidentifying ? "spin" : ""} />
            <span>{isReidentifying ? "Re-identifying…" : "Re-identify"}</span>
          </button>
          <button
            className="overflow-menu-item overflow-share"
            style={styles.overflowMenuItem}
            onClick={() => {
              setShareAnim(true);
              setTimeout(() => setShareAnim(false), 350);
              actionProps.onShareImage(q);
            }}
          >
            <Share2 size={14} strokeWidth={1.5} className={shareAnim ? "share-lift" : ""} />
            <span>Share</span>
          </button>
          {collections.length > 0 && (
            <>
              <div style={styles.overflowMenuDivider} />
              {actionProps.activeCollectionId && (
                <button
                  className="overflow-menu-item"
                  style={styles.overflowMenuItem}
                  onClick={() => {
                    actionProps.onRemoveFromCollection(actionProps.activeCollectionId, [q.id]);
                    onToggle();
                  }}
                >
                  <FolderMinus size={14} strokeWidth={1.5} />
                  <span>Remove from collection</span>
                </button>
              )}
              <div style={{ position: "relative" }}>
                <button
                  className="overflow-menu-item"
                  style={{ ...styles.overflowMenuItem, justifyContent: "space-between" }}
                  onClick={() => setShowCollections(prev => !prev)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FolderPlus size={14} strokeWidth={1.5} />
                    <span>Add to collection</span>
                  </span>
                  <ChevronRight size={12} strokeWidth={2} style={{ transform: showCollections ? "rotate(90deg)" : "none", transition: "transform .12s" }} />
                </button>
                {showCollections && (
                  <div style={{ padding: "2px 4px 2px 24px" }}>
                    {collections.map(c => (
                      <button
                        key={c.id}
                        className="overflow-menu-item"
                        style={{ ...styles.overflowMenuItem, fontSize: 12, padding: "6px 10px" }}
                        onClick={() => {
                          actionProps.onAddToCollection(c.id, [q.id]);
                          onToggle();
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <div style={styles.overflowMenuDivider} />
          <button
            className="overflow-menu-item-destructive"
            style={styles.overflowMenuItemDestructive}
            onClick={() => { actionProps.onDelete(q.id); }}
          >
            <Trash2 size={14} strokeWidth={1.5} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ConfDot({ q, CONF_LABELS }) {
  return (
    <span
      className="conf-tooltip"
      data-tip={CONF_LABELS[q.confidence] || "Unknown"}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0, cursor: "help" }}
    >
      <span style={{ ...styles.confDot, background: CONF_COLORS[q.confidence] || "#D1D5DB", pointerEvents: "none" }} />
    </span>
  );
}
