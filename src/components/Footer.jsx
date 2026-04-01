import { useState } from "react";
import { Globe, X } from "lucide-react";

const GITHUB_PATH = "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
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
          padding: "20px 24px", overflowY: "auto", textAlign: "left",
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d={GITHUB_PATH} /></svg>
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
