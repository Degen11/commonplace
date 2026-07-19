import { useState, useEffect, useRef } from "react";
import { LS_THEME, THEME_COLOR_LIGHT, THEME_COLOR_DARK } from "../config";
import { loadString, saveString, removeFromStorage } from "../utils/storage";

export default function useTheme() {
  const transitionTimerRef = useRef(null);
  const [dark, setDark] = useState(() => {
    const saved = loadString(LS_THEME);
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  // Track whether the user explicitly chose a theme (vs auto-detected from system)
  const [explicit, setExplicit] = useState(() => {
    const saved = loadString(LS_THEME);
    return saved === "dark" || saved === "light";
  });

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", dark);
    // "light" class overrides the CSS @media(prefers-color-scheme:dark) fallback
    el.classList.toggle("light", explicit && !dark);
    if (explicit) {
      saveString(LS_THEME, dark ? "dark" : "light");
    } else {
      // Remove stored preference so system preference is always followed
      removeFromStorage(LS_THEME);
    }
  }, [dark, explicit]);

  // Keep the browser chrome (mobile address bar) in sync with the effective theme.
  // index.html ships two media-scoped theme-color metas for pre-JS paint; setting both
  // to the effective color makes whichever one the browser picks correct after an
  // explicit in-app toggle. `dark` already tracks system changes in auto mode.
  useEffect(() => {
    const color = dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", color));
  }, [dark]);

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

  // Sync theme across tabs via storage events
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== LS_THEME) return;
      if (e.newValue === "dark") { setDark(true); setExplicit(true); }
      else if (e.newValue === "light") { setDark(false); setExplicit(true); }
      else { setExplicit(false); setDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false); }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Apply a theme change wrapped in a brief, lightweight color crossfade.
  // The `.theme-transitioning` class (see baseCSS) puts a short background/color/
  // border transition on every element, so when applyFn() flips the html.dark
  // class the CSS-variable colors interpolate. This is deliberately NOT the
  // View Transitions circle: that snapshots the whole page, which stalls on large
  // pages/slower hardware — the crossfade is cheap and smooth everywhere.
  const applyWithTransition = (applyFn) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    const el = document.documentElement;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("theme-transitioning");
      transitionTimerRef.current = setTimeout(() => {
        el.classList.remove("theme-transitioning");
        transitionTimerRef.current = null;
      }, 350);
    }
    applyFn();
  };

  const toggleTheme = () => {
    applyWithTransition(() => { setExplicit(true); setDark(d => !d); });
  };

  // Reset to auto (follow system preference)
  const setAutoTheme = () => {
    applyWithTransition(() => {
      setExplicit(false);
      setDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
    });
  };

  // Cycle: light (explicit) → dark (explicit) → auto → ...
  const cycleTheme = () => {
    if (explicit && dark) {
      setAutoTheme();                       // dark (explicit) → auto
    } else if (explicit && !dark) {
      toggleTheme();                        // light (explicit) → dark (explicit)
    } else if (dark) {
      applyWithTransition(() => { setExplicit(true); setDark(false); }); // auto-dark → explicit light
    } else {
      toggleTheme();                        // auto-light → explicit dark
    }
  };

  // Theme mode for UI display: "light", "dark", or "auto"
  const themeMode = explicit ? (dark ? "dark" : "light") : "auto";

  return { dark, toggleTheme, cycleTheme, themeMode, setAutoTheme };
}
