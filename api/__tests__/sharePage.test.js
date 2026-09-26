import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildMeta, injectMeta } from "../share-page.js";
import { pickFeaturedQuote, readSharedQuote } from "../_shareData.js";

const template = readFileSync(fileURLToPath(new URL("../../index.html", import.meta.url)), "utf8");
const count = (html, re) => (html.match(re) || []).length;

describe("pickFeaturedQuote", () => {
  it("prefers the first favorite, else the first quote with text", () => {
    expect(pickFeaturedQuote([["a", "A", "Book", 0], ["b", "B", "Film", 1]]).text).toBe("b");
    expect(pickFeaturedQuote([["", "", "Book", 0], ["c", "C", "TV", 0]]).text).toBe("c");
    expect(pickFeaturedQuote([])).toBeNull();
  });

  it("reads both tuple and object quote shapes", () => {
    expect(readSharedQuote(["t", "s", "Book", 0])).toEqual({ text: "t", source: "s", category: "Book" });
    expect(readSharedQuote({ text: "t", source: "s", category: "Book" })).toEqual({ text: "t", source: "s", category: "Book" });
    expect(readSharedQuote(null)).toBeNull();
  });
});

describe("share page meta", () => {
  const quotes = [["Not all those who wander are lost.", "J.R.R. Tolkien", "Book", 0], ["x", "y", "Film", 0]];

  it("describes the collection and points og:image at its share card", () => {
    const meta = buildMeta({ id: "abc12345", quotes });
    expect(meta.title).toBe("A shared collection of 2 quotes — Commonplace");
    expect(meta.description).toContain("“Not all those who wander are lost.” — J.R.R. Tolkien");
    expect(meta.image).toBe("https://commonplace.pro/api/og?id=abc12345");
    expect(meta.url).toBe("https://commonplace.pro/c/abc12345");
  });

  it("replaces the homepage tags instead of duplicating them", () => {
    const html = injectMeta(template, buildMeta({ id: "abc12345", quotes }));
    expect(count(html, /<title>/g)).toBe(1);
    expect(count(html, /<meta name="description"/g)).toBe(1);
    expect(count(html, /<link rel="canonical"/g)).toBe(1);
    expect(count(html, /<meta property="og:image"/g)).toBe(1);
    expect(count(html, /<meta name="twitter:card"/g)).toBe(1);
    expect(html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(html).toContain('<link rel="canonical" href="https://commonplace.pro/c/abc12345" />');
    expect(html).not.toContain('content="https://commonplace.pro/og-image.png"');
    // Untouched: the app's scripts and JSON-LD
    expect(html).toContain('src="/src/main.jsx"');
    expect(html).toContain('application/ld+json');
  });

  it("escapes user content", () => {
    const html = injectMeta(template, buildMeta({ id: "abc12345", quotes: [['He said "<script>" & left', "<b>Someone</b>", "Book", 0]] }));
    expect(html).not.toContain("<script>\"");
    expect(html).not.toContain("<b>Someone");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;");
  });

  it("uses generic tags for missing or unreadable collections", () => {
    expect(buildMeta({ id: "abc12345", quotes: null }).title).toMatch(/not found/);
    expect(buildMeta({ id: "abc12345", quotes: [] }).image).toBe("https://commonplace.pro/og-image.png");
  });
});
