import { describe, it, expect } from "vitest";
import { describeApiError } from "../apiErrors";
import { TIMEOUT_MESSAGE } from "../api";

const withStatus = (message, status) => Object.assign(new Error(message), { status });

describe("describeApiError", () => {
  it("shows the server's own 429 message, so the daily AI cap isn't read as a short burst limit", () => {
    const err = withStatus("Daily AI limit reached for this connection. Please try again tomorrow.", 429);
    expect(describeApiError(err)).toBe("Daily AI limit reached for this connection. Please try again tomorrow.");
  });

  it("falls back to the generic rate-limit text when the server sent no message", () => {
    expect(describeApiError(withStatus("Request failed (429)", 429))).toMatch(/Wait a moment/);
  });

  it("still maps older 'API returned <status>' messages", () => {
    expect(describeApiError(new Error("API returned 429"))).toMatch(/Wait a moment/);
    expect(describeApiError(new Error("API returned 503"))).toMatch(/overloaded/);
  });

  it("uses the status, not digits in the message, when .status is set", () => {
    expect(describeApiError(withStatus("Input too large. Send fewer quotes per batch.", 400)))
      .toBe("Input too large. Send fewer quotes per batch.");
    expect(describeApiError(withStatus("AI service temporarily unavailable. Please try again.", 502)))
      .toMatch(/temporarily unavailable/);
  });

  it("explains a timeout", () => {
    const err = Object.assign(new Error(TIMEOUT_MESSAGE), { name: "TimeoutError" });
    expect(describeApiError(err)).toBe(TIMEOUT_MESSAGE);
  });

  it("recognizes network failures", () => {
    expect(describeApiError(new TypeError("Failed to fetch"))).toMatch(/Network error/);
  });
});
