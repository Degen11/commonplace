import { QUOTED_CATS } from "../data/constants";
import LOCAL_DB from "../data/localQuotes";

// ── Extract known proper nouns from local DB source strings ──
// Fix 6: only include a word if it appears in 2+ DIFFERENT source strings.
// Single-occurrence words are likely song/movie title words ("Dreams",
// "Heroes", "Perfect", "Changes") that shouldn't be capitalized in general text.
const KNOWN_PROPER_NOUNS = (() => {
  // Words that are common English words or title-case noise — never treat as proper nouns
  const skipWords = new Set([
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

  // Count how many distinct source strings each capitalized word appears in
  const wordSources = new Map(); // word → Set of source strings it appears in

  LOCAL_DB.forEach(entry => {
    const words = entry.s.split(/[\s\-\u2013\u2014,()[\]/&]+/);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z']/g, "");
      if (
        clean.length > 2 &&
        /^[A-Z]/.test(clean) &&
        !skipWords.has(clean.toLowerCase()) &&
        !/^\d/.test(clean)
      ) {
        if (!wordSources.has(clean)) wordSources.set(clean, new Set());
        wordSources.get(clean).add(entry.s);
      }
    });
  });

  // Only trust words that appear in at least 2 different source strings —
  // this weeds out single-occurrence title words like "Dreams" or "Heroes"
  // while keeping reliable proper nouns like "Hemingway" or "Shakespeare"
  const nouns = new Set();
  wordSources.forEach((sources, word) => {
    if (sources.size >= 2) nouns.add(word);
  });

  return nouns;
})();

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
  t = t.replace(/^[\s\u2022\u00b7\u2013\u2014\-*>#]+/, "").trim();

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

  // 6. Capitalize known proper nouns (only high-confidence ones from 2+ sources)
  KNOWN_PROPER_NOUNS.forEach(noun => {
    const lower = noun.toLowerCase();
    t = t.replace(new RegExp("\\b" + lower + "\\b", "g"), noun);
  });

  // 7. Capitalize first letter
  t = t.charAt(0).toUpperCase() + t.slice(1);

  // 8. Curly quotes
  t = t.replace(/(^|[-\s([{<])"(\S)/g, "$1\u201C$2")
       .replace(/(\S)"([\s)\]}>,.!?;:]|$)/g, "$1\u201D$2");

  return t;
}

export function smartSplit(text) {
  const byNewline = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  if (/\d+\.\s/.test(text)) {
    const parts = text.split(/\d+\.\s+/).filter(Boolean);
    if (parts.length > 1) return parts.map(p => p.trim()).filter(Boolean);
  }
  if (/[•·]\s/.test(text)) {
    const parts = text.split(/[•·]\s+/).filter(Boolean);
    if (parts.length > 1) return parts.map(p => p.trim()).filter(Boolean);
  }
  return byNewline;
}

// ===================== TEXT PROCESSING =====================
export function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function wordSet(s) {
  return new Set(normalize(s).split(" ").filter(w => w.length > 2));
}

export function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
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

// ===================== DISPLAY =====================
export const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text}\u201D` : q.text;

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
