// Multi-drag ghost: compact pill with stacked shadow effect
let ghostEl = null;

export function setMultiDragImage(e, count) {
  cleanupDragGhost();

  const ghost = document.createElement("div");
  ghost.style.cssText = `
    position:fixed;top:-200px;left:-200px;
    display:inline-flex;align-items:center;gap:6px;
    padding:6px 12px 6px 10px;
    background:#3C5775;color:#fff;
    border-radius:4px;
    font:500 12px/1 'Satoshi',-apple-system,sans-serif;
    white-space:nowrap;
    box-shadow:
      4px 3px 0 -1px #2D4259,
      8px 6px 0 -2px rgba(45,66,89,0.45),
      0 4px 12px rgba(0,0,0,0.2);
    pointer-events:none;z-index:9999;
  `;

  // Grip dots icon (3×2 grid)
  const grip = document.createElement("div");
  grip.style.cssText = `
    display:grid;grid-template-columns:repeat(2,4px);gap:2px;
    opacity:0.5;
  `;
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement("div");
    dot.style.cssText = `width:3px;height:3px;border-radius:50%;background:#fff;`;
    grip.appendChild(dot);
  }

  const label = document.createElement("span");
  label.textContent = `${count} quotes`;

  ghost.appendChild(grip);
  ghost.appendChild(label);
  document.body.appendChild(ghost);
  ghostEl = ghost;

  e.dataTransfer.setDragImage(ghost, 40, 14);
}

export function cleanupDragGhost() {
  if (ghostEl) { ghostEl.remove(); ghostEl = null; }
}
