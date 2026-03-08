import { useRef, useState, useEffect } from "react";
import {
  ClipboardCopy, Sparkles, Link, Globe, FileText, Table2, FileDown,
  AlertTriangle, Loader,
} from "lucide-react";
import {
  exportCSV, exportMD, exportJSON, exportTXT,
  copyToClipboard, richCopyToClipboard, encodeShareData,
} from "../utils/export";
import { styles } from "./styles";
import { SHARE_URL_WARN_LENGTH, SHARE_URL_MAX_LENGTH, API_TIMEOUT_MS } from "../config";

export default function ExportDropdown({
  quotes, filtered, selected, hasActiveFilters,
  showToast, setShowExport, collections,
}) {
  const dropRef = useRef(null);
  const [flipLeft, setFlipLeft] = useState(false);

  // Flip horizontal alignment if dropdown clips the right edge
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) setFlipLeft(true);
  }, []);

  const handleShare = () => {
    const encoded = encodeShareData(quotes);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;

    if (url.length > SHARE_URL_MAX_LENGTH) {
      showToast(`Link is too long for most browsers (${url.length} chars, ${quotes.length} entries). Export a file instead.`);
      return;
    }

    if (url.length > SHARE_URL_WARN_LENGTH) {
      showToast(`Link copied but may not work in older browsers (${quotes.length} entries, ${url.length} chars). Consider exporting instead.`);
    }

    navigator.clipboard.writeText(url).then(() => {
      if (url.length <= SHARE_URL_WARN_LENGTH) showToast("Shareable link copied to clipboard!");
    }).catch(() => {
      showToast("Couldn't copy \u2014 try manually copying from the address bar.");
      window.location.hash = `s=${encoded}`;
    });
  };

  const [publishing, setPublishing] = useState(false);

  const handlePublicLink = () => {
    if (publishing) return;
    setPublishing(true);
    const minimal = quotes.map(q => [q.text || "", q.source || "", q.category || "", q.favorite ? 1 : 0]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "1" },
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
          .then(() => showToast(`Public link copied! Expires in 30 days (${data.count} entries).`))
          .catch(() => showToast(`Public link created: ${url}`));
        setShowExport(false);
      })
      .catch(err => {
        if (err.name === "AbortError") {
          showToast("Request timed out \u2014 try again.");
        } else {
          showToast(err.message || "Couldn't create public link.");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setPublishing(false);
      });
  };

  return (
    <div ref={dropRef} style={{ ...styles.expDrop, ...(flipLeft ? { right: "auto", left: 0 } : {}) }}>
      <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "var(--cp-text-muted)", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
        Exporting all {quotes.length} {quotes.length === 1 ? "entry" : "entries"}
      </div>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy to clipboard</button>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { richCopyToClipboard(quotes).then(() => showToast("Rich text copied \u2014 paste into Notion, Notes, etc.")); setShowExport(false); }}><Sparkles size={14} strokeWidth={1.5} /> Rich copy</button>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { handleShare(); setShowExport(false); }}><Link size={14} strokeWidth={1.5} /> Shareable link</button>
      {quotes.length > 80 && <span style={styles.expOptNote}><AlertTriangle size={11} strokeWidth={2} style={{verticalAlign:"middle", marginRight:3}} /> Links may break above ~80 entries — use public link instead</span>}
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8, opacity: publishing ? 0.5 : 1}} onClick={handlePublicLink} disabled={publishing}>
        {publishing ? <Loader size={14} strokeWidth={1.5} className="spin" /> : <Globe size={14} strokeWidth={1.5} />} Public link{publishing ? "..." : ""}<span style={{ fontSize: 10, opacity: 0.5 }}>30 days</span>
      </button>
      <div style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportTXT(quotes); showToast("Exported as TXT"); setShowExport(false); }}><FileText size={14} strokeWidth={1.5} /> Plain text</button>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportCSV(quotes); showToast("Exported as CSV"); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> CSV</button>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportMD(quotes); showToast("Exported as Markdown"); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Markdown</button>
      <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportJSON(quotes, collections); showToast("Exported as JSON"); setShowExport(false); }}>{"{ }"} JSON</button>
      {hasActiveFilters && (<>
        <div style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
        <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#2383E2", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
          Export filtered only ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
        </div>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { copyToClipboard(filtered).then(() => showToast(`Copied ${filtered.length} filtered entries`)); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy filtered</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportTXT(filtered); showToast(`Exported ${filtered.length} as TXT`); setShowExport(false); }}><FileText size={14} strokeWidth={1.5} /> Filtered TXT</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportCSV(filtered); showToast(`Exported ${filtered.length} as CSV`); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> Filtered CSV</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportMD(filtered); showToast(`Exported ${filtered.length} as Markdown`); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Filtered MD</button>
      </>)}
      {selected.size > 0 && (<>
        <div style={{ height: 1, background: "var(--cp-border)", margin: "2px 0" }} />
        <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#059669", borderBottom: "1px solid var(--cp-border)", marginBottom: 2 }}>
          Export selected ({selected.size} {selected.size === 1 ? "entry" : "entries"})
        </div>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); copyToClipboard(sel).then(() => showToast(`Copied ${sel.length} selected entries`)); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy selected</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportCSV(sel); showToast(`Exported ${sel.length} as CSV`); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> Selected CSV</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportMD(sel); showToast(`Exported ${sel.length} as Markdown`); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Selected MD</button>
        <button className="dd-opt" style={{...styles.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportJSON(sel); showToast(`Exported ${sel.length} as JSON`); setShowExport(false); }}>{"{ }"} Selected JSON</button>
      </>)}
    </div>
  );
}
