import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isLocalizedRoute, localizePath, parsePath, type Lang } from "@/lib/i18n/routes";

export type { Lang };

interface LangContextValue {
  lang: Lang;
  /** Navigeert naar dezelfde pagina in de andere taal (aparte URL). */
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "en", setLang: () => { /* empty */ } });

export const useLang = () => useContext(LangContext);

interface LangProviderProps {
  children: ReactNode;
  /**
   * SSR/prerender hint. De URL wint altijd; dit veld bestaat alleen nog zodat
   * oudere aanroepen niet breken en als fallback voor niet-gelokaliseerde routes.
   */
  initialLang?: Lang;
}

/**
 * Taal = URL. `/nl/...` is Nederlands, al het andere Engels (HAN-167).
 *
 * Bewust verwijderd (2026-09-05): localStorage-voorkeur en navigator.language.
 * Die maakten dat één URL twee talen serveerde afhankelijk van de bezoeker,
 * waardoor html[lang], title/meta en body elkaar tegenspraken en Google een
 * andere taal indexeerde dan NL-bezoekers zagen. Google vraagt expliciet om
 * geen automatische taalwissel op browsertaal; de zichtbare NL/ENG-schakelaar
 * in de navigatie is de aanbevolen vorm.
 */
export const LangProvider = ({ children, initialLang }: LangProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const lang = useMemo<Lang>(() => {
    const { lang: fromUrl, path } = parsePath(location.pathname);
    if (fromUrl === "nl") return "nl";
    // Niet-gelokaliseerde routes (artikelen, portal, cms) hebben geen /nl-variant;
    // daar bepaalt de SSR-hint (bv. NL-artikel) de UI-taal, anders EN.
    if (!isLocalizedRoute(path) && initialLang) return initialLang;
    return "en";
  }, [location.pathname, initialLang]);

  const setLang = (l: Lang) => {
    if (l === lang) return;
    const target = localizePath(location.pathname, l);
    navigate(`${target}${location.search}${location.hash}`);
  };

  // html[lang] volgt de URL, zodat a11y-tools en JS-renderende crawlers altijd
  // een consistent lang/content-paar zien. De prerender zet hetzelfde attribuut
  // al in de ruwe HTML voor crawlers die geen JS uitvoeren.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};
