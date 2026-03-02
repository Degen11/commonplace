import { Search, X } from "lucide-react";
import { getCatColor } from "../data/constants";
import { Z } from "./styles";

export default function EmptyState({
  catFilter, setCatFilter,
  favFilter, setFavFilter,
  search, setSearch,
  setSortBy,
  customCats,
}) {
  return (
    <div style={{ ...Z.empty, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Search size={48} color="#D4D4D0" strokeWidth={1.5} style={{ marginBottom: 16 }} />
      <p style={{ fontSize: 14, fontWeight: 500, color: "#6A6660", marginBottom: 8 }}>
        No results found
      </p>
      <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 16 }}>
        Try removing a filter to see more entries
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
        {catFilter !== "All" && (
          <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid #E3E2DE", background: "#fff", fontSize: 12, color: getCatColor(catFilter, customCats).text, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            onClick={() => setCatFilter("All")}>{catFilter} <X size={10} strokeWidth={2} /></button>
        )}
        {search && (
          <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid #E3E2DE", background: "#fff", fontSize: 12, color: "#37352F", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            onClick={() => setSearch("")}>"{search}" <X size={10} strokeWidth={2} /></button>
        )}
        {favFilter && (
          <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 50, border: "1px solid #FDE68A", background: "#FEF3C7", fontSize: 12, color: "#D97706", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            onClick={() => setFavFilter(false)}>&star; Favorites <X size={10} strokeWidth={2} /></button>
        )}
      </div>
      <button style={{
        background: "#F0F0EE", border: "none", color: "#6A6660", cursor: "pointer",
        fontSize: 13, fontFamily: "inherit", fontWeight: 500, padding: "8px 20px",
        borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 6,
      }}
        onClick={() => { setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default"); }}>Reset all filters</button>
    </div>
  );
}
