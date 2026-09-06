// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DeviceLinkModal from "../DeviceLinkModal";
import { LS_DEVICE_ID } from "../../config";

const THIS_DEVICE = "11111111-1111-1111-1111-111111111111";
const OTHER_DEVICE = "22222222-2222-2222-2222-222222222222";

const mocks = vi.hoisted(() => ({ deviceId: "", saveString: vi.fn(() => true) }));

vi.mock("../../utils/storage", () => ({
  loadString: () => mocks.deviceId,
  saveString: mocks.saveString,
  loadFromStorage: (_k, _v, fb) => (typeof fb === "function" ? fb() : (fb ?? [])),
  saveToStorage: () => true,
  removeFromStorage: () => {},
}));

function setup(props = {}) {
  const showToast = vi.fn();
  render(<DeviceLinkModal onClose={vi.fn()} syncStatus="synced" onRetry={vi.fn()} showToast={showToast} {...props} />);
  return { showToast };
}

const lastVariant = (showToast) => showToast.mock.calls.at(-1)?.[3];

let realLocation;
beforeEach(() => {
  mocks.deviceId = THIS_DEVICE;
  mocks.saveString.mockReset().mockReturnValue(true);
  // jsdom's location.reload() throws "Not implemented" — replace with a stub so the
  // relink path can run.
  realLocation = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { reload: vi.fn(), href: "http://localhost/", pathname: "/", origin: "http://localhost" },
  });
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
});

describe("DeviceLinkModal", () => {
  it("shows this device's code", () => {
    setup();
    expect(screen.getByText(THIS_DEVICE)).toBeTruthy();
  });

  it("rejects an invalid code — error toast, no relink", () => {
    const { showToast } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Device code to link" }), { target: { value: "not-a-uuid" } });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(lastVariant(showToast)).toBe("error");
    // Opening the panel marks sync as "engaged" (a separate flag) — the guard
    // under test is that the device id itself is never overwritten.
    expect(mocks.saveString).not.toHaveBeenCalledWith(LS_DEVICE_ID, expect.anything());
  });

  it("guards against linking to your own code — info toast, no relink", () => {
    const { showToast } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Device code to link" }), { target: { value: THIS_DEVICE.toUpperCase() } });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(lastVariant(showToast)).toBe("info");
    expect(mocks.saveString).not.toHaveBeenCalledWith(LS_DEVICE_ID, expect.anything());
  });

  it("persists a valid new code before reloading", () => {
    setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Device code to link" }), { target: { value: OTHER_DEVICE } });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(mocks.saveString).toHaveBeenCalledWith(LS_DEVICE_ID, OTHER_DEVICE);
  });

  it("surfaces a storage-write failure instead of relinking", () => {
    mocks.saveString.mockReturnValue(false);
    const { showToast } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Device code to link" }), { target: { value: OTHER_DEVICE } });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(lastVariant(showToast)).toBe("error");
  });

  it("renders the storage-blocked warning when there is no device code", () => {
    mocks.deviceId = null;
    setup();
    expect(screen.getByText(/Cloud sync is unavailable/i)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Device code to link" })).toBeNull();
  });
});
