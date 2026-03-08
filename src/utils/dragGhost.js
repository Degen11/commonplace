// Multi-drag ghost: stacked card with count badge
let ghostEl = null;

export function setMultiDragImage(e, count) {
  cleanupDragGhost();

  const ghost = document.createElement("div");
  ghost.style.cssText = `
    position:fixed;top:-1000px;left:-1000px;
    width:220px;padding:10px 14px;
    background:var(--cp-bg-card);border:1px solid var(--cp-border);
    border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);
    font:13px/1.4 'DM Sans',-apple-system,sans-serif;color:var(--cp-text);
    pointer-events:none;z-index:9999;
  `;
  // Stacked layers behind
  const layer1 = document.createElement("div");
  layer1.style.cssText = `
    position:absolute;top:4px;left:4px;right:4px;bottom:-4px;
    background:var(--cp-bg-card);border:1px solid var(--cp-border);
    border-radius:8px;z-index:-1;
  `;
  const layer2 = document.createElement("div");
  layer2.style.cssText = `
    position:absolute;top:8px;left:8px;right:8px;bottom:-8px;
    background:var(--cp-bg-card);border:1px solid var(--cp-border);
    border-radius:8px;z-index:-2;opacity:0.6;
  `;
  // Count badge
  const badge = document.createElement("div");
  badge.style.cssText = `
    position:absolute;top:-8px;right:-8px;
    background:#3C5775;color:#fff;
    font-size:11px;font-weight:700;
    min-width:20px;height:20px;
    border-radius:10px;
    display:flex;align-items:center;justify-content:center;
    padding:0 5px;
  `;
  badge.textContent = count;

  ghost.textContent = `${count} quotes`;
  ghost.appendChild(layer1);
  ghost.appendChild(layer2);
  ghost.appendChild(badge);
  document.body.appendChild(ghost);
  ghostEl = ghost;

  e.dataTransfer.setDragImage(ghost, 110, 20);
}

export function cleanupDragGhost() {
  if (ghostEl) { ghostEl.remove(); ghostEl = null; }
}
