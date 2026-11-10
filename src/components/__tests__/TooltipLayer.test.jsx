// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import TooltipLayer, { tooltipPosition } from "../TooltipLayer";

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

describe("tooltipPosition", () => {
  const r = rect(500, 300, 40, 20); // trigger in the middle of a 1200×800 viewport

  it("centers above by default", () => {
    expect(tooltipPosition("above", r, 100, 24, 1200, 800)).toEqual({ left: 470, top: 270 });
  });
  it("places below, right-aligned (left), and beside (right)", () => {
    expect(tooltipPosition("below", r, 100, 24, 1200, 800)).toEqual({ left: 470, top: 326 });
    expect(tooltipPosition("left", r, 100, 24, 1200, 800)).toEqual({ left: 440, top: 270 });
    expect(tooltipPosition("right", r, 100, 24, 1200, 800)).toEqual({ left: 546, top: 298 });
  });
  it("flips below when there's no room above, and above when there's no room below", () => {
    expect(tooltipPosition("above", rect(500, 4, 40, 20), 100, 24, 1200, 800).top).toBe(30);
    expect(tooltipPosition("below", rect(500, 770, 40, 20), 100, 24, 1200, 800).top).toBe(740);
  });
  it("keeps the bubble inside the viewport horizontally", () => {
    expect(tooltipPosition("above", rect(2, 300, 20, 20), 100, 24, 1200, 800).left).toBe(8);
    expect(tooltipPosition("above", rect(1190, 300, 10, 20), 100, 24, 1200, 800).left).toBe(1092);
  });
});

function pointer(type, target, { pointerType = "mouse", relatedTarget = null } = {}) {
  const e = new MouseEvent(type, { bubbles: true, relatedTarget });
  Object.defineProperty(e, "pointerType", { value: pointerType });
  target.dispatchEvent(e);
}
const bubble = () => document.querySelector(".ui-tip-layer");

describe("TooltipLayer", () => {
  let btn, clipper;
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn(() => ({ matches: true }));
    // A trigger inside an overflow:hidden container, the case CSS tooltips got clipped in
    clipper = document.createElement("div");
    clipper.style.overflow = "hidden";
    btn = document.createElement("button");
    btn.className = "ui-tip ui-tip-below";
    btn.setAttribute("data-tip", "Copy");
    clipper.appendChild(btn);
    document.body.appendChild(clipper);
    render(<TooltipLayer />);
  });
  afterEach(() => {
    cleanup();
    clipper.remove();
    vi.useRealTimers();
  });

  const hover = () => { act(() => pointer("pointerover", btn)); act(() => vi.advanceTimersByTime(250)); };

  it("shows after the delay, portaled to <body> outside the clipping container", () => {
    act(() => pointer("pointerover", btn));
    expect(bubble()).toBeNull();
    act(() => vi.advanceTimersByTime(250));
    expect(bubble().textContent).toBe("Copy");
    expect(bubble().parentElement).toBe(document.body);
    expect(clipper.contains(bubble())).toBe(false);
  });

  it("hides on leave and on press", () => {
    hover();
    act(() => pointer("pointerout", btn, { relatedTarget: document.body }));
    expect(bubble()).toBeNull();
    hover();
    act(() => pointer("pointerdown", btn));
    expect(bubble()).toBeNull();
  });

  it("follows a data-tip change while shown", async () => {
    hover();
    await act(async () => { btn.setAttribute("data-tip", "Copied"); });
    expect(bubble().textContent).toBe("Copied");
  });

  it("hides when the trigger opens its menu, and doesn't show over an open one", async () => {
    btn.setAttribute("aria-haspopup", "menu");
    hover();
    expect(bubble()).not.toBeNull();
    await act(async () => { btn.setAttribute("aria-expanded", "true"); });
    expect(bubble()).toBeNull();
    act(() => pointer("pointerout", btn, { relatedTarget: document.body }));
    hover();
    expect(bubble()).toBeNull();
  });

  it("ignores touch pointers", () => {
    act(() => pointer("pointerover", btn, { pointerType: "touch" }));
    act(() => vi.advanceTimersByTime(250));
    expect(bubble()).toBeNull();
  });
});
