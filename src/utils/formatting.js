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

export const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text}\u201D` : q.text;
