import { useState, useEffect, useRef } from "react";
import { LS_THEME } from "../config";

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

  const toggleTheme = (/** @type {MouseEvent|undefined} */ event) => {
    // Cancel any in-flight transition cleanup from a previous toggle
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    const applyTheme = () => {
      setExplicit(true);
      setDark(d => !d);
    };

    // Try View Transition API for radial wipe effect
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Get click coordinates for the radial origin
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? 0;
      // Calculate the maximum distance from click to any corner
      const maxDist = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        applyTheme();
        // Flush the class changes synchronously
        const el = document.documentElement;
        // The useEffect will handle class toggling, but we need it to flush during the callback
        // so we also do it here for the view transition snapshot
        const nextDark = !dark; // since setDark hasn't flushed yet, compute manually
        el.classList.toggle("dark", nextDark);
        el.classList.toggle("light", !nextDark);
      });

      // Animate the new view in with a radial clip-path from click position
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
      }).catch(() => {}); // Ignore if animation is interrupted
    } else {
      // Fallback: CSS crossfade transition (existing behavior)
      const el = document.documentElement;
      el.classList.add("theme-transitioning");
      applyTheme();
      transitionTimerRef.current = setTimeout(() => {
        el.classList.remove("theme-transitioning");
        transitionTimerRef.current = null;
      }, 350);
    }
  };

  // Reset to auto (follow system preference)
  const setAutoTheme = () => {
    setExplicit(false);
    setDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  };

  // Cycle: light → dark → auto → (system decides) → light/dark → ...
  const cycleTheme = (event) => {
    if (explicit && dark) {
      // dark (explicit) → auto
      setAutoTheme();
    } else if (explicit && !dark) {
      // light (explicit) → dark (explicit)
      toggleTheme(event);
    } else {
      // auto → light (explicit) — always go to explicit light, then dark, then auto
      setExplicit(true);
      if (dark) {
        // Currently auto-dark, switch to explicit light
        const applyLight = () => { setExplicit(true); setDark(false); };
        if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const x = event?.clientX ?? window.innerWidth / 2;
          const y = event?.clientY ?? 0;
          const maxDist = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
          const transition = document.startViewTransition(() => {
            applyLight();
            const el = document.documentElement;
            el.classList.remove("dark");
            el.classList.add("light");
          });
          transition.ready.then(() => {
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxDist}px at ${x}px ${y}px)`] },
              { duration: 500, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
            );
          }).catch(() => {});
        } else {
          const el = document.documentElement;
          el.classList.add("theme-transitioning");
          applyLight();
          if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = setTimeout(() => { el.classList.remove("theme-transitioning"); transitionTimerRef.current = null; }, 350);
        }
      } else {
        // Currently auto-light, switch to explicit dark
        toggleTheme(event);
      }
    }
  };

  // Theme mode for UI display: "light", "dark", or "auto"
  const themeMode = explicit ? (dark ? "dark" : "light") : "auto";

  return { dark, toggleTheme, cycleTheme, themeMode, setAutoTheme };
}
