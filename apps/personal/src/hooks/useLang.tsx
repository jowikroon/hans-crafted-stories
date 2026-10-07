import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isLocalizedRoute, localizePath, parseArticlePath, parsePath, type Lang } from "@/lib/i18n/routes";
import { usePreloadedData } from "@/contexts/PreloadedDataContext";
import { useArticleLangInfo } from "@/lib/i18n/articleLang";
import { primaryBlogPostLang } from "@/lib/seo/blogPostHead";


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
 * Taal = URL. `/en/...` is Engels, al het andere Nederlands (HAN-167; omgedraaid
 * naar Nederlands-eerst op 2026-10-07, besluit Hans).
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

  // Artikelen: de UI-taal (menu, schakelaar, labels) volgt het artikel, niet de
  // bezoeker (i18n-audit 2026-09-22): op een Nederlands artikel stond ENG als
  // actief omdat de client geen initialLang kent. Bron in volgorde: ?lang=en,
  // de prerender-/SSR-preload, de store die BlogPostPage vult na het laden.
  const article = parseArticlePath(location.pathname);
  const articleSlug = article?.slug;
  const wantsEn = articleSlug ? new URLSearchParams(location.search).get("lang") === "en" : false;
  const preloaded = usePreloadedData();
  const storeInfo = useArticleLangInfo(articleSlug);
  const preloadedArticleLang = useMemo<Lang | null>(() => {
    if (!articleSlug) return null;
    const post = preloaded.blogPost?.slug === articleSlug
      ? preloaded.blogPost
      : preloaded.blogPosts?.find((p) => p.slug === articleSlug) ?? null;
    return post ? primaryBlogPostLang(post) : null;
  }, [articleSlug, preloaded.blogPost, preloaded.blogPosts]);

  const lang = useMemo<Lang>(() => {
    const { lang: fromUrl, path } = parsePath(location.pathname);
    if (fromUrl === "en" && isLocalizedRoute(path)) return "en";
    // /en/writing/<slug> is altijd de Engelse versie (optie A, 2026-10-02).
    if (article?.enRoute) return "en";
    if (articleSlug) {
      if (wantsEn && (storeInfo ? storeInfo.hasEn : true)) return "en";
      return storeInfo?.lang ?? preloadedArticleLang ?? initialLang ?? "nl";
    }
    // Niet-gelokaliseerde routes (portal, cms, music) hebben geen /en-variant;
    // daar bepaalt de SSR-hint de UI-taal, anders EN (die pagina's zijn Engelstalig).
    if (!isLocalizedRoute(path)) return initialLang ?? "en";
    return "nl";
  }, [location.pathname, initialLang, article?.enRoute, articleSlug, wantsEn, storeInfo, preloadedArticleLang]);

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
