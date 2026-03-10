export const IMAGE_STYLES = {
  classic: {
    label: "Classic",
    bg: "#FAF8F4",
    accent: "#3C5775",
    text: "#1A1814",
    attr: "#9A9590",
    border: "#E8E3DA",
    quoteMark: "rgba(60,87,117,0.07)",
    brandColor: "#3C5775",
  },
  dark: {
    label: "Dark",
    bg: "#1A1D23",
    accent: "#C9A87C",
    text: "#E8E3DA",
    attr: "#8A8580",
    border: "#2E3238",
    quoteMark: "rgba(201,168,124,0.08)",
    brandColor: "#C9A87C",
  },
  minimal: {
    label: "Minimal",
    bg: "#FFFFFF",
    accent: "#222222",
    text: "#222222",
    attr: "#888888",
    border: "#E5E5E5",
    quoteMark: "rgba(0,0,0,0.03)",
    brandColor: "#222222",
  },
};

export async function generateShareImage(q, styleName = "classic") {
  const theme = IMAGE_STYLES[styleName] || IMAGE_STYLES.classic;
  const W = 1080, H = 1080, PAD = 72;

  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, W, 6);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  const bi = 32;
  ctx.strokeRect(bi, bi, W - bi * 2, H - bi * 2);

  ctx.fillStyle = theme.quoteMark;
  ctx.font = `bold 280px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u201C", PAD - 10, PAD + 220);

  const textX = PAD + 8;
  const textMaxW = W - PAD * 2 - 16;
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  const words = (q.text || "").split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > textMaxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  // Cap at 8 lines with ellipsis
  if (lines.length > 8) {
    lines.splice(8);
    let last = lines[7];
    while (ctx.measureText(last + "\u2026").width > textMaxW && last.length > 1)
      last = last.slice(0, -1).trimEnd();
    lines[7] = last + "\u2026";
  }

  const lineH = 62;
  const blockH = lines.length * lineH;
  const attrH = 28;
  const totalH = blockH + 40 + attrH;
  const textStartY = Math.round(Math.max(PAD + 180, (H - totalH) * 0.46 + lineH));

  ctx.fillStyle = theme.text;
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textStartY + i * lineH);
  });

  const attrY = textStartY + blockH + 40;
  ctx.fillStyle = theme.accent;
  ctx.font = `400 26px 'DM Sans', -apple-system, sans-serif`;
  const dash = "\u2014 ";
  const dashW = ctx.measureText(dash).width;
  ctx.fillText(dash, textX, attrY);
  ctx.fillStyle = theme.attr;
  ctx.fillText(q.source || "", textX + dashW, attrY);

  drawBranding(ctx, W, H, PAD, theme.brandColor);

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png");
  });
}

function drawBookIcon(ctx, x, y, size, color) {
  const s = size / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "none";

  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.bezierCurveTo(13.5, 5.5, 10, 5, 7, 5);
  ctx.bezierCurveTo(5.5, 5, 4, 5.8, 4, 7.5);
  ctx.lineTo(4, 23.5);
  ctx.bezierCurveTo(4, 25, 5.5, 25.5, 7, 25.5);
  ctx.bezierCurveTo(10, 25.5, 13.5, 26.2, 16, 28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.bezierCurveTo(18.5, 5.5, 22, 5, 25, 5);
  ctx.bezierCurveTo(26.5, 5, 28, 5.8, 28, 7.5);
  ctx.lineTo(28, 23.5);
  ctx.bezierCurveTo(28, 25, 26.5, 25.5, 25, 25.5);
  ctx.bezierCurveTo(22, 25.5, 18.5, 26.2, 16, 28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16, 7);
  ctx.lineTo(16, 28);
  ctx.stroke();

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(21, 5);
  ctx.lineTo(21, 14);
  ctx.lineTo(23, 12.5);
  ctx.lineTo(25, 14);
  ctx.lineTo(25, 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(21, 5);
  ctx.lineTo(21, 14);
  ctx.lineTo(23, 12.5);
  ctx.lineTo(25, 14);
  ctx.lineTo(25, 5);
  ctx.stroke();

  ctx.restore();
}

function drawBranding(ctx, W, H, PAD, color) {
  const brandY = H - PAD - 12;
  const fontSize = 22;
  const iconSize = 26;

  ctx.fillStyle = color;
  ctx.font = `700 ${fontSize}px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "right";
  const textW = ctx.measureText("Commonplace").width;
  const textX = W - PAD - 8;
  ctx.fillText("Commonplace", textX, brandY);

  const iconX = textX - textW - iconSize - 8;
  const iconY = brandY - iconSize + 4;
  drawBookIcon(ctx, iconX, iconY, iconSize, color);
}
