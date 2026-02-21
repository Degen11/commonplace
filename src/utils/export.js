import { QUOTED_CATS } from "../data/constants";

// ===================== EXPORT =====================
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
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
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
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
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
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
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
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
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
