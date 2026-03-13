// Proper noun set — lazy-initialized via initProperNouns() on first processing run.
let properNouns = null;
// Pre-compiled RegExp patterns for properNouns, built once in initProperNouns()
let properNounPatterns = null;

const SKIP_WORDS = new Set([
  "the","a","an","of","in","on","at","to","for","and","or","but","with",
  "from","by","via","as","is","was","are","be","been","has","have","had",
  "it","its","this","that","these","those","my","his","her","our","your",
  "get","got","go","goes","make","take","want","know","say","think","see",
  "come","give","find","tell","ask","seem","feel","look","leave","call",
  "film","tv","book","music","speech","person","phrase","various",
  "attributed","often","unknown","parts","series","season","episode",
  "act","scene","chapter","vol","pt","ep","version",
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

export function initProperNouns(db) {
  if (properNouns) return;

  // Build a set of words that appear in quote text (lowercase) — these are common words, not proper nouns
  const textWords = new Set();
  db.forEach(entry => {
    entry.t.split(/\s+/).forEach(w => {
      if (w.length > 2) textWords.add(w);
    });
  });

  // Extract candidate proper nouns only from the person/character part of sources.
  // Sources follow "Title - Person Name" format; if no separator, use whole source.
  const wordSources = new Map();
  db.forEach(entry => {
    const dashIdx = entry.s.indexOf(" - ");
    const namePart = dashIdx >= 0 ? entry.s.slice(dashIdx + 3) : entry.s;
    // Strip parenthetical years/notes like "(2008)" from the name part
    const cleaned = namePart.replace(/\([^)]*\)/g, "").trim();
    const words = cleaned.split(/[\s\-\u2013\u2014,()[\]/&]+/);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z']/g, "");
      if (
        clean.length > 2 &&
        /^[A-Z]/.test(clean) &&
        !SKIP_WORDS.has(clean.toLowerCase()) &&
        !/^\d/.test(clean) &&
        // Skip words that commonly appear in quote text — they're regular words, not names
        !textWords.has(clean.toLowerCase())
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
  properNouns = nouns;
  // Pre-compile RegExp for each proper noun once — use Unicode word boundaries
  // so proper nouns are corrected anywhere in a sentence, not just at sentence starts
  properNounPatterns = [];
  for (const noun of nouns) {
    const escaped = noun.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    properNounPatterns.push({ noun, re: new RegExp("(?<![\\p{L}])" + escaped + "(?![\\p{L}])", "gu") });
  }
}

// Conservative list — only clear-cut misspellings (pre-compiled RegExps)
const MISSPELLING_PATTERNS = Object.entries({
  "recieve": "receive", "beleive": "believe", "freind": "friend",
  "occured": "occurred", "begining": "beginning", "seperate": "separate",
  "definately": "definitely", "untill": "until",
  "alot": "a lot", "noone": "no one",
  "everytime": "every time", "nevermind": "never mind",
}).map(([wrong, right]) => ({ re: new RegExp("\\b" + wrong + "\\b", "gi"), right }));

export function basicFormat(text) {
  let t = text.trim();
  if (!t) return t;

  t = t.replace(/^[\s\u2022\u00b7\u2013\u2014\->#]+/, "")
       .replace(/^\*(?!\*?\w)/, "")
       .replace(/^\d{1,4}\s*\.\s*/, "")
       .replace(/^\d{1,4}\s+(?=[A-Z])/, "")
       .trim();

  t = t.replace(/  +/g, " ");
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi'm\b/gi, "I'm")
       .replace(/\bi'll\b/gi, "I'll")
       .replace(/\bi've\b/gi, "I've")
       .replace(/\bi'd\b/gi, "I'd");

  // Case-insensitive contraction fixes — preserves original capitalization
  const fixContraction = (re, fixed) => {
    t = t.replace(re, m => m[0] === m[0].toUpperCase() ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed);
  };
  fixContraction(/\bcant\b/gi, "can't");
  fixContraction(/\bdont\b/gi, "don't");
  fixContraction(/\bwont\b/gi, "won't");
  fixContraction(/\bdidnt\b/gi, "didn't");
  fixContraction(/\bdoesnt\b/gi, "doesn't");
  fixContraction(/\bwouldnt\b/gi, "wouldn't");
  fixContraction(/\bcouldnt\b/gi, "couldn't");
  fixContraction(/\bshouldnt\b/gi, "shouldn't");
  fixContraction(/\bisnt\b/gi, "isn't");
  fixContraction(/\barent\b/gi, "aren't");
  fixContraction(/\bwasnt\b/gi, "wasn't");
  fixContraction(/\bwerent\b/gi, "weren't");
  fixContraction(/\bhasnt\b/gi, "hasn't");
  fixContraction(/\bhavent\b/gi, "haven't");
  fixContraction(/\bhadnt\b/gi, "hadn't");
  fixContraction(/\bthats\b/gi, "that's");
  fixContraction(/\bwhats\b/gi, "what's");
  fixContraction(/\bwhos\b/gi, "who's");

  for (const { re, right } of MISSPELLING_PATTERNS) {
    re.lastIndex = 0;
    t = t.replace(re, (match) =>
      match[0] === match[0].toUpperCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right
    );
  }

  if (properNounPatterns) {
    for (const { noun, re } of properNounPatterns) {
      re.lastIndex = 0;
      t = t.replace(re, noun);
    }
  }

  t = t.charAt(0).toUpperCase() + t.slice(1);

  t = t.replace(/(^|[-\s([{<])"(\S)/g, "$1\u201C$2")
       .replace(/(\S)"([\s)\]}>,.!?;:]|$)/g, "$1\u201D$2");

  return t;
}

export function smartSplit(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

export function normalize(s) {
  return (s || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(normalized) {
  return new Set(
    normalized
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

  const wa = wordSet(na), wb = wordSet(nb);
  if (wa.size + wb.size === 0) return 0;
  if (!wa.size || !wb.size) return 0;

  let overlap = 0;
  wa.forEach(w => { if (wb.has(w)) overlap++; });
  return (overlap * 2) / (wa.size + wb.size);
}

export function smartParse(line) {
  let t = line.trim();
  // Strip leading bullets, dashes, en/em dashes, list markers
  // but preserve * when it's part of markdown bold/italic (e.g. **bold** or *italic*)
  t = t.replace(/^[\u2022\u00b7\u2013\u2014\->#]+\s*/, "")
       .replace(/^\*(?!\*?\w)/, "")
       .replace(/^\d{1,4}\s*\.\s*/, "")
       .trim();
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
