import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useProcessing from "../hooks/useProcessing";
import useQuoteActions from "../hooks/useQuoteActions";
import useTheme from "../hooks/useTheme";

import { useToastContext } from "../contexts/ToastContext";
import { useQuotesContext } from "../contexts/QuotesContext";

import { sanitizeName } from "../data/constants";
import { pluralize } from "../utils/helpers";
import {
  DRAFT_SAVE_DEBOUNCE_MS,
  LS_DRAFT,
} from "../config";

import DupeModal from "./DupeModal";
import InputPhase from "./InputPhase";
import ProcessingPhase from "./ProcessingPhase";
import ResultsPhase from "./ResultsPhase";
import SectionErrorBoundary from "./SectionErrorBoundary";

export default function Commonplace() {
  const { showToast } = useToastContext();
  const {
    quotes, setQuotes,
    customCats, setCustomCats,
    allCats,
    initialLoading,
    trackDeletion, untrackDeletion,
    collections,
    createCollection,
    addToCollection, removeFromCollection, updateCollectionIcon,
    cleanCollectionRefs,
  } = useQuotesContext();

  const [phase, setPhase]         = useState("input");
  const [rawInput, setRawInput]   = useState(() => {
    try { return localStorage.getItem(LS_DRAFT) || ""; } catch(e) { return ""; }
  });

  const goPhase = setPhase;

  const processing = useProcessing({ quotes, setQuotes, allCats, goPhase });
  const {
    isProcessing, processingDone, progress, identifiedFeed,
    apiError, failedEntries,
    stats,
    pendingDupes, dupeDecisions, setDupeDecision,
    formattingEnabled, setFormattingEnabled,
    processEntries, handleDupesContinue, retryFailed,
    identifyBatch, autoGroup, cancelProcessing, resetProcessingState,
    dismissApiError, dismissStats,
  } = processing;

  const {
    deletingId,
    copiedId,
    reidentifyingIds,
    handleDelete, copyQuote, reIdentify, batchReIdentify,
    handleFileImport,
  } = useQuoteActions({ quotes, setQuotes, allCats, showToast, identifyBatch, trackDeletion, untrackDeletion, cleanCollectionRefs });

  const { dark, toggleTheme } = useTheme();
  const [inputTab, setInputTab]               = useState("paste");
  const [isDragOver, setIsDragOver]           = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const fileInputRef        = useRef(null);

  // useLayoutEffect prevents flash of input phase on synchronous loads
  useLayoutEffect(() => {
    if (quotes.length > 0 && phase === "input") {
      setPhase("results");
    }
  }, [quotes.length, phase]);

  // Auto-save raw input draft
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (rawInput.trim()) localStorage.setItem(LS_DRAFT, rawInput);
        else localStorage.removeItem(LS_DRAFT);
      } catch(e) {}
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawInput]);

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

  const handleProcess = () => processEntries(rawInput, false, formattingEnabled);

  const importCollections = useCallback((imported) => {
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
  }, [collections, createCollection, updateCollectionIcon, addToCollection, showToast]);

  // Called by ResultsPhase when user confirms "Start fresh"
  const clearParentState = useCallback(() => {
    goPhase("input");
    setRawInput("");
    setImportedFileName(null);
    setInputTab("paste");
    resetProcessingState();
  }, [goPhase, resetProcessingState]);

  // Shared motion variants for phase transitions
  const phaseVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <>
      <Analytics />
      <SpeedInsights />

      <DupeModal
        pendingDupes={pendingDupes}
        dupeDecisions={dupeDecisions}
        setDupeDecision={setDupeDecision}
        onContinue={handleDupesContinue}
      />

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
          />
        </SectionErrorBoundary>
        </motion.div>
      )}

      {/* ── Results phase ── */}
      {phase === "results" && (
        <motion.div key="results" variants={phaseVariants} initial="initial" animate="animate" exit="exit">
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
            importCollections={importCollections}
            onClearReset={clearParentState}
          />
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
