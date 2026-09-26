// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import source from "../../public/boot.js?raw";
import {
  LS_THEME, LS_QUOTES, SHARE_HASH_PREFIX, PUBLIC_HASH_PREFIX, PUBLIC_SHARE_PATH,
} from "../config";

// public/boot.js runs before the bundle, so it can't import config.js; these
// tests pin its hard-coded keys to the real constants and check its behavior.
const runBoot = () => new Function(source)();
const classes = () => [...document.documentElement.classList].sort();

describe("public/boot.js", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    window.history.replaceState(null, "", "/");
  });

  it("uses the same storage keys and share prefixes as config.js", () => {
    expect(source).toContain(`"${LS_THEME}"`);
    expect(source).toContain(`"${LS_QUOTES}"`);
    expect(source).toContain(`"${PUBLIC_SHARE_PATH}"`);
    expect(source).toContain(`#[${SHARE_HASH_PREFIX[0]}${PUBLIC_HASH_PREFIX[0]}]=`);
  });

  it("leaves a first-time visitor on the prerendered landing page", () => {
    runBoot();
    expect(classes()).toEqual([]);
  });

  it("applies a saved theme before first paint", () => {
    localStorage.setItem(LS_THEME, "dark");
    runBoot();
    expect(classes()).toEqual(["dark"]);

    document.documentElement.className = "";
    localStorage.setItem(LS_THEME, "light");
    runBoot();
    expect(classes()).toEqual(["light"]);
  });

  it("hides the landing markup for visitors with saved quotes", () => {
    localStorage.setItem(LS_QUOTES, JSON.stringify([{ id: "a", text: "x" }]));
    runBoot();
    expect(classes()).toEqual(["cp-app"]);
  });

  it("ignores an empty saved collection", () => {
    localStorage.setItem(LS_QUOTES, "[]");
    runBoot();
    expect(classes()).toEqual([]);
  });

  it.each([
    ["/c/abc12345", "public share path"],
    ["/#p=abc12345", "legacy public share hash"],
    ["/#s=eyJ4IjoxfQ", "encoded share hash"],
  ])("hides the landing markup for %s (%s)", (url) => {
    window.history.replaceState(null, "", url);
    runBoot();
    expect(classes()).toEqual(["cp-app"]);
  });
});
