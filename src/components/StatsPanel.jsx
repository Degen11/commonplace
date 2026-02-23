import { Z } from "./styles";
import { getCatColor, CONF_LABELS } from "../data/constants";

export default function StatsPanel({ quotes, computedStats, cc, customCats, onClose }) {
  if (!computedStats) return null;

  const uniqueSources = new Set(quotes.map(q => q.source).filter(s => s !== "Unknown")).size;
  const favCount = quotes.filter(q => q.favorite).length;
  const confCounts = { high: 0, medium: 0, low: 0 };
  quotes.forEach(q => { if (confCounts[q.confidence] !== undefined) confCounts[q.confidence]++; });
  const needsAttention = confCounts.low + quotes.filter(q => q.category === "Unknown").length;

  const kpis = [
    { value: quotes.length, label: "entries", color: "#37352F" },
    { value: uniqueSources, label: "sources", color: "#3C5775" },
    { value: computedStats.avgWords, label: "avg words", color: "#6A6660" },
    { value: favCount, label: "favorites", color: "#D97706" },
  ];

  const confColors = { high: "#16A34A", medium: "#D97706", low: "#DC2626" };

  return (
    <div style={Z.statsPanel}>
      <div style={Z.statsPanelTitle}>
        <span>Collection breakdown</span>
        <button style={Z.statsPanelClose} onClick={onClose}>✕</button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: "#fff",
            border: "1px solid #E3E2DE",
            borderRadius: 8,
            padding: "14px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, letterSpacing: -1, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#9B9A97", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={Z.statsGrid}>
        {/* Category distribution */}
        <div style={Z.statsSection}>
          <div style={Z.statsSectionTitle}>By category</div>
          {Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const pct = (count / quotes.length) * 100;
            const col = getCatColor(cat, customCats);
            return (
              <div key={cat} style={Z.statsBarRow}>
                <div style={Z.statsBarLabel}>
                  <span>{cat}</span>
                  <span style={{ color: "#9B9A97" }}>{count} <span style={{ fontSize: 10 }}>({Math.round(pct)}%)</span></span>
                </div>
                <div style={Z.statsBarTrack}>
                  <div style={{ ...Z.statsBarFill, width: `${pct}%`, background: col.text }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top sources */}
        <div style={Z.statsSection}>
          <div style={Z.statsSectionTitle}>Top sources</div>
          {computedStats.topSrcs.map(([src, count]) => (
            <div key={src} style={Z.statsBarRow}>
              <div style={Z.statsBarLabel}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{src}</span>
                <span style={{ color: "#9B9A97", flexShrink: 0 }}>{count}</span>
              </div>
              <div style={Z.statsBarTrack}>
                <div style={{ ...Z.statsBarFill, width: `${(count / quotes.length) * 100}%`, background: "#37352F" }} />
              </div>
            </div>
          ))}

          {/* Confidence breakdown replaces shortest/longest */}
          <div style={{ marginTop: 16 }}>
            <div style={Z.statsSectionTitle}>Confidence</div>
            <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", height: 8, background: "#EBEBEA", marginTop: 6, marginBottom: 8 }}>
              {["high", "medium", "low"].map(level => {
                const pct = (confCounts[level] / quotes.length) * 100;
                return pct > 0 ? (
                  <div key={level} style={{ width: `${pct}%`, background: confColors[level], transition: "width .4s ease" }} />
                ) : null;
              })}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#6A6660" }}>
              {["high", "medium", "low"].map(level => (
                <span key={level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: confColors[level], flexShrink: 0 }} />
                  {CONF_LABELS[level]} {confCounts[level]}
                </span>
              ))}
            </div>
          </div>

          {needsAttention > 0 && (
            <div style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 6,
              fontSize: 12,
              color: "#92400E",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{ fontWeight: 700 }}>{needsAttention}</span>
              {needsAttention === 1 ? "entry needs" : "entries need"} review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}