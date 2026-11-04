// The one text normalizer for quote matching, shared by the client
// (textFormatting.js, the local quote index in data/localQuotes.js) and the
// server (api/_shared.js cache keys). Keep it dependency-free: the serverless
// functions import this file directly.
//
// NFKD + strip combining marks folds accents (é → e, й → и, ё → е); Unicode
// property escapes keep non-Latin letters and digits while dropping punctuation.
export function normalize(s) {
  return (s || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
