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
