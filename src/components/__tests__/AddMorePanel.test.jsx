// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";

vi.mock("../../utils/api", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "../../utils/api";
import AddMorePanel from "../AddMorePanel";
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from "../../data/constants";

// AddMorePanel's input is controlled by ResultsPhase — keep it in real state here
function Harness(props) {
  const [input, setInput] = useState(props.initialInput ?? "");
  const [fmt, setFmt] = useState(false);
  return (
    <AddMorePanel
      addMoreInput={input} setAddMoreInput={setInput}
      addMoreFormatting={fmt} setAddMoreFormatting={setFmt}
      addMoreRef={{ current: null }}
      allCats={DEFAULT_CATEGORIES}
      onAddMore={vi.fn()} onQuickAdd={vi.fn()} onCancel={vi.fn()} onFileImport={vi.fn()}
      existingCount={4}
      {...props}
    />
  );
}

const tab = (name) => screen.getByRole("button", { name: new RegExp(name) });

beforeEach(() => { apiRequest.mockReset(); });
afterEach(cleanup);

describe("AddMorePanel — tabs", () => {
  it("starts on 'Paste & identify' with only that tab styled active", () => {
    render(<Harness />);
    expect(screen.getByPlaceholderText(/Paste additional quotes/)).toBeDefined();
    expect(screen.getByText("Adding to your 4 quotes")).toBeDefined();
    expect(tab("Paste & identify").style.boxShadow).not.toBe("none");
    expect(tab("Import").style.boxShadow).toBe("none");
    expect(tab("Quick add").style.boxShadow).toBe("none");
  });

  it("switching tabs swaps the content and the active style", () => {
    render(<Harness />);

    fireEvent.click(tab("Import"));
    expect(screen.getByText("Drop a file or click to browse")).toBeDefined();
    expect(screen.queryByPlaceholderText(/Paste additional quotes/)).toBeNull();
    expect(tab("Import").style.boxShadow).not.toBe("none");
    expect(tab("Import").style.background).toBe("var(--cp-bg-card)");
    expect(tab("Paste & identify").style.boxShadow).toBe("none");
    expect(tab("Paste & identify").style.background).toBe("transparent");

    fireEvent.click(tab("Quick add"));
    expect(screen.getByPlaceholderText("Type or paste a single quote…")).toBeDefined();
    expect(tab("Quick add").style.boxShadow).not.toBe("none");
  });
});

describe("AddMorePanel — paste & identify", () => {
  it("counts entries and enables 'Add & identify' once there's input", () => {
    const onAddMore = vi.fn();
    render(<Harness onAddMore={onAddMore} />);
    const add = screen.getByRole("button", { name: "Add & identify" });
    expect(add.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/Paste additional quotes/), { target: { value: "One\nTwo\nThree" } });
    expect(screen.getByText("3 entries")).toBeDefined();
    expect(add.disabled).toBe(false);

    fireEvent.click(add);
    expect(onAddMore).toHaveBeenCalledTimes(1);
  });
});

describe("AddMorePanel — quick add", () => {
  it("sends trimmed text, source and category, then resets the form", () => {
    const onQuickAdd = vi.fn();
    render(<Harness onQuickAdd={onQuickAdd} />);
    fireEvent.click(tab("Quick add"));

    const text = screen.getByPlaceholderText("Type or paste a single quote…");
    fireEvent.change(text, { target: { value: "  Know thyself  " } });
    fireEvent.change(screen.getByPlaceholderText(/^Source/), { target: { value: " Socrates " } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: DEFAULT_CATEGORIES[1] } });
    fireEvent.keyDown(text, { key: "Enter", metaKey: true });

    expect(onQuickAdd).toHaveBeenCalledWith("Know thyself", "Socrates", DEFAULT_CATEGORIES[1]);
    expect(text.value).toBe("");
    expect(screen.getByRole("combobox").value).toBe(FALLBACK_CATEGORY);
  });

  it("ignores an empty quote", () => {
    const onQuickAdd = vi.fn();
    render(<Harness onQuickAdd={onQuickAdd} />);
    fireEvent.click(tab("Quick add"));
    fireEvent.keyDown(screen.getByPlaceholderText("Type or paste a single quote…"), { key: "Enter", ctrlKey: true });
    expect(onQuickAdd).not.toHaveBeenCalled();
  });
});

describe("AddMorePanel — URL fetch", () => {
  function startFetch() {
    render(<Harness />);
    fireEvent.click(tab("Import"));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/quotes"), { target: { value: "https://example.com/q" } });
    const fetchBtn = screen.getByRole("button", { name: "Fetch" });
    return fetchBtn;
  }

  it("shows a spinner and disables the button while fetching", async () => {
    let resolve;
    apiRequest.mockReturnValue(new Promise(r => { resolve = r; }));
    const fetchBtn = startFetch();

    await act(async () => { fireEvent.click(fetchBtn); });

    expect(apiRequest).toHaveBeenCalledWith("/api/fetch-url", { body: { url: "https://example.com/q", extractMode: "all" } });
    expect(fetchBtn.disabled).toBe(true);
    expect(fetchBtn.textContent).toBe("");
    expect(fetchBtn.querySelector("svg.spin")).not.toBeNull();

    await act(async () => { resolve({ lines: [] }); });
    expect(fetchBtn.textContent).toBe("Fetch");
    expect(fetchBtn.querySelector("svg.spin")).toBeNull();
  });

  it("shows the error when the page has no text", async () => {
    apiRequest.mockResolvedValue({ lines: [] });
    const fetchBtn = startFetch();

    await act(async () => { fireEvent.click(fetchBtn); });

    expect(screen.getByText("No text content found")).toBeDefined();
  });

  it("shows the server's error message", async () => {
    apiRequest.mockRejectedValue(new Error("That page couldn't be reached"));
    const fetchBtn = startFetch();

    await act(async () => { fireEvent.click(fetchBtn); });

    expect(screen.getByText("That page couldn't be reached")).toBeDefined();
  });
});
