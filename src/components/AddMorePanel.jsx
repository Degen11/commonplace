import { useState, useRef } from "react";
import { smartSplit } from "../utils/textFormatting";
import { handleRichTextShortcut } from "../utils/richTextKeys";
import { styles, CP_ACCENT, CP_ACCENT_10, CLR_BLUE, CLR_RED } from "./styles";
import { Pencil, Bot, FileText, FolderOpen, CircleCheckBig, Link, Eye } from "lucide-react";
import UrlPreviewModal, { EXTRACT_MODES } from "./UrlPreviewModal";

export default function AddMorePanel({
  addMoreInput, setAddMoreInput,
  addMoreFormatting, setAddMoreFormatting,
  addMoreRef,
  onAddMore,
  onQuickAdd,
  onCancel,
  allCats,
  onFileImport,
}) {
  const [tab, setTab] = useState("identify");
  const [quickText, setQuickText] = useState("");
  const [quickSource, setQuickSource] = useState("");
  const [quickCategory, setQuickCategory] = useState("Reflection");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [extractMode, setExtractMode] = useState("all");
  const [urlPreview, setUrlPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEntryPreview, setShowEntryPreview] = useState(false);
  const fileInputRef = useRef(null);
  const lastUrlRef = useRef("");

  const handleQuickAdd = () => {
    if (!quickText.trim()) return;
    onQuickAdd(quickText.trim(), quickSource.trim(), quickCategory);
    setQuickText("");
    setQuickSource("");
    setQuickCategory("Reflection");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && onFileImport) {
      onFileImport(file, setAddMoreInput, setImportedFileName);
      setTab("identify");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileImport) {
      onFileImport(file, setAddMoreInput, setImportedFileName);
      setTab("identify");
    }
    e.target.value = "";
  };

  const handleUrlFetch = async (modeOverride) => {
    const trimmed = urlInput.trim() || lastUrlRef.current;
    if (!trimmed) return;
    const useMode = modeOverride || extractMode;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "CommonplaceApp" },
        body: JSON.stringify({ url: trimmed, extractMode: useMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      if (!data.lines || data.lines.length === 0) throw new Error("No text content found");
      lastUrlRef.current = trimmed;
      setUrlPreview(data);
      setShowPreviewModal(true);
    } catch (e) {
      setUrlError(e.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handlePreviewConfirm = (selectedLines) => {
    setAddMoreInput(selectedLines.join("\n"));
    setShowPreviewModal(false);
    setUrlInput("");
    setTab("identify");
  };

  const handlePreviewRefetch = async (newMode) => {
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
      setUrlPreview(data);
    } catch (e) {
      setUrlError(e.message);
    }
  };

  const tabStyle = (active) => ({
    flex: 1, padding: "5px 0", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
    background: active ? "var(--cp-bg-card)" : "transparent",
    color: active ? "var(--cp-text)" : "var(--cp-text-muted)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  });

  return (
    <>
      {showPreviewModal && urlPreview && (
        <UrlPreviewModal
          preview={urlPreview}
          currentMode={extractMode}
          onConfirm={handlePreviewConfirm}
          onCancel={() => setShowPreviewModal(false)}
          onRefetch={handlePreviewRefetch}
        />
      )}
      <div style={{ display: "flex", gap: 2, marginBottom: 10, background: "var(--cp-bg-tab)", borderRadius: 6, padding: 2 }}>
        <button style={tabStyle(tab === "identify")} onClick={() => setTab("identify")}>
          <Bot size={13} strokeWidth={1.5} /> Paste & identify
        </button>
        <button style={tabStyle(tab === "import")} onClick={() => setTab("import")}>
          <FileText size={13} strokeWidth={1.5} /> Import
        </button>
        <button style={tabStyle(tab === "quick")} onClick={() => setTab("quick")}>
          <Pencil size={13} strokeWidth={1.5} /> Quick add
        </button>
      </div>

      {tab === "identify" ? (
        <>
          <textarea ref={addMoreRef} style={{ ...styles.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
            onKeyDown={e => handleRichTextShortcut(e, addMoreInput, setAddMoreInput)}
            placeholder="Paste additional quotes, one per line. Similar entries will be flagged for review." />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8, gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <label className="ui-tip ui-tip-below" data-tip="Normalize quotes, dashes, and whitespace" style={styles.fmtToggleWrap} onClick={() => setAddMoreFormatting(p => !p)}>
                <div style={{ ...styles.fmtToggleTrack, background: addMoreFormatting ? "var(--cp-text)" : "var(--cp-toggle-off)" }}>
                  <div style={{ ...styles.fmtToggleThumb, left: addMoreFormatting ? 15 : 2 }} />
                </div>
                Clean up formatting
              </label>
              <span style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                {addMoreInput.trim() ? `${smartSplit(addMoreInput.trim()).length} entries` : "These will be added to your existing collection"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
              <button style={{ ...styles.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={onAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
            </div>
          </div>
        </>
      ) : tab === "import" ? (
        <>
          <div
            className="drop-zone"
            style={{ ...styles.dropZone, ...(isDragOver ? styles.dropZoneActive : {}), padding: "24px 16px", minHeight: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json,.md"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <div style={{ ...styles.dropIcon, display: "flex", justifyContent: "center", marginBottom: 8 }}>
              {isDragOver
                ? <FolderOpen size={24} color={CLR_BLUE} strokeWidth={1.5} />
                : <FileText size={24} color="var(--cp-text-muted)" strokeWidth={1.5} />}
            </div>
            <div style={{ ...styles.dropTitle, fontSize: 13 }}>{isDragOver ? "Drop it!" : "Drop a file or click to browse"}</div>
            <div style={{ ...styles.dropSub, fontSize: 12 }}>Supports .txt, .csv, .json, .md — Kindle, Readwise, Notion</div>
            {importedFileName && addMoreInput.trim() && (
              <div style={{ ...styles.dropFileName, marginTop: 8 }}>
                <CircleCheckBig size={13} strokeWidth={2} /> {importedFileName} — {smartSplit(addMoreInput.trim()).length} entries loaded
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0", color: "var(--cp-text-faint)", fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: "var(--cp-border-light)" }} />
            <span>or from URL</span>
            <div style={{ flex: 1, height: 1, background: "var(--cp-border-light)" }} />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleUrlFetch(); }}
              placeholder="https://example.com/quotes"
              style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--cp-border)", background: "var(--cp-bg-input, #fff)", color: "var(--cp-text)", fontSize: 12, fontFamily: "inherit", outline: "none" }}
            />
            <button
              onClick={() => handleUrlFetch()}
              disabled={urlLoading || !urlInput.trim()}
              style={{ padding: "7px 12px", borderRadius: 6, border: "none", background: urlLoading ? "var(--cp-border)" : "#2383E2", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              {urlLoading ? "..." : "Fetch"}
            </button>
          </div>

          {/* Extraction mode selector */}
          <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
            {EXTRACT_MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setExtractMode(m.value)}
                className="ui-tip ui-tip-below"
                data-tip={m.desc}
                style={{
                  padding: "2px 8px",
                  borderRadius: 50,
                  border: extractMode === m.value ? `1px solid ${CP_ACCENT}` : "1px solid var(--cp-border)",
                  background: extractMode === m.value ? CP_ACCENT_10 : "transparent",
                  color: extractMode === m.value ? CP_ACCENT : "var(--cp-text-faint)",
                  fontSize: 10,
                  fontWeight: extractMode === m.value ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .15s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {urlError && <div style={{ marginTop: 6, fontSize: 11, color: CLR_RED }}>{urlError}</div>}

          {addMoreInput.trim() && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--cp-text-muted)" }}>
                    {smartSplit(addMoreInput.trim()).length} entries ready to add
                  </span>
                  <button
                    onClick={() => setShowEntryPreview(p => !p)}
                    style={{
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                      fontSize: 11, color: CP_ACCENT, fontWeight: 500, padding: "2px 6px",
                      borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3,
                      transition: "background .12s",
                    }}
                  >
                    <Eye size={11} strokeWidth={2} />
                    {showEntryPreview ? "Hide" : "Preview"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
                  <button style={styles.editSave} onClick={onAddMore}>Add & identify</button>
                </div>
              </div>

              {/* Inline entry preview */}
              {showEntryPreview && (
                <div style={{
                  marginTop: 6, maxHeight: 160, overflow: "auto", padding: "6px 8px",
                  background: "var(--cp-bg-card)", border: "1px solid var(--cp-border-light)",
                  borderRadius: 6, fontSize: 11, lineHeight: 1.5, color: "var(--cp-text-secondary)",
                  animation: "slideD .15s ease",
                }}>
                  {smartSplit(addMoreInput.trim()).slice(0, 25).map((line, i) => (
                    <div key={i} style={{ padding: "3px 0", borderBottom: "1px solid var(--cp-border-light)" }}>{line}</div>
                  ))}
                  {smartSplit(addMoreInput.trim()).length > 25 && (
                    <div style={{ padding: "3px 0", color: "var(--cp-text-faint)", fontStyle: "italic" }}>
                      ...and {smartSplit(addMoreInput.trim()).length - 25} more
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            style={{ ...styles.textarea, minHeight: 60 }}
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            placeholder="Type or paste a single quote..."
            onKeyDown={e => {
              if (handleRichTextShortcut(e, quickText, setQuickText)) return;
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleQuickAdd(); }
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              style={{ ...styles.editIn, flex: 1, minWidth: 140 }}
              value={quickSource}
              onChange={e => setQuickSource(e.target.value)}
              placeholder="Source (author, film, book...)"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleQuickAdd(); } }}
            />
            <select
              style={styles.editSel}
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value)}
            >
              {allCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--cp-text-faint)" }}>
              {"\u2318"}+Enter to save
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.editCancel} onClick={onCancel}>Cancel</button>
              <button
                style={{ ...styles.editSave, opacity: !quickText.trim() ? .4 : 1 }}
                onClick={handleQuickAdd}
                disabled={!quickText.trim()}
              >
                Add quote
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
