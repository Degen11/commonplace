import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import clsx from "clsx";
import { Star, Copy, Check, RefreshCw, Trash2, Share2, Ellipsis, FolderPlus, FolderMinus, ChevronRight } from "lucide-react";
import { styles, CLR_EMERALD } from "./styles";

export function FavBtn({ q, onFav }) {
  const [animating, setAnimating] = useState(false);
  const handleClick = (e) => {
    e.stopPropagation();
    setAnimating(true);
    onFav(q.id);
    setTimeout(() => setAnimating(false), 450);
  };

  return (
    <button
      className="act-btn ui-tip"
      data-tip={q.favorite ? "Remove from favorites" : "Add to favorites"}
      style={{ ...styles.actBtn, "--hover-color": "#F59E0B", ...(q.favorite ? { color: "#F59E0B" } : {}) }}
      onClick={handleClick}
    >
      <Star
        size={16}
        fill={q.favorite ? "#F59E0B" : "none"}
        color={q.favorite ? "#F59E0B" : "currentColor"}
        strokeWidth={1.5}
        className={clsx({ "fav-pop": animating })}
      />
    </button>
  );
}

export function OverflowMenu({ q, actionProps, isOpen, onToggle }) {
  const [copyAnim, setCopyAnim] = useState(false);
  const [shareAnim, setShareAnim] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [localCopied, setLocalCopied] = useState(false);

  const isReidentifying = actionProps.reidentifying.has(q.id);
  const collections = actionProps.collections || [];

  const menuItemStyle = styles.overflowMenuItem;
  const menuContentStyle = {
    background: "var(--cp-bg-card)",
    borderRadius: 6,
    boxShadow: "0 4px 16px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)",
    minWidth: 172,
    zIndex: 100,
    padding: 4,
    animation: "menuIn .14s ease",
    transformOrigin: "var(--transform-origin)",
  };

  return (
    <div style={styles.overflowWrap}>
      <Menu.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (open !== isOpen) onToggle();
          if (open) setLocalCopied(false);
          if (!open) setShowCollections(false);
        }}
      >
        <Menu.Trigger
          className="overflow-btn act-btn"
          style={{ ...styles.actBtn, "--hover-color": "var(--cp-text-secondary)" }}
          onClick={e => e.stopPropagation()}
        >
          <Ellipsis size={16} strokeWidth={2} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
            <Menu.Popup style={menuContentStyle} onClick={e => e.stopPropagation()}>
              <Menu.Item
                className="overflow-menu-item overflow-copy"
                closeOnClick={false}
                style={{ ...menuItemStyle, ...(localCopied ? { color: CLR_EMERALD } : {}) }}
                onClick={() => {
                  if (!localCopied) {
                    setLocalCopied(true);
                    setCopyAnim(true);
                    setTimeout(() => setCopyAnim(false), 350);
                    setTimeout(() => setLocalCopied(false), 2000);
                    actionProps.onCopy(q);
                  }
                }}
              >
                {localCopied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} className={clsx({ "copy-push": copyAnim })} />}
                <span>{localCopied ? "Copied!" : "Copy"}</span>
              </Menu.Item>
              <Menu.Item
                className="overflow-menu-item overflow-reidentify"
                style={{ ...menuItemStyle, ...(isReidentifying ? { opacity: 0.5, cursor: "wait" } : {}) }}
                disabled={isReidentifying}
                onClick={() => { if (!isReidentifying) actionProps.onReidentify(q); }}
              >
                <RefreshCw size={14} strokeWidth={1.5} className={clsx({ spin: isReidentifying })} />
                <span>{isReidentifying ? "Re-identifying…" : "Re-identify"}</span>
              </Menu.Item>
              <Menu.Item
                className="overflow-menu-item overflow-share"
                closeOnClick={false}
                style={menuItemStyle}
                onClick={() => {
                  setShareAnim(true);
                  setTimeout(() => setShareAnim(false), 350);
                  actionProps.onShareImage(q);
                }}
              >
                <Share2 size={14} strokeWidth={1.5} className={clsx({ "share-lift": shareAnim })} />
                <span>Share</span>
              </Menu.Item>
              {collections.length > 0 && (
                <>
                  <Menu.Separator style={styles.overflowMenuDivider} />
                  {actionProps.activeCollectionId && (
                    <Menu.Item
                      className="overflow-menu-item"
                      style={menuItemStyle}
                      onClick={() => {
                        actionProps.onRemoveFromCollection(actionProps.activeCollectionId, [q.id]);
                      }}
                    >
                      <FolderMinus size={14} strokeWidth={1.5} />
                      <span>Remove from collection</span>
                    </Menu.Item>
                  )}
                  <div style={{ position: "relative" }}>
                    <button
                      className="overflow-menu-item"
                      style={{ ...menuItemStyle, justifyContent: "space-between", background: "none", border: "none", width: "100%", fontFamily: "inherit" }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCollections(prev => !prev); }}
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
                          <Menu.Item
                            key={c.id}
                            className="overflow-menu-item"
                            style={{ ...menuItemStyle, fontSize: 12, padding: "6px 10px" }}
                            onClick={() => {
                              actionProps.onAddToCollection(c.id, [q.id]);
                            }}
                          >
                            {c.name}
                          </Menu.Item>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              <Menu.Separator style={styles.overflowMenuDivider} />
              <Menu.Item
                className="overflow-menu-item-destructive"
                style={styles.overflowMenuItemDestructive}
                onClick={() => { actionProps.onDelete(q.id); }}
              >
                <Trash2 size={14} strokeWidth={1.5} />
                <span>Delete</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
