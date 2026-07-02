import nlp from "compromise";

/**
 * Smart text restoration from normalized (lowercase, no punctuation) text.
 * Uses compromise NLP for pronoun "I" capitalization, contraction restoration,
 * and proper noun detection — replacing fragile regex-only approaches.
 */

// Unambiguous contractions — the un-apostrophed form isn't a real word.
// These are safe to restore without NLP context.
const UNAMBIGUOUS_CONTRACTIONS = [
  [/\b(don|won|can|couldn|shouldn|wouldn|didn|doesn|isn|aren|wasn|weren|hasn|haven|hadn|mustn|needn|ain)t\b/gi, "$1't"],
  [/\b(we|you|they|could|should|would|might)ve\b/gi, "$1've"],
  [/\bive\b/gi, "I've"],
  [/\b(you|they)re\b/gi, "$1're"],
  [/\b(you|they)ll\b/gi, "$1'll"],
  [/\b(you|they)d\b/gi, "$1'd"],
  [/\b(that|what|who|here|there|where|how)s\b/gi, "$1's"],
  [/\bim\b/gi, "I'm"],
];

/**
 * Use compromise POS tagging to disambiguate contractions that regex can't handle.
 * "were doing" → "we're doing" (were + gerund = contraction)
 * "they were happy" → stays "were" (were + adjective = past tense)
 * "its not fair" → "it's not fair" (its + not/adjective/adverb = contraction)
 * "its color" → stays "its" (its + noun = possessive)
 */
function disambiguateContractions(text) {
  const doc = nlp(text);
  const terms = doc.json()[0]?.terms;
  if (!terms || terms.length < 2) return text;

  let result = text;

  for (let i = 0; i < terms.length - 1; i++) {
    const term = terms[i];
    const next = terms[i + 1];
    const word = term.text.toLowerCase();

    // "were" + gerund/going/gonna → "we're" (contraction of "we are")
    // Only convert when no subject precedes it — any noun/pronoun before "were"
    // means it's past tense ("they were going", "those were good").
    if (word === "were") {
      const nextTags = next.tags;
      if (
        nextTags.includes("Gerund") ||
        nextTags.includes("Adverb") ||
        next.text.toLowerCase() === "not" ||
        next.text.toLowerCase() === "gonna" ||
        next.text.toLowerCase() === "going"
      ) {
        const prev = i > 0 ? terms[i - 1] : null;
        const prevTags = prev?.tags || [];
        const hasPrecedingSubject =
          prev && (
            prevTags.includes("Noun") ||
            prevTags.includes("Pronoun") ||
            prevTags.includes("ProperNoun")
          );
        if (!hasPrecedingSubject) {
          const re = new RegExp("\\b" + term.text + "\\b");
          result = result.replace(re, term.text[0] === "W" ? "We're" : "we're");
        }
      }
    }

    // "its" + not/adjective/adverb/verb/pronoun/preposition → "it's" (contraction of "it is/has")
    // "its" + noun (without adjective tag) → possessive, keep as "its"
    if (word === "its") {
      const nextTags = next.tags;
      const isContraction =
        next.text.toLowerCase() === "not" ||
        nextTags.includes("Adjective") ||
        nextTags.includes("Adverb") ||
        nextTags.includes("Verb") ||
        nextTags.includes("Determiner") ||
        nextTags.includes("Pronoun") ||
        nextTags.includes("Preposition");
      const isPossessive = nextTags.includes("Noun") && !nextTags.includes("Adjective") && !nextTags.includes("Pronoun") && !nextTags.includes("Preposition");
      if (isContraction && !isPossessive) {
        const re = new RegExp("\\b" + term.text + "\\b");
        result = result.replace(re, term.text[0] === "I" ? "It's" : "it's");
      }
    }
  }

  return result;
}

/**
 * Restore a normalized (lowercase, no-punctuation) string to natural English.
 * Handles: pronoun "I", unambiguous contractions, ambiguous contraction
 * disambiguation, and sentence capitalization.
 */
export function smartRestore(text) {
  if (!text || !text.trim()) return text;
  let t = text.trim();

  // 1. Restore unambiguous contractions via regex (fast, no NLP needed)
  for (const [re, replacement] of UNAMBIGUOUS_CONTRACTIONS) {
    t = t.replace(re, replacement);
  }

  // 2. Capitalize standalone "i" → "I"
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bI'm\b/gi, "I'm")
       .replace(/\bI'll\b/gi, "I'll")
       .replace(/\bI've\b/gi, "I've")
       .replace(/\bI'd\b/gi, "I'd");

  // 3. Disambiguate ambiguous contractions using POS context
  t = disambiguateContractions(t);

  // 4. Capitalize first letter of each sentence
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());

  return t;
}

/**
 * Enhanced formatting using compromise NLP.
 * Applies to user-entered or pasted text (not normalized DB text).
 * Handles: pronoun "I", contractions, proper nouns, sentence caps.
 */
export function nlpFormat(text) {
  if (!text || !text.trim()) return text;
  let t = text.trim();

  // 1. Capitalize pronoun "I"
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi'm\b/gi, "I'm")
       .replace(/\bi'll\b/gi, "I'll")
       .replace(/\bi've\b/gi, "I've")
       .replace(/\bi'd\b/gi, "I'd");

  // 2. Restore missing apostrophes in contractions (unambiguous only)
  for (const [re, replacement] of UNAMBIGUOUS_CONTRACTIONS) {
    t = t.replace(re, replacement);
  }

  // 3. Disambiguate ambiguous contractions using POS context
  t = disambiguateContractions(t);

  // 4. Use compromise to find and capitalize proper nouns (Person, Place, Organization)
  const doc = nlp(t);
  const people = doc.people().out("array");
  const places = doc.places().out("array");

  for (const name of [...people, ...places]) {
    if (!name) continue;
    const words = name.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      const lower = word.toLowerCase();
      const re = new RegExp("\\b" + lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
      t = t.replace(re, word.charAt(0).toUpperCase() + word.slice(1));
    }
  }

  // 5. Capitalize first letter of each sentence
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());

  return t;
}
