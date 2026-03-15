import useScrollLock from "../hooks/useScrollLock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function ConfirmModal({
  icon,
  iconBg,
  borderColor,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  useScrollLock();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        showClose={false}
        className="max-w-sm"
        style={{ borderTop: `3px solid ${borderColor}` }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="flex items-center justify-center shrink-0 rounded-[10px]"
              style={{ width: 36, height: 36, background: iconBg }}
            >
              {icon}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
