import { QUOTED_CATS } from "../data/constants";
import { groupBy } from "./helpers";

export const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text || ""}\u201D` : (q.text || "");

const groupByCategory = (quotes) => groupBy(quotes, "category");

function buildCollectionMap(collections) {
  const map = {};
  if (!collections?.length) return map;
  for (const c of collections) {
    for (const qid of c.quoteIds) {
      if (!map[qid]) map[qid] = [];
      map[qid].push(c.name);
    }
  }
  return map;
}

// ── Shared formatting helpers ──
// Each quote in an export has the same derived fields — extract once.

function quoteFields(q, colMap) {
  return {
    text: q.text || "",
    source: q.source || "",
    fav: q.favorite ? " \u2605" : "",
    collections: colMap[q.id]?.length ? colMap[q.id].join(", ") : "",
    isQuoted: QUOTED_CATS.has(q.category),
  };
}

// Iterate grouped quotes with per-category and per-quote callbacks.
function forEachGrouped(quotes, collections, { onCategory, onQuote, onCategoryEnd }) {
  const colMap = buildCollectionMap(collections);
  const grouped = groupByCategory(quotes);
  Object.entries(grouped).forEach(([cat, qs]) => {
    onCategory(cat);
    qs.forEach(q => onQuote(quoteFields(q, colMap), q));
    if (onCategoryEnd) onCategoryEnd(cat);
  });
}

// ── Download helpers ──

export function downloadBlob(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u; a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(u), 100);
}

function download(content, name, type) {
  downloadBlob(new Blob([content], { type }), name);
}

// Dated filename (commonplace-export-2026-07-10.csv) so repeat exports don't collide.
// Local date, not toISOString() — UTC would mislabel evening exports west of Greenwich.
// `label` distinguishes variants (e.g. "anki") so they don't clobber the plain export.
export function exportFilename(ext, label = "export") {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `commonplace-${label}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${ext}`;
}

// ── Export formats ──

export function exportCSV(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const esc = s => `"${(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  const rows = [[esc("Text"), esc("Source"), esc("Category"), esc("Favorite"), esc("Collection")]];
  quotes.forEach(q => rows.push([
    esc(q.text),
    esc(q.source),
    esc(q.category),
    esc(q.favorite ? "yes" : "no"),
    esc((colMap[q.id] || []).join(", ")),
  ]));
  // UTF-8 BOM ensures spreadsheet apps detect encoding correctly
  download("\uFEFF" + rows.map(r => r.join(",")).join("\n"), exportFilename("csv"), "text/csv;charset=utf-8");
}

export function exportMD(quotes, collections) {
  let md = "# Commonplace Export\n\n";
  forEachGrouped(quotes, collections, {
    onCategory(cat) { md += `## ${cat}\n\n`; },
    onQuote(f) {
      const c = f.collections ? ` \u2014 *${f.collections}*` : "";
      const star = f.fav ? " \u2B50" : "";
      f.isQuoted
        ? md += `> \u201C${f.text}\u201D\n> \u2014 *${f.source}*${star}${c}\n\n`
        : md += `- ${f.text} \u2014 ${f.source}${star}${c}\n`;
    },
    onCategoryEnd() { md += "\n"; },
  });
  download(md, exportFilename("md"), "text/markdown");
}

export function exportJSON(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const quoteData = quotes.map(q => {
    const entry = { id: q.id, text: q.text || "", source: q.source || "", category: q.category || "", confidence: q.confidence, favorite: q.favorite };
    const names = colMap[q.id];
    if (names?.length) entry.collections = names;
    return entry;
  });
  const data = { quotes: quoteData };
  if (collections?.length > 0) {
    data.collections = collections.map(c => ({ id: c.id, name: c.name, icon: c.icon || null, quoteIds: c.quoteIds }));
  }
  download(JSON.stringify(data, null, 2), exportFilename("json"), "application/json");
}

// Two-column CSV for Anki flashcard import: front = quote, back = source.
// No header row (Anki would import it as a card). Quoted fields + UTF-8 BOM.
export function exportAnki(quotes) {
  const esc = s => `"${(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
  const rows = quotes.map(q => [esc(displayText(q)), esc(q.source)].join(","));
  download("\uFEFF" + rows.join("\r\n"), exportFilename("csv", "anki"), "text/csv;charset=utf-8");
}

export function exportTXT(quotes, collections) {
  let text = "";
  forEachGrouped(quotes, collections, {
    onCategory(cat) { text += `${cat.toUpperCase()}\n${"\u2500".repeat(cat.length)}\n\n`; },
    onQuote({ text: t, source, fav, collections: cols, isQuoted }) {
      const c = cols ? ` [${cols}]` : "";
      isQuoted ? text += `"${t}" \u2014 ${source}${fav}${c}\n` : text += `${t} \u2014 ${source}${fav}${c}\n`;
    },
    onCategoryEnd() { text += "\n"; },
  });
  download(text.trim(), exportFilename("txt"), "text/plain");
}

export function richCopyToClipboard(quotes, collections) {
  let text = "";
  forEachGrouped(quotes, collections, {
    onCategory(cat) { text += `\u2726 ${cat.toUpperCase()}\n\n`; },
    onQuote({ text: t, source, fav, collections: cols, isQuoted }) {
      const c = cols ? ` [${cols}]` : "";
      if (isQuoted) {
        text += `\u201C${t}\u201D\n`;
        text += `    \u2014 ${source}${fav}${c}\n\n`;
      } else {
        text += `${t} \u2014 ${source}${fav}${c}\n\n`;
      }
    },
  });
  return navigator.clipboard.writeText(text.trim());
}

export function copyToClipboard(quotes, collections) {
  let text = "";
  forEachGrouped(quotes, collections, {
    onCategory(cat) { text += `${cat}\n${"\u2500".repeat(cat.length)}\n`; },
    onQuote({ text: t, source, fav, collections: cols, isQuoted }) {
      const c = cols ? ` [${cols}]` : "";
      isQuoted ? text += `"${t}" \u2014 ${source}${fav}${c}\n` : text += `${t} \u2014 ${source}${fav}${c}\n`;
    },
    onCategoryEnd() { text += "\n"; },
  });
  return navigator.clipboard.writeText(text.trim());
}

export function encodeShareData(quotes, maxItems = 10_000) {
  if (quotes.length > maxItems) {
    throw new Error(`Too many items to share (${quotes.length}, max ${maxItems})`);
  }
  const minimal = quotes.map(q => [q.text || "", q.source || "", q.category || "", q.favorite ? 1 : 0]);
  const bytes = new TextEncoder().encode(JSON.stringify(minimal));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
