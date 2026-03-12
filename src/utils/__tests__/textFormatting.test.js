import { describe, it, expect } from "vitest";
import { normalize, similarity, basicFormat, smartSplit, smartParse } from "../textFormatting";

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  Hello World  ")).toBe("hello world");
  });

  it("strips diacritics", () => {
    expect(normalize("café résumé")).toBe("cafe resume");
  });

  it("strips punctuation", () => {
    expect(normalize("it's a test!")).toBe("its a test");
  });

  it("collapses whitespace", () => {
    expect(normalize("too   many   spaces")).toBe("too many spaces");
  });

  it("returns empty for null/undefined", () => {
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
    expect(normalize("")).toBe("");
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("hello world", "hello world")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(similarity("apple banana cherry", "xyz qrs tuv")).toBe(0);
  });

  it("returns 0 for empty strings", () => {
    expect(similarity("", "")).toBe(0);
    expect(similarity("hello", "")).toBe(0);
    expect(similarity("", "hello")).toBe(0);
  });

  it("handles one empty, one non-empty without NaN", () => {
    const result = similarity("test", "");
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(0);
  });

  it("returns 0.9 when one string contains the other", () => {
    expect(similarity("to be or not to be", "to be or not to be that is the question")).toBe(0.9);
  });

  it("returns partial overlap score", () => {
    const score = similarity("the quick brown fox", "the quick red dog");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("is case insensitive", () => {
    expect(similarity("Hello World", "hello world")).toBe(1);
  });

  it("handles strings with only short words gracefully", () => {
    // Words shorter than 2 unicode chars are filtered by wordSet
    const result = similarity("I a", "I a");
    expect(Number.isNaN(result)).toBe(false);
  });
});

describe("basicFormat", () => {
  it("capitalizes first letter", () => {
    expect(basicFormat("hello")).toBe("Hello");
  });

  it("fixes common contractions", () => {
    expect(basicFormat("i cant believe it")).toBe("I can't believe it");
    expect(basicFormat("i dont know")).toBe("I don't know");
    expect(basicFormat("it isnt right")).toBe("It isn't right");
  });

  it("fixes I-contractions", () => {
    expect(basicFormat("i'm here")).toBe("I'm here");
    expect(basicFormat("i'll go")).toBe("I'll go");
    expect(basicFormat("i've seen it")).toBe("I've seen it");
  });

  it("strips leading bullets and markers", () => {
    expect(basicFormat("• hello")).toBe("Hello");
    expect(basicFormat("- hello")).toBe("Hello");
    expect(basicFormat("3. hello")).toBe("Hello");
  });

  it("returns empty for empty input", () => {
    expect(basicFormat("")).toBe("");
    expect(basicFormat("   ")).toBe("");
  });

  it("collapses multiple spaces", () => {
    expect(basicFormat("too   many   spaces")).toBe("Too many spaces");
  });
});

describe("smartSplit", () => {
  it("splits on newlines and trims", () => {
    expect(smartSplit("  hello  \n  world  ")).toEqual(["hello", "world"]);
  });

  it("filters empty lines", () => {
    expect(smartSplit("a\n\n\nb")).toEqual(["a", "b"]);
  });

  it("returns empty array for empty input", () => {
    expect(smartSplit("")).toEqual([]);
    expect(smartSplit("   \n   \n   ")).toEqual([]);
  });
});

describe("smartParse", () => {
  it("extracts hint from parenthetical attribution", () => {
    const result = smartParse('"Be the change" (Gandhi)');
    expect(result.text).toBe("Be the change");
    expect(result.hint).toBe("Gandhi");
  });

  it("extracts hint from em-dash separator", () => {
    const result = smartParse("Not all who wander are lost \u2014 Tolkien");
    expect(result.text).toBe("Not all who wander are lost");
    expect(result.hint).toBe("Tolkien");
  });

  it("extracts hint from double-dash separator", () => {
    const result = smartParse("To be or not to be -- Shakespeare");
    expect(result.text).toBe("To be or not to be");
    expect(result.hint).toBe("Shakespeare");
  });

  it("returns null hint when no attribution found", () => {
    const result = smartParse("Just a quote with no source");
    expect(result.text).toBe("Just a quote with no source");
    expect(result.hint).toBeNull();
  });

  it("strips surrounding quotes", () => {
    const result = smartParse('"Hello world"');
    expect(result.text).toBe("Hello world");
  });

  it("strips leading bullets", () => {
    const result = smartParse("• a bullet point");
    expect(result.text).toBe("a bullet point");
  });
});
