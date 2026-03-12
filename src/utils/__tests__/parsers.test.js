import { describe, it, expect } from "vitest";
import {
  parseCSVLine,
  parseKindleClippings,
  parseJSONQuotes,
  parseMarkdownQuotes,
  parseReadwiseCSV,
  parseNotionCSV,
} from "../parsers";

describe("parseCSVLine", () => {
  it("splits simple fields", () => {
    expect(parseCSVLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields", () => {
    expect(parseCSVLine('"hello, world",b')).toEqual(["hello, world", "b"]);
  });

  it("handles escaped quotes", () => {
    expect(parseCSVLine('"say ""hello""",b')).toEqual(['say "hello"', "b"]);
  });

  it("trims whitespace", () => {
    expect(parseCSVLine("  a , b , c  ")).toEqual(["a", "b", "c"]);
  });

  it("handles empty fields", () => {
    expect(parseCSVLine(",b,")).toEqual(["", "b", ""]);
  });
});

describe("parseKindleClippings", () => {
  it("parses standard Kindle format", () => {
    const content = [
      "The Great Gatsby (F. Scott Fitzgerald)",
      "- Your Highlight on page 42 | Added on Monday",
      "",
      "So we beat on, boats against the current",
      "==========",
    ].join("\n");
    const results = parseKindleClippings(content);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("So we beat on, boats against the current");
    expect(results[0].hint).toBe("The Great Gatsby - F. Scott Fitzgerald");
  });

  it("flips Last, First author format", () => {
    const content = [
      "1984 (Orwell, George)",
      "- Your Highlight on page 1 | Added on Monday",
      "",
      "Big Brother is watching you",
      "==========",
    ].join("\n");
    const results = parseKindleClippings(content);
    expect(results[0].hint).toBe("1984 - George Orwell");
  });

  it("skips notes (only keeps highlights)", () => {
    const content = [
      "Book (Author)",
      "- Your Note on page 5 | Added on Monday",
      "",
      "This is my note",
      "==========",
      "Book (Author)",
      "- Your Highlight on page 5 | Added on Monday",
      "",
      "This is a highlight",
      "==========",
    ].join("\n");
    const results = parseKindleClippings(content);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("This is a highlight");
  });

  it("returns empty for empty input", () => {
    expect(parseKindleClippings("")).toEqual([]);
  });
});

describe("parseJSONQuotes", () => {
  it("parses array of strings", () => {
    const { entries } = parseJSONQuotes(JSON.stringify(["hello", "world"]));
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe("hello");
    expect(entries[0].hint).toBeNull();
  });

  it("parses array of objects with text field", () => {
    const { entries } = parseJSONQuotes(JSON.stringify([
      { text: "hello", source: "World" },
      { quote: "goodbye", author: "Author" },
    ]));
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe("hello");
    expect(entries[0].hint).toBe("World");
    expect(entries[1].text).toBe("goodbye");
    expect(entries[1].hint).toBe("Author");
  });

  it("parses nested quotes array", () => {
    const { entries } = parseJSONQuotes(JSON.stringify({ quotes: [{ text: "hi" }] }));
    expect(entries).toHaveLength(1);
  });

  it("extracts collections from Commonplace export format", () => {
    const data = {
      quotes: [{ text: "hello", source: "s", category: "c" }],
      collections: [{ id: "c1", name: "Favorites", quoteIds: ["q1"] }],
    };
    const { entries, collections } = parseJSONQuotes(JSON.stringify(data));
    expect(entries).toHaveLength(1);
    expect(collections).toHaveLength(1);
    expect(collections[0].name).toBe("Favorites");
  });

  it("returns empty for invalid JSON", () => {
    const { entries } = parseJSONQuotes("not json at all");
    expect(entries).toEqual([]);
  });

  it("returns empty for empty array", () => {
    const { entries } = parseJSONQuotes("[]");
    expect(entries).toEqual([]);
  });
});

describe("parseMarkdownQuotes", () => {
  it("parses blockquotes", () => {
    const md = "> To be or not to be\n— Shakespeare";
    const results = parseMarkdownQuotes(md);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("To be or not to be");
    expect(results[0].hint).toBe("Shakespeare");
  });

  it("handles multi-line blockquotes", () => {
    const md = "> First line\n> Second line\nNot a quote";
    const results = parseMarkdownQuotes(md);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("First line Second line");
  });

  it("returns null hint when no attribution", () => {
    const md = "> Just a quote\n\nSome other text";
    const results = parseMarkdownQuotes(md);
    expect(results).toHaveLength(1);
    expect(results[0].hint).toBeNull();
  });

  it("returns empty for no blockquotes", () => {
    expect(parseMarkdownQuotes("just plain text")).toEqual([]);
  });
});

describe("parseReadwiseCSV", () => {
  it("parses standard Readwise export", () => {
    const csv = "Highlight,Book Title,Book Author\n\"The highlight text\",\"The Book\",\"The Author\"";
    const results = parseReadwiseCSV(csv);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("The highlight text");
    expect(results[0].hint).toBe("The Book - The Author");
  });

  it("returns empty when no Highlight column", () => {
    const csv = "Text,Author\nhello,someone";
    expect(parseReadwiseCSV(csv)).toEqual([]);
  });

  it("skips empty rows", () => {
    const csv = "Highlight,Book Title\nhello,Book\n\n";
    const results = parseReadwiseCSV(csv);
    expect(results).toHaveLength(1);
  });
});

describe("parseNotionCSV", () => {
  it("parses Notion export with quote and source columns", () => {
    const csv = "Quote,Source,Title\n\"Hello world\",\"Author\",\"Book\"";
    const results = parseNotionCSV(csv);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("Hello world");
    expect(results[0].hint).toBe("Book - Author");
  });

  it("falls back to Name column", () => {
    const csv = "Name,Author\n\"A quote\",\"Someone\"";
    const results = parseNotionCSV(csv);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("A quote");
  });

  it("returns empty when no recognizable columns", () => {
    const csv = "Foo,Bar\na,b";
    expect(parseNotionCSV(csv)).toEqual([]);
  });
});
