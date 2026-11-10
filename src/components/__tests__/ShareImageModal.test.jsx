// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";

// Canvas rendering, downloads and the share sheet are browser-only — stub them
// so the modal's own state (which style is generating) is what's under test.
vi.mock("../../utils/shareImage", async (importOriginal) => ({
  ...(await importOriginal()),
  generateShareImage: vi.fn(),
}));
vi.mock("../../utils/export", () => ({ downloadBlob: vi.fn() }));
vi.mock("../../utils/shareLinks", () => ({ canNativeShare: vi.fn(() => false), nativeShare: vi.fn() }));

import { generateShareImage, IMAGE_STYLES } from "../../utils/shareImage";
import { downloadBlob } from "../../utils/export";
import { canNativeShare, nativeShare } from "../../utils/shareLinks";
import ShareImageModal from "../ShareImageModal";

const QUOTE = { id: "q1", text: "Simplicity is the ultimate sophistication", source: "Leonardo da Vinci" };
const LABELS = Object.values(IMAGE_STYLES).map(s => s.label);

function setup() {
  const onClose = vi.fn();
  const showToast = vi.fn();
  render(<ShareImageModal quote={QUOTE} onClose={onClose} showToast={showToast} />);
  return { onClose, showToast };
}

const styleButton = (label) => screen.getByText(label).closest("button");

beforeEach(() => {
  generateShareImage.mockReset();
  downloadBlob.mockReset();
  canNativeShare.mockReset().mockReturnValue(false);
  nativeShare.mockReset();
});
afterEach(cleanup);

describe("ShareImageModal", () => {
  it("offers one enabled button per image style", () => {
    setup();
    expect(LABELS).toEqual(["Classic", "Dark", "Minimal"]);
    for (const label of LABELS) {
      const btn = styleButton(label);
      expect(btn.disabled).toBe(false);
      expect(btn.style.cursor).toBe("pointer");
      expect(btn.style.opacity).toBe("1");
    }
  });

  it("while one style is generating: it shows wait + spinner, the others are dimmed and disabled", async () => {
    let finish;
    generateShareImage.mockReturnValue(new Promise(r => { finish = r; }));
    setup();

    await act(async () => { fireEvent.click(styleButton("Dark")); });

    expect(generateShareImage).toHaveBeenCalledWith(QUOTE, "dark");
    const active = styleButton("Dark");
    expect(active.style.cursor).toBe("wait");
    expect(active.style.opacity).toBe("1");
    expect(active.textContent).toContain("Generating image…");
    expect(active.querySelectorAll("svg.spin")).toHaveLength(2);

    for (const label of ["Classic", "Minimal"]) {
      const btn = styleButton(label);
      expect(btn.disabled).toBe(true);
      expect(btn.style.cursor).toBe("not-allowed");
      expect(btn.style.opacity).toBe("0.5");
      expect(btn.querySelector("svg.spin")).toBeNull();
    }

    await act(async () => { finish(new Blob(["png"], { type: "image/png" })); });
  });

  it("downloads the image, toasts and closes when native share isn't available", async () => {
    const blob = new Blob(["png"], { type: "image/png" });
    generateShareImage.mockResolvedValue(blob);
    const { onClose, showToast } = setup();

    await act(async () => { fireEvent.click(styleButton("Classic")); });

    expect(downloadBlob).toHaveBeenCalledWith(blob, "commonplace-quote-classic.png");
    expect(showToast).toHaveBeenCalledWith("Image saved!", null, null, "success");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses the share sheet when available and stays open if the user cancels it", async () => {
    canNativeShare.mockReturnValue(true);
    nativeShare.mockResolvedValue("cancelled");
    generateShareImage.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const { onClose } = setup();

    await act(async () => { fireEvent.click(styleButton("Minimal")); });

    expect(nativeShare).toHaveBeenCalledTimes(1);
    expect(nativeShare.mock.calls[0][0].files[0].name).toBe("commonplace-quote-minimal.png");
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // Generating state is cleared so another style can be picked
    expect(styleButton("Classic").disabled).toBe(false);
  });

  it("shows an error toast and re-enables the buttons when generation fails", async () => {
    generateShareImage.mockRejectedValue(new Error("canvas"));
    const { onClose, showToast } = setup();

    await act(async () => { fireEvent.click(styleButton("Classic")); });

    expect(showToast).toHaveBeenCalledWith("Couldn't generate image.", null, null, "error");
    expect(onClose).not.toHaveBeenCalled();
    for (const label of LABELS) expect(styleButton(label).disabled).toBe(false);
  });
});
