import { useState } from "react";
import { Globe, Github, X } from "lucide-react";
import { FONT_SANS } from "./styles";

// ── Legal modal ──
function LegalModal({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "var(--cp-overlay)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "overlayFade .15s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--cp-bg-card)", borderRadius: 6,
          width: "90%", maxWidth: 640, maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          boxShadow: "var(--cp-shadow-md)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--cp-border-light)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: FONT_SANS, color: "var(--cp-text)" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", padding: 4 }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div style={{
          padding: "20px 24px", overflowY: "auto",
          fontSize: 13, lineHeight: 1.7, color: "var(--cp-text-secondary)", fontFamily: FONT_SANS,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const sectionTitle = { fontSize: 14, fontWeight: 600, color: "var(--cp-text)", margin: "16px 0 6px" };
const firstSectionTitle = { ...sectionTitle, marginTop: 0 };

function PrivacyContent() {
  return (
    <>
      <p style={{ color: "var(--cp-text-muted)", marginBottom: 16 }}>Last updated: March 2026</p>

      <h3 style={firstSectionTitle}>What we collect</h3>
      <p>Commonplace stores your quotes and collections in your browser&apos;s local storage. If you use cloud sync, your data is also stored in our database (Supabase) and associated with an anonymous device ID &mdash; no email, name, or account required.</p>

      <h3 style={sectionTitle}>How we use your data</h3>
      <p>Your quotes are sent to our AI service (Claude by Anthropic) solely to identify sources and categories. We cache identification results to speed up future lookups. We do not sell, share, or use your data for advertising.</p>

      <h3 style={sectionTitle}>Analytics</h3>
      <p>We use Vercel Analytics and Speed Insights to collect anonymous performance metrics (page load times, Web Vitals). No personal information or quote content is included in analytics.</p>

      <h3 style={sectionTitle}>Cookies &amp; local storage</h3>
      <p>We do not use tracking cookies. We use browser local storage to save your quotes, preferences, and theme settings. A random device ID is stored for cloud sync.</p>

      <h3 style={sectionTitle}>Third-party services</h3>
      <p>Anthropic (AI identification), Supabase (cloud storage), Vercel (hosting and analytics), Google Fonts and Fontshare (web fonts). Each has their own privacy policy.</p>

      <h3 style={sectionTitle}>Data deletion</h3>
      <p>Clear your browser&apos;s local storage to remove all local data. Cloud-synced data can be removed by clearing your collection and syncing, which propagates the deletion.</p>

      <h3 style={sectionTitle}>Contact</h3>
      <p>Questions? Reach out via <a href="https://www.degenh.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cp-accent)" }}>degenh.com</a>.</p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p style={{ color: "var(--cp-text-muted)", marginBottom: 16 }}>Last updated: March 2026</p>

      <h3 style={firstSectionTitle}>Service</h3>
      <p>Commonplace is a free tool for organizing quote collections. We provide it as-is, without guarantees of uptime or availability.</p>

      <h3 style={sectionTitle}>Your content</h3>
      <p>You retain ownership of all quotes and text you input. We do not claim any rights to your content. Content is processed by AI solely to identify sources and categories.</p>

      <h3 style={sectionTitle}>Acceptable use</h3>
      <p>Don&apos;t abuse the service (excessive API calls, automated scraping, or using it to process content that violates applicable law).</p>

      <h3 style={sectionTitle}>Data &amp; availability</h3>
      <p>Your primary data is stored locally in your browser. Cloud sync is a convenience backup, not a guaranteed storage service. We recommend exporting important collections regularly.</p>

      <h3 style={sectionTitle}>Limitation of liability</h3>
      <p>Commonplace is provided &quot;as is&quot; without warranty. We are not liable for data loss, service interruptions, or inaccurate AI identifications.</p>

      <h3 style={sectionTitle}>Changes</h3>
      <p>We may update these terms. Continued use of the service constitutes acceptance of updated terms.</p>
    </>
  );
}

// ── Footer ──
export default function Footer({ styles }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <footer style={styles.footer}>
      <span>Built by Degen Hill</span>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", marginTop: 10 }}>
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--cp-text)", display: "inline-flex", alignItems: "center" }}
        >
          <Globe size={16} strokeWidth={1.5} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--cp-text)", display: "inline-flex", alignItems: "center" }}
        >
          <Github size={16} strokeWidth={1.5} />
        </a>
        <span style={{ color: "var(--cp-border-dim)" }}>&middot;</span>
        <button
          onClick={() => setShowPrivacy(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", fontSize: 12, fontFamily: "inherit", padding: 0 }}
        >
          Privacy
        </button>
        <button
          onClick={() => setShowTerms(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cp-text-muted)", fontSize: 12, fontFamily: "inherit", padding: 0 }}
        >
          Terms
        </button>
      </div>

      {showPrivacy && (
        <LegalModal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <PrivacyContent />
        </LegalModal>
      )}
      {showTerms && (
        <LegalModal title="Terms of Service" onClose={() => setShowTerms(false)}>
          <TermsContent />
        </LegalModal>
      )}
    </footer>
  );
}
