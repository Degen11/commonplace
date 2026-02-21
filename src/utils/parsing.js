// ===================== TEXT PROCESSING =====================
export function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function wordSet(s) {
  return new Set(normalize(s).split(" ").filter(w => w.length > 2));
}

export function smartSplit(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
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
