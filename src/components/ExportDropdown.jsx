import {
  ClipboardCopy, Sparkles, Link, FileText, Table2, FileDown,
  AlertTriangle,
} from "lucide-react";
import {
  exportCSV, exportMD, exportJSON, exportTXT,
  copyToClipboard, richCopyToClipboard, encodeShareData,
} from "../utils/helpers";
import { Z } from "./styles";

export default function ExportDropdown({
  quotes, filtered, selected, hasActiveFilters,
  showToast, setShowExport,
}) {
  const handleShare = () => {
    const encoded = encodeShareData(quotes);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    if (encoded.length > 6000) showToast(`Link may be too long for some browsers (${quotes.length} entries). Consider exporting instead.`);
    navigator.clipboard.writeText(url).then(() => {
      if (encoded.length <= 6000) showToast("Shareable link copied to clipboard!");
    }).catch(() => {
      showToast("Couldn't copy \u2014 try manually copying from the address bar.");
      window.location.hash = `s=${encoded}`;
    });
  };

  return (
    <div style={Z.expDrop}>
      <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#9B9A97", borderBottom: "1px solid #F1F1EF", marginBottom: 2 }}>
        Exporting all {quotes.length} {quotes.length === 1 ? "entry" : "entries"}
      </div>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy to clipboard</button>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { richCopyToClipboard(quotes).then(() => showToast("Rich text copied \u2014 paste into Notion, Notes, etc.")); setShowExport(false); }}><Sparkles size={14} strokeWidth={1.5} /> Rich copy</button>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { handleShare(); setShowExport(false); }}><Link size={14} strokeWidth={1.5} /> Shareable link</button>
      {quotes.length > 80 && <span style={Z.expOptNote}><AlertTriangle size={11} strokeWidth={2} style={{verticalAlign:"middle", marginRight:3}} /> Links may break above ~80 entries — export a file instead</span>}
      <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportTXT(quotes); showToast("Exported as TXT"); setShowExport(false); }}><FileText size={14} strokeWidth={1.5} /> Plain text</button>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportCSV(quotes); showToast("Exported as CSV"); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> CSV</button>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportMD(quotes); showToast("Exported as Markdown"); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Markdown</button>
      <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportJSON(quotes); showToast("Exported as JSON"); setShowExport(false); }}>{"{ }"} JSON</button>
      {hasActiveFilters && (<>
        <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
        <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#2383E2", borderBottom: "1px solid #F1F1EF", marginBottom: 2 }}>
          Export filtered only ({filtered.length} {filtered.length === 1 ? "entry" : "entries"})
        </div>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { copyToClipboard(filtered).then(() => showToast(`Copied ${filtered.length} filtered entries`)); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy filtered</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportTXT(filtered); showToast(`Exported ${filtered.length} as TXT`); setShowExport(false); }}><FileText size={14} strokeWidth={1.5} /> Filtered TXT</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportCSV(filtered); showToast(`Exported ${filtered.length} as CSV`); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> Filtered CSV</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { exportMD(filtered); showToast(`Exported ${filtered.length} as Markdown`); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Filtered MD</button>
      </>)}
      {selected.size > 0 && (<>
        <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
        <div style={{ padding: "6px 12px 4px", fontSize: 11, color: "#059669", borderBottom: "1px solid #F1F1EF", marginBottom: 2 }}>
          Export selected ({selected.size} {selected.size === 1 ? "entry" : "entries"})
        </div>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); copyToClipboard(sel).then(() => showToast(`Copied ${sel.length} selected entries`)); setShowExport(false); }}><ClipboardCopy size={14} strokeWidth={1.5} /> Copy selected</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportCSV(sel); showToast(`Exported ${sel.length} as CSV`); setShowExport(false); }}><Table2 size={14} strokeWidth={1.5} /> Selected CSV</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportMD(sel); showToast(`Exported ${sel.length} as Markdown`); setShowExport(false); }}><FileDown size={14} strokeWidth={1.5} /> Selected MD</button>
        <button className="dd-opt" style={{...Z.expOpt, display:"flex", alignItems:"center", gap:8}} onClick={() => { const sel = quotes.filter(q => selected.has(q.id)); exportJSON(sel); showToast(`Exported ${sel.length} as JSON`); setShowExport(false); }}>{"{ }"} Selected JSON</button>
      </>)}
    </div>
  );
}
