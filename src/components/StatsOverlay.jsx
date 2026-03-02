import StatsPanel from "./StatsPanel";

export default function StatsOverlay({
  quotes, computedStats, cc, customCats,
  headerVisible, preserveScroll,
  onClose,
}) {
  const handleClose = () => {
    if (!headerVisible) preserveScroll();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collection statistics"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "overlayFade .15s ease",
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
      <div style={{ maxWidth: 720, width: "100%" }}>
        <StatsPanel quotes={quotes} computedStats={computedStats} cc={cc} customCats={customCats} onClose={handleClose} />
      </div>
    </div>
  );
}
