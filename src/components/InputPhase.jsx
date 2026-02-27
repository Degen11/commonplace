import { FolderOpen, Pencil, FileText, Check, AlertTriangle, ClipboardList, Zap, Bot, Info } from "lucide-react";
import TransformPreview from "./TransformPreview";
import Footer from "./Footer";
import { baseCSS, Z } from "./styles";
import { smartSplit } from "../utils/helpers";
import { EXAMPLE_QUOTES } from "../data/constants";

export default function InputPhase({
  fadeClass,
  rawInput, setRawInput,
  inputTab, setInputTab,
  isDragOver, setIsDragOver,
  importedFileName,
  formattingEnabled, setFormattingEnabled,
  savedSession,
  isProcessing,
  onProcess,
  onFileImport,
  onRestoreSession,
  onDismissSession,
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
      <style>{baseCSS}</style>
      <nav style={Z.nav}>
        <span style={Z.navLogo}>Commonplace</span>
        <div style={Z.navRight}>
          <a className="nav-link" href="#how" style={{ color: "#9A9590", textDecoration: "none" }}>How it works</a>
        </div>
      </nav>

      <div style={Z.landing}>
        <div style={Z.hero}>
          <h1 style={Z.heroTitle}>Commonplace</h1>
          <p style={Z.heroSub}>Paste your messy quotes, phrases, and fragments.<br />We'll organize everything and identify the sources.</p>
        </div>

        {savedSession && (
          <div style={Z.restoreBanner}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FolderOpen size={15} /> You have <strong>{savedSession.quotes.length}</strong> entries saved from your last session</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={Z.restoreBtn} onClick={onRestoreSession}>Restore session</button>
              <button style={Z.restoreDismiss} onClick={onDismissSession}>Dismiss</button>
            </div>
          </div>
        )}

        <div style={Z.inputCard}>
          <div style={Z.tabRow}>
            <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "paste" ? Z.tabBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }} onClick={() => setInputTab("paste")}><Pencil size={13} /> Type / Paste</button>
            <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "import" ? Z.tabBtnActive : {}), display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }} onClick={() => setInputTab("import")}><FolderOpen size={13} /> Import File</button>
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
              <div style={Z.dropIcon}>{isDragOver ? <FolderOpen size={32} color="#2383E2" /> : <FileText size={32} color="#9B9A97" />}</div>
              <div style={Z.dropTitle}>{isDragOver ? "Drop it!" : "Drop a .txt or .csv file"}</div>
              <div style={Z.dropSub}>or click to browse — supports Kindle highlights and Readwise exports</div>
              {importedFileName && (
                <div style={Z.dropFileName}><Check size={13} /> {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded</div>
              )}
            </div>
          )}

          <div style={Z.inputFooter}>
            {(() => {
              const count = rawInput.trim() ? smartSplit(rawInput.trim()).length : 0;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={Z.entryMeta}>
                    {count > 0 ? `${count} ${count === 1 ? "entry" : "entries"} detected` : "Quotes, phrases, expressions — all welcome"}
                  </span>
                  {count > 50 && (
                    <span style={Z.warnBadge}><AlertTriangle size={12} /> {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment</span>
                  )}
                  <label style={Z.fmtToggleWrap} onClick={() => setFormattingEnabled(p => !p)}>
                    <div style={{ ...Z.fmtToggleTrack, background: formattingEnabled ? "#1A1814" : "#E0DCD4" }}>
                      <div style={{ ...Z.fmtToggleThumb, left: formattingEnabled ? 15 : 2 }} />
                    </div>
                    Clean up formatting
                    <span className="conf-tooltip" data-tip="Fixes capitalization, converts straight quotes to curly quotes, normalizes dashes and spacing" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", cursor: "help" }}><Info size={12} color="#9B9A97" /></span>
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

        <TransformPreview />

        <div id="how" style={Z.howSection}>
          <div style={Z.howSectionTitle}>
            <span style={Z.howSectionTitleLine} />
            How it works
            <span style={Z.howSectionTitleLine} />
          </div>
          <div style={Z.howGrid}>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}><ClipboardList size={24} color="#3C5775" /></div>
              <div style={Z.howCardTitle}>Paste anything</div>
              <div style={Z.howCardDesc}>One entry per line. Attribution hints via dashes, parentheses, or tildes — or nothing at all. Messy is fine.</div>
            </div>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}><Zap size={24} color="#D97706" /></div>
              <div style={Z.howCardTitle}>Local first</div>
              <div style={Z.howCardDesc}>600+ common quotes matched instantly from a built-in database. Zero API calls, zero cost, millisecond results.</div>
            </div>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}><Bot size={24} color="#059669" /></div>
              <div style={Z.howCardTitle}>AI for the rest</div>
              <div style={Z.howCardDesc}>Unrecognized quotes go to Claude Haiku in batches of 20. Source, category, and confidence — all returned.</div>
            </div>
          </div>

          <div style={{ marginTop: 40, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#9B9A97", marginBottom: 14, fontWeight: 400 }}>
              Powerful features
            </div>
            <div style={Z.featPills}>
              {[
                "Inline editing", "Bulk operations", "Drag to reorder", "Multiple exports",
                "Shareable links", "Session restore", "Custom categories", "Duplicate detection",
                "Smart formatting", "Confidence indicators", "Search & filter", "Keyboard shortcuts",
              ].map(title => (
                <span key={title} className="feat-pill" style={Z.featPill}>
                  <span style={Z.featPillDot} />
                  {title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Footer styles={Z} />
      </div>
    </div>
  );
}
