import { motion } from "motion/react";
import StatsPanel from "./StatsPanel";
import useScrollLock from "../hooks/useScrollLock";

export default function StatsOverlay({
  quotes, computedStats, cc, customCats,
  headerVisible, preserveScroll,
  onClose,
}) {
  useScrollLock();
  const handleClose = () => {
    if (!headerVisible) preserveScroll();
    onClose();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Collection statistics"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.15, ease: "easeOut" } }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      ref={el => { if (el && !el.dataset.trapped) { el.dataset.trapped = "1"; el.focus(); } }}
      tabIndex={-1}
      onKeyDown={e => {
        if (e.key !== "Tab") return;
        const focusable = e.currentTarget.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.12, ease: "easeIn" } }}
        style={{ maxWidth: "min(90vw, 720px)", width: "100%" }}
      >
        <StatsPanel quotes={quotes} computedStats={computedStats} cc={cc} customCats={customCats} onClose={handleClose} />
      </motion.div>
    </motion.div>
  );
}
