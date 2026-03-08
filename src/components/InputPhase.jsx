import { useEffect, useState, useRef, useMemo } from "react";
import Logo from "./Logo";
import HowItWorksAnimation from "./HowItWorksAnimation";
import Footer from "./Footer";
import { styles, CP_ACCENT } from "./styles";
import { smartSplit, basicFormat } from "../utils/textFormatting";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { EXAMPLE_QUOTES } from "../data/constants";
import {
  Pencil, Upload, FolderOpen, FileText,
  AlertTriangle, CheckCircle, ArrowRight, ChevronDown,
  Sparkles, PenLine, Download, RefreshCw, Filter,
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
  Film:   { bg: "rgba(139,92,246,0.14)",  text: "#7C3AED" },
  Speech: { bg: "rgba(59,130,246,0.14)",  text: "#2563EB" },
  Person: { bg: "rgba(168,85,247,0.14)",  text: "#9333EA" },
  Book:   { bg: "rgba(217,119,6,0.14)",   text: "#D97706" },
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
  // Hero
  hero: {
    minHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 32px 48px",
    position: "relative",
    background: "var(--cp-bg)",
  },
  heroGlow: {
    position: "absolute",
    width: 600,
    height: 300,
    background: "radial-gradient(ellipse, rgba(60,87,117,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    top: "45%",
    left: "50%",
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
    fontFamily: "'Playfair Display',Georgia,serif",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: -0.5,
    color: "var(--cp-text)",
  },
  heroContent: {
    textAlign: "center",
    animation: "fadeUp .8s ease",
    position: "relative",
    zIndex: 1,
  },
  heroHeadline: {
    fontFamily: "'Playfair Display',Georgia,serif",
    fontSize: 56,
    fontWeight: 700,
    letterSpacing: -2,
    lineHeight: 1.1,
    color: "var(--cp-text)",
    marginBottom: 20,
  },
  heroSub: {
    fontFamily: "'DM Sans',-apple-system,sans-serif",
    fontSize: 18,
    fontWeight: 300,
    lineHeight: 1.7,
    color: "var(--cp-text-muted)",
    marginBottom: 36,
    maxWidth: 480,
    margin: "0 auto 36px",
  },
  heroCtas: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  heroPrimary: {
    display: "inline-flex",
    alignItems: "center",
    padding: "14px 32px",
    border: "none",
    borderRadius: 10,
    background: CP_ACCENT,
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans',-apple-system,sans-serif",
    letterSpacing: -0.2,
  },
  heroGhost: {
    display: "inline-flex",
    alignItems: "center",
    padding: "14px 28px",
    border: "1px solid var(--cp-border)",
    borderRadius: 10,
    background: "transparent",
    color: "var(--cp-text-secondary)",
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },
  heroTrust: {
    fontSize: 13,
    color: "var(--cp-text-faint)",
    letterSpacing: 0.02,
  },
  scrollHint: {
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    color: "var(--cp-text-faint)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  section: {
    padding: "64px 32px",
  },
  sectionAlt: {
    background: "var(--cp-bg-panel)",
  },
  sectionInner: {
    maxWidth: 800,
    margin: "0 auto",
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: CP_ACCENT,
    marginBottom: 12,
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },
  sectionHeadline: {
    fontFamily: "'Playfair Display',Georgia,serif",
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: -1,
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
    margin: "0 auto",
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },

  // Animation wrap
  animationWrap: {
    maxWidth: 560,
    margin: "40px auto 0",
  },

  // Timeline
  timeline: {
    maxWidth: 480,
    margin: "48px auto 0",
    position: "relative",
    textAlign: "left",
  },
  timelineMoment: {
    display: "flex",
    gap: 20,
    position: "relative",
    paddingBottom: 36,
  },
  timelineDotWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    width: 8,
    paddingTop: 3,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--cp-border-dim)",
    flexShrink: 0,
    zIndex: 1,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    background: "var(--cp-border)",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: 0,
  },
  timelinePeriod: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: CP_ACCENT,
    marginBottom: 2,
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },
  timelineCount: {
    fontFamily: "'Playfair Display',Georgia,serif",
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
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },
  timelineQuoteSrc: {
    color: "var(--cp-text-muted)",
    fontSize: 11,
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "'DM Sans',-apple-system,sans-serif",
  },

  // Features
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24,
    marginTop: 40,
    textAlign: "left",
  },
  featureCard: {
    background: "var(--cp-bg-card)",
    border: "1px solid var(--cp-border-light)",
    borderRadius: 14,
    padding: "28px 24px",
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 16,
  },
  featureTitle: {
    fontFamily: "'DM Sans',-apple-system,sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--cp-text)",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.6,
    color: "var(--cp-text-muted)",
    fontFamily: "'DM Sans',-apple-system,sans-serif",
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
  const samples = useMemo(() => {
    const lines = smartSplit(rawInput.trim()).slice(0, 5);
    const diffs = [];
    for (const line of lines) {
      const formatted = basicFormat(line);
      if (formatted !== line) diffs.push({ before: line, after: formatted });
    }
    return diffs;
  }, [rawInput]);

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
              <div style={{ color: "#059669", lineHeight: 1.4, wordBreak: "break-word" }}>{s.after}</div>
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

  const handleFetch = async (modeOverride) => {
    const trimmed = url.trim() || lastUrlRef.current;
    if (!trimmed) return;
    const useMode = modeOverride || extractMode;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify({ url: trimmed, extractMode: useMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      if (!data.lines || data.lines.length === 0) throw new Error("No text content found on that page");
      lastUrlRef.current = trimmed;
      setPreview(data);
      setShowModal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefetch = async (newMode) => {
    const trimmed = lastUrlRef.current;
    if (!trimmed) return;
    setExtractMode(newMode);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify({ url: trimmed, extractMode: newMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      setPreview(data);
    } catch (e) {
      setError(e.message);
    }
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
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--cp-border)", background: "var(--cp-bg-input, #fff)", color: "var(--cp-text)", fontSize: 14, fontFamily: "inherit", outline: "none" }}
        />
        <button
          onClick={() => handleFetch()}
          disabled={loading || !url.trim()}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: loading ? "var(--cp-border)" : "#2383E2", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
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
              border: extractMode === m.value ? "1px solid var(--cp-accent, #3C5775)" : "1px solid var(--cp-border)",
              background: extractMode === m.value ? "rgba(60,87,117,0.10)" : "transparent",
              color: extractMode === m.value ? "var(--cp-accent, #3C5775)" : "var(--cp-text-muted)",
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
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>
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
  fadeClass,
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
}) {
  // Scroll-reveal refs
  const [howRef, howVisible] = useScrollReveal();
  const [inputRef, inputVisible] = useScrollReveal();
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
    <div className={fadeClass} style={{ background: "var(--cp-bg)", minHeight: "100vh", fontFamily: "'DM Sans',-apple-system,sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED NAV
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav style={HP.nav}>
        <div style={HP.navBrand}>
          <Logo size={24} />
          <span style={HP.navName}>Commonplace</span>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-hero" style={HP.hero}>
        <div style={HP.heroGlow} />
        <div style={HP.heroContent}>
          <h1 className="hp-hero-headline" style={HP.heroHeadline}>
            Your personal library<br />of ideas
          </h1>
          <p className="hp-hero-sub" style={HP.heroSub}>
            Paste messy quotes, phrases, and fragments.
            <br />
            We organize everything and identify the sources.
          </p>
          <div className="hp-ctas" style={HP.heroCtas}>
            <button className="hp-primary" style={HP.heroPrimary} onClick={() => scrollTo("input-section")}>
              Start organizing <ArrowRight size={16} strokeWidth={2} style={{ marginLeft: 6 }} />
            </button>
            <button className="hp-ghost" style={HP.heroGhost} onClick={() => scrollTo("how-section")}>
              See how it works
            </button>
          </div>
          <p style={HP.heroTrust}>No signup · Private processing · Instant results · Free</p>
        </div>

        {/* Scroll hint */}
        <div className="hp-scroll-hint" style={HP.scrollHint}>
          <ChevronDown size={20} strokeWidth={1.5} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — animated demo
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="how-section"
        ref={howRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(howVisible) }}
      >
        <div style={HP.sectionInner}>
          <div style={HP.sectionLabel}>How it works</div>
          <h2 style={HP.sectionHeadline}>Paste anything. We handle the rest.</h2>
          <p style={HP.sectionSub}>
            Drop in your messy collection of quotes, and watch them transform
            into an organized, searchable library.
          </p>
          <div style={HP.animationWrap}>
            <HowItWorksAnimation active={howVisible} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRY IT NOW — input area
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        id="input-section"
        ref={inputRef}
        className="hp-section"
        style={{ ...HP.section, ...reveal(inputVisible) }}
      >
        <div style={HP.sectionInner}>
          <div style={HP.sectionLabel}>Try it now</div>
          <h2 style={HP.sectionHeadline}>Paste your quotes below</h2>
          <p style={{ ...HP.sectionSub, marginBottom: 32 }}>
            One per line, messy is fine. We&rsquo;ll sort it all out.
          </p>

          {initialLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", marginBottom: 16, background: "var(--cp-bg-card)", border: "1px solid var(--cp-border-light)", borderRadius: 10, maxWidth: 640, margin: "0 auto 16px", fontSize: 13, color: "var(--cp-text-muted)" }}>
              <RefreshCw size={14} strokeWidth={2} className="spin" /> Restoring from cloud&hellip;
            </div>
          )}

          <div style={{ ...styles.inputCard, maxWidth: 640, margin: "0 auto" }}>
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
                rows={10}
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
                    <CheckCircle size={13} strokeWidth={2} /> {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded
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
                        <AlertTriangle size={12} strokeWidth={2} /> {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment
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
                  style={{ ...styles.processBtn, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }}
                  onClick={onProcess}
                  disabled={!rawInput.trim() || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Organize my collection \u2192"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TIMELINE — library growth over time
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={timelineRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(timelineVisible) }}
      >
        <div style={HP.sectionInner}>
          <div style={HP.sectionLabel}>Build over time</div>
          <h2 style={HP.sectionHeadline}>Your library grows with you</h2>
          <p style={HP.sectionSub}>
            Every quote you collect becomes part of your personal archive.
            Over time, it becomes a rich repository of the ideas that shaped your thinking.
          </p>

          <div style={HP.timeline}>
            {TIMELINE_MOMENTS.map((moment, i) => (
              <div
                key={i}
                style={{
                  ...HP.timelineMoment,
                  ...reveal(timelineVisible, 0.15 + i * 0.2),
                }}
              >
                {/* Dot + connecting line */}
                <div style={HP.timelineDotWrap}>
                  <div style={HP.timelineDot} />
                  {i < TIMELINE_MOMENTS.length && <div style={HP.timelineLine} />}
                </div>

                {/* Content */}
                <div style={HP.timelineContent}>
                  <div style={HP.timelinePeriod}>{moment.period}</div>
                  <div style={HP.timelineCount}>{moment.count} quotes</div>
                  <div style={HP.timelineQuotes}>
                    {moment.quotes.map((q, j) => (
                      <div key={j} className="hp-timeline-quote" style={HP.timelineQuote}>
                        <span style={HP.timelineQuoteTag(q.tag)}>{q.tag}</span>
                        <span style={HP.timelineQuoteText}>&ldquo;{q.text}&rdquo;</span>
                        <span style={HP.timelineQuoteSrc}>&mdash; {q.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Final milestone */}
            <div
              style={{
                ...HP.timelineMoment,
                paddingBottom: 0,
                ...reveal(timelineVisible, 0.15 + TIMELINE_MOMENTS.length * 0.2),
              }}
            >
              <div style={HP.timelineDotWrap}>
                <div style={{ ...HP.timelineDot, background: CP_ACCENT, width: 14, height: 14, marginLeft: -3, marginTop: -3 }} />
              </div>
              <div style={HP.timelineContent}>
                <div style={HP.timelinePeriod}>Your library</div>
                <div style={{ ...HP.timelineCount, fontSize: 28, color: CP_ACCENT }}>200+ quotes</div>
                <div style={{ fontSize: 13, color: "var(--cp-text-muted)", marginTop: 4, fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
                  Searchable, organized, always accessible
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
        <div style={HP.sectionInner}>
          <div style={HP.sectionLabel}>Features</div>
          <h2 style={HP.sectionHeadline}>Everything you need</h2>
          <p style={HP.sectionSub}>
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
                color: "#7C3AED",
              },
              {
                icon: Download,
                title: "Flexible export",
                desc: "Export as CSV, Markdown, or JSON. Compatible with Notion, Obsidian, and more.",
                color: "#059669",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="hp-feature-card"
                  style={{
                    ...HP.featureCard,
                    ...reveal(featuresVisible, 0.1 + i * 0.12),
                  }}
                >
                  <div style={{ ...HP.featureIconWrap, background: `${f.color}12` }}>
                    <Icon size={24} color={f.color} strokeWidth={1.5} />
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
        <div style={{ ...HP.sectionInner, textAlign: "center" }}>
          <h2 style={{ ...HP.sectionHeadline, fontSize: 36, marginBottom: 16 }}>
            Start building your library
          </h2>
          <p style={{ ...HP.sectionSub, marginBottom: 32 }}>
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
