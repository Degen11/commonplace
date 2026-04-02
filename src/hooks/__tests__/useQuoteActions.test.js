// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useQuoteActions from "../useQuoteActions";
import { DELETE_ANIM_MS, MAX_IMPORT_FILE_BYTES } from "../../config";

// ── Shared test data ──

const makeQuote = (overrides = {}) => ({
  id: "1",
  text: "test quote",
  source: "Author",
  category: "Book",
  confidence: "high",
  ...overrides,
});

const defaultQuotes = [
  makeQuote({ id: "1", text: "first quote" }),
  makeQuote({ id: "2", text: "second quote" }),
  makeQuote({ id: "3", text: "third quote" }),
];

// ── Helpers ──

function setup(overrides = {}) {
  const props = {
    quotes: overrides.quotes ?? [...defaultQuotes],
    setQuotes: overrides.setQuotes ?? vi.fn((updater) => {
      if (typeof updater === "function") return updater(props.quotes);
    }),
    allCats: overrides.allCats ?? [],
    showToast: overrides.showToast ?? vi.fn(),
    identifyBatch: overrides.identifyBatch ?? vi.fn(),
    trackDeletion: overrides.trackDeletion ?? vi.fn(),
    untrackDeletion: overrides.untrackDeletion ?? vi.fn(),
    cleanCollectionRefs: overrides.cleanCollectionRefs ?? vi.fn(),
    collections: overrides.collections ?? [],
    addToCollection: overrides.addToCollection ?? vi.fn(),
  };
  const result = renderHook(() => useQuoteActions(props));
  return { result, props };
}

// ── Tests ──

describe("useQuoteActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Initial state ──

  describe("initial state", () => {
    it("starts with deletingId null, copiedId null, and empty reidentifyingIds", () => {
      const { result } = setup();
      expect(result.result.current.deletingId).toBe(null);
      expect(result.result.current.copiedId).toBe(null);
      expect(result.result.current.reidentifyingIds).toEqual(new Set());
    });
  });

  // ── handleDelete ──

  describe("handleDelete", () => {
    it("sets deletingId immediately on call", () => {
      const { result } = setup();
      act(() => {
        result.result.current.handleDelete("2");
      });
      expect(result.result.current.deletingId).toBe("2");
    });

    it("after DELETE_ANIM_MS: clears deletingId, removes quote, calls trackDeletion, and shows undo toast", () => {
      const setQuotes = vi.fn();
      const showToast = vi.fn();
      const trackDeletion = vi.fn();
      const cleanCollectionRefs = vi.fn();
      const { result } = setup({ setQuotes, showToast, trackDeletion, cleanCollectionRefs });

      act(() => {
        result.result.current.handleDelete("2");
      });

      // Before timeout fires, setQuotes should not have been called
      expect(setQuotes).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(DELETE_ANIM_MS);
      });

      expect(result.result.current.deletingId).toBe(null);
      expect(setQuotes).toHaveBeenCalled();
      expect(trackDeletion).toHaveBeenCalledWith(["2"]);
      expect(cleanCollectionRefs).toHaveBeenCalledWith(["2"]);
      expect(showToast).toHaveBeenCalledWith(
        "Entry deleted",
        "Undo",
        expect.any(Function),
      );
    });

    it("undo callback re-inserts the quote at the correct position", () => {
      const setQuotes = vi.fn();
      const showToast = vi.fn();
      const untrackDeletion = vi.fn();
      const { result } = setup({ setQuotes, showToast, untrackDeletion });

      act(() => {
        result.result.current.handleDelete("2");
      });

      act(() => {
        vi.advanceTimersByTime(DELETE_ANIM_MS);
      });

      // Extract the undo callback from the showToast call
      const undoCallback = showToast.mock.calls[0][2];
      expect(undoCallback).toBeTypeOf("function");

      // The undo calls setQuotes with a functional updater that re-inserts the quote
      act(() => {
        undoCallback();
      });

      // setQuotes called once for deletion, once for undo
      expect(setQuotes).toHaveBeenCalledTimes(2);

      // Simulate the undo updater on a filtered array (quote "2" removed)
      const undoUpdater = setQuotes.mock.calls[1][0];
      const afterDeletion = [defaultQuotes[0], defaultQuotes[2]];
      const restored = undoUpdater(afterDeletion);

      // Quote "2" should be re-inserted after quote "1" (its neighbor)
      expect(restored).toHaveLength(3);
      expect(restored[0].id).toBe("1");
      expect(restored[1].id).toBe("2");
      expect(restored[2].id).toBe("3");

      expect(untrackDeletion).toHaveBeenCalledWith(["2"]);
    });
  });

  // ── copyQuote ──

  describe("copyQuote", () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it("wraps text in quotes for QUOTED_CATS categories", async () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const quotedCategories = ["Film", "TV", "Book", "Music", "Game", "Speech", "Person"];

      for (const category of quotedCategories) {
        const q = makeQuote({ category, text: "hello", source: "Source" });

        await act(async () => {
          result.result.current.copyQuote(q);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          `"hello" \u2014 Source`,
        );
        navigator.clipboard.writeText.mockClear();
      }
    });

    it("does not wrap text in quotes for non-QUOTED_CATS categories", async () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const nonQuotedCategories = ["Aphorism", "Philosophical", "Observation"];

      for (const category of nonQuotedCategories) {
        const q = makeQuote({ category, text: "hello", source: "Source" });

        await act(async () => {
          result.result.current.copyQuote(q);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "hello \u2014 Source",
        );
        navigator.clipboard.writeText.mockClear();
      }
    });

    it("shows success toast after copy", async () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });
      const q = makeQuote();

      await act(async () => {
        result.result.current.copyQuote(q);
      });

      // Flush microtasks for the .then()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(showToast).toHaveBeenCalledWith("Copied!", null, null, "success");
    });

    it("shows error toast when clipboard fails", async () => {
      navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error("denied"));
      const showToast = vi.fn();
      const { result } = setup({ showToast });
      const q = makeQuote();

      await act(async () => {
        result.result.current.copyQuote(q);
      });

      // Flush microtasks for the .catch()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(showToast).toHaveBeenCalledWith(
        "Couldn't copy \u2014 try manually selecting the text.",
        null,
        null,
        "error",
      );
    });
  });

  // ── handleFileImport ──

  describe("handleFileImport", () => {
    it("rejects files larger than MAX_IMPORT_FILE_BYTES", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const oversizedFile = new File(["x"], "big.txt", { type: "text/plain" });
      Object.defineProperty(oversizedFile, "size", { value: MAX_IMPORT_FILE_BYTES + 1 });

      act(() => {
        result.result.current.handleFileImport(oversizedFile, vi.fn(), vi.fn());
      });

      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("File too large"),
        null,
        null,
        "error",
      );
    });

    it("rejects unsupported file extensions (.exe)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const exeFile = new File(["data"], "virus.exe", { type: "application/octet-stream" });
      Object.defineProperty(exeFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(exeFile, vi.fn(), vi.fn());
      });

      expect(showToast).toHaveBeenCalledWith(
        "Supported formats: .txt, .csv, .json, .md",
        null,
        null,
        "error",
      );
    });

    it("rejects unsupported file extensions (.pdf)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const pdfFile = new File(["data"], "doc.pdf", { type: "application/pdf" });
      Object.defineProperty(pdfFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(pdfFile, vi.fn(), vi.fn());
      });

      expect(showToast).toHaveBeenCalledWith(
        "Supported formats: .txt, .csv, .json, .md",
        null,
        null,
        "error",
      );
    });

    it("accepts .txt files (does not show error toast)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const txtFile = new File(["hello world"], "notes.txt", { type: "text/plain" });
      Object.defineProperty(txtFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(txtFile, vi.fn(), vi.fn());
      });

      // Should not show an error toast — the file passes validation gates
      const errorCalls = showToast.mock.calls.filter(
        (call) => call[3] === "error",
      );
      expect(errorCalls).toHaveLength(0);
    });

    it("accepts .csv files (does not show error toast)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const csvFile = new File(["col1,col2\na,b"], "data.csv", { type: "text/csv" });
      Object.defineProperty(csvFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(csvFile, vi.fn(), vi.fn());
      });

      const errorCalls = showToast.mock.calls.filter(
        (call) => call[3] === "error",
      );
      expect(errorCalls).toHaveLength(0);
    });

    it("accepts .json files (does not show error toast)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const jsonFile = new File(['[{"text":"hi"}]'], "quotes.json", { type: "application/json" });
      Object.defineProperty(jsonFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(jsonFile, vi.fn(), vi.fn());
      });

      const errorCalls = showToast.mock.calls.filter(
        (call) => call[3] === "error",
      );
      expect(errorCalls).toHaveLength(0);
    });

    it("accepts .md files (does not show error toast)", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      const mdFile = new File(["# Quotes\n> hello"], "quotes.md", { type: "text/markdown" });
      Object.defineProperty(mdFile, "size", { value: 100 });

      act(() => {
        result.result.current.handleFileImport(mdFile, vi.fn(), vi.fn());
      });

      const errorCalls = showToast.mock.calls.filter(
        (call) => call[3] === "error",
      );
      expect(errorCalls).toHaveLength(0);
    });

    it("does nothing when file is null", () => {
      const showToast = vi.fn();
      const { result } = setup({ showToast });

      act(() => {
        result.result.current.handleFileImport(null, vi.fn(), vi.fn());
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });
});
