import { useState, useRef, useEffect, useMemo } from "react";
import {
  DEFAULT_CATEGORIES, REORDERABLE_COLS,
} from "../data/constants";
import { decodeShareData } from "../utils/helpers";

const LS_QUOTES    = "commonplace_quotes";
const LS_CATS      = "commonplace_cats";
const LS_COL_ORDER = "commonplace_col_order";

export default function useQuotes(showToast) {
  const [quotes, setQuotes]           = useState([]);
  const [customCats, setCustomCats]   = useState([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === REORDERABLE_COLS.length &&
            REORDERABLE_COLS.every(c => parsed.includes(c))) return parsed;
      }
    } catch(e) {}
    return [...REORDERABLE_COLS];
  });

  const storageLimitWarned = useRef(false);
  const allCats = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  // ── Persist quotes + custom categories ──
  useEffect(() => {
    if (quotes.length > 0 && !isSharedView) {
      try {
        const data = JSON.stringify(quotes);
        const catsData = JSON.stringify(customCats);
        if (!storageLimitWarned.current && data.length + catsData.length > 4 * 1024 * 1024) {
          storageLimitWarned.current = true;
          showToast("Large collection — consider exporting a backup.");
        }
        localStorage.setItem(LS_QUOTES, data);
        localStorage.setItem(LS_CATS, catsData);
      } catch(e) {
        showToast("Couldn't save — storage may be full. Export to keep your data safe.");
      }
    }
  }, [quotes, customCats, isSharedView, showToast]);

  // Persist column order
  useEffect(() => {
    try { localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder)); } catch(e) {}
  }, [columnOrder]);

  // ── Mount: shared link OR restore session ──
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = decodeShareData(hash.slice(2));
      if (decoded?.length > 0) {
        setQuotes(decoded); setIsSharedView(true);
        return;
      }
      showToast("This shared link couldn't be loaded — it may be corrupted.");
      try { window.history.replaceState(null, "", window.location.pathname); } catch(e) {}
    }
    try {
      const saved = localStorage.getItem(LS_QUOTES);
      if (saved) {
        const q = JSON.parse(saved);
        if (q?.length > 0) {
          const cats = JSON.parse(localStorage.getItem(LS_CATS) || "[]");
          setSavedSession({ quotes: q, customCats: cats });
        }
      }
    } catch(e) {
      showToast("Saved session couldn't be loaded. Starting fresh.");
      try { localStorage.removeItem(LS_QUOTES); localStorage.removeItem(LS_CATS); } catch(e2) {}
    }
  }, [showToast]);

  return {
    quotes, setQuotes,
    customCats, setCustomCats,
    columnOrder, setColumnOrder,
    allCats,
    isSharedView, setIsSharedView,
    savedSession, setSavedSession,
  };
}
