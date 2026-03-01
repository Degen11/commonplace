import Logo from "./Logo";
import { Z } from "./styles";
import {
  List, AlignJustify, LayoutGrid,
} from "lucide-react";

export default function HeaderBar({
  quotes, filtered, topCats, customCats,
  view, compact, setView, setCompact,
  showStats, setShowStats,
  showExport, setShowExport,
  showAddMore, setShowAddMore,
  isMobile,
  setConfirmClear,
  addMoreRef,
  exportRef,
  headerRef,
  headerVisible,
  exportDropdownContent,
  getCatColor,
}) {
  return (
    <div ref={headerRef} style={Z.header}>
      <div>
        <h1 style={{ ...Z.title, display: "flex", alignItems: "center", gap: 10 }}><Logo size={28} /> Commonplace</h1>
        <p style={Z.sub}>
          {filtered.length < quotes.length
            ? <>{filtered.length} of {quotes.length} {quotes.length === 1 ? "entry" : "entries"}</>
            : <>{quotes.length} {quotes.length === 1 ? "entry" : "entries"} organized</>
          }
          {filtered.length === quotes.length && topCats.length > 0 && <span style={{ color: "#D3D3D0" }}> · </span>}
          {filtered.length === quotes.length && topCats.map(([c, n], i) => <span key={c} style={{ color: getCatColor(c, customCats).text }}>{i > 0 && <span style={{ color: "#D3D3D0" }}>, </span>}{n} {c}</span>)}
        </p>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {!isMobile && (
          <div style={Z.viewTog}>
            <button className="ui-tip ui-tip-below" data-tip="Table view" style={{ ...Z.viewBtn, ...(view === "table" && !compact ? Z.viewOn : {}) }} onClick={() => { setView("table"); setCompact(false); }}>
              <List size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below" data-tip="Compact view" style={{ ...Z.viewBtn, ...(view === "table" && compact ? Z.viewOn : {}) }} onClick={() => { setView("table"); setCompact(true); }}>
              <AlignJustify size={16} strokeWidth={1.5} />
            </button>
            <button className="ui-tip ui-tip-below" data-tip="Card view" style={{ ...Z.viewBtn, ...(view === "cards" ? Z.viewOn : {}) }} onClick={() => setView("cards")}>
              <LayoutGrid size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Collection insights" style={{ ...Z.statsBtn, ...(showStats ? Z.statsBtnActive : {}) }} onClick={() => setShowStats(s => !s)}>
          {showStats ? "Hide stats" : "Stats"}
        </button>
        <div ref={exportRef} style={{ position: "relative" }}>
          <button className="ui-tip ui-tip-below hdr-btn" data-tip="Export or share your collection" style={Z.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
          {showExport && headerVisible && exportDropdownContent}
        </div>
        <button className="ui-tip ui-tip-below hdr-btn" data-tip="Add more quotes" style={Z.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>+ Add more</button>
        <button className="ui-tip ui-tip-below hdr-btn new-batch-btn" data-tip="Clear all and start over" style={Z.startOverBtn} onClick={() => setConfirmClear(true)}>New batch</button>
      </div>
    </div>
  );
}
