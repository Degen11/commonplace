// Proper noun set — lazy-initialized via initProperNouns() on first processing run.
let properNouns = null;

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
  const wordSources = new Map();
  db.forEach(entry => {
    const words = entry.s.split(/[\s\-\u2013\u2014,()[\]/&]+/);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z']/g, "");
      if (
        clean.length > 2 &&
        /^[A-Z]/.test(clean) &&
        !SKIP_WORDS.has(clean.toLowerCase()) &&
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
  properNouns = nouns;
}

// Conservative list — only clear-cut misspellings
const MISSPELLINGS = {
  "recieve": "receive", "beleive": "believe", "freind": "friend",
  "occured": "occurred", "begining": "beginning", "seperate": "separate",
  "definately": "definitely", "untill": "until",
  "alot": "a lot", "noone": "no one",
  "everytime": "every time", "nevermind": "never mind",
};

export function basicFormat(text) {
  let t = text.trim();
  if (!t) return t;

  t = t.replace(/^[\s\u2022\u00b7\u2013\u2014\-*>#]+/, "")
       .replace(/^\d{1,4}\s*\.\s*/, "")
       .replace(/^\d{1,4}\s+(?=[A-Z])/, "")
       .trim();

  t = t.replace(/  +/g, " ");
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi'm\b/gi, "I'm")
       .replace(/\bi'll\b/gi, "I'll")
       .replace(/\bi've\b/gi, "I've")
       .replace(/\bi'd\b/gi, "I'd");

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

  Object.entries(MISSPELLINGS).forEach(([wrong, right]) => {
    t = t.replace(new RegExp("\\b" + wrong + "\\b", "gi"), (match) =>
      match[0] === match[0].toUpperCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right
    );
  });

  if (properNouns) {
    properNouns.forEach(noun => {
      const lower = noun.toLowerCase();
      const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Use Unicode letter boundaries instead of \b to avoid corrupting
      // words like "johnson" when "Son" is a proper noun.
      t = t.replace(new RegExp("(?<![\\p{L}])" + escaped + "(?![\\p{L}])", "gu"), noun);
    });
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
  if (wa.size + wb.size === 0) return 0;
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
