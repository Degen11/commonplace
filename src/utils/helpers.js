import { QUOTED_CATS } from "../data/constants";

// ── Proper noun set — lazy-initialized when localQuotes DB is first loaded ──
// Populated by initProperNouns() called from useProcessing on first run.
// basicFormat gracefully skips step 6 if not yet initialized.
let _properNouns = null;

const _SKIP_WORDS = new Set([
  // Articles / prepositions / conjunctions
  "the","a","an","of","in","on","at","to","for","and","or","but","with",
  "from","by","via","as","is","was","are","be","been","has","have","had",
  // Pronouns / determiners
  "it","its","this","that","these","those","my","his","her","our","your",
  // Common verbs
  "get","got","go","goes","make","take","want","know","say","think","see",
  "come","give","find","tell","ask","seem","feel","look","leave","call",
  // Category / meta words
  "film","tv","book","music","speech","person","phrase","various",
  "attributed","often","unknown","parts","series","season","episode",
  "act","scene","chapter","vol","pt","ep","version",
  // Words that appear capitalized in titles but aren't proper nouns
  "man","men","women","woman","boy","girl","one","two","three","four","five",
  "six","seven","eight","nine","ten","new","old","big","little","great",
  "long","good","bad","best","last","first","next","right","left","high",
  "low","real","true","false","black","white","red","blue","green","dark",
  "light","hard","soft","hot","cold","fast","slow","free","full","back",
  "front","night","day","life","time","world","home","house","road","way",
  "end","start","stop","run","walk","stand","fall","rise","love","hate",
  "fear","hope","pain","joy","heart","mind","soul","fire","water","air",
  "earth","sky","sun","moon","star","wild","sweet","beautiful","perfect",
  "simple","broken","lost","found","gone","dead","alive","young","old",
  // Common song/movie title words that get extracted but aren't proper nouns
  "dreams","dream","heroes","hero","changes","change","perfect","thunder",
  "animal","animals","africa","imagine","creep","humble","gods","plan","plans",
  "normal","rolling","deep","rolling","somebody","nobody","everybody","anybody",
  "always","never","forever","sometimes","just","only","every","another",
  "nothing","something","everything","anything","somewhere","nowhere","here",
  "where","there","when","while","after","before","until","since","still",
  "already","again","even","also","too","very","well","down","up","out",
  "over","under","through","between","against","without","within","about",
  "their","them","they","him","her","its","who","what","why","how",
  "all","both","each","few","many","much","more","most","other","some",
  "such","no","nor","not","same","so","than","then","there","though",
  "into","during","across","along","off","away",
]);

// Called once from useProcessing after dynamic-importing localQuotes.
export function initProperNouns(db) {
  if (_properNouns) return; // already initialized
  const wordSources = new Map();
  db.forEach(entry => {
    const words = entry.s.split(/[\s\-\u2013\u2014,()[\]/&]+/);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z']/g, "");
      if (
        clean.length > 2 &&
        /^[A-Z]/.test(clean) &&
        !_SKIP_WORDS.has(clean.toLowerCase()) &&
        !/^\d/.test(clean)
      ) {
        if (!wordSources.has(clean)) wordSources.set(clean, new Set());
        wordSources.get(clean).add(entry.s);
      }
    });
  });
  const nouns = new Set();
  wordSources.forEach((sources, word) => {
    if (sources.size >= 2) nouns.add(word);
  });
  _properNouns = nouns;
}

// Common misspellings — conservative, only clear-cut cases
const MISSPELLINGS = {
  "recieve": "receive", "beleive": "believe", "freind": "friend",
  "occured": "occurred", "begining": "beginning", "seperate": "separate",
  "definately": "definitely", "untill": "until",
  "alot": "a lot", "noone": "no one",
  "everytime": "every time", "nevermind": "never mind",
};

// ===================== TEXT FORMATTING =====================
export function basicFormat(text) {
  let t = text.trim();
  if (!t) return t;

  // 1. Strip leading copy-paste junk (bullets, numbers, dashes)
  t = t.replace(/^[\s\u2022\u00b7\u2013\u2014\-*>#]+/, "")
       .replace(/^\d{1,4}\s*\.\s*/, "")
       .replace(/^\d{1,4}\s+(?=[A-Z])/, "")
       .trim();

  // 2. Collapse multiple spaces
  t = t.replace(/  +/g, " ");

  // 3. Fix lowercase "i" and contractions
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi'm\b/gi, "I'm")
       .replace(/\bi'll\b/gi, "I'll")
       .replace(/\bi've\b/gi, "I've")
       .replace(/\bi'd\b/gi, "I'd");

  // 4. Fix missing apostrophes in common contractions
  t = t.replace(/\bcant\b/g, "can't")
       .replace(/\bdont\b/g, "don't")
       .replace(/\bwont\b/g, "won't")
       .replace(/\bdidnt\b/g, "didn't")
       .replace(/\bdoesnt\b/g, "doesn't")
       .replace(/\bwouldnt\b/g, "wouldn't")
       .replace(/\bcouldnt\b/g, "couldn't")
       .replace(/\bshouldnt\b/g, "shouldn't")
       .replace(/\bisnt\b/g, "isn't")
       .replace(/\barent\b/g, "aren't")
       .replace(/\bwasnt\b/g, "wasn't")
       .replace(/\bwerent\b/g, "weren't")
       .replace(/\bhasnt\b/g, "hasn't")
       .replace(/\bhavent\b/g, "haven't")
       .replace(/\bhadnt\b/g, "hadn't")
       .replace(/\bthats\b/g, "that's")
       .replace(/\bwhats\b/g, "what's")
       .replace(/\bwhos\b/g, "who's");

  // 5. Common misspellings
  Object.entries(MISSPELLINGS).forEach(([wrong, right]) => {
    t = t.replace(new RegExp("\\b" + wrong + "\\b", "gi"), (match) =>
      match[0] === match[0].toUpperCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right
    );
  });

  // 6. Capitalize known proper nouns (only if DB has been loaded via initProperNouns)
  if (_properNouns) {
    _properNouns.forEach(noun => {
      const lower = noun.toLowerCase();
      t = t.replace(new RegExp("\\b" + lower + "\\b", "g"), noun);
    });
  }

  // 7. Capitalize first letter
  t = t.charAt(0).toUpperCase() + t.slice(1);

  // 8. Curly quotes
  t = t.replace(/(^|[-\s([{<])"(\S)/g, "$1\u201C$2")
       .replace(/(\S)"([\s)\]}>,.!?;:]|$)/g, "$1\u201D$2");

  return t;
}

export function smartSplit(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

// ===================== TEXT PROCESSING =====================
export function normalize(s) {
  return (s || "")
    .normalize("NFKD")                 // splits accents
    .toLowerCase()
    .replace(/\p{M}/gu, "")            // removes accent marks only
    .replace(/[^\p{L}\p{N}\s]/gu, "")  // keeps letters/numbers from ALL scripts
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(s) {
  return new Set(
    normalize(s)
      .split(" ")
      .filter(Boolean)
      .filter(w => (w.match(/[\p{L}\p{N}]/gu) || []).length >= 2)
  );
}

export function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  const wa = wordSet(a), wb = wordSet(b);
  if (!wa.size || !wb.size) return 0;

  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return (overlap * 2) / (wa.size + wb.size);
}

export function smartParse(line) {
  let t = line.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('\u201C') && t.endsWith('\u201D')) || (t.startsWith("'") && t.endsWith("'")))
    t = t.slice(1, -1).trim();
  const parenMatch = t.match(/^(.+?)\s*\(([^)]{2,50})\)\s*$/);
  if (parenMatch && parenMatch[1].length > parenMatch[2].length)
    return { text: parenMatch[1].replace(/^["'\u201C]+|["'\u201D]+$/g, "").trim(), hint: parenMatch[2].trim() };
  const seps = [/\s*\u2014\s*/, /\s*\u2013\s*/, /\s*--\s*/, /\s+-\s+/, /\s*~\s*/];
  for (const sep of seps) {
    const parts = t.split(sep);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1].trim();
      const rest = parts.slice(0, -1).join(" — ").trim();
      if (last.length < 60 && rest.length > last.length)
        return { text: rest.replace(/^["'\u201C]+|["'\u201D]+$/g, "").trim(), hint: last.replace(/^["'\u201C]+|["'\u201D]+$/g, "").trim() };
    }
  }
  return { text: t.replace(/^["'\u201C]+|["'\u201D]+$/g, "").trim(), hint: null };
}

// ===================== CSV PARSING =====================
export function parseCSVLine(line) {
  const fields = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuote = !inQuote; }
    else if (line[i] === "," && !inQuote) { fields.push(cur.trim()); cur = ""; }
    else { cur += line[i]; }
  }
  fields.push(cur.trim());
  return fields;
}

// ===================== IMPORT PARSERS =====================
export function parseKindleClippings(content) {
  const clips = content.split("==========").filter(c => c.trim());
  const results = [];

  for (const clip of clips) {
    const lines = clip.trim().split("\n").map(l => l.trim());
    if (lines.length < 3) continue;

    const titleLine = lines[0];
    const metaLine = lines[1] || "";
    // Skip notes — only keep highlights
    if (metaLine.toLowerCase().includes("your note")) continue;

    const textLines = lines.slice(2).filter(Boolean);
    const text = textLines.join(" ").trim();
    if (!text || text.length < 3) continue;

    const match = titleLine.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    let hint;
    if (match) {
      const title = match[1].trim();
      const rawAuthor = match[2].trim();
      // Kindle stores author as "Last, First" — flip it
      const parts = rawAuthor.split(",").map(p => p.trim());
      const author = parts.length === 2 ? `${parts[1]} ${parts[0]}` : rawAuthor;
      hint = `${title} - ${author}`;
    } else {
      hint = titleLine.trim();
    }

    results.push({ text, hint });
  }

  return results;
}

export function parseReadwiseCSV(content) {
  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  const highlightIdx = headers.indexOf("highlight");
  const titleIdx = Math.max(headers.indexOf("book title"), headers.indexOf("title"));
  const authorIdx = Math.max(headers.indexOf("book author"), headers.indexOf("author"));

  if (highlightIdx < 0) return [];

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const fields = parseCSVLine(lines[i]);
    const text = fields[highlightIdx]?.trim();
    if (!text) continue;

    const title = titleIdx >= 0 ? fields[titleIdx]?.trim() : null;
    const author = authorIdx >= 0 ? fields[authorIdx]?.trim() : null;

    let hint = null;
    if (title && author) hint = `${title} - ${author}`;
    else if (title) hint = title;
    else if (author) hint = author;

    results.push({ text, hint });
  }

  return results;
}

// ===================== DISPLAY =====================
export const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text}\u201D` : q.text;

// ===================== EXPORT =====================
function groupByCategory(quotes) {
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
  return grouped;
}

function download(content, name, type) {
  const b = new Blob([content], { type });
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u; a.download = name; a.click();
  URL.revokeObjectURL(u);
}

export function exportCSV(quotes) {
  const rows = [["Text", "Source", "Category", "Favorite"]];
  quotes.forEach(q => rows.push([
    `"${q.text.replace(/"/g, '""')}"`,
    `"${q.source.replace(/"/g, '""')}"`,
    q.category,
    q.favorite ? "yes" : "no",
  ]));
  download(rows.map(r => r.join(",")).join("\n"), "commonplace-export.csv", "text/csv");
}

export function exportMD(quotes) {
  const grouped = groupByCategory(quotes);
  let md = "# Commonplace Export\n\n";
  Object.entries(grouped).forEach(([cat, qs]) => {
    md += `## ${cat}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " ⭐" : "";
      QUOTED_CATS.has(q.category)
        ? md += `> \u201C${q.text}\u201D\n> \u2014 *${q.source}*${f}\n\n`
        : md += `- **${q.text}** \u2014 ${q.source}${f}\n`;
    });
    md += "\n";
  });
  download(md, "commonplace-export.md", "text/markdown");
}

export function exportJSON(quotes) {
  const data = quotes.map(q => ({ text: q.text, source: q.source, category: q.category, confidence: q.confidence, favorite: q.favorite }));
  download(JSON.stringify(data, null, 2), "commonplace-export.json", "application/json");
}

export function exportTXT(quotes) {
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `${cat.toUpperCase()}\n${"─".repeat(cat.length)}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " ★" : "";
      QUOTED_CATS.has(q.category)
        ? text += `"${q.text}" — ${q.source}${f}\n`
        : text += `${q.text} — ${q.source}${f}\n`;
    });
    text += "\n";
  });
  download(text.trim(), "commonplace-export.txt", "text/plain");
}

export function richCopyToClipboard(quotes) {
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `✦ ${cat.toUpperCase()}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " ★" : "";
      if (QUOTED_CATS.has(q.category)) {
        text += `\u201C${q.text}\u201D\n`;
        text += `    \u2014 ${q.source}${f}\n\n`;
      } else {
        text += `${q.text} \u2014 ${q.source}${f}\n\n`;
      }
    });
  });
  return navigator.clipboard.writeText(text.trim());
}

export function copyToClipboard(quotes) {
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `${cat}\n${"─".repeat(cat.length)}\n`;
    qs.forEach(q => {
      const f = q.favorite ? " ★" : "";
      QUOTED_CATS.has(q.category) ? text += `"${q.text}" — ${q.source}${f}\n` : text += `${q.text} — ${q.source}${f}\n`;
    });
    text += "\n";
  });
  return navigator.clipboard.writeText(text.trim());
}

// ===================== SHAREABLE LINKS =====================
export function encodeShareData(quotes) {
  const minimal = quotes.map(q => [q.text, q.source, q.category, q.favorite ? 1 : 0]);
  return btoa(unescape(encodeURIComponent(JSON.stringify(minimal))));
}

export function decodeShareData(hash) {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const arr = JSON.parse(json);
    return arr.map((q) => ({
      id: crypto.randomUUID(),
      text: q[0], source: q[1], category: q[2],
      confidence: "high", favorite: !!q[3],
    }));
  } catch { return null; }
}

// ===================== SHARE AS IMAGE =====================
// Draws a 1080×1080 PNG card for a single quote and returns a Blob.
// catColor: { bg: string, text: string } from getCatColor().
export async function generateShareImage(q, catColor) {
  const W = 1080, H = 1080, PAD = 72;

  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Thin border inset
  ctx.strokeStyle = "#E8E3DA";
  ctx.lineWidth = 1.5;
  const bi = 32;
  ctx.strokeRect(bi, bi, W - bi * 2, H - bi * 2);

  // Decorative open-quote watermark
  ctx.fillStyle = "rgba(60,87,117,0.06)";
  ctx.font = `bold 280px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  ctx.fillText("\u201C", PAD - 10, PAD + 220);

  // ── Measure and wrap quote text ──
  const textX = PAD + 8;
  const textMaxW = W - PAD * 2 - 16;
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  const words = q.text.split(" ");
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

  // ── Vertical centering ──
  const lineH = 62;
  const blockH = lines.length * lineH;
  const attrH = 28; // attribution font size
  const pillH = 36;
  const totalH = blockH + 36 + attrH + 48 + pillH;
  const textStartY = Math.round(Math.max(PAD + 180, (H - totalH) * 0.44 + lineH));

  // Draw quote lines
  ctx.fillStyle = "#1A1814";
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textStartY + i * lineH);
  });

  // Attribution
  const attrY = textStartY + blockH + 36;
  ctx.fillStyle = "#9A9590";
  ctx.font = `400 26px 'DM Sans', -apple-system, sans-serif`;
  ctx.fillText(`\u2014 ${q.source}`, textX, attrY);

  // Category pill
  const pillY = attrY + 48;
  ctx.font = `600 18px 'DM Sans', -apple-system, sans-serif`;
  const pillTxt = q.category;
  const pillTxtW = ctx.measureText(pillTxt).width;
  const px = 18, py = 8;
  const pillW = pillTxtW + px * 2;
  ctx.fillStyle = catColor.bg;
  _roundRect(ctx, textX, pillY - pillH + py, pillW, pillH, 6);
  ctx.fill();
  ctx.fillStyle = catColor.text;
  ctx.fillText(pillTxt, textX + px, pillY + py - 2);

  // Branding
  ctx.fillStyle = "#C8C4BC";
  ctx.font = `500 20px 'DM Sans', -apple-system, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("\u2756 Commonplace", W - PAD - 8, H - PAD - 12);

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png");
  });
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}