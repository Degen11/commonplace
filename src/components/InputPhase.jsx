import { useEffect, useState, useRef } from "react";
import Logo from "./Logo";
import HowItWorksAnimation from "./HowItWorksAnimation";
import Footer from "./Footer";
import { styles, CP_ACCENT, CP_ACCENT_06, CP_ACCENT_10, FONT_SANS, FONT_SERIF, CLR_EMERALD } from "./styles";
import { API_HEADERS } from "../utils/api";
import { smartSplit, basicFormat } from "../utils/textFormatting";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { EXAMPLE_QUOTES } from "../data/constants";
import {
  Pencil, Upload, FolderOpen, FileText,
  TriangleAlert, CircleCheckBig, ArrowRight, ChevronDown,
  Sparkles, PenLine, Download, RefreshCw, Filter, Library,
  Moon, Sun, Monitor, Loader,
} from "lucide-react";
import UrlPreviewModal, { EXTRACT_MODES } from "./UrlPreviewModal";

// ── Scroll-reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Timeline data ────────────────────────────────────────────────────────────
const TAG_COLORS = {
  Film:   { bg: "rgba(139,92,246,0.08)",  text: "#7A48CE" },
  Speech: { bg: "rgba(59,130,246,0.08)",  text: "#3967CD" },
  Person: { bg: "rgba(168,85,247,0.08)",  text: "#8B43CC" },
  Book:   { bg: "rgba(217,119,6,0.08)",   text: "#C07621" },
};

const TIMELINE_MOMENTS = [
  {
    period: "First session",
    count: 5,
    quotes: [
      { text: "You can\u2019t handle the truth", source: "A Few Good Men", tag: "Film" },
      { text: "Be the change", source: "Gandhi", tag: "Speech" },
    ],
  },
  {
    period: "One week in",
    count: 23,
    quotes: [
      { text: "Less is more", source: "Mies van der Rohe", tag: "Person" },
      { text: "The only way out is through", source: "Robert Frost", tag: "Book" },
    ],
  },
  {
    period: "One month later",
    count: 87,
    quotes: [
      { text: "Cogito ergo sum", source: "Descartes", tag: "Person" },
      { text: "Stay hungry, stay foolish", source: "Steve Jobs", tag: "Speech" },
    ],
  },
];

// ── Homepage-specific styles ─────────────────────────────────────────────────
const HP = {
  // Hero — split layout
  hero: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "5fr 7fr",
    alignItems: "center",
    gap: 40,
    padding: "100px 48px 48px",
    position: "relative",
    background: "var(--cp-bg)",
    maxWidth: 1200,
    margin: "0 auto",
  },
  heroGlow: {
    position: "absolute",
    width: 600,
    height: 300,
    background: `radial-gradient(ellipse, ${CP_ACCENT_06} 0%, transparent 70%)`,
    pointerEvents: "none",
    top: "40%",
    left: "25%",
    transform: "translate(-50%, -50%)",
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    padding: "16px 32px",
    zIndex: 100,
    background: "var(--cp-mini-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--cp-border-light)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navName: {
    fontFamily: FONT_SERIF,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.5,
    color: "var(--cp-text)",
  },
  heroLeft: {
    animation: "fadeUp .8s ease",
    position: "relative",
    zIndex: 1,
  },
  heroRight: {
    animation: "fadeUp .8s .15s ease both",
    position: "relative",
    zIndex: 1,
  },
  heroHeadline: {
    fontFamily: FONT_SANS,
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: "var(--cp-text)",
    marginBottom: 20,
  },
  heroSub: {
    fontFamily: FONT_SANS,
    fontSize: 18,
    fontWeight: 300,
    lineHeight: 1.7,
    color: "var(--cp-text-muted)",
    marginBottom: 28,
    maxWidth: 440,
  },
  heroPrimary: {
    display: "inline-flex",
    alignItems: "center",
    padding: "14px 32px",
    border: "none",
    borderRadius: 6,
    background: CP_ACCENT,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    letterSpacing: -0.2,
  },
  heroProblem: {
    fontFamily: FONT_SANS,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: CP_ACCENT,
    marginBottom: 12,
  },
  heroMiniDemo: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px 16px",
    background: "var(--cp-bg-panel)",
    border: "1px solid var(--cp-border-light)",
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  miniDemoLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--cp-text-faint)",
  },
  miniDemoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    flexWrap: "wrap",
  },
  miniDemoBefore: {
    color: "var(--cp-text-muted)",
    fontFamily: "'SF Mono','DM Mono',Menlo,monospace",
    fontSize: 12,
  },
  miniDemoAfter: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
    color: "var(--cp-text-secondary)",
  },
  miniDemoTag: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 3,
    background: "rgba(59,130,246,0.08)",
    color: "#3967CD",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: "'DM Mono',monospace",
  },
  heroTrust: {
    fontSize: 13,
    color: CP_ACCENT,
    fontWeight: 500,
    letterSpacing: 0.02,
    marginTop: 20,
  },

  // Sections
  section: {
    padding: "80px 48px",
  },
  sectionAlt: {
    background: "var(--cp-bg-panel)",
  },
  sectionInner: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: CP_ACCENT,
    marginBottom: 12,
    fontFamily: FONT_SANS,
  },
  sectionHeadline: {
    fontFamily: FONT_SANS,
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: "var(--cp-text)",
    marginBottom: 12,
  },
  sectionSub: {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.7,
    color: "var(--cp-text-muted)",
    maxWidth: 520,
    fontFamily: FONT_SANS,
  },

  // How it works — asymmetric split (text left, animation right)
  howSplit: {
    display: "grid",
    gridTemplateColumns: "5fr 7fr",
    gap: 48,
    alignItems: "center",
  },
  howLeft: {
    display: "flex",
    flexDirection: "column",
  },
  howRight: {
    maxWidth: 560,
  },

  // Timeline — horizontal
  timeline: {
    position: "relative",
    marginTop: 48,
    textAlign: "left",
  },
  timelineTrack: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    height: 2,
    background: "var(--cp-border)",
    borderRadius: 1,
  },
  timelineTrackFill: {
    position: "absolute",
    top: 4,
    left: 0,
    width: "75%",
    height: 2,
    background: `linear-gradient(90deg, var(--cp-border-dim) 0%, ${CP_ACCENT} 100%)`,
    borderRadius: 1,
  },
  timelineColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 24,
    position: "relative",
  },
  timelineMoment: {
    display: "flex",
    flexDirection: "column",
    paddingTop: 24,
    position: "relative",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "var(--cp-border-dim)",
    border: "2px solid var(--cp-bg-panel)",
    position: "absolute",
    top: -1,
    left: 0,
    zIndex: 1,
  },
  timelinePeriod: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: CP_ACCENT,
    marginBottom: 2,
    fontFamily: FONT_SANS,
  },
  timelineCount: {
    fontFamily: FONT_SANS,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--cp-text)",
    marginBottom: 12,
  },
  timelineQuotes: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  timelineQuoteTag: (tag) => ({
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 3,
    background: TAG_COLORS[tag]?.bg || "#F1F1EF",
    color: TAG_COLORS[tag]?.text || "#787774",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "'DM Mono',monospace",
  }),
  timelineQuote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    background: "var(--cp-bg-card)",
    borderRadius: 6,
    border: "1px solid var(--cp-border-light)",
    fontSize: 12,
  },
  timelineQuoteText: {
    color: "var(--cp-text-secondary)",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: FONT_SANS,
  },
  timelineQuoteSrc: {
    color: "var(--cp-text-muted)",
    fontSize: 11,
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: FONT_SANS,
  },

  // Features — single row of 4 cards
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginTop: 40,
    textAlign: "left",
  },
  featureCard: {
    background: "var(--cp-bg-card)",
    border: "1px solid var(--cp-border-light)",
    borderRadius: 6,
    padding: "20px 18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    marginBottom: 14,
  },
  featureTitle: {
    fontFamily: FONT_SANS,
    fontSize: 14,
    fontWeight: 600,
    color: "var(--cp-text)",
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: 300,
    lineHeight: 1.5,
    color: "var(--cp-text-muted)",
    fontFamily: FONT_SANS,
  },
};

// ── Reveal transition helper ─────────────────────────────────────────────────
const reveal = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0)" : "translateY(40px)",
  transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
});

// ── Formatting preview — shows before/after for a sample of entries ──────────
function FormattingPreview({ rawInput }) {
  const [expanded, setExpanded] = useState(false);
  const samples = (() => {
    const lines = smartSplit(rawInput.trim()).slice(0, 5);
    const diffs = [];
    for (const line of lines) {
      const formatted = basicFormat(line);
      if (formatted !== line) diffs.push({ before: line, after: formatted });
    }
    return diffs;
  })();

  if (samples.length === 0) return null;

  return (
    <div style={{ marginTop: 2 }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          fontSize: 11, color: CP_ACCENT, fontWeight: 500, padding: 0,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}
      >
        <ChevronDown
          size={12}
          strokeWidth={2}
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .15s" }}
        />
        Preview changes ({samples.length} {samples.length === 1 ? "fix" : "fixes"})
      </button>
      {expanded && (
        <div style={{
          marginTop: 6, padding: "8px 10px",
          background: "var(--cp-bg-panel)", border: "1px solid var(--cp-border-light)",
          borderRadius: 6, fontSize: 12, display: "flex", flexDirection: "column", gap: 6,
          animation: "slideD .15s ease",
        }}>
          {samples.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ color: "var(--cp-text-muted)", textDecoration: "line-through", opacity: 0.7, lineHeight: 1.4, wordBreak: "break-word" }}>{s.before}</div>
              <div style={{ color: CLR_EMERALD, lineHeight: 1.4, wordBreak: "break-word" }}>{s.after}</div>
              {i < samples.length - 1 && <div style={{ borderBottom: "1px solid var(--cp-border-light)", margin: "2px 0" }} />}
            </div>
          ))}
          {smartSplit(rawInput.trim()).length > 5 && (
            <div style={{ fontSize: 11, color: "var(--cp-text-faint)", fontStyle: "italic" }}>Showing first 5 entries...</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── URL Import Panel ─────────────────────────────────────────────────────────
function UrlImportPanel({ onLoad }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractMode, setExtractMode] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const lastUrlRef = useRef("");

  const fetchUrl = async (trimmed, mode, { showLoading = false, openModal = false } = {}) => {
    if (!trimmed) return;
    if (showLoading) { setLoading(true); setError(null); }
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ url: trimmed, extractMode: mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      if (openModal && (!data.lines || data.lines.length === 0)) throw new Error("No text content found on that page");
      lastUrlRef.current = trimmed;
      setPreview(data);
      if (openModal) setShowModal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleFetch = (modeOverride) => {
    const trimmed = url.trim() || lastUrlRef.current;
    fetchUrl(trimmed, modeOverride || extractMode, { showLoading: true, openModal: true });
  };

  const handleRefetch = (newMode) => {
    setExtractMode(newMode);
    fetchUrl(lastUrlRef.current, newMode);
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      {showModal && preview && (
        <UrlPreviewModal
          preview={preview}
          currentMode={extractMode}
          onConfirm={(selected) => {
            onLoad(selected.join("\n"));
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
          onRefetch={handleRefetch}
        />
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleFetch(); }}
          placeholder="https://example.com/quotes"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 6, border: "1px solid var(--cp-border)", background: "var(--cp-bg-input, #fff)", color: "var(--cp-text)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
        />
        <button
          onClick={() => handleFetch()}
          disabled={loading || !url.trim()}
          style={{ padding: "10px 18px", borderRadius: 4, border: "none", background: loading ? "var(--cp-border)" : "#2383E2", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {/* Extraction mode selector */}
      <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
        {EXTRACT_MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setExtractMode(m.value)}
            className="ui-tip ui-tip-below"
            data-tip={m.desc}
            style={{
              padding: "3px 10px",
              borderRadius: 50,
              border: extractMode === m.value ? `1px solid ${CP_ACCENT}` : "1px solid var(--cp-border)",
              background: extractMode === m.value ? CP_ACCENT_10 : "transparent",
              color: extractMode === m.value ? CP_ACCENT : "var(--cp-text-muted)",
              fontSize: 11,
              fontWeight: extractMode === m.value ? 600 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all .15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {m.value === "quotes" && <Filter size={10} strokeWidth={2} />}
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--cp-error-bg)", border: "1px solid var(--cp-error-border)", borderRadius: 4, fontSize: 13, color: "var(--cp-error-text)" }}>
          {error}
        </div>
      )}
      <p style={{ marginTop: 12, fontSize: 11, color: "var(--cp-text-faint)" }}>
        Fetches the page and extracts text content. Choose an extraction mode to filter what gets pulled.
      </p>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function InputPhase({
  rawInput, setRawInput,
  inputTab, setInputTab,
  isDragOver, setIsDragOver,
  importedFileName,
  formattingEnabled, setFormattingEnabled,
  isProcessing,
  initialLoading,
  onProcess,
  onFileImport,
  fileInputRef,
  dark,
  toggleTheme,
  themeMode,
}) {
  // Scroll-reveal refs
  const [howRef, howVisible] = useScrollReveal();
  const [timelineRef, timelineVisible] = useScrollReveal(0.1);
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  const handleDropZone = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileImport(file);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--cp-bg)", minHeight: "100vh", fontFamily: FONT_SANS }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED NAV
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav style={HP.nav}>
        <div style={HP.navBrand}>
          <Logo size={24} />
          <span style={HP.navName}>Commonplace</span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            className="ui-tip ui-tip-below hdr-btn"
            data-tip={themeMode === "auto" ? "Auto (system)" : dark ? "Dark mode" : "Light mode"}
            style={{ ...styles.statsBtn, padding: "5px 8px" }}
            onClick={toggleTheme}
          >
            {themeMode === "auto" ? <Monitor size={16} strokeWidth={1.5} /> : dark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO — split layout: headline left, input card right
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-hero" id="input-section" style={HP.hero}>
        <div style={HP.heroGlow} />

        {/* Left column — headline & value prop */}
        <div style={HP.heroLeft}>
          <p style={HP.heroProblem}>Never lose a brilliant quote again.</p>
          <h1 className="hp-hero-headline" style={HP.heroHeadline}>
            Your personal<br />library of ideas
          </h1>
          <p className="hp-hero-sub" style={HP.heroSub}>
            Paste messy quotes, phrases, and fragments.
            We organize everything and identify the sources.
          </p>
          <div style={HP.heroMiniDemo}>
            <div style={HP.miniDemoLabel}>See how it works</div>
            <div style={HP.miniDemoRow}>
              <span style={HP.miniDemoBefore}>"be the change — Gandhi"</span>
              <ArrowRight size={14} color="var(--cp-text-faint)" style={{ flexShrink: 0 }} />
              <span style={HP.miniDemoAfter}>
                <span style={HP.miniDemoTag}>Speech</span>
                Mahatma Gandhi
              </span>
            </div>
          </div>
          <p style={HP.heroTrust}>No signup · Private processing · Instant results · Free</p>
        </div>

        {/* Right column — input card */}
        <div style={HP.heroRight}>
          {initialLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", marginBottom: 16, background: "var(--cp-bg-card)", border: "1px solid var(--cp-border-light)", borderRadius: 6, fontSize: 13, color: "var(--cp-text-muted)" }}>
              <RefreshCw size={14} strokeWidth={2} className="spin" /> Restoring from cloud&hellip;
            </div>
          )}

          <div style={{ ...styles.inputCard, maxWidth: "100%" }}>
            {/* Tab row */}
            <div style={styles.tabRow}>
              <button
                className="tab-btn"
                style={{ ...styles.tabBtn, ...(inputTab === "paste" ? styles.tabBtnActive : {}), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => setInputTab("paste")}
              >
                <Pencil size={14} strokeWidth={1.5} /> Type / Paste
              </button>
              <button
                className="tab-btn"
                style={{ ...styles.tabBtn, ...(inputTab === "import" ? styles.tabBtnActive : {}), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => setInputTab("import")}
              >
                <Upload size={14} strokeWidth={1.5} /> Import File
              </button>
            </div>

            {inputTab === "paste" && (
              <textarea
                style={styles.bigTextarea}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                onKeyDown={e => handleRichTextShortcut(e, rawInput, setRawInput)}
                placeholder={
                  "Paste everything here \u2014 one per line, messy is fine:\n\nYou can\u2019t handle the truth\nThe world breaks everyone \u2014 Hemingway\n\u201CBe the change\u201D (Gandhi)\nTo infinity and beyond\nNot all those who wander are lost \u2014 Tolkien"
                }
                rows={8}
              />
            )}

            {inputTab === "import" && (
              <>
              <div
                className="drop-zone"
                style={{ ...styles.dropZone, ...(isDragOver ? styles.dropZoneActive : {}) }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json,.md"
                  style={{ display: "none" }}
                  onChange={(e) => { onFileImport(e.target.files[0]); e.target.value = ""; }}
                />
                <div style={{ ...styles.dropIcon, display: "flex", justifyContent: "center" }}>
                  {isDragOver
                    ? <FolderOpen size={32} color="#2383E2" strokeWidth={1.5} />
                    : <FileText size={32} color="var(--cp-text-muted)" strokeWidth={1.5} />}
                </div>
                <div style={styles.dropTitle}>{isDragOver ? "Drop it!" : "Drop a file to import"}</div>
                <div style={styles.dropSub}>Supports .txt, .csv, .json, .md — Kindle, Readwise, Notion, and more</div>
                {importedFileName && (
                  <div style={styles.dropFileName}>
                    <CircleCheckBig size={13} strokeWidth={2} /> {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 24px", color: "var(--cp-text-faint)", fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: "var(--cp-border-light)" }} />
                <span>or import from URL</span>
                <div style={{ flex: 1, height: 1, background: "var(--cp-border-light)" }} />
              </div>

              <UrlImportPanel onLoad={(text) => { setRawInput(text); setInputTab("paste"); }} />
              </>
            )}

            <div style={styles.inputFooter}>
              {(() => {
                const trimmed = rawInput.trim();
                const count = trimmed ? smartSplit(trimmed).length : 0;
                const charCount = rawInput.length;
                const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
                const hasFancyChars = /[\u201C\u201D\u2018\u2019\u2014\u2013\u2026]/.test(rawInput);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={styles.entryMeta}>
                      {count > 0
                        ? <>{count} {count === 1 ? "entry" : "entries"} detected<span style={{ color: "var(--cp-text-faint)", marginLeft: 8, fontSize: 11 }}>{wordCount.toLocaleString()} words &middot; {charCount.toLocaleString()} chars</span></>
                        : "Quotes, phrases, expressions \u2014 all welcome"}
                    </span>
                    {count > 50 && (
                      <span style={styles.warnBadge}>
                        <TriangleAlert size={12} strokeWidth={2} /> {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment
                      </span>
                    )}
                    {hasFancyChars && !formattingEnabled && (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
                          color: "#0369A1", background: "#EFF6FF", padding: "3px 8px", borderRadius: 50,
                          fontWeight: 500, cursor: "pointer", border: "1px solid #DBEAFE",
                        }}
                        onClick={() => setFormattingEnabled(true)}
                      >
                        Smart quotes detected — enable formatting cleanup?
                      </span>
                    )}
                    <label
                      className="ui-tip ui-tip-below"
                      data-tip="Normalize quotes, dashes, and whitespace"
                      style={styles.fmtToggleWrap}
                      onClick={() => setFormattingEnabled((p) => !p)}
                    >
                      <div style={{ ...styles.fmtToggleTrack, background: formattingEnabled ? "var(--cp-text)" : "var(--cp-toggle-off)" }}>
                        <div style={{ ...styles.fmtToggleThumb, left: formattingEnabled ? 15 : 2 }} />
                      </div>
                      Clean up formatting
                    </label>
                    {formattingEnabled && count > 0 && <FormattingPreview rawInput={rawInput} />}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!rawInput.trim() && inputTab === "paste" && (
                  <button className="try-btn" style={styles.tryBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>
                    Try with examples
                  </button>
                )}
                <button
                  className="proc-btn"
                  style={{ ...styles.processBtn, display: "flex", alignItems: "center", gap: 6, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }}
                  onClick={onProcess}
                  disabled={!rawInput.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader size={14} strokeWidth={2} className="spin" />
                      Processing...
                    </>
                  ) : "Organize my collection \u2192"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — asymmetric split: text left, animation right
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="how-section"
        ref={howRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(howVisible) }}
      >
        <div style={HP.sectionInner}>
          <div className="hp-how-split" style={HP.howSplit}>
            <div style={HP.howLeft}>
              <div style={HP.sectionLabel}>How it works</div>
              <h2 style={HP.sectionHeadline}>Paste anything.<br />We handle the rest.</h2>
              <p style={HP.sectionSub}>
                Drop in your messy collection of quotes, and watch them transform
                into an organized, searchable library.
              </p>
            </div>
            <div style={HP.howRight}>
              <HowItWorksAnimation active={howVisible} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TIMELINE — horizontal library growth
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={timelineRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(timelineVisible) }}
      >
        <div style={HP.sectionInner}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={HP.sectionLabel}>Build over time</div>
            <h2 style={HP.sectionHeadline}>Your library grows with you</h2>
            <p style={{ ...HP.sectionSub, margin: "0 auto" }}>
              Every quote you collect becomes part of your personal archive.
            </p>
          </div>

          <div className="hp-timeline" style={HP.timeline}>
            {/* Continuous track line */}
            <div style={HP.timelineTrack} />
            <div style={HP.timelineTrackFill} />

            <div className="hp-timeline-cols" style={HP.timelineColumns}>
              {TIMELINE_MOMENTS.map((moment, i) => (
                <div
                  key={i}
                  style={{
                    ...HP.timelineMoment,
                    ...reveal(timelineVisible, 0.15 + i * 0.15),
                  }}
                >
                  <div style={HP.timelineDot} />
                  <div style={HP.timelinePeriod}>{moment.period}</div>
                  <div style={HP.timelineCount}>{moment.count} quotes</div>
                  <div style={HP.timelineQuotes}>
                    {moment.quotes.map((q, j) => (
                      <div key={j} className="hp-timeline-quote" style={HP.timelineQuote}>
                        <span style={HP.timelineQuoteTag(q.tag)}>{q.tag}</span>
                        <span style={HP.timelineQuoteText}>&ldquo;{q.text}&rdquo;</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Final milestone */}
              <div
                style={{
                  ...HP.timelineMoment,
                  ...reveal(timelineVisible, 0.15 + TIMELINE_MOMENTS.length * 0.15),
                }}
              >
                <div style={{ ...HP.timelineDot, background: CP_ACCENT, width: 14, height: 14, left: -2, top: -3, border: `2px solid var(--cp-bg-panel)` }} />
                <div style={HP.timelinePeriod}>Your library</div>
                <div style={{ ...HP.timelineCount, fontSize: 28, color: CP_ACCENT }}>200+</div>
                <div style={{ fontSize: 13, color: "var(--cp-text-muted)", fontFamily: FONT_SANS, lineHeight: 1.5 }}>
                  Searchable, organized,<br />always yours
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        className="hp-section"
        style={{ ...HP.section, ...reveal(featuresVisible) }}
      >
        <div style={{ ...HP.sectionInner, textAlign: "center" }}>
          <div style={HP.sectionLabel}>Features</div>
          <h2 style={HP.sectionHeadline}>Everything you need</h2>
          <p style={{ ...HP.sectionSub, margin: "0 auto" }}>
            Simple enough to use in seconds. Powerful enough to manage hundreds of quotes.
          </p>

          <div className="hp-features-grid" style={HP.featuresGrid}>
            {[
              {
                icon: Sparkles,
                title: "Smart organization",
                desc: "AI identifies sources, assigns categories, and detects duplicates automatically.",
                color: CP_ACCENT,
              },
              {
                icon: PenLine,
                title: "Powerful editing",
                desc: "Inline editing, drag to reorder, bulk operations, and custom categories.",
                color: "#7A48CE",
              },
              {
                icon: Library,
                title: "Custom collections",
                desc: "Curate your own collections, or let AI auto-group quotes by theme and topic.",
                color: "#3967CD",
              },
              {
                icon: Download,
                title: "Flexible export",
                desc: "Export as CSV, Markdown, or JSON. Compatible with Notion, Obsidian, and more.",
                color: "#218D6C",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="hp-feature-card"
                  style={{
                    ...HP.featureCard,
                    ...reveal(featuresVisible, 0.1 + i * 0.1),
                  }}
                >
                  <div style={{ ...HP.featureIconWrap, background: `${f.color}12` }}>
                    <Icon size={20} color={f.color} strokeWidth={1.5} />
                  </div>
                  <h3 style={HP.featureTitle}>{f.title}</h3>
                  <p style={HP.featureDesc}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(ctaVisible) }}
      >
        <div style={{ ...HP.sectionInner, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ ...HP.sectionHeadline, fontSize: 36, marginBottom: 16 }}>
            Start building your library
          </h2>
          <p style={{ ...HP.sectionSub, marginBottom: 32, margin: "0 auto 32px" }}>
            Free. Private. No signup required.
          </p>
          <button className="hp-primary" style={HP.heroPrimary} onClick={() => scrollTo("input-section")}>
            Start organizing <ArrowRight size={16} strokeWidth={2} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Footer styles={styles} />
    </div>
  );
}
