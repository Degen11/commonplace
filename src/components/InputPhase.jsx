import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import Logo from "./Logo";
import HowItWorksAnimation from "./HowItWorksAnimation";
import Footer from "./Footer";
import { styles, CP_ACCENT, FONT_SANS, CLR_EMERALD } from "./styles";
import { smartSplit, basicFormat } from "../utils/textFormatting";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { EXAMPLE_QUOTES } from "../data/constants";
import {
  Pencil, Upload, FolderOpen, FileText,
  TriangleAlert, CircleCheckBig, ArrowRight, ChevronDown,
  Sparkles, PenLine, Download, RefreshCw, Library,
  Moon, Sun, Monitor, Loader,
} from "lucide-react";
import UrlImportPanel from "./UrlImportPanel";
import { HP, TIMELINE_MOMENTS, reveal } from "./inputPhaseStyles";

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
        <motion.div layoutId="app-logo" style={HP.navBrand} transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}>
          <Logo size={24} />
          <span style={HP.navName}>Commonplace</span>
        </motion.div>
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
                <motion.button
                  layoutId="phase-action"
                  className="proc-btn"
                  style={{ ...styles.processBtn, display: "flex", alignItems: "center", gap: 6, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }}
                  onClick={onProcess}
                  disabled={!rawInput.trim() || isProcessing}
                  transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.9 }}
                >
                  {isProcessing ? (
                    <>
                      <Loader size={14} strokeWidth={2} className="spin" />
                      Processing...
                    </>
                  ) : "Organize my collection \u2192"}
                </motion.button>
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
