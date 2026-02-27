import { Z } from "./styles";
import { getCatColor, CONF_LABELS } from "../data/constants";
import { useMemo } from "react";

// Lucide React icons - you'll need to install lucide-react
import { 
  FileText, 
  BookOpen, 
  Hash, 
  Star, 
  Tag, 
  BarChart3, 
  AlertCircle,
  X 
} from "lucide-react";

export default function StatsPanel({ quotes, computedStats, cc, customCats, onClose }) {
  // Memoize expensive computations
  const stats = useMemo(() => {
    if (!quotes.length) return null;
    
    const uniqueSources = new Set(quotes.map(q => q.source).filter(Boolean)).size;
    const favCount = quotes.filter(q => q.favorite).length;
    const confCounts = { high: 0, medium: 0, low: 0 };
    const unknownCount = quotes.filter(q => q.category === "Unknown").length;
    
    quotes.forEach(q => {
      if (confCounts[q.confidence] !== undefined) confCounts[q.confidence]++;
    });
    
    const needsAttention = confCounts.low + unknownCount;
    
    return { uniqueSources, favCount, confCounts, needsAttention, unknownCount };
  }, [quotes]);

  if (!computedStats || !stats || quotes.length < 10) {
    return <EmptyState count={quotes.length} onClose={onClose} />;
  }

  const confColors = { 
    high: "#16A34A", 
    medium: "#D97706", 
    low: "#DC2626" 
  };

  const confLabels = {
    high: "High",
    medium: "Medium",
    low: "Low"
  };

  const kpis = [
    { 
      value: quotes.length, 
      label: "entries", 
      color: "#37352F", 
      icon: FileText,
      iconColor: "#9B9A97"
    },
    { 
      value: stats.uniqueSources, 
      label: "sources", 
      color: "#3C5775", 
      icon: BookOpen,
      iconColor: "#6A6660"
    },
    { 
      value: computedStats.avgWords, 
      label: "avg words", 
      color: "#6A6660", 
      icon: Hash,
      iconColor: "#9B9A97"
    },
    { 
      value: stats.favCount, 
      label: "favorites", 
      color: "#D97706", 
      icon: Star,
      iconColor: "#B45309"
    },
  ];

  return (
    <div style={Z.statsPanel}>
      <PanelHeader onClose={onClose} />

      {/* KPI row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 24,
      }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="stat-card"
              style={{
                background: "#fff",
                border: "1px solid #E3E2DE",
                borderRadius: 10,
                padding: "16px 12px",
                cursor: "default",
              }}
            >
              <Icon 
                size={20} 
                color={k.iconColor}
                style={{ 
                  marginBottom: 10,
                  opacity: 0.8,
                }}
              />
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: k.color,
                letterSpacing: -1,
                lineHeight: 1,
              }}>{k.value}</div>
              <div style={{
                fontSize: 11,
                color: "#9B9A97",
                marginTop: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 500,
              }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
      }}>
        {/* Category distribution */}
        <div style={Z.statsSection}>
          <SectionTitle icon={Tag} title="By category" />
          {Object.entries(cc)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const pct = (count / quotes.length) * 100;
              const col = getCatColor(cat, customCats);
              return (
                <StatBar
                  key={cat}
                  label={cat}
                  count={count}
                  percentage={pct}
                  color={col.text}
                />
              );
            })}
        </div>

        {/* Top sources and confidence */}
        <div style={Z.statsSection}>
          <SectionTitle icon={BookOpen} title="Top sources" />
          {computedStats.topSrcs.map(([src, count]) => (
            <StatBar
              key={src}
              label={src}
              count={count}
              percentage={(count / quotes.length) * 100}
              color="#37352F"
              maxWidth={180}
            />
          ))}

          <div style={{ marginTop: 24 }}>
            <SectionTitle icon={BarChart3} title="Confidence breakdown" />
            
            {/* Confidence meter */}
            <div style={{
              display: "flex",
              gap: 0,
              borderRadius: 8,
              overflow: "hidden",
              height: 10,
              background: "#EBEBEA",
              marginTop: 8,
              marginBottom: 12,
            }}>
              {["high", "medium", "low"].map(level => {
                const pct = (stats.confCounts[level] / quotes.length) * 100;
                return pct > 0 ? (
                  <div
                    key={level}
                    style={{
                      width: `${pct}%`,
                      background: confColors[level],
                      transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                ) : null;
              })}
            </div>

            {/* Confidence legend */}
            <div style={{
              display: "flex",
              gap: 20,
              fontSize: 12,
              color: "#6A6660",
              flexWrap: "wrap",
            }}>
              {["high", "medium", "low"].map(level => (
                <span
                  key={level}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: confColors[level],
                    flexShrink: 0,
                  }} />
                  {confLabels[level]} {stats.confCounts[level]}
                </span>
              ))}
            </div>
          </div>

          {stats.needsAttention > 0 && (
            <AttentionBanner count={stats.needsAttention} />
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted components for better organization
const EmptyState = ({ count, onClose }) => (
  <div style={Z.statsPanel}>
    <PanelHeader onClose={onClose} />
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 24px",
      color: "#9B9A97",
    }}>
      <BarChart3 
        size={48} 
        color="#D4D4D0"
        style={{ 
          marginBottom: 16,
          strokeWidth: 1.5,
        }}
      />
      <div style={{
        fontWeight: 500,
        fontSize: 14,
        color: "#6A6660",
        marginBottom: 12,
        textAlign: "center",
      }}>
        Add at least 10 entries to unlock insights
      </div>
      <div style={{
        background: "#F0F0EE",
        padding: "6px 16px",
        borderRadius: 100,
        fontSize: 13,
        color: "#6A6660",
        display: "inline-flex",
        alignItems: "center",
      }}>
        <FileText size={14} style={{ marginRight: 6, opacity: 0.6 }} />
        {count} {count === 1 ? 'entry' : 'entries'} so far
      </div>
    </div>
  </div>
);

const PanelHeader = ({ onClose }) => (
  <div style={{
    ...Z.statsPanelTitle,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E3E2DE",
    paddingBottom: 16,
    marginBottom: 20,
  }}>
    <span style={{ 
      fontSize: 16, 
      fontWeight: 600,
      color: "#37352F",
    }}>
      Collection breakdown
    </span>
    <button
      className="stats-close-btn"
      style={{
        ...Z.statsPanelClose,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: "#9B9A97",
        cursor: "pointer",
      }}
      onClick={onClose}
      aria-label="Close panel"
    >
      <X size={18} />
    </button>
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div style={{
    ...Z.statsSectionTitle,
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 600,
    color: "#37352F",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  }}>
    {Icon && (
      <Icon 
        size={16} 
        color="#9B9A97"
        style={{ strokeWidth: 2 }}
      />
    )}
    <span>{title}</span>
  </div>
);

const StatBar = ({ label, count, percentage, color, maxWidth }) => (
  <div style={{
    marginBottom: 16,
    animation: "slideIn 0.3s ease",
  }}>
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: 13,
      marginBottom: 6,
    }}>
      <span style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: maxWidth || "auto",
        color: "#37352F",
      }}>{label}</span>
      <span style={{ 
        color: "#9B9A97",
        flexShrink: 0,
        marginLeft: 8,
      }}>
        {count} <span style={{ fontSize: 11 }}>({Math.round(percentage)}%)</span>
      </span>
    </div>
    <div style={{
      height: 6,
      background: "#EBEBEA",
      borderRadius: 4,
      overflow: "hidden",
    }}>
      <div 
        style={{
          height: "100%",
          width: `${percentage}%`,
          background: color,
          borderRadius: 4,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }} 
      />
    </div>
  </div>
);

const AttentionBanner = ({ count }) => (
  <div style={{
    marginTop: 20,
    padding: "12px 16px",
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: 10,
    fontSize: 13,
    color: "#92400E",
    display: "flex",
    alignItems: "center",
    gap: 10,
    animation: "slideIn 0.3s ease",
  }}>
    <AlertCircle 
      size={18} 
      color="#D97706"
      style={{ flexShrink: 0 }}
    />
    <span>
      <strong style={{ fontWeight: 600 }}>{count}</strong>{" "}
      {count === 1 ? "entry needs" : "entries need"} review
    </span>
  </div>
);