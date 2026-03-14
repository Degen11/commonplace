import { useEffect } from "react";

/**
 * Close something when clicking outside a ref.
 * Attaches mousedown listener only while `isOpen` is true.
 *
 * @param {React.RefObject} ref - element to treat as "inside"
 * @param {boolean} isOpen - whether the target is currently open
 * @param {function} onClose - called when an outside click is detected
 */
export default function useClickOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, isOpen, onClose]);
}
