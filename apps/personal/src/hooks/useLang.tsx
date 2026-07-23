import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "nl" | "en";

const STORAGE_KEY = "site_lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "nl", setLang: () => { /* empty */ } });

export const useLang = () => useContext(LangContext);

interface LangProviderProps {
  children: ReactNode;
  /** Set during SSR/prerender to control initial language (e.g. "en" for /about). */
  initialLang?: Lang;
}

export const LangProvider = ({ children, initialLang }: LangProviderProps) => {
  // Language resolution order (2026-07-23, permanent fix for the EN<->NL flip-flop):
  //   1. explicit SSR initialLang (prerender pins EN)
  //   2. the visitor's PERSISTED choice in localStorage (survives reloads --
  //      this was the missing piece: before, a NL visitor fell back to EN on
  //      every load and had to re-toggle)
  //   3. navigator.language auto-detect
  //   4. "en" (canonical)
  const [lang, setLangState] = useState<Lang>(() => {
    if (initialLang) return initialLang;
    if (typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "nl" || stored === "en") return stored;
      } catch { /* private mode */ }
    }
    if (typeof navigator !== "undefined" && /^nl\b/i.test(navigator.language || "")) return "nl";
    return "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
  };

  // Keep <html lang> in sync with the language the visitor actually sees.
  // Replaces the removed pre-paint "language guard" script (PR #264) at the
  // correct layer: attribute follows CONTENT, so a11y tools and crawlers that
  // execute JS always see a consistent lang/content pair.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};
