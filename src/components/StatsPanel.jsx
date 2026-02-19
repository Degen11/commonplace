import { Z } from "./styles";
import { getCatColor } from "../data/constants";

export default function StatsPanel({ quotes, computedStats, cc, customCats, onClose }) {
  if (!computedStats) return null;

  return (
    <div style={Z.statsPanel}>
      <div style={Z.statsPanelTitle}>
        <span>Collection breakdown</span>
        <button style={Z.statsPanelClose} onClick={onClose}>✕</button>
      </div>
      <div style={Z.statsGrid}>
        <div style={Z.statsSection}>
          <div style={Z.statsSectionTitle}>By category</div>
          {Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
            const pct = (count / quotes.length) * 100;
            const col = getCatColor(cat, customCats);
            return (
              <div key={cat} style={Z.statsBarRow}>
                <div style={Z.statsBarLabel}>
                  <span>{cat}</span>
                  <span style={{ color: "#9B9A97" }}>{count}</span>
                </div>
                <div style={Z.statsBarTrack}>
                  <div style={{ ...Z.statsBarFill, width: `${pct}%`, background: col.text }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={Z.statsSection}>
          <div style={Z.statsSectionTitle}>Top sources</div>
          {computedStats.topSrcs.map(([src, count]) => (
            <div key={src} style={Z.statsBarRow}>
              <div style={Z.statsBarLabel}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{src}</span>
                <span style={{ color: "#9B9A97", flexShrink: 0 }}>{count}</span>
              </div>
              <div style={Z.statsBarTrack}>
                <div style={{ ...Z.statsBarFill, width: `${(count / quotes.length) * 100}%`, background: "#37352F" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
            <div>
              <div style={Z.statNumber}>{quotes.length}</div>
              <div style={Z.statNumberSub}>total entries</div>
            </div>
            <div>
              <div style={Z.statNumber}>{computedStats.avgWords}</div>
              <div style={Z.statNumberSub}>avg words</div>
            </div>
          </div>
        </div>

        {computedStats.shortest && (
          <div style={Z.statsSection}>
            <div style={Z.statsSectionTitle}>Shortest</div>
            <div style={Z.statsHighlight}>
              <div style={Z.statsHighlightLabel}>{computedStats.shortest.source}</div>
              "{computedStats.shortest.text}"
            </div>
          </div>
        )}

        {computedStats.longest && (
          <div style={Z.statsSection}>
            <div style={Z.statsSectionTitle}>Longest</div>
            <div style={Z.statsHighlight}>
              <div style={Z.statsHighlightLabel}>{computedStats.longest.source}</div>
              "{computedStats.longest.text.slice(0, 120)}{computedStats.longest.text.length > 120 ? "…" : ""}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
