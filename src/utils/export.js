import { QUOTED_CATS } from "../data/constants";

export const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text || ""}\u201D` : (q.text || "");

function groupByCategory(quotes) {
  const grouped = {};
  quotes.forEach(q => { (grouped[q.category] = grouped[q.category] || []).push(q); });
  return grouped;
}

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

export function exportCSV(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const rows = [["Text", "Source", "Category", "Favorite", "Collection"]];
  quotes.forEach(q => rows.push([
    `"${(q.text || "").replace(/"/g, '""')}"`,
    `"${(q.source || "").replace(/"/g, '""')}"`,
    q.category || "",
    q.favorite ? "yes" : "no",
    `"${(colMap[q.id] || []).join(", ")}"`,
  ]));
  download(rows.map(r => r.join(",")).join("\n"), "commonplace-export.csv", "text/csv");
}

export function exportMD(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const grouped = groupByCategory(quotes);
  let md = "# Commonplace Export\n\n";
  Object.entries(grouped).forEach(([cat, qs]) => {
    md += `## ${cat}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " \u2B50" : "";
      const t = q.text || ""; const s = q.source || "";
      const c = colMap[q.id]?.length ? ` \u2014 *${colMap[q.id].join(", ")}*` : "";
      QUOTED_CATS.has(q.category)
        ? md += `> \u201C${t}\u201D\n> \u2014 *${s}*${f}${c}\n\n`
        : md += `- **${t}** \u2014 ${s}${f}${c}\n`;
    });
    md += "\n";
  });
  download(md, "commonplace-export.md", "text/markdown");
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
  download(JSON.stringify(data, null, 2), "commonplace-export.json", "application/json");
}

export function exportTXT(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `${cat.toUpperCase()}\n${"\u2500".repeat(cat.length)}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " \u2605" : "";
      const t = q.text || ""; const s = q.source || "";
      const c = colMap[q.id]?.length ? ` [${colMap[q.id].join(", ")}]` : "";
      QUOTED_CATS.has(q.category)
        ? text += `"${t}" \u2014 ${s}${f}${c}\n`
        : text += `${t} \u2014 ${s}${f}${c}\n`;
    });
    text += "\n";
  });
  download(text.trim(), "commonplace-export.txt", "text/plain");
}

export function richCopyToClipboard(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `\u2726 ${cat.toUpperCase()}\n\n`;
    qs.forEach(q => {
      const f = q.favorite ? " \u2605" : "";
      const t = q.text || ""; const s = q.source || "";
      const c = colMap[q.id]?.length ? ` [${colMap[q.id].join(", ")}]` : "";
      if (QUOTED_CATS.has(q.category)) {
        text += `\u201C${t}\u201D\n`;
        text += `    \u2014 ${s}${f}${c}\n\n`;
      } else {
        text += `${t} \u2014 ${s}${f}${c}\n\n`;
      }
    });
  });
  return navigator.clipboard.writeText(text.trim());
}

export function copyToClipboard(quotes, collections) {
  const colMap = buildCollectionMap(collections);
  const grouped = groupByCategory(quotes);
  let text = "";
  Object.entries(grouped).forEach(([cat, qs]) => {
    text += `${cat}\n${"\u2500".repeat(cat.length)}\n`;
    qs.forEach(q => {
      const f = q.favorite ? " \u2605" : "";
      const t = q.text || ""; const s = q.source || "";
      const c = colMap[q.id]?.length ? ` [${colMap[q.id].join(", ")}]` : "";
      QUOTED_CATS.has(q.category) ? text += `"${t}" \u2014 ${s}${f}${c}\n` : text += `${t} \u2014 ${s}${f}${c}\n`;
    });
    text += "\n";
  });
  return navigator.clipboard.writeText(text.trim());
}

export function encodeShareData(quotes) {
  const minimal = quotes.map(q => [q.text || "", q.source || "", q.category || "", q.favorite ? 1 : 0]);
  const bytes = new TextEncoder().encode(JSON.stringify(minimal));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
