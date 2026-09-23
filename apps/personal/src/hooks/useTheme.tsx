import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { resetPageLocalSkin } from "@/hooks/useSkin";

/* ────────────────────────────────────────────────────────────────────────────
   Site-wide theme system — single source of truth for light/dark.

   Replaces the four independent copies that used to live in Navbar,
   HeaderNeon, Wiki and Portal (each with its own useState + localStorage
   read/write, none of them in sync with each other).

   Behaviour ("altijd licht starten", 2026-09-23):
   - Every new document, refresh, deep link AND every route change starts
     LIGHT, regardless of the OS setting or any previously stored choice.
     First paint is handled by the inline guard in index.html (always light,
     no localStorage read), so there is no dark flash before hydration.
   - A manual dark toggle applies to the current page only: it is not
     persisted, and the next route (see useLightOnRouteChange) starts light.
   - OS changes and other tabs no longer change the theme of an open page.
   - Toggling animates via the View Transitions API (soft cross-fade) when
     supported, falls back to a scoped .theme-transition colour fade, and is
     instant for prefers-reduced-motion users.
   - Applies `color-scheme` so native UI (scrollbars, form controls) follows.
   - Updates <meta name="theme-color"> so mobile browser chrome matches.
   ──────────────────────────────────────────────────────────────────────── */

export type Theme = "light" | "dark";

/* Layout effect in the browser (before paint), plain effect during prerender. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Every page starts in this theme (no storage, no OS preference). */
export const START_THEME: Theme = "light";

/* Canvas colours for browser chrome — mirror --background in index.css. */
const THEME_COLOR: Record<Theme, string> = {
  light: "#FAF8F2",
  dark: "#08080A",
};

/* Guarded: the prerender pipeline exposes a window shim WITHOUT matchMedia,
   so checking `typeof window` alone is not enough (broke Build personal). */
const matchMediaSafe = (query: string): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(query).matches;


/** Paint a theme onto <html>: class, native color-scheme, browser chrome. */
export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
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
  /** Back to START_THEME without animation (route changes). */
  resetToStart: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(START_THEME);

  /* Keep the DOM in sync with state. */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    /* Bewust NIET opslaan: een donkerkeuze geldt alleen voor de huidige pagina. */
    const reduce = matchMediaSafe("(prefers-reduced-motion: reduce)");
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

  /* Page-only theme: a route change always starts light again. Called by
     useLightOnRouteChange (inside the router). Instant, no transition. */
  const resetToStart = useCallback(() => {
    applyTheme(START_THEME); // synchronous, so the new route never paints a dark frame
    setThemeState(START_THEME);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resetToStart }}>{children}</ThemeContext.Provider>;
};

/* Fallback store for renders outside <ThemeProvider> (unit tests, isolated
   embeds): same behaviour, minus View Transitions. Also never persisted. */
let fallbackTheme: Theme | null = null;
const fallbackListeners = new Set<(t: Theme) => void>();

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  const [local, setLocal] = useState<Theme>(() => fallbackTheme ?? START_THEME);
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
    applyTheme(next);
    fallbackListeners.forEach((fn) => fn(next));
  };
  return {
    theme: local,
    setTheme: set,
    toggleTheme: () => set(local === "dark" ? "light" : "dark"),
    resetToStart: () => set(START_THEME),
  };
};

/**
 * Surfaces with a fixed theme (Portal, Wiki, dashboards). Forces the theme
 * while mounted WITHOUT persisting anything. On unmount it returns to
 * START_THEME (light); it never restores an OS or stored dark preference.
 */
export const useForcedTheme = (forced: Theme = "dark") => {
  useEffect(() => {
    applyTheme(forced);
    return () => {
      applyTheme(START_THEME);
    };
  }, [forced]);
};

/**
 * Mount once inside the router: every real route change (pathname, incl. a
 * language switch like /about -> /nl/about) starts light again. Hash-only or
 * query-only changes on the same page keep the visitor's page-local choice.
 */
export const useLightOnRouteChange = (pathname: string) => {
  const { resetToStart } = useTheme();
  const first = useRef(true);
  useIsomorphicLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    resetToStart();
    resetPageLocalSkin();
  }, [pathname, resetToStart]);
};
