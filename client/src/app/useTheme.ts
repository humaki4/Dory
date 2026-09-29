import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const themeEvent = "dory-theme-change";

function getTheme(): Theme {
  const storedTheme = window.localStorage.getItem("dory-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeEvent, callback);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("dory-theme", nextTheme);
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
