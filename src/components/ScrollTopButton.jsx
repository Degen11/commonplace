import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Z } from "../data/constants";

// Floating "scroll to top" button. Fades in once the user has scrolled
// past ~600px and jumps back to the top of the page. Positioned bottom-left
// to avoid the bottom-right help/collections controls.
const SHOW_THRESHOLD_PX = 600;

export default function ScrollTopButton({ isMobile, bottomOffset = 20 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD_PX);
    onScroll(); // sync initial state (e.g. when mounted already scrolled)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      className="ui-tip hdr-btn"
      data-tip="Back to top"
      aria-label="Scroll back to top"
      onClick={scrollToTop}
      tabIndex={visible ? 0 : -1}
      style={{
        position: "fixed", bottom: bottomOffset, left: isMobile ? 16 : 20,
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid var(--cp-border)", background: "var(--cp-bg-card)",
        boxShadow: "var(--cp-shadow-card)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--cp-text-muted)", zIndex: Z.OVERLAY,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity .2s ease, transform .2s ease, bottom .2s ease, box-shadow .15s ease",
      }}
    >
      <ArrowUp size={16} strokeWidth={1.5} />
    </button>
  );
}
