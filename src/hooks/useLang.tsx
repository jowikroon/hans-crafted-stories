import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "nl" | "en";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "nl", setLang: () => {} });

export const useLang = () => useContext(LangContext);

interface LangProviderProps {
  children: ReactNode;
  /** Set during SSR/prerender to control initial language (e.g. "en" for /about). */
  initialLang?: Lang;
}

export const LangProvider = ({ children, initialLang }: LangProviderProps) => {
  const [lang, setLang] = useState<Lang>(initialLang ?? "nl");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};
