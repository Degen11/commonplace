import { useState, useRef } from "react";
import { CP_ACCENT, CP_ACCENT_10 } from "./styles";
import { API_HEADERS } from "../utils/api";
import { Filter } from "lucide-react";
import UrlPreviewModal, { EXTRACT_MODES } from "./UrlPreviewModal";

export default function UrlImportPanel({ onLoad }) {
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
          onChange={e => { setUrl(e.target.value); setError(null); }}
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
