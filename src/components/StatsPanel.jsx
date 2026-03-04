import { styles } from "./styles";
import { getCatColor, CONF_COLORS } from "../data/constants";
import { useMemo, useEffect } from "react";

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
  // Esc to close
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { document.activeElement?.blur(); onClose(); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

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

  const confLabels = { high: "High", medium: "Medium", low: "Low" };

  const kpis = [
    { value: quotes.length, label: "entries", icon: FileText, color: "#37352F", iconColor: "#9B9A97" },
    { value: stats.uniqueSources, label: "sources", icon: BookOpen, color: "#3C5775", iconColor: "#6A6660" },
    { value: computedStats.avgWords, label: "avg words", icon: Hash, color: "#6A6660", iconColor: "#9B9A97" },
    { value: stats.favCount, label: "favorites", icon: Star, color: "#D97706", iconColor: "#B45309" },
  ];

  const catEntries = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topSrcs = computedStats.topSrcs.slice(0, 4);

  return (
    <div style={styles.statsPanel}>
      <PanelHeader onClose={onClose} />

      {/* KPI row — compact */}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{
              background: "#fff", border: "1px solid #E3E2DE", borderRadius: 8,
              padding: "10px 10px", cursor: "default",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Icon size={14} color={k.iconColor} style={{ opacity: 0.8 }} />
                <span style={{ fontSize: 11, color: "#9B9A97", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 500 }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color, letterSpacing: -0.5, lineHeight: 1 }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Category distribution */}
        <div>
          <SectionTitle icon={Tag} title="By category" />
          {catEntries.map(([cat, count]) => {
            const pct = (count / quotes.length) * 100;
            const col = getCatColor(cat, customCats);
            return <CompactBar key={cat} label={cat} count={count} pct={pct} color={col.text} />;
          })}
        </div>

        {/* Top sources */}
        <div>
          <SectionTitle icon={BookOpen} title="Top sources" />
          {topSrcs.map(([src, count]) => (
            <CompactBar key={src} label={src} count={count} pct={(count / quotes.length) * 100} color="#37352F" maxW={160} />
          ))}
        </div>
      </div>

      {/* Confidence breakdown — inline */}
      <div style={{ marginTop: 14, padding: "12px 14px", background: "#fff", border: "1px solid #E3E2DE", borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, color: "#37352F" }}>
            <BarChart3 size={13} color="#9B9A97" /> Confidence
          </span>
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6A6660" }}>
            {["high", "medium", "low"].map(level => (
              <span key={level} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: CONF_COLORS[level], flexShrink: 0 }} />
                {confLabels[level]} {stats.confCounts[level]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, background: "#EBEBEA" }}>
          {["high", "medium", "low"].map(level => {
            const pct = (stats.confCounts[level] / quotes.length) * 100;
            return pct > 0 ? (
              <div key={level} style={{ width: `${pct}%`, background: CONF_COLORS[level], transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            ) : null;
          })}
        </div>
      </div>

      {stats.needsAttention > 0 && <AttentionBanner count={stats.needsAttention} />}
    </div>
  );
}

const EmptyState = ({ count, onClose }) => {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") { document.activeElement?.blur(); onClose(); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={styles.statsPanel}>
      <PanelHeader onClose={onClose} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", color: "#9B9A97" }}>
        <BarChart3 size={40} color="#D4D4D0" style={{ marginBottom: 12, strokeWidth: 1.5 }} />
        <div style={{ fontWeight: 500, fontSize: 14, color: "#6A6660", marginBottom: 10, textAlign: "center" }}>
          Add at least 10 entries to unlock insights
        </div>
        <div style={{ background: "#F0F0EE", padding: "5px 14px", borderRadius: 100, fontSize: 13, color: "#6A6660", display: "inline-flex", alignItems: "center" }}>
          <FileText size={14} style={{ marginRight: 6, opacity: 0.6 }} />
          {count} {count === 1 ? 'entry' : 'entries'} so far
        </div>
      </div>
    </div>
  );
};

const PanelHeader = ({ onClose }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #E3E2DE", paddingBottom: 12, marginBottom: 14,
  }}>
    <span style={{ fontSize: 15, fontWeight: 600, color: "#37352F" }}>
      Collection breakdown
    </span>
    <button
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 6, border: "none",
        background: "transparent", color: "#9B9A97", cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      className="ui-tip"
      data-tip="Close (Esc)"
      onClick={onClose}
      aria-label="Close panel"
      onMouseEnter={e => { e.currentTarget.style.background = "#F0F0EE"; e.currentTarget.style.color = "#37352F"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9B9A97"; }}
    >
      <X size={16} />
    </button>
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 5,
    marginBottom: 10, fontSize: 11, fontWeight: 600,
    color: "#37352F", textTransform: "uppercase", letterSpacing: 0.3,
  }}>
    {Icon && <Icon size={13} color="#9B9A97" style={{ strokeWidth: 2 }} />}
    <span>{title}</span>
  </div>
);

const CompactBar = ({ label, count, pct, color, maxW }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: maxW || "auto", color: "#37352F" }}>{label}</span>
      <span style={{ color: "#9B9A97", flexShrink: 0, marginLeft: 8 }}>
        {count} <span style={{ fontSize: 10 }}>({Math.round(pct)}%)</span>
      </span>
    </div>
    <div style={{ height: 4, background: "#EBEBEA", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </div>
  </div>
);

const AttentionBanner = ({ count }) => (
  <div style={{
    marginTop: 12, padding: "10px 14px", background: "#FFF7ED",
    border: "1px solid #FED7AA", borderRadius: 8, fontSize: 13,
    color: "#92400E", display: "flex", alignItems: "center", gap: 8,
  }}>
    <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
    <span>
      <strong style={{ fontWeight: 600 }}>{count}</strong>{" "}
      {count === 1 ? "entry needs" : "entries need"} review
    </span>
  </div>
);
