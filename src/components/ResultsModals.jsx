import ShortcutsModal from "./ShortcutsModal";
import ShareImageModal from "./ShareImageModal";
import ConfirmModal from "./ConfirmModal";
import CollectionDupeModal from "./CollectionDupeModal";
import { TriangleAlert, Trash2 } from "lucide-react";
import { CLR_ORANGE } from "./styles";

/**
 * All modal dialogs used by ResultsPhase, extracted to reduce component size.
 * Each modal is conditionally rendered based on its trigger state.
 */
export default function ResultsModals({
  showShortcuts, setShowShortcuts,
  shareImageQuote, setShareImageQuote, showToast,
  confirmClear, setConfirmClear, handleClear, quotesLength,
  confirmBulkDel, setConfirmBulkDel, bulkDel, selectedSize,
  collectionDupes, setCollectionDupes, handleDupeDeleteBatch,
}) {
  return (
    <>
      <CollectionDupeModal
        dupeGroups={collectionDupes}
        onClose={() => setCollectionDupes([])}
        onDeleteQuotes={handleDupeDeleteBatch}
      />

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {shareImageQuote && (
        <ShareImageModal
          quote={shareImageQuote}
          onClose={() => setShareImageQuote(null)}
          showToast={showToast}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          icon={<TriangleAlert size={20} color={CLR_ORANGE} strokeWidth={2} />}
          iconColor={CLR_ORANGE}
          iconBg="var(--cp-warning-bg)"
          borderColor={CLR_ORANGE}
          title="Start fresh?"
          description={`This will clear all ${quotesLength} entries and remove them from your saved session. This cannot be undone.`}
          cancelLabel="Keep my entries"
          confirmLabel="Clear everything"
          onCancel={() => setConfirmClear(false)}
          onConfirm={handleClear}
        />
      )}

      {confirmBulkDel && (
        <ConfirmModal
          icon={<Trash2 size={20} color="#EB5757" strokeWidth={2} />}
          iconColor="#EB5757"
          iconBg="var(--cp-error-bg)"
          borderColor="#EB5757"
          title={`Delete ${selectedSize} entries?`}
          description={`This will remove ${selectedSize} selected entries. You can undo immediately after.`}
          cancelLabel="Keep entries"
          confirmLabel={`Delete ${selectedSize} entries`}
          onCancel={() => setConfirmBulkDel(false)}
          onConfirm={bulkDel}
        />
      )}
    </>
  );
}
