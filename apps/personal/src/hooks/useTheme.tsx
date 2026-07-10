import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

/* ────────────────────────────────────────────────────────────────────────────
   Site-wide theme system — single source of truth for light/dark.

   Replaces the four independent copies that used to live in Navbar,
   HeaderNeon, Wiki and Portal (each with its own useState + localStorage
   read/write, none of them in sync with each other).

   Behaviour:
   - Initial theme: localStorage("site_theme") → else prefers-color-scheme.
     (First paint is handled by the inline guard in index.html, so there is
     no flash; this provider takes over from the same value after hydration.)
   - Toggling animates via the View Transitions API (soft cross-fade) when
     supported, falls back to a scoped .theme-transition colour fade, and is
     instant for prefers-reduced-motion users.
   - Applies `color-scheme` so native UI (scrollbars, form controls) follows.
   - Updates <meta name="theme-color"> so mobile browser chrome matches.
   - Syncs across tabs (storage event) and follows the OS setting while the
     visitor has not made an explicit choice.
   ──────────────────────────────────────────────────────────────────────── */

export type Theme = "light" | "dark";

const THEME_KEY = "site_theme";

/* Canvas colours for browser chrome — mirror --background in index.css. */
const THEME_COLOR: Record<Theme, string> = {
  light: "#FAF8F2",
  dark: "#08080A",
};

const getSystemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "light" ? t : null;
  } catch {
    return null;
  }
};

/** Paint a theme onto <html>: class, native color-scheme, browser chrome. */
const applyTheme = (theme: Theme) => {
  const el = document.documentElement;
  el.classList.toggle("dark", theme === "dark");
  el.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  /* Keep the DOM in sync with state (covers storage/OS-driven updates too). */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — non-fatal */
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    if (!reduce && typeof doc.startViewTransition === "function") {
      /* Cross-fade the whole page between the two themes. flushSync makes
         React commit the class flip inside the transition callback. */
      doc.startViewTransition(() => {
        flushSync(() => setThemeState(next));
      });
    } else if (!reduce) {
      /* Fallback: brief, property-scoped colour fade (never `transition: all`). */
      const el = document.documentElement;
      el.classList.add("theme-transition");
      window.setTimeout(() => el.classList.remove("theme-transition"), 400);
      setThemeState(next);
    } else {
      setThemeState(next); /* reduced motion: instant flip */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  /* Cross-tab sync. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === "dark" || e.newValue === "light")) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Follow the OS while the visitor has no explicit stored choice. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) setThemeState(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

/* Fallback store for renders outside <ThemeProvider> (unit tests, isolated
   embeds): same behaviour, minus View Transitions and cross-tab sync. */
let fallbackTheme: Theme | null = null;
const fallbackListeners = new Set<(t: Theme) => void>();

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  const [local, setLocal] = useState<Theme>(() => fallbackTheme ?? getStoredTheme() ?? getSystemTheme());
  useEffect(() => {
    if (ctx) return;
    const fn = (t: Theme) => setLocal(t);
    fallbackListeners.add(fn);
    return () => {
      fallbackListeners.delete(fn);
    };
  }, [ctx]);
  if (ctx) return ctx;
  const set = (next: Theme) => {
    fallbackTheme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode */
    }
    applyTheme(next);
    fallbackListeners.forEach((fn) => fn(next));
  };
  return { theme: local, setTheme: set, toggleTheme: () => set(local === "dark" ? "light" : "dark") };
};

/**
 * Immersive dark-only pages (Portal, Wiki). Forces dark while mounted WITHOUT
 * persisting to localStorage (the old versions overwrote the visitor's saved
 * preference), and restores the visitor's own theme on unmount.
 */
export const useForcedTheme = (forced: Theme = "dark") => {
  useEffect(() => {
    const prev = getStoredTheme() ?? getSystemTheme();
    applyTheme(forced);
    return () => {
      applyTheme(prev);
    };
  }, [forced]);
};
