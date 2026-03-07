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

export function parseJSONQuotes(content) {
  try {
    const data = JSON.parse(content);
    const arr = Array.isArray(data)
      ? data
      : (data.quotes || data.highlights || data.entries || data.items || data.data || []);
    if (!Array.isArray(arr) || arr.length === 0) return { entries: [], collections: [] };

    const entries = arr.map(item => {
      if (typeof item === "string") return { text: item.trim(), hint: null };
      if (!item || typeof item !== "object") return null;
      const text = (item.text || item.quote || item.content || item.highlight || item.passage || "").trim();
      if (!text) return null;
      const source = (item.source || "").trim();
      const author = (item.author || item.by || "").trim();
      const title = (item.title || item.book || item.work || "").trim();
      const hint = source || (title && author ? `${title} - ${author}` : title || author) || null;
      return { text, hint, id: item.id || null };
    }).filter(Boolean);

    // Extract collections if present (Commonplace export format)
    let collections = [];
    if (!Array.isArray(data) && Array.isArray(data.collections)) {
      collections = data.collections.filter(c =>
        c && typeof c.id === "string" && typeof c.name === "string" && Array.isArray(c.quoteIds)
      );
    }

    return { entries, collections };
  } catch {
    return { entries: [], collections: [] };
  }
}

export function parseMarkdownQuotes(content) {
  const results = [];
  const lines = content.split("\n");
  let currentQuote = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed.startsWith("> ") || trimmed === ">") {
      currentQuote += (currentQuote ? " " : "") + trimmed.slice(1).trim();
    } else {
      if (currentQuote) {
        let hint = null;
        if (trimmed && /^[—\-~–]/.test(trimmed)) {
          hint = trimmed.replace(/^[—\-~–]\s*/, "").trim();
        }
        results.push({ text: currentQuote.trim(), hint });
        currentQuote = "";
      }
    }
  }
  if (currentQuote) results.push({ text: currentQuote.trim(), hint: null });

  return results;
}

export function parseNotionCSV(content) {
  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Notion databases often export with "Name" as the primary column
  // Look for quote-like columns first, then fall back to "name"
  const textCols = ["quote", "text", "content", "highlight", "passage", "name"];
  const textIdx = textCols.reduce((found, key) => found >= 0 ? found : headers.indexOf(key), -1);
  if (textIdx < 0) return [];

  const sourceCols = ["source", "author", "by", "attribution"];
  const sourceIdx = sourceCols.reduce((found, key) => found >= 0 ? found : headers.indexOf(key), -1);

  const titleCols = ["title", "book", "work", "film", "movie"];
  const titleIdx = titleCols.reduce((found, key) => found >= 0 ? found : headers.indexOf(key), -1);

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const fields = parseCSVLine(lines[i]);
    const text = fields[textIdx]?.trim();
    if (!text) continue;

    const source = sourceIdx >= 0 ? fields[sourceIdx]?.trim() : null;
    const title = titleIdx >= 0 ? fields[titleIdx]?.trim() : null;

    let hint = null;
    if (source && title) hint = `${title} - ${source}`;
    else if (title) hint = title;
    else if (source) hint = source;

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
