import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useProcessing from "../hooks/useProcessing";
import useQuoteActions from "../hooks/useQuoteActions";
import useTheme from "../hooks/useTheme";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesStore } from "../stores/quotesStore";
import { DEFAULT_CATEGORIES } from "../data/constants";
import { pluralize } from "../utils/helpers";
import { loadString, saveString, removeFromStorage } from "../utils/storage";
import { smartSplit } from "../utils/textFormatting";
import {
  DRAFT_SAVE_DEBOUNCE_MS,
  LS_DRAFT,
} from "../config";

import InputPhase from "./InputPhase";
import ProcessingPhase from "./ProcessingPhase";
import SectionErrorBoundary from "./SectionErrorBoundary";

const ResultsPhase = lazy(() => import("./ResultsPhase"));
const OnboardingModal = lazy(() => import("./OnboardingModal"));
const DupeModal = lazy(() => import("./DupeModal"));
const EntryReviewModal = lazy(() => import("./EntryReviewModal"));

export default function Commonplace() {
  const { showToast } = useToastContext();

  // Direct Zustand subscriptions — each selector triggers re-render only when its slice changes
  const quotes = useQuotesStore(s => s.quotes);
  const setQuotes = useQuotesStore(s => s.setQuotes);
  const customCats = useQuotesStore(s => s.customCats);
  const setCustomCats = useQuotesStore(s => s.setCustomCats);
  const initialLoading = useQuotesStore(s => s.initialLoading);
  const trackDeletion = useQuotesStore(s => s.trackDeletion);
  const untrackDeletion = useQuotesStore(s => s.untrackDeletion);
  const collections = useQuotesStore(s => s.collections);
  const createCollection = useQuotesStore(s => s.createCollection);
  const addToCollection = useQuotesStore(s => s.addToCollection);
  const removeFromCollection = useQuotesStore(s => s.removeFromCollection);
  const updateCollectionIcon = useQuotesStore(s => s.updateCollectionIcon);
  const cleanCollectionRefs = useQuotesStore(s => s.cleanCollectionRefs);
  const allCats = [...DEFAULT_CATEGORIES, ...customCats];

  const [phase, setPhase]         = useState(() => quotes.length > 0 ? "results" : "input");
  const [rawInput, setRawInput]   = useState(() => loadString(LS_DRAFT, ""));

  const processing = useProcessing({ quotes, setQuotes, allCats, goPhase: setPhase });
  const {
    isProcessing, processingDone, progress, identifiedFeed,
    apiError, failedEntries,
    stats,
    pendingDupes, dupeDecisions, setDupeDecision,
    formattingEnabled, setFormattingEnabled,
    processEntries, handleDupesContinue, retryFailed,
    identifyBatch, autoGroup, skipToResults, cancelProcessing, resetProcessingState,
    dismissApiError, dismissStats,
  } = processing;

  const {
    deletingId,
    copiedId,
    reidentifyingIds,
    handleDelete, copyQuote, reIdentify, batchReIdentify,
    handleFileImport,
  } = useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion, untrackDeletion, cleanCollectionRefs, collections, addToCollection });

  const { dark, cycleTheme: toggleTheme, themeMode } = useTheme();
  const [inputTab, setInputTab]               = useState("paste");
  const [isDragOver, setIsDragOver]           = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const fileInputRef        = useRef(null);

  // When quotes are loaded from sync/shared link, transition to results
  const [prevQuotesEmpty, setPrevQuotesEmpty] = useState(quotes.length === 0);
  if (prevQuotesEmpty && quotes.length > 0 && phase === "input") {
    setPrevQuotesEmpty(false);
    setPhase("results");
  }
  if (!prevQuotesEmpty && quotes.length === 0) {
    setPrevQuotesEmpty(true);
  }

  // Auto-save raw input draft
  useEffect(() => {
    const t = setTimeout(() => {
      if (rawInput.trim()) saveString(LS_DRAFT, rawInput);
      else removeFromStorage(LS_DRAFT);
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawInput]);

  // Warn before leaving mid-identification — a refresh discards in-flight progress.
  // Only while actively processing; the completion screen doesn't need a guard.
  useEffect(() => {
    if (phase !== "processing" || processingDone) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase, processingDone]);

  useEffect(() => {
    const baseTitle = "Commonplace";
    if (phase === "processing" && progress) {
      document.title = `(${progress.done}/${progress.total}) Organizing... \u2014 ${baseTitle}`;
    } else if (quotes.length > 0) {
      document.title = `(${quotes.length}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [quotes, phase, progress]);

  const [pendingReview, setPendingReview] = useState(null);

  const handleProcess = () => {
    const lines = smartSplit(rawInput.trim());
    if (!lines.length) return;
    setPendingReview(lines);
  };

  const handleReviewConfirm = (selectedLines) => {
    setPendingReview(null);
    processEntries(rawInput, false, formattingEnabled, selectedLines);
  };

  const handleReviewCancel = () => {
    setPendingReview(null);
  };

  const importCollections = (imported) => {
    const existingNames = new Set(collections.map(c => c.name.toLowerCase()));
    let added = 0;
    for (const c of imported) {
      if (existingNames.has(c.name.toLowerCase())) continue;
      const col = createCollection(c.name);
      if (col && !col.error) {
        if (c.icon) updateCollectionIcon(col.id, c.icon);
        if (c.quoteIds?.length > 0) addToCollection(col.id, c.quoteIds);
        existingNames.add(c.name.toLowerCase());
        added++;
      }
    }
    if (added > 0) showToast(`Imported ${pluralize(added, "collection")}`, null, null, "success");
  };

  // Called by ResultsPhase when user confirms "Start fresh"
  const clearParentState = () => {
    setPhase("input");
    setRawInput("");
    setImportedFileName(null);
    setInputTab("paste");
    resetProcessingState();
  };

  // Shared motion variants for phase transitions — spring entry, quick ease exit
  const phaseVariants = {
    initial: { opacity: 0, y: 20, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <main>
      <Analytics />
      <SpeedInsights />

      <Suspense fallback={null}>
        <OnboardingModal />
        <DupeModal
          pendingDupes={pendingDupes}
          dupeDecisions={dupeDecisions}
          setDupeDecision={setDupeDecision}
          onContinue={handleDupesContinue}
        />
        {pendingReview && (
          <EntryReviewModal
            lines={pendingReview}
            onConfirm={handleReviewConfirm}
            onCancel={handleReviewCancel}
          />
        )}
      </Suspense>

      {/* reducedMotion="user" — disables motion/react transforms when the OS requests reduced motion */}
      <MotionConfig reducedMotion="user">
      <LayoutGroup>
      <AnimatePresence mode="wait">
      {/* ── Input phase ── */}
      {phase === "input" && (
        <motion.div key="input" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
        <SectionErrorBoundary name="Input">
          <InputPhase
            rawInput={rawInput} setRawInput={setRawInput}
            inputTab={inputTab} setInputTab={setInputTab}
            isDragOver={isDragOver} setIsDragOver={setIsDragOver}
            importedFileName={importedFileName}
            formattingEnabled={formattingEnabled} setFormattingEnabled={setFormattingEnabled}
            isProcessing={isProcessing}
            initialLoading={initialLoading}
            onProcess={handleProcess}
            onFileImport={(file) => handleFileImport(file, setRawInput, setImportedFileName, importCollections)}
            fileInputRef={fileInputRef}
            dark={dark}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        </SectionErrorBoundary>
        </motion.div>
      )}

      {/* ── Processing phase ── */}
      {phase === "processing" && (
        <motion.div key="processing" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
        <SectionErrorBoundary name="Processing">
          <ProcessingPhase
            progress={progress}
            identifiedFeed={identifiedFeed}
            customCats={customCats}
            processingDone={processingDone}
            onCancel={cancelProcessing}
            onSkipToResults={skipToResults}
            stats={stats}
          />
        </SectionErrorBoundary>
        </motion.div>
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <motion.div key="results" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
          <Suspense fallback={null}>
          <ResultsPhase
            apiError={apiError}
            failedEntries={failedEntries}
            stats={stats}
            retryFailed={retryFailed}
            dismissApiError={dismissApiError}
            dismissStats={dismissStats}
            processEntries={processEntries}
            autoGroup={autoGroup}
            deletingId={deletingId}
            copiedId={copiedId}
            reidentifyingIds={reidentifyingIds}
            handleDelete={handleDelete}
            copyQuote={copyQuote}
            reIdentify={reIdentify}
            batchReIdentify={batchReIdentify}
            handleFileImport={handleFileImport}
            dark={dark}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
            importCollections={importCollections}
            onClearReset={clearParentState}
          />
          </Suspense>
        </motion.div>
      )}
      </AnimatePresence>
      </LayoutGroup>
      </MotionConfig>
    </main>
  );
}
