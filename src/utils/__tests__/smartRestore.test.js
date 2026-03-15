import { describe, it, expect } from "vitest";
import { smartRestore, nlpFormat } from "../smartRestore";

describe("smartRestore", () => {
  it("returns empty/null input unchanged", () => {
    expect(smartRestore("")).toBe("");
    expect(smartRestore(null)).toBe(null);
    expect(smartRestore(undefined)).toBe(undefined);
    expect(smartRestore("   ")).toBe("   ");
  });

  it("capitalizes first letter of sentences", () => {
    expect(smartRestore("hello world")).toBe("Hello world");
    expect(smartRestore("first. second. third")).toBe("First. Second. Third");
  });

  it("capitalizes pronoun I", () => {
    expect(smartRestore("i think i can")).toBe("I think I can");
  });

  it("restores I-contractions", () => {
    expect(smartRestore("im here")).toBe("I'm here");
    expect(smartRestore("ive seen it")).toBe("I've seen it");
  });

  it("does not convert ambiguous 'ill' to contraction", () => {
    // "ill" is a real word, so smartRestore correctly leaves it alone
    expect(smartRestore("ill go")).toBe("Ill go");
  });

  it("restores unambiguous contractions", () => {
    expect(smartRestore("dont stop")).toBe("Don't stop");
    expect(smartRestore("cant believe it")).toBe("Can't believe it");
    expect(smartRestore("its not worth it")).toBe("It's not worth it");
    expect(smartRestore("wouldnt you agree")).toBe("Wouldn't you agree");
  });

  it("restores -ve contractions", () => {
    expect(smartRestore("they couldve won")).toBe("They could've won");
    expect(smartRestore("we shouldve left")).toBe("We should've left");
  });

  it("capitalizes after sentence-ending punctuation", () => {
    expect(smartRestore("stop! go now. why? because")).toBe("Stop! Go now. Why? Because");
  });

  it("handles already-correct text", () => {
    expect(smartRestore("Hello World")).toBe("Hello World");
  });
});

describe("nlpFormat", () => {
  it("returns empty/null input unchanged", () => {
    expect(nlpFormat("")).toBe("");
    expect(nlpFormat(null)).toBe(null);
    expect(nlpFormat(undefined)).toBe(undefined);
  });

  it("capitalizes pronoun I and I-contractions", () => {
    expect(nlpFormat("i think i'm right")).toBe("I think I'm right");
  });

  it("restores unambiguous contractions", () => {
    expect(nlpFormat("i dont know")).toBe("I don't know");
    expect(nlpFormat("it isnt fair")).toBe("It isn't fair");
  });

  it("capitalizes first letter", () => {
    expect(nlpFormat("the quick brown fox")).toBe("The quick brown fox");
  });
});
