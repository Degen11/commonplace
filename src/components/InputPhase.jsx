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
            <span>📂 You have <strong>{savedSession.quotes.length}</strong> entries saved from your last session</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={Z.restoreBtn} onClick={onRestoreSession}>Restore session</button>
              <button style={Z.restoreDismiss} onClick={onDismissSession}>Dismiss</button>
            </div>
          </div>
        )}

        <div style={Z.inputCard}>
          <div style={Z.tabRow}>
            <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "paste" ? Z.tabBtnActive : {}) }} onClick={() => setInputTab("paste")}>✏️ Type / Paste</button>
            <button className="tab-btn" style={{ ...Z.tabBtn, ...(inputTab === "import" ? Z.tabBtnActive : {}) }} onClick={() => setInputTab("import")}>📁 Import File</button>
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
              <div style={Z.dropIcon}>{isDragOver ? "📂" : "📄"}</div>
              <div style={Z.dropTitle}>{isDragOver ? "Drop it!" : "Drop a .txt or .csv file"}</div>
              <div style={Z.dropSub}>or click to browse — supports Kindle highlights and Readwise exports</div>
              {importedFileName && (
                <div style={Z.dropFileName}>✓ {importedFileName} — {rawInput ? smartSplit(rawInput).length : 0} entries loaded</div>
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
                    <span style={Z.warnBadge}>⚠ {count} entries — will process in {Math.ceil(count / 20)} batches, may take a moment</span>
                  )}
                  <label style={Z.fmtToggleWrap} onClick={() => setFormattingEnabled(p => !p)}>
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

        <TransformPreview />

        <div id="how" style={Z.howSection}>
          <div style={Z.howSectionTitle}>
            <span style={Z.howSectionTitleLine} />
            How it works
            <span style={Z.howSectionTitleLine} />
          </div>
          <div style={Z.howGrid}>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}>📋</div>
              <div style={Z.howCardTitle}>Paste anything</div>
              <div style={Z.howCardDesc}>One entry per line. Attribution hints via dashes, parentheses, or tildes — or nothing at all. Messy is fine.</div>
            </div>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}>⚡</div>
              <div style={Z.howCardTitle}>Local first</div>
              <div style={Z.howCardDesc}>600+ common quotes matched instantly from a built-in database. Zero API calls, zero cost, millisecond results.</div>
            </div>
            <div className="how-card" style={Z.howCard}>
              <div style={Z.howCardIcon}>🤖</div>
              <div style={Z.howCardTitle}>AI for the rest</div>
              <div style={Z.howCardDesc}>Unrecognized quotes go to Claude Haiku in batches of 20. Source, category, and confidence — all returned.</div>
            </div>
          </div>

          <div style={{...Z.howSectionTitle, marginTop: 48, marginBottom: 20}}>
            <span style={Z.howSectionTitleLine} />
            Powerful features
            <span style={Z.howSectionTitleLine} />
          </div>

          <div style={Z.featuresGrid}>
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="#2383E2" strokeWidth="2" strokeLinecap="round"/></svg>, title: "Inline editing", color: "#2383E2" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="7" height="6" rx="1" stroke="#7C3AED" strokeWidth="1.5" fill="none"/><rect x="11" y="5" width="7" height="6" rx="1" stroke="#7C3AED" strokeWidth="1.5" fill="none"/><rect x="2" y="13" width="7" height="4" rx="1" stroke="#7C3AED" strokeWidth="1.5" fill="none"/><rect x="11" y="13" width="7" height="4" rx="1" stroke="#7C3AED" strokeWidth="1.5" fill="none"/></svg>, title: "Bulk operations", color: "#7C3AED" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 3v14M14 3v14" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 7l3-3 3 3M17 13l-3 3-3-3" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: "Drag to reorder", color: "#EA580C" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v3m0 5v6m-4-4h8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="7" stroke="#059669" strokeWidth="1.5" fill="none"/></svg>, title: "Multiple exports", color: "#059669" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 9l3-3 3 3M10 6v8m-7 1h14" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: "Shareable links", color: "#DC2626" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#0891B2" strokeWidth="1.5" fill="none"/><path d="M10 6v4l3 2" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Session restore", color: "#0891B2" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="2.5" rx="1" stroke="#9333EA" strokeWidth="1.5" fill="none"/><rect x="3" y="9" width="9" height="2.5" rx="1" stroke="#9333EA" strokeWidth="1.5" fill="none"/><rect x="3" y="13" width="6" height="2.5" rx="1" stroke="#9333EA" strokeWidth="1.5" fill="none"/></svg>, title: "Custom categories", color: "#9333EA" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="4" stroke="#0D9488" strokeWidth="1.5" fill="none"/><circle cx="13" cy="13" r="4" stroke="#0D9488" strokeWidth="1.5" fill="none"/></svg>, title: "Duplicate detection", color: "#0D9488" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5l4 4 4-4M15 11l-4 4-4-4" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: "Smart formatting", color: "#D97706" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2" fill="#E11D48"/><circle cx="10" cy="10" r="6" stroke="#E11D48" strokeWidth="1.5" fill="none"/></svg>, title: "Confidence indicators", color: "#E11D48" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#4338CA" strokeWidth="1.5" fill="none"/><path d="M14 14l3 3" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Search & filter", color: "#4338CA" },
              { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="4" height="8" rx="1" stroke="#0369A1" strokeWidth="1.5" fill="none"/><rect x="8" y="4" width="4" height="12" rx="1" stroke="#0369A1" strokeWidth="1.5" fill="none"/><rect x="13" y="10" width="4" height="6" rx="1" stroke="#0369A1" strokeWidth="1.5" fill="none"/></svg>, title: "Keyboard shortcuts", color: "#0369A1" },
            ].map(f => (
              <div key={f.title} className="feature-card" style={Z.featureCard}>
                <div style={{ ...Z.featureIcon, background: `${f.color}15` }}>
                  {f.icon}
                </div>
                <div style={Z.featureContent}>
                  <div style={Z.featureTitle}>{f.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Footer styles={Z} />
      </div>
    </div>
  );
}
