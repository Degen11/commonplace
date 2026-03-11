import { styles } from "./styles";
import { X } from "lucide-react";

export default function ToolbarSection({
  catFilter, setCatFilter,
  favFilter, setFavFilter,
  favCount,
  allCats, customCats, cc, quotes,
  showNewCat, setShowNewCat,
  newCatName, setNewCatName,
  addCat, remCat,
  toolbarRef,
  catScrollRef, updateCatFade, catFade,
  getCatColor,
}) {
  return (
    <>
      <div ref={toolbarRef} style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--cp-bg)", borderBottom: "1px solid var(--cp-border)" }}>
        <div className="cat-scroll" ref={catScrollRef} onScroll={updateCatFade}
          style={{ ...styles.cats, position: "static", top: "auto", zIndex: "auto", borderBottom: "none" }}>
          <button className="cat-pill" onClick={() => setCatFilter("All")} style={{ ...styles.catPill, ...(catFilter === "All" && !favFilter ? styles.catOn : {}) }}>All</button>
          {favCount > 0 && (
            <button className="cat-pill" onClick={() => setFavFilter(!favFilter)} style={{ ...styles.catPill, ...(favFilter ? { background: "rgba(217,119,6,0.14)", color: "#D97706", borderColor: "rgba(217,119,6,0.25)" } : {}) }}>
              ★ Favorites <span style={{ opacity: .5, fontSize: 11, marginLeft: 2 }}>{favCount}</span>
            </button>
          )}
          {allCats.filter(c => cc[c] || customCats.includes(c)).map(c => {
            const col = getCatColor(c, customCats); const on = catFilter === c;
            const count = cc[c];
            const attCount = quotes.filter(q => q.category === c && (q.confidence === "low" || q.category === "Unknown")).length;
            return <button key={c} className="cat-pill" onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...styles.catPill, ...(on ? { background: col.bg, color: col.text, borderColor: col.bg } : {}), ...(!count ? { opacity: .6 } : {}), position: "relative" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}
              {count ? <span style={{ opacity: .5, fontSize: 11 }}>{count}</span> : <span style={{ opacity: .4, fontSize: 10 }}>0</span>}
              {attCount > 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EA580C", position: "absolute", top: 2, right: 2 }} />}
              {customCats.includes(c) && <span title="Remove category" style={{ opacity: .4, cursor: "pointer", display: "inline-flex" }} onClick={e => { e.stopPropagation(); remCat(c); }}><X size={10} strokeWidth={2} /></span>}
            </button>;
          })}
          {showNewCat ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
              <input style={styles.newCatIn} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Name" autoFocus onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); } }} />
              <button style={styles.newCatSv} onClick={addCat}>Add</button>
            </div>
          ) : <button title="Add custom category" style={styles.addCatBtn} onClick={() => setShowNewCat(true)}>+</button>}
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 24, background: "linear-gradient(to right, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.left ? 1 : 0, transition: "opacity .15s" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 24, background: "linear-gradient(to left, var(--cp-bg), transparent)", pointerEvents: "none", zIndex: 51, opacity: catFade.right ? 1 : 0, transition: "opacity .15s" }} />
      </div>
    </>
  );
}
