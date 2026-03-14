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

function wrapText(ctx, text, maxW) {
  const words = (text || "").split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function generateShareImage(q, styleName = "classic") {
  const theme = IMAGE_STYLES[styleName] || IMAGE_STYLES.classic;
  const W = 1080, PAD = 72;
  const MIN_H = 1080;

  await document.fonts.ready;

  // Use an offscreen canvas to measure text before deciding final height
  const measure = document.createElement("canvas");
  measure.width = W;
  measure.height = 1;
  const mCtx = measure.getContext("2d");

  const textX = PAD + 8;
  const textMaxW = W - PAD * 2 - 16;

  // Measure quote lines
  mCtx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  const lines = wrapText(mCtx, q.text, textMaxW);

  const lineH = 62;
  const blockH = lines.length * lineH;

  // Measure attribution lines
  const attrLineH = 38;
  let attrLines = [];
  if (q.source) {
    mCtx.font = `400 26px 'DM Sans', -apple-system, sans-serif`;
    const dash = "\u2014 ";
    const dashW = mCtx.measureText(dash).width;
    const attrMaxW = textMaxW - dashW;
    attrLines = wrapText(mCtx, q.source, attrMaxW);
  }
  const attrBlockH = Math.max(attrLines.length, 1) * attrLineH;

  // Calculate required height: top padding + quote mark area + quote + gap + attribution + gap + branding + bottom padding
  const quoteMarkSpace = 180;
  const gapAfterQuote = 40;
  const brandingH = 50;
  const bottomPad = PAD + 12;
  const contentH = quoteMarkSpace + blockH + gapAfterQuote + attrBlockH + brandingH + bottomPad;
  const H = Math.max(MIN_H, PAD + contentH + PAD);

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, W, 6);

  // Border
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  const bi = 32;
  ctx.strokeRect(bi, bi, W - bi * 2, H - bi * 2);

  // Opening quote mark
  ctx.fillStyle = theme.quoteMark;
  ctx.font = `bold 280px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u201C", PAD - 10, PAD + 220);

  // Vertically center content within available space, with a minimum top offset
  const totalContentH = blockH + gapAfterQuote + attrBlockH;
  const availableH = H - PAD - quoteMarkSpace - brandingH - bottomPad - PAD;
  const verticalOffset = Math.max(0, (availableH - totalContentH) / 2);
  const textStartY = Math.round(PAD + quoteMarkSpace + verticalOffset + lineH);

  // Draw quote text
  ctx.fillStyle = theme.text;
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textStartY + i * lineH);
  });

  // Draw attribution (wrapped)
  const attrStartY = textStartY + blockH + gapAfterQuote;
  if (attrLines.length > 0) {
    ctx.font = `400 26px 'DM Sans', -apple-system, sans-serif`;
    const dash = "\u2014 ";
    const dashW = ctx.measureText(dash).width;

    // Draw dash on first line
    ctx.fillStyle = theme.accent;
    ctx.fillText(dash, textX, attrStartY);

    // Draw attribution text lines
    ctx.fillStyle = theme.attr;
    attrLines.forEach((line, i) => {
      const x = i === 0 ? textX + dashW : textX;
      ctx.fillText(line, x, attrStartY + i * attrLineH);
    });
  }

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
