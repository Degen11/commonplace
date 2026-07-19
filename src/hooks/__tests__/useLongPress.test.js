// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useLongPress from "../useLongPress";

const touch = (x = 0, y = 0) => ({ touches: [{ clientX: x, clientY: y }] });
const clickEvent = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

describe("useLongPress", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires onLongPress after the hold duration", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, 350));
    result.current.onTouchStart(touch());
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("swallows exactly one follow-up click after a long-press fires", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, 350));
    result.current.onTouchStart(touch());
    vi.advanceTimersByTime(350);

    const e1 = clickEvent();
    result.current.onClickCapture(e1);
    expect(e1.preventDefault).toHaveBeenCalledTimes(1);
    expect(e1.stopPropagation).toHaveBeenCalledTimes(1);

    // Only the immediate follow-up click is swallowed; a later real click passes through.
    const e2 = clickEvent();
    result.current.onClickCapture(e2);
    expect(e2.preventDefault).not.toHaveBeenCalled();
  });

  it("does not swallow a normal tap (no long-press fired)", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, 350));
    result.current.onTouchStart(touch());
    result.current.onTouchEnd(); // lifted before the timer
    vi.advanceTimersByTime(350);
    expect(cb).not.toHaveBeenCalled();

    const e = clickEvent();
    result.current.onClickCapture(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("cancels the long-press when the finger moves past the distance threshold", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, 350));
    result.current.onTouchStart(touch(0, 0));
    result.current.onTouchMove(touch(50, 0)); // > LONG_PRESS_MOVE_PX
    vi.advanceTimersByTime(350);
    expect(cb).not.toHaveBeenCalled();
  });

  it("resets the fired flag on a new touch sequence", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useLongPress(cb, 350));
    result.current.onTouchStart(touch());
    vi.advanceTimersByTime(350); // fires, firedRef = true

    // A fresh touch that is a quick tap must clear the stale fired flag.
    result.current.onTouchStart(touch());
    result.current.onTouchEnd();
    const e = clickEvent();
    result.current.onClickCapture(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });
});
