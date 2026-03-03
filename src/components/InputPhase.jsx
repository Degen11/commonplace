import Logo from "./Logo";
import HowItWorksAnimation from "./HowItWorksAnimation";
import Footer from "./Footer";
import { Z } from "./styles";
import { smartSplit } from "../utils/helpers";
import { EXAMPLE_QUOTES } from "../data/constants";
import {
  Pencil, Upload, FolderOpen, FileText,
  AlertTriangle, CheckCircle, PenLine, LayoutGrid,
  GripVertical, Download, Copy, Search,
} from "lucide-react";

export default function InputPhase({
  fadeClass,
  rawInput, setRawInput,
  inputTab, setInputTab,
  isDragOver, setIsDragOver,
  importedFileName,
  formattingEnabled, setFormattingEnabled,
  isProcessing,
  onProcess,
  onFileImport,
  fileInputRef,
}) {
  const handleDropZone = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileImport(file);
  };

  return (
    <div style={Z.wrap} className={fadeClass}>

      <div style={Z.landing}>
        {/* ── Two-column split layout ── */}
        <div className="split-layout" style={Z.splitLayout}>

          {/* Left column — brand mark + tagline + animated demo */}
          <div style={Z.splitLeft}>
            <div>
              <div style={Z.heroBrandWrap}>
                <Logo size={36} />
                <h1 style={Z.heroBrandName}>Commonplace</h1>
              </div>
              <p style={Z.heroTagline}>Organize your quote collection</p>
              <p style={Z.splitDesc}>Paste your messy quotes, phrases, and fragments. We'll organize everything and identify the sources.</p>
              <p style={{ fontSize: 13, color: "#B0ACA6", marginTop: 12, letterSpacing: "0.01em" }}>No signup · Private processing · Instant results · Zero cost</p>
            </div>

            {/* Animated "How It Works" demo */}
            <div id="how" style={{ width: "100%", marginTop: "auto" }}>
              <HowItWorksAnimation />
            </div>
          </div>

          {/* Right column — input area */}
          <div style={Z.splitRight}>
            <div style={{ ...Z.inputCard, maxWidth: "none" }}>
              <div style={Z.tabRow}>
                <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "paste" ? Z.tabBtnActive : {}), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => setInputTab("paste")}><Pencil size={14} strokeWidth={1.5} /> Type / Paste</button>
                <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "import" ? Z.tabBtnActive : {}), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => setInputTab("import")}><Upload size={14} strokeWidth={1.5} /> Import File</button>
              </div>

              {inputTab === "paste" && (
                <textarea style={Z.bigTextarea} value={rawInput} onChange={e => setRawInput(e.target.value)}
                  placeholder={"Paste everything here — one per line, messy is fine:\n\nYou can't handle the truth\nThe world breaks everyone — Hemingway\n\"Be the change\" (Gandhi)\nTo infinity and beyond\nNot all those who wander are lost — Tolkien"} rows={12} />
              )}

              {inputTab === "import" && (
                <div className="drop-zone" style={{ ...Z.dropZone, ...(isDragOver ? Z.dropZoneActive : {}) }}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".txt,.csv" style={{ display: "none" }}
                    onChange={e => { onFileImport(e.target.files[0]); e.target.value = ""; }} />
                  <div style={{ ...Z.dropIcon, display: "flex", justifyContent: "center" }}>{isDragOver ? <FolderOpen size={32} color="#2383E2" strokeWidth={1.5} /> : <FileText size={32} color="#9B9A97" strokeWidth={1.5} />}</div>
                  <div style={Z.dropTitle}>{isDragOver ? "Drop it!" : "Drop a .txt or .csv file"}</div>
                  <div style={Z.dropSub}>or click to browse — supports Kindle highlights and Readwise exports</div>
                  {importedFileName && (
                    <div style={Z.dropFileName}><CheckCircle size={13} strokeWidth={2} /> {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded</div>
                  )}
                </div>
              )}

              <div style={Z.inputFooter}>
                {(() => {
                  const count = rawInput.trim() ? smartSplit(rawInput.trim()).length : 0;
                  const hasFancyChars = /[\u201C\u201D\u2018\u2019\u2014\u2013\u2026]/.test(rawInput);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={Z.entryMeta}>
                        {count > 0 ? `${count} ${count === 1 ? "entry" : "entries"} detected` : "Quotes, phrases, expressions — all welcome"}
                      </span>
                      {count > 50 && (
                        <span style={Z.warnBadge}><AlertTriangle size={12} strokeWidth={2} /> {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment</span>
                      )}
                      {hasFancyChars && !formattingEnabled && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#0369A1", background: "#EFF6FF", padding: "3px 8px", borderRadius: 50, fontWeight: 500, cursor: "pointer", border: "1px solid #DBEAFE" }}
                          onClick={() => setFormattingEnabled(true)}>
                          Smart quotes detected — enable formatting cleanup?
                        </span>
                      )}
                      <label className="ui-tip ui-tip-below" data-tip="Normalize quotes, dashes, and whitespace" style={Z.fmtToggleWrap} onClick={() => setFormattingEnabled(p => !p)}>
                        <div style={{ ...Z.fmtToggleTrack, background: formattingEnabled ? "#1A1814" : "#E0DCD4" }}>
                          <div style={{ ...Z.fmtToggleThumb, left: formattingEnabled ? 15 : 2 }} />
                        </div>
                        Clean up formatting
                      </label>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!rawInput.trim() && inputTab === "paste" && <button className="try-btn" style={Z.tryBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>Try it with examples</button>}
                  <button className="proc-btn" style={{ ...Z.processBtn, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }} onClick={onProcess} disabled={!rawInput.trim() || isProcessing}>
                    {isProcessing ? "Processing..." : "Organize my collection →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Features — 6 key features in 3×2 grid ── */}
        <div style={{ width: "100%", maxWidth: 800, marginTop: 56, animation: "fadeUp .6s .1s ease both" }}>
          <div style={{ ...Z.howSectionTitle, marginTop: 0, marginBottom: 20 }}>
            <span style={Z.howSectionTitleLine} />
            Powerful features
            <span style={Z.howSectionTitleLine} />
          </div>

          <div className="features-grid" style={Z.featuresGrid}>
            {[
              { icon: PenLine, title: "Inline editing", color: "#2383E2" },
              { icon: LayoutGrid, title: "Bulk operations", color: "#7C3AED" },
              { icon: GripVertical, title: "Drag to reorder", color: "#EA580C" },
              { icon: Download, title: "Multiple exports", color: "#059669" },
              { icon: Copy, title: "Duplicate detection", color: "#0D9488" },
              { icon: Search, title: "Search & filter", color: "#4338CA" },
            ].map(f => {
              const Icon = f.icon;
              return (
              <div key={f.title} className="feature-card" style={Z.featureCard}>
                <div style={{ ...Z.featureIcon, background: `${f.color}15` }}>
                  <Icon size={20} color={f.color} strokeWidth={1.5} />
                </div>
                <div style={Z.featureContent}>
                  <div style={Z.featureTitle}>{f.title}</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <Footer styles={Z} />
      </div>
    </div>
  );
}
