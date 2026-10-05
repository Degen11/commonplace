import { useEffect, useState, useRef } from "react";
import { API_HEADERS } from "../utils/api";
import { motion } from "motion/react";
import Logo from "./Logo";
import Wordmark from "./Wordmark";
import HowItWorksAnimation from "./HowItWorksAnimation";
import Footer from "./Footer";
import { styles, CP_ACCENT, FONT_SANS, CLR_EMERALD } from "./styles";
import { smartSplit, basicFormat } from "../utils/textFormatting";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { EXAMPLE_QUOTES, getCatColor } from "../data/constants";
import { FAQ_ITEMS } from "../data/faq";
import {
  Pencil, Upload, FolderOpen, FileText,
  TriangleAlert, CircleCheckBig, ArrowRight, ChevronDown,
  Download, RefreshCw, Search, Tag, Folder,
  Loader, Lock, Check, ArrowDown, Sparkles,
} from "lucide-react";
import UrlImportPanel from "./UrlImportPanel";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { HP, reveal } from "./inputPhaseStyles";
import { pluralize } from "../utils/helpers";

// ── Scroll-reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  // Start revealed where there's no IntersectionObserver, which includes the
  // build-time prerender, so the static markup shows every section to
  // crawlers and to visitors before JS loads.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
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
  // Open by default — previously required a click to see what formatting
  // was about to change, so most people never looked.
  const [expanded, setExpanded] = useState(true);
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
        Preview changes ({pluralize(samples.length, "fix", "fixes")})
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
            <div style={{ fontSize: 11, color: "var(--cp-text-faint)", fontStyle: "italic" }}>Showing first 5 entries…</div>
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
  const [faqRef, faqVisible] = useScrollReveal(0.1);
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  // Pre-warm the /api/identify serverless function on first keystroke.
  // The rejected request still causes the function to initialize (cold-start eliminated).
  const prewarmedRef = useRef(false);
  useEffect(() => {
    if (!rawInput.trim() || prewarmedRef.current) return;
    prewarmedRef.current = true;
    const schedule = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
    schedule(() => {
      fetch("/api/identify", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ messages: [], formatting: false }),
      }).catch(() => {});
    });
  }, [rawInput]);

  const handleDropZone = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileImport(file);
  };

  // File drops on the paste textarea route to the importer instead of the
  // browser default (which navigates away). Text drags keep native behavior.
  const isFileDrag = (e) => e.dataTransfer.types.includes("Files");
  const pasteDropHandlers = {
    onDragOver: (e) => { if (isFileDrag(e)) { e.preventDefault(); setIsDragOver(true); } },
    onDragLeave: () => setIsDragOver(false),
    onDrop: (e) => { if (isFileDrag(e)) handleDropZone(e); },
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "var(--cp-bg)", minHeight: "100dvh", fontFamily: FONT_SANS }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED NAV
      ═══════════════════════════════════════════════════════════════════════ */}
      <nav style={HP.nav}>
        <motion.div layoutId="app-logo" style={HP.navBrand} transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}>
          <Logo size={24} />
          <Wordmark height={17} color="var(--cp-text)" />
        </motion.div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggleButton dark={dark} themeMode={themeMode} toggleTheme={toggleTheme} />
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO — split layout: headline left, input card right
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-hero" id="input-section" style={HP.hero}>
        <div style={HP.heroGlow} />

        {/* Left column — headline & value prop */}
        <div style={HP.heroLeft}>
          <h1 className="hp-hero-headline" style={HP.heroHeadline}>
            <span style={HP.heroProblem}>Free AI quote organizer</span>
            Your personal<br />library of ideas
          </h1>
          <p className="hp-hero-sub" style={HP.heroSub}>
            Paste messy quotes, phrases, and fragments.
            We organize everything and identify the sources.
          </p>
          <ul className="hp-hero-trust" style={HP.heroTrust}>
            {["No signup", "Stays in your browser", "Free"].map(t => (
              <li key={t} style={HP.heroTrustItem}>
                <Check size={13} strokeWidth={2.25} aria-hidden="true" style={{ color: "var(--cp-accent)" }} /> {t}
              </li>
            ))}
          </ul>

          {/* What you get — a messy line and the quote it turns into */}
          <div className="hp-hero-preview" style={HP.heroPreview} aria-hidden="true">
            <span style={HP.heroPreviewRaw}>not all who wander are lost - tolkien</span>
            <span style={HP.heroPreviewArrow}>
              <ArrowDown size={13} strokeWidth={2} /> becomes
            </span>
            <div style={HP.heroPreviewCard}>
              <span style={HP.heroPreviewQuote}>&ldquo;Not all those who wander are lost.&rdquo;</span>
              <span style={HP.heroPreviewMeta}>
                <span style={{ fontWeight: 500, color: "var(--cp-text-secondary)" }}>J.R.R. Tolkien</span>
                <span style={{ color: "var(--cp-text-muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>The Fellowship of the Ring</span>
                <span style={{ ...styles.tag, background: getCatColor("Book", []).bg, color: getCatColor("Book", []).text }}>Book</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right column — input card */}
        <div style={HP.heroRight}>
          {initialLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", marginBottom: 16, background: "var(--cp-bg-card)", border: "1px solid var(--cp-border-light)", borderRadius: 6, fontSize: 13, color: "var(--cp-text-muted)" }}>
              <RefreshCw size={14} strokeWidth={2} className="spin" /> Restoring from cloud&hellip;
            </div>
          )}

          {/* No fade-in here (unlike styles.inputCard elsewhere): the card is part of the
              prerendered first paint, and its placeholder text can be the LCP element. */}
          <div className="input-card" style={{ ...styles.inputCard, maxWidth: "100%", animation: "none" }}>
            {/* Tab row */}
            <div role="tablist" aria-label="Add quotes by" style={styles.tabRow}>
              <button
                role="tab"
                aria-selected={inputTab === "paste"}
                className="tab-btn"
                style={{ ...styles.tabBtn, ...(inputTab === "paste" ? styles.tabBtnActive : {}) }}
                onClick={() => setInputTab("paste")}
              >
                <Pencil size={14} strokeWidth={1.5} /> Paste
              </button>
              <button
                role="tab"
                aria-selected={inputTab === "import"}
                className="tab-btn"
                style={{ ...styles.tabBtn, ...(inputTab === "import" ? styles.tabBtnActive : {}) }}
                onClick={() => setInputTab("import")}
              >
                <Upload size={14} strokeWidth={1.5} /> Import file
              </button>
            </div>

            {inputTab === "paste" && (
              <div style={{ position: "relative" }}>
                <textarea
                  className="paste-area"
                  style={{
                    ...styles.bigTextarea,
                    ...(isDragOver ? { boxShadow: `inset 0 0 0 2px ${CP_ACCENT}`, background: "var(--cp-bg-selected)" } : {}),
                  }}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && rawInput.trim() && !isProcessing) {
                      e.preventDefault();
                      onProcess();
                      return;
                    }
                    handleRichTextShortcut(e, rawInput, setRawInput);
                  }}
                  aria-label="Paste your quotes"
                  {...pasteDropHandlers}
                  placeholder={"Paste quotes here, one per line. Messy is fine, we\u2019ll clean it up."}
                  rows={8}
                />
                {/* Empty-state shortcuts, sitting where the eye already is */}
                {!rawInput.trim() && !isDragOver && (
                  <div className="paste-shortcuts" style={styles.pasteShortcuts}>
                    <button className="try-btn" style={styles.pasteShortcutBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>
                      <Sparkles size={13} strokeWidth={2} aria-hidden="true" /> Try sample quotes
                    </button>
                    <button className="try-btn" style={styles.pasteShortcutBtn} onClick={() => setInputTab("import")}>
                      <Upload size={13} strokeWidth={2} aria-hidden="true" /> Import from Kindle, Readwise, CSV&hellip;
                    </button>
                  </div>
                )}
              </div>
            )}

            {inputTab === "import" && (
              <div style={styles.importPane}>
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
                    ? <FolderOpen size={32} style={{ color: "var(--cp-info)" }} strokeWidth={1.5} />
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
              </div>
            )}

            <div className="input-footer" style={styles.inputFooter}>
              {(() => {
                const trimmed = rawInput.trim();
                const count = trimmed ? smartSplit(trimmed).length : 0;
                const charCount = rawInput.length;
                const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
                const hasFancyChars = /[\u201C\u201D\u2018\u2019\u2014\u2013\u2026]/.test(rawInput);
                return (
                  <div className="input-footer-meta" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                    <div style={styles.inputFooterRow}>
                      <span style={styles.entryMeta}>
                        {pluralize(count, "entry", "entries")}
                        {count > 0 && <span className="input-footer-wordcount" style={{ color: "var(--cp-text-faint)", marginLeft: 8, fontSize: 11 }}>{wordCount.toLocaleString()} words &middot; {charCount.toLocaleString()} chars</span>}
                      </span>
                      <span aria-hidden="true" style={styles.inputFooterSep} />
                      <label
                        className="ui-tip ui-tip-below"
                        data-tip="Normalize quotes, dashes, and whitespace"
                        style={styles.fmtToggleWrap}
                        onClick={() => setFormattingEnabled(!formattingEnabled)}
                      >
                        <div style={{ ...styles.fmtToggleTrack, background: formattingEnabled ? "var(--cp-accent)" : "var(--cp-toggle-off)" }}>
                          <div style={{ ...styles.fmtToggleThumb, left: formattingEnabled ? 15 : 2 }} />
                        </div>
                        Clean up formatting
                      </label>
                    </div>
                    {count > 50 && (
                      <span style={styles.warnBadge}>
                        <TriangleAlert size={12} strokeWidth={2} /> {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment
                      </span>
                    )}
                    {hasFancyChars && !formattingEnabled && (
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
                          color: "var(--cp-accent)", background: "var(--cp-bg-selected)", padding: "3px 8px", borderRadius: 50,
                          fontWeight: 500, cursor: "pointer", border: "1px solid var(--cp-border)",
                        }}
                        onClick={() => setFormattingEnabled(true)}
                      >
                        Smart quotes detected — enable formatting cleanup?
                      </span>
                    )}
                    {formattingEnabled && count > 0 && <FormattingPreview rawInput={rawInput} />}
                  </div>
                );
              })()}
              <div className="input-footer-actions" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
                <motion.button
                  layoutId="phase-action"
                  className="proc-btn ui-tip ui-tip-below"
                  data-tip="⌘/Ctrl + Enter"
                  style={{ ...styles.processBtn, display: "flex", alignItems: "center", gap: 6, ...(!rawInput.trim() ? styles.processBtnIdle : {}), ...(isProcessing ? { opacity: 0.6 } : {}) }}
                  onClick={onProcess}
                  disabled={!rawInput.trim() || isProcessing}
                  transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.9 }}
                >
                  {isProcessing ? (
                    <>
                      <Loader size={14} strokeWidth={2} className="spin" />
                      Processing…
                    </>
                  ) : <>Organize <ArrowRight size={15} strokeWidth={2} /></>}
                </motion.button>
              </div>
            </div>
          </div>
          <p style={HP.heroFinePrint}>
            <Lock size={13} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 3 }} />
            <span>Quotes we can't match are sent to Claude (by Anthropic) to find the source. Nothing else leaves your browser unless you turn on cloud sync.</span>
          </p>
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
          FAQ — same content as the FAQPage JSON-LD in index.html (src/data/faq.js)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={faqRef}
        className="hp-section"
        style={{ ...HP.section, ...HP.sectionAlt, ...reveal(faqVisible) }}
      >
        <div style={{ ...HP.sectionInner, maxWidth: 720 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={HP.sectionLabel}>FAQ</div>
            <h2 style={HP.sectionHeadline}>Questions, answered</h2>
          </div>

          <div style={HP.faqList}>
            {FAQ_ITEMS.map((item, i) => (
              <details key={item.q} className="hp-faq-item" style={{ ...HP.faqItem, ...reveal(faqVisible, 0.08 + i * 0.05) }}>
                <summary style={HP.faqQuestion}>
                  <span>{item.q}</span>
                  <ChevronDown className="hp-faq-chevron" size={16} strokeWidth={2} style={HP.faqChevron} />
                </summary>
                <p style={HP.faqAnswer}>{item.a}</p>
              </details>
            ))}
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
        <div className="hp-features-split" style={{ ...HP.sectionInner, ...HP.featuresSplit }}>
          <div>
            <div style={HP.sectionLabel}>Features</div>
            <h2 style={{ ...HP.sectionHeadline, marginBottom: 0 }}>From a messy paste to a library you can use</h2>
          </div>

          <div className="hp-features-grid" style={HP.featuresGrid}>
            {[
              {
                icon: Search,
                title: "Finds the source",
                desc: "Checks 3,700+ known quotes first, then asks Claude about anything it can\u2019t match.",
                demo: (
                  <span style={HP.featureDemo}>
                    <span style={{ color: "var(--cp-text-faint)" }}>you miss 100% of the shots&hellip;</span>
                    <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                    <span style={{ color: "var(--cp-text)" }}>Wayne Gretzky</span>
                  </span>
                ),
              },
              {
                icon: Tag,
                title: "Sorts and tidies",
                desc: "Gives every quote a category, cleans up quotes and dashes, and catches duplicates.",
                demo: (
                  <span style={{ ...HP.featureDemo, gap: 6 }}>
                    {["Motivational", "Philosophical", "Book"].map(c => {
                      const col = getCatColor(c, []);
                      return <span key={c} style={{ ...styles.tag, background: col.bg, color: col.text }}>{c}</span>;
                    })}
                  </span>
                ),
              },
              {
                icon: Folder,
                title: "Collections your way",
                desc: "Group quotes by hand, or let Smart group sort them by theme.",
                demo: (
                  <span style={{ ...HP.featureDemo, gap: 14, color: "var(--cp-text-secondary)" }}>
                    {[["Stoic mornings", 12], ["Wedding toast", 4], ["Book club", 9]].map(([name, n]) => (
                      <span key={name}>{name} <span style={{ color: "var(--cp-text-faint)" }}>{n}</span></span>
                    ))}
                  </span>
                ),
              },
              {
                icon: Download,
                title: "Goes where you write",
                desc: "Export to CSV, Markdown, JSON, plain text or Anki, or share a public link for 30 days.",
                demo: (
                  <span style={{ ...HP.featureDemo, gap: 6 }}>
                    {[".csv", ".md", ".json", "Anki"].map(f => <span key={f} style={HP.featureChip}>{f}</span>)}
                  </span>
                ),
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`hp-feature hp-feature-${i % 2 ? "right" : "left"}${i < 2 ? " hp-feature-top" : ""}`}
                  style={{
                    ...HP.feature,
                    ...(i % 2 ? HP.featureRight : HP.featureLeft),
                    ...(i < 2 ? HP.featureTopRow : {}),
                    ...reveal(featuresVisible, 0.1 + i * 0.1),
                  }}
                >
                  <Icon size={18} strokeWidth={1.75} style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
                  <h3 style={HP.featureTitle}>{f.title}</h3>
                  <p style={HP.featureDesc}>{f.desc}</p>
                  {f.demo}
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
            Free. No account. No signup required.
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
