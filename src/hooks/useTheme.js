import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
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

  // Shared view transition helper — applies a theme change with radial wipe or CSS fallback
  const applyWithTransition = (event, applyFn, nextDark) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    const el = document.documentElement;

    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;
      const maxDist = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      // The reveal is driven by a CSS keyframe on ::view-transition-new(root)
      // (see baseCSS `cpThemeReveal`), parameterized by these custom properties.
      // A CSS animation is attached to the pseudo from its first frame, so the
      // circle starts fully clipped — no flash of the un-clipped snapshot, and no
      // WAAPI-in-.ready.then() race.
      el.style.setProperty("--vt-x", `${x}px`);
      el.style.setProperty("--vt-y", `${y}px`);
      el.style.setProperty("--vt-r", `${maxDist}px`);

      document.startViewTransition(() => {
        // flushSync commits the React re-render synchronously BEFORE the browser
        // snapshots ::view-transition-new. Without it, the setState in applyFn()
        // commits partway through the animation and blocks the main thread — the
        // "pause when the circle is halfway". It also guarantees the snapshot is
        // complete (no half-rendered content inside the reveal). The class toggle
        // drives the CSS-variable colors for the snapshot.
        flushSync(() => applyFn());
        el.classList.toggle("dark", nextDark);
        el.classList.toggle("light", !nextDark);
      });
    } else {
      el.classList.add("theme-transitioning");
      applyFn();
      transitionTimerRef.current = setTimeout(() => {
        el.classList.remove("theme-transitioning");
        transitionTimerRef.current = null;
      }, 350);
    }
  };

  const toggleTheme = (/** @type {MouseEvent|undefined} */ event) => {
    applyWithTransition(
      event,
      () => { setExplicit(true); setDark(d => !d); },
      !dark,
    );
  };

  // Reset to auto (follow system preference)
  const setAutoTheme = () => {
    setExplicit(false);
    setDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  };

  // Cycle: light (explicit) → dark (explicit) → auto → ...
  const cycleTheme = (event) => {
    if (explicit && dark) {
      // dark (explicit) → auto
      setAutoTheme();
    } else if (explicit && !dark) {
      // light (explicit) → dark (explicit)
      toggleTheme(event);
    } else {
      // auto → explicit (opposite of current system theme)
      if (dark) {
        // Currently auto-dark → explicit light
        applyWithTransition(event, () => { setExplicit(true); setDark(false); }, false);
      } else {
        // Currently auto-light → explicit dark
        toggleTheme(event);
      }
    }
  };

  // Theme mode for UI display: "light", "dark", or "auto"
  const themeMode = explicit ? (dark ? "dark" : "light") : "auto";

  return { dark, toggleTheme, cycleTheme, themeMode, setAutoTheme };
}
