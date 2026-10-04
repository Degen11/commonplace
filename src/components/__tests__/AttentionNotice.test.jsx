// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AttentionNotice } from "../NotificationBars";
import ConfidenceTag from "../ConfidenceTag";

afterEach(cleanup);

function noticeProps(overrides = {}) {
  return {
    unknownCount: 2, reviewQueue: [], setReviewQueue: vi.fn(), setEditingId: vi.fn(),
    sortBy: "default", dismissedAtCount: null, setDismissedAtCount: vi.fn(),
    handleStartReview: vi.fn(),
    ...overrides,
  };
}

describe("AttentionNotice", () => {
  it("renders nothing when every quote has a source and category", () => {
    const { container } = render(<AttentionNotice {...noticeProps({ unknownCount: 0 })} />);
    expect(container.textContent).toBe("");
  });

  it("states the count and starts review from the Review button", () => {
    const props = noticeProps();
    render(<AttentionNotice {...props} />);
    expect(screen.getByText("2 quotes are missing a source or category.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(props.handleStartReview).toHaveBeenCalledOnce();
  });

  it("uses singular wording for one quote", () => {
    render(<AttentionNotice {...noticeProps({ unknownCount: 1 })} />);
    expect(screen.getByText("1 quote is missing a source or category.")).toBeTruthy();
  });

  it("dismisses at the current count", () => {
    const props = noticeProps();
    render(<AttentionNotice {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss review reminder" }));
    expect(props.setDismissedAtCount).toHaveBeenCalledWith(2);
  });

  it("shows review progress with an exit action while reviewing", () => {
    const props = noticeProps({ reviewQueue: ["a", "b", "c"] });
    render(<AttentionNotice {...props} />);
    expect(screen.getByText("3 quotes left to review.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Exit review" }));
    expect(props.setReviewQueue).toHaveBeenCalledWith([]);
    expect(props.setEditingId).toHaveBeenCalledWith(null);
  });
});

describe("ConfidenceTag", () => {
  it("shows nothing for high confidence", () => {
    const { container } = render(<ConfidenceTag confidence="high" />);
    expect(container.textContent).toBe("");
  });

  it("labels medium and low matches", () => {
    const { rerender } = render(<ConfidenceTag confidence="medium" />);
    expect(screen.getByText("Check")).toBeTruthy();
    rerender(<ConfidenceTag confidence="low" />);
    expect(screen.getByText("Low")).toBeTruthy();
  });
});
