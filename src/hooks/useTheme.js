import { useState, useEffect, useRef } from "react";
import { LS_THEME, THEME_COLOR_LIGHT, THEME_COLOR_DARK } from "../config";

export default function useTheme() {
  const transitionTimerRef = useRef(null);
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

    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;
      const maxDist = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        applyFn();
        // Flush class changes synchronously for the view transition snapshot
        const el = document.documentElement;
        el.classList.toggle("dark", nextDark);
        el.classList.toggle("light", !nextDark);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxDist}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      }).catch(() => {});
    } else {
      const el = document.documentElement;
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
