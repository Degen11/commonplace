import { Dialog } from "@base-ui/react/dialog";

const backdropBase = {
  position: "fixed", inset: 0,
  background: "var(--cp-overlay)",
  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  zIndex: 1000,
  animation: "backdropBlurIn .2s ease-out",
};

const containerBase = {
  position: "fixed", inset: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 20,
  pointerEvents: "none",
  animation: "modalScaleIn .2s ease-out",
};

/**
 * Shared modal wrapper — eliminates duplicated Dialog.Root/Portal/Backdrop
 * boilerplate across all modal components.
 *
 * @param {Function} onClose - Called when the user dismisses the modal
 * @param {Object}   [popupStyle] - Style for the Dialog.Popup container
 * @param {Object}   [containerExtra] - Extra styles merged into the centering container
 * @param {string}   [backdropBg] - Override the backdrop background color
 * @param {Object}   [backdropExtra] - Extra styles merged into the backdrop (overrides defaults)
 * @param {React.ReactNode} children - Modal content
 */
export default function ModalShell({ onClose, popupStyle, containerExtra, backdropBg, backdropExtra, children }) {
  const bdStyle = (backdropBg || backdropExtra)
    ? { ...backdropBase, ...(backdropBg ? { background: backdropBg } : {}), ...backdropExtra }
    : backdropBase;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop style={bdStyle} />
        <div style={containerExtra ? { ...containerBase, ...containerExtra } : containerBase}>
          <Dialog.Popup style={{ pointerEvents: "auto", ...popupStyle }}>
            {children}
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
