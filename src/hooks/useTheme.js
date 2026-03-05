import { useState, useEffect, useCallback } from "react";

const LS_THEME = "commonplace_theme";

export default function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_THEME);
      if (saved === "dark") return true;
      if (saved === "light") return false;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem(LS_THEME, dark ? "dark" : "light"); } catch {}
  }, [dark]);

  const toggleTheme = useCallback(() => setDark(d => !d), []);

  return { dark, toggleTheme };
}
