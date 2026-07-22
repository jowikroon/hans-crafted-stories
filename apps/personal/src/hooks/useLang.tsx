import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "nl" | "en";

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
  // Auto-detect the visitor's language. Priority: explicit SSR initialLang >
  // a guard-script decision on <html lang> (set synchronously in index.html from
  // navigator.language) > navigator.language directly > "en". Reading it lazily in
  // useState means the very first client render already uses the detected language,
  // so there is no post-mount en<->nl re-render for the common case.
  const [lang, setLang] = useState<Lang>(() => {
    if (initialLang) return initialLang;
    if (typeof document !== "undefined") {
      const htmlLang = document.documentElement.lang;
      if (htmlLang === "nl" || htmlLang === "en") return htmlLang;
    }
    if (typeof navigator !== "undefined" && /^nl\b/i.test(navigator.language || "")) return "nl";
    return "en";
  });
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};
