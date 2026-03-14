import { useState, useEffect, useCallback } from "react";
import { LS_THEME } from "../config";

export default function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_THEME);
      if (saved === "dark") return true;
      if (saved === "light") return false;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Track whether the user explicitly chose a theme (vs auto-detected from system)
  const [explicit, setExplicit] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_THEME);
      return saved === "dark" || saved === "light";
    } catch {}
    return false;
  });

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", dark);
    // "light" class overrides the CSS @media(prefers-color-scheme:dark) fallback
    el.classList.toggle("light", explicit && !dark);
    try {
      if (explicit) {
        localStorage.setItem(LS_THEME, dark ? "dark" : "light");
      } else {
        // Remove stored preference so system preference is always followed
        localStorage.removeItem(LS_THEME);
      }
    } catch {}
  }, [dark, explicit]);

  // Listen for system preference changes and follow them when no explicit choice
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => {
      if (!explicit) setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [explicit]);

  const toggleTheme = useCallback(() => {
    setExplicit(true);
    setDark(d => !d);
  }, []);

  return { dark, toggleTheme };
}
