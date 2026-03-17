import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  ClipboardCopy, Sparkles, Link, Globe, FileText, Table2, FileDown, Braces,
  AlertTriangle, Loader,
} from "lucide-react";
import {
  exportCSV, exportMD, exportJSON, exportTXT,
  copyToClipboard, richCopyToClipboard, encodeShareData,
} from "../utils/export";
import { styles } from "./styles";
import { SHARE_URL_WARN_LENGTH, SHARE_URL_MAX_LENGTH, API_TIMEOUT_MS } from "../config";

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
      showToast(`Link is too long for most browsers (${url.length} chars, ${quotes.length} entries). Export a file instead.`, null, null, "error");
      close();
      return;
    }

    if (url.length > SHARE_URL_WARN_LENGTH) {
      showToast(`Link copied but may not work in older browsers (${quotes.length} entries, ${url.length} chars). Consider exporting instead.`, null, null, "error");
    }

    close();
    navigator.clipboard.writeText(url).then(() => {
      if (url.length <= SHARE_URL_WARN_LENGTH) showToast("Shareable link copied to clipboard!", null, null, "success");
    }).catch(() => {
      showToast("Couldn't copy \u2014 try manually copying from the address bar.", null, null, "error");
      window.location.hash = `s=${encoded}`;
    });
  };

  const handlePublicLink = () => {
    if (publishing) return;
    setPublishing(true);
    const minimal = quotes.map(q => [q.text || "", q.source || "", q.category || "", q.favorite ? 1 : 0]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
      body: JSON.stringify({ quotes: minimal }),
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error || "Failed"); });
        return r.json();
      })
      .then(data => {
        const url = `${window.location.origin}${window.location.pathname}#p=${data.id}`;
        navigator.clipboard.writeText(url)
          .then(() => showToast(`Public link copied! Expires in 30 days (${data.count} entries).`, null, null, "success"))
          .catch(() => showToast(`Public link created: ${url}`, null, null, "success"));
        close();
      })
      .catch(err => {
        if (err.name === "AbortError") {
          showToast("Request timed out \u2014 try again.", null, null, "error");
        } else {
          showToast(err.message || "Couldn't create public link.", null, null, "error");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
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
              Exporting all {quotes.length} {quotes.length === 1 ? "entry" : "entries"}
            </div>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { copyToClipboard(quotes, collections).then(() => showToast("Copied to clipboard!", null, null, "success")); close(); }}>
              <ClipboardCopy size={14} strokeWidth={1.5} /> Copy to clipboard
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { richCopyToClipboard(quotes, collections).then(() => showToast("Rich text copied \u2014 paste into Notion, Notes, etc.", null, null, "success")); close(); }}>
              <Sparkles size={14} strokeWidth={1.5} /> Rich copy
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={handleShare}>
              <Link size={14} strokeWidth={1.5} /> Shareable link
            </Menu.Item>
            {quotes.length > 80 && <span style={styles.expOptNote}><AlertTriangle size={11} strokeWidth={2} style={{verticalAlign:"middle", marginRight:3}} /> Links may break above ~80 entries — use public link instead</span>}
            <Menu.Item className="dd-opt" style={{ ...itemStyle, opacity: publishing ? 0.5 : 1 }} closeOnClick={false} disabled={publishing} onClick={handlePublicLink}>
              {publishing ? <Loader size={14} strokeWidth={1.5} className="spin" /> : <Globe size={14} strokeWidth={1.5} />} Public link{publishing ? "..." : ""}<span style={{ fontSize: 10, opacity: 0.5 }}>30 days</span>
            </Menu.Item>
            <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportTXT(quotes, collections); showToast("Exported as TXT", null, null, "success"); close(); }}>
              <FileText size={14} strokeWidth={1.5} /> Plain text
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportCSV(quotes, collections); showToast("Exported as CSV", null, null, "success"); close(); }}>
              <Table2 size={14} strokeWidth={1.5} /> CSV
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportMD(quotes, collections); showToast("Exported as Markdown", null, null, "success"); close(); }}>
              <FileDown size={14} strokeWidth={1.5} /> Markdown
            </Menu.Item>
            <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportJSON(quotes, collections); showToast("Exported as JSON", null, null, "success"); close(); }}>
              <Braces size={14} strokeWidth={1.5} /> JSON
            </Menu.Item>
            {hasActiveFilters && (<>
              <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
              <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#2383E2", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
                Export filtered only ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
              </div>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { copyToClipboard(filtered, collections).then(() => showToast(`Copied ${filtered.length} filtered entries`, null, null, "success")); close(); }}>
                <ClipboardCopy size={14} strokeWidth={1.5} /> Copy filtered
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportTXT(filtered, collections); showToast(`Exported ${filtered.length} as TXT`, null, null, "success"); close(); }}>
                <FileText size={14} strokeWidth={1.5} /> Filtered TXT
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportCSV(filtered, collections); showToast(`Exported ${filtered.length} as CSV`, null, null, "success"); close(); }}>
                <Table2 size={14} strokeWidth={1.5} /> Filtered CSV
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { exportMD(filtered, collections); showToast(`Exported ${filtered.length} as Markdown`, null, null, "success"); close(); }}>
                <FileDown size={14} strokeWidth={1.5} /> Filtered MD
              </Menu.Item>
            </>)}
            {selected.size > 0 && (<>
              <Menu.Separator style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
              <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#059669", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
                Export selected ({selected.size} {selected.size === 1 ? "entry" : "entries"})
              </div>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); copyToClipboard(sel, collections).then(() => showToast(`Copied ${sel.length} selected entries`, null, null, "success")); close(); }}>
                <ClipboardCopy size={14} strokeWidth={1.5} /> Copy selected
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportCSV(sel, collections); showToast(`Exported ${sel.length} as CSV`, null, null, "success"); close(); }}>
                <Table2 size={14} strokeWidth={1.5} /> Selected CSV
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportMD(sel, collections); showToast(`Exported ${sel.length} as Markdown`, null, null, "success"); close(); }}>
                <FileDown size={14} strokeWidth={1.5} /> Selected MD
              </Menu.Item>
              <Menu.Item className="dd-opt" style={itemStyle} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportJSON(sel, collections); showToast(`Exported ${sel.length} as JSON`, null, null, "success"); close(); }}>
                {"{ }"} Selected JSON
              </Menu.Item>
            </>)}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
