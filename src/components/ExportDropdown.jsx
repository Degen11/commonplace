import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  ClipboardCopy, Sparkles, Link, Globe, FileText, Table2, FileDown, Braces,
  TriangleAlert, Loader, Layers,
} from "lucide-react";
import {
  exportCSV, exportMD, exportJSON, exportTXT, exportAnki,
  copyToClipboard, richCopyToClipboard, encodeShareData,
} from "../utils/export";
import { styles, CLR_EMERALD } from "./styles";
import { pluralize } from "../utils/helpers";
import { publicShareUrl, canNativeShare, nativeShare, copyWithToast } from "../utils/shareLinks";
import { SHARE_URL_WARN_LENGTH, SHARE_URL_MAX_LENGTH } from "../config";
import { apiRequest } from "../utils/api";

const SHARE_TITLE = "Quotes from my Commonplace";

const menuPopupStyle = {
  background: "var(--cp-bg-card)",
  borderRadius: 6,
  boxShadow: "var(--cp-shadow-md)",
  border: "1px solid var(--cp-border)",
  minWidth: 200,
  padding: 4,
  animation: "slideD .15s ease",
  maxHeight: "70vh",
  overflowY: "auto",
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  padding: "8px 12px",
  fontSize: 12,
  color: "var(--cp-text-secondary)",
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
  lineHeight: 1,
};

export default function ExportDropdown({
  quotes, filtered, selected, hasActiveFilters,
  showToast, open, onOpenChange, collections,
  triggerStyle, triggerClassName, triggerTip,
}) {
  const [publishing, setPublishing] = useState(false);

  const close = () => onOpenChange(false);

  const handleShare = () => {
    const encoded = encodeShareData(quotes);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;

    if (url.length > SHARE_URL_MAX_LENGTH) {
      showToast(`Link is too long for most browsers (${url.length} chars, ${pluralize(quotes.length, "quote")}). Export a file instead.`, null, null, "error");
      close();
      return;
    }

    if (url.length > SHARE_URL_WARN_LENGTH) {
      showToast(`Link copied but may not work in older browsers (${pluralize(quotes.length, "quote")}, ${url.length} chars). Consider exporting instead.`, null, null, "error");
    }

    close();
    const copyLink = () => navigator.clipboard.writeText(url).then(() => {
      if (url.length <= SHARE_URL_WARN_LENGTH) showToast("Shareable link copied to clipboard!", null, null, "success");
    }).catch(() => {
      showToast("Couldn't copy the link to your clipboard.", "Retry", handleShare, "error");
    });
    if (canNativeShare({ url })) {
      nativeShare({ title: SHARE_TITLE, url }).catch(copyLink);
      return;
    }
    copyLink();
  };

  const handlePublicLink = () => {
    if (publishing) return;
    setPublishing(true);
    const toastId = showToast("Creating share link\u2026", null, null, "loading");
    const minimal = quotes.map(q => [q.text || "", q.source || "", q.category || "", q.favorite ? 1 : 0]);

    apiRequest("/api/share", { body: { quotes: minimal } })
      .then(data => {
        const url = publicShareUrl(data.id);
        const copyLink = () => navigator.clipboard.writeText(url)
          .then(() => showToast(`Public link copied! Expires in 30 days (${pluralize(data.count, "quote")}).`, null, null, "success", { id: toastId }))
          .catch(() => showToast(`Public link created: ${url}`, null, null, "success", { id: toastId }));
        close();
        if (!canNativeShare({ url })) return copyLink();
        // A cancelled sheet still falls back to copying, so the link isn't lost
        nativeShare({ title: SHARE_TITLE, url })
          .then(result => result === "shared"
            ? showToast(`Public link shared! Expires in 30 days (${pluralize(data.count, "quote")}).`, null, null, "success", { id: toastId })
            : copyLink())
          .catch(copyLink);
      })
      .catch(err => {
        const msg = err.name === "TimeoutError"
          ? "Request timed out \u2014 couldn't create public link."
          : (err.message || "Couldn't create public link.");
        showToast(msg, "Retry", handlePublicLink, "error", { id: toastId });
      })
      .finally(() => {
        setPublishing(false);
      });
  };

  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      <Menu.Trigger
        className={triggerClassName}
        {...(triggerTip ? { "data-tip": triggerTip } : {})}
        style={triggerStyle}
      >
        Export &darr;
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} style={{ zIndex: 100 }}>
          <Menu.Popup style={menuPopupStyle}>
            <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "var(--cp-text-muted)", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
              Exporting all {pluralize(quotes.length, "quote")}
            </div>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { copyWithToast(() => copyToClipboard(quotes, collections), showToast, `Copied ${pluralize(quotes.length, "quote")}`); close(); }}>
              <ClipboardCopy size={14} strokeWidth={1.5} /> Copy to clipboard
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { copyWithToast(() => richCopyToClipboard(quotes, collections), showToast, `Rich text copied (${pluralize(quotes.length, "quote")}) \u2014 paste into Notion, Notes, etc.`); close(); }}>
              <Sparkles size={14} strokeWidth={1.5} /> Rich copy
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={handleShare}>
              <Link size={14} strokeWidth={1.5} /> Shareable link
            </Menu.Item>
            {quotes.length > 80 && <span style={styles.expOptNote}><TriangleAlert size={11} strokeWidth={2} style={{verticalAlign:"middle", marginRight:3}} /> Links may break above ~80 entries — use public link instead</span>}
            <Menu.Item className="dd-opt" style={{ ...itemStyle, opacity: publishing ? 0.5 : 1 }} closeOnClick={false} disabled={publishing} onClick={handlePublicLink}>
              {publishing ? <Loader size={14} strokeWidth={1.5} className="spin" /> : <Globe size={14} strokeWidth={1.5} />} Public link{publishing ? "..." : ""}<span style={{ fontSize: 10, opacity: 0.5 }}>30 days</span>
            </Menu.Item>
            <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportTXT(quotes, collections); showToast(`Exported ${pluralize(quotes.length, "quote")} as TXT`, null, null, "success"); close(); }}>
              <FileText size={14} strokeWidth={1.5} /> Plain text
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportCSV(quotes, collections); showToast(`Exported ${pluralize(quotes.length, "quote")} as CSV`, null, null, "success"); close(); }}>
              <Table2 size={14} strokeWidth={1.5} /> CSV
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportMD(quotes, collections); showToast(`Exported ${pluralize(quotes.length, "quote")} as Markdown`, null, null, "success"); close(); }}>
              <FileDown size={14} strokeWidth={1.5} /> Markdown
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportJSON(quotes, collections); showToast(`Exported ${pluralize(quotes.length, "quote")} as JSON`, null, null, "success"); close(); }}>
              <Braces size={14} strokeWidth={1.5} /> JSON
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportAnki(quotes); showToast(`Exported ${pluralize(quotes.length, "quote")} as Anki cards`, null, null, "success"); close(); }}>
              <Layers size={14} strokeWidth={1.5} /> Anki flashcards
            </Menu.Item>
            {hasActiveFilters && (<>
              <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
              <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "var(--cp-info)", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
                Export filtered only ({pluralize(filtered.length, "quote")})
              </div>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { copyWithToast(() => copyToClipboard(filtered, collections), showToast, `Copied ${pluralize(filtered.length, "filtered quote")}`); close(); }}>
                <ClipboardCopy size={14} strokeWidth={1.5} /> Copy filtered
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportTXT(filtered, collections); showToast(`Exported ${pluralize(filtered.length, "quote")} as TXT`, null, null, "success"); close(); }}>
                <FileText size={14} strokeWidth={1.5} /> Filtered TXT
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportCSV(filtered, collections); showToast(`Exported ${pluralize(filtered.length, "quote")} as CSV`, null, null, "success"); close(); }}>
                <Table2 size={14} strokeWidth={1.5} /> Filtered CSV
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportMD(filtered, collections); showToast(`Exported ${pluralize(filtered.length, "quote")} as Markdown`, null, null, "success"); close(); }}>
                <FileDown size={14} strokeWidth={1.5} /> Filtered MD
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportAnki(filtered); showToast(`Exported ${pluralize(filtered.length, "quote")} as Anki cards`, null, null, "success"); close(); }}>
                <Layers size={14} strokeWidth={1.5} /> Filtered Anki
              </Menu.Item>
            </>)}
            {selected.size > 0 && (<>
              <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
              <div style={{ padding: "6px 12px 4px", fontSize: 11, color: CLR_EMERALD, borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
                Export selected ({pluralize(selected.size, "quote")})
              </div>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); copyWithToast(() => copyToClipboard(sel, collections), showToast, `Copied ${pluralize(sel.length, "selected quote")}`); close(); }}>
                <ClipboardCopy size={14} strokeWidth={1.5} /> Copy selected
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportCSV(sel, collections); showToast(`Exported ${pluralize(sel.length, "quote")} as CSV`, null, null, "success"); close(); }}>
                <Table2 size={14} strokeWidth={1.5} /> Selected CSV
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportMD(sel, collections); showToast(`Exported ${pluralize(sel.length, "quote")} as Markdown`, null, null, "success"); close(); }}>
                <FileDown size={14} strokeWidth={1.5} /> Selected MD
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportJSON(sel, collections); showToast(`Exported ${pluralize(sel.length, "quote")} as JSON`, null, null, "success"); close(); }}>
                {"{ }"} Selected JSON
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportAnki(sel); showToast(`Exported ${pluralize(sel.length, "quote")} as Anki cards`, null, null, "success"); close(); }}>
                <Layers size={14} strokeWidth={1.5} /> Selected Anki
              </Menu.Item>
            </>)}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
