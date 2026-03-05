import { Globe, Github } from "lucide-react";

// ── Footer ──
export default function Footer({ styles }) {
  return (
    <footer style={styles.footer}>
      <span>Built by Degen Hill</span>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10 }}>
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
      </div>
    </footer>
  );
}
