import { describe, it, expect } from "vitest";
import { displayText, encodeShareData, exportFilename } from "../export";

describe("exportFilename", () => {
  it("defaults to the 'export' label", () => {
    expect(exportFilename("csv")).toMatch(/^commonplace-export-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("uses a custom label to distinguish variants (e.g. anki)", () => {
    expect(exportFilename("csv", "anki")).toMatch(/^commonplace-anki-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

describe("displayText", () => {
  it("wraps quoted categories in smart quotes", () => {
    expect(displayText({ text: "Hello", category: "Film" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "Book" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "TV" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "Music" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "Speech" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "Person" })).toBe("\u201CHello\u201D");
    expect(displayText({ text: "Hello", category: "Game" })).toBe("\u201CHello\u201D");
  });

  it("returns plain text for non-quoted categories", () => {
    expect(displayText({ text: "Hello", category: "Reflection" })).toBe("Hello");
    expect(displayText({ text: "Hello", category: "Proverb" })).toBe("Hello");
    expect(displayText({ text: "Hello", category: "Unknown" })).toBe("Hello");
  });

  it("handles empty or missing text", () => {
    expect(displayText({ text: "", category: "Film" })).toBe("\u201C\u201D");
    expect(displayText({ text: undefined, category: "Film" })).toBe("\u201C\u201D");
    expect(displayText({ text: null, category: "Reflection" })).toBe("");
  });
});

describe("encodeShareData", () => {
  it("encodes quotes to base64", () => {
    const quotes = [
      { text: "Hello", source: "Test", category: "Film", favorite: false },
    ];
    const encoded = encodeShareData(quotes);
    // Should be valid base64
    expect(() => atob(encoded)).not.toThrow();
    // Should round-trip correctly
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    ));
    expect(decoded).toEqual([["Hello", "Test", "Film", 0]]);
  });

  it("encodes favorite as 1", () => {
    const quotes = [
      { text: "a", source: "b", category: "c", favorite: true },
    ];
    const encoded = encodeShareData(quotes);
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    ));
    expect(decoded[0][3]).toBe(1);
  });

  it("handles empty text/source/category as empty strings", () => {
    const quotes = [{ favorite: false }];
    const encoded = encodeShareData(quotes);
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    ));
    expect(decoded[0]).toEqual(["", "", "", 0]);
  });

  it("handles multiple quotes", () => {
    const quotes = [
      { text: "a", source: "s1", category: "Film", favorite: false },
      { text: "b", source: "s2", category: "Book", favorite: true },
    ];
    const encoded = encodeShareData(quotes);
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    ));
    expect(decoded).toHaveLength(2);
    expect(decoded[1]).toEqual(["b", "s2", "Book", 1]);
  });

  it("throws when exceeding maxItems", () => {
    const quotes = Array.from({ length: 5 }, (_, i) => ({
      text: `q${i}`, source: "s", category: "c", favorite: false,
    }));
    expect(() => encodeShareData(quotes, 3)).toThrow("Too many items");
  });

  it("handles unicode text correctly", () => {
    const quotes = [
      { text: "caf\u00e9 r\u00e9sum\u00e9", source: "\u2014 Author", category: "Book", favorite: false },
    ];
    const encoded = encodeShareData(quotes);
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
    ));
    expect(decoded[0][0]).toBe("caf\u00e9 r\u00e9sum\u00e9");
  });
});
