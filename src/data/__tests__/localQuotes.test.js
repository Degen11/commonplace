import { describe, it, expect } from "vitest";
import LOCAL_DB, { localLookup } from "../localQuotes";
import { normalize } from "../../utils/normalize";
import { normalize as clientNormalize } from "../../utils/textFormatting";
import { normalizeForCache } from "../../../api/_shared.js";

describe("normalize — one implementation", () => {
  it("the client and the server cache use the same function", () => {
    expect(clientNormalize).toBe(normalize);
    expect(normalizeForCache).toBe(normalize);
  });

  it("folds accents, punctuation and case", () => {
    expect(normalize("Not Penny’s Boat!")).toBe("not pennys boat");
    expect(normalize("Spider-Man")).toBe("spiderman");
    expect(normalize("Кто не рискует, тот не пьёт")).toBe("кто не рискует тот не пьет");
  });
});

describe("localLookup", () => {
  it("every entry's own text finds that entry by exact lookup", () => {
    // Exact-only is the mode re-identify uses. Before keys were normalized,
    // entries whose raw text changes under normalize() (ё/й, curly
    // apostrophes, hyphens) could never match.
    const misses = LOCAL_DB.filter(entry => !localLookup(entry.t, null, { exactOnly: true }));
    expect(misses.map(e => e.t)).toEqual([]);
  });

  it("matches entries whose raw text isn't already normalized", () => {
    const raw = LOCAL_DB.filter(e => e.t !== normalize(e.t));
    expect(raw.length).toBeGreaterThan(0);
    for (const entry of raw) {
      expect(localLookup(entry.t, null, { exactOnly: true })?.source).toBeTruthy();
    }
  });

  it("keeps the raw text for display alongside the key", () => {
    const entry = LOCAL_DB.find(e => e.t.includes("ё"));
    expect(entry.t).toContain("ё");
    expect(entry.k).not.toContain("ё");
  });
});
