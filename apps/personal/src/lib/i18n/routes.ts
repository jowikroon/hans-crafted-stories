/**
 * Eén URL per taal — de enige manier waarop Google en AI-crawlers een tweetalige
 * site correct lezen (HAN-167 / HAN-83).
 *
 *   EN (canoniek, x-default):  /interim-ecommerce-manager
 *   NL:                        /nl/interim-ecommerce-manager
 *
 * De URL is de enige bron van waarheid voor de taal. Geen navigator.language,
 * geen localStorage, geen geo: Google vraagt expliciet om níet automatisch te
 * wisselen op browsertaal en om zichtbare taal-links te bieden.
 * https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
 */
export type Lang = "nl" | "en";

export const BASE_URL = "https://hansvanleeuwen.com";
export const NL_PREFIX = "/nl";

/** Routes die in beide talen bestaan (EN-pad zonder prefix). */
export const LOCALIZED_ROUTES: readonly string[] = [
  "/",
  "/about",
  "/work",
  "/work/marketplace-product-data-automation",
  "/amazon-nl-specialist",
  "/bol-com-consultant",
  "/interim-ecommerce-manager",
  "/ai-ecommerce-automation",
  "/privacy",
  "/rates",
  // De artikelenindex bestaat in beide talen (/writing EN, /nl/writing NL) sinds de
  // i18n-audit van 2026-09-22. Artikelen volgen een eigen model, zie parseArticlePath.
  "/writing",
] as const;

const normalize = (p: string): string => {
  if (!p) return "/";
  let out = p.split("?")[0].split("#")[0];
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out || "/";
};

export const isLocalizedRoute = (path: string): boolean => LOCALIZED_ROUTES.includes(normalize(path));

/** Splits een pathname in taal + EN-basispad. `/nl/about` -> { lang: "nl", path: "/about" }. */
export const parsePath = (pathname: string): { lang: Lang; path: string } => {
  const p = normalize(pathname);
  if (p === NL_PREFIX) return { lang: "nl", path: "/" };
  if (p.startsWith(NL_PREFIX + "/")) return { lang: "nl", path: p.slice(NL_PREFIX.length) || "/" };
  return { lang: "en", path: p };
};

/** Taal van een pathname, uitsluitend op basis van het /nl-prefix. */
export const langFromPath = (pathname: string): Lang => parsePath(pathname).lang;

/**
 * Maakt van een EN-pad het pad in de gevraagde taal. Alleen routes uit
 * LOCALIZED_ROUTES krijgen een prefix; andere paden (artikelen, portal, cms)
 * blijven ongewijzigd zodat er nooit een niet-bestaande /nl-URL ontstaat.
 */
export const localizePath = (path: string, lang: Lang): string => {
  const { path: base } = parsePath(path);
  if (lang === "nl" && isLocalizedRoute(base)) return base === "/" ? NL_PREFIX : `${NL_PREFIX}${base}`;
  return base;
};

/**
 * localizePath werkt op een kaal pad en laat ?query en #hash vallen; een link
 * als `/writing/<slug>?lang=en` werd daardoor stil de Nederlandse versie
 * (i18n-audit 2026-10-01). Query en hash blijven hier behouden.
 */
export const localizeHref = (to: string, lang: Lang): string => {
  const cut = to.search(/[?#]/);
  if (cut === -1) return localizePath(to, lang);
  return `${localizePath(to.slice(0, cut), lang)}${to.slice(cut)}`;
};

/**
 * Artikel-URL's (besluit Hans 2026-10-02, optie A):
 *
 *   /writing/<slug>      primaire taal van het artikel (NL zodra er NL-tekst is)
 *   /en/writing/<slug>   Engelse versie van een NL-primair artikel, eigen canonical
 *
 * Beide dragen een wederkerige hreflang-set (nl, en, x-default = en). ?lang=en is
 * de oude vorm en gaat met een 308 naar /en/writing/<slug> (vercel.json).
 */
export const EN_ARTICLE_PREFIX = "/en/writing/";

export const parseArticlePath = (pathname: string): { slug: string; enRoute: boolean } | null => {
  const p = normalize(pathname);
  const en = /^\/en\/writing\/([^/]+)$/.exec(p);
  if (en) return { slug: en[1], enRoute: true };
  const primary = /^\/writing\/([^/]+)$/.exec(parsePath(p).path);
  if (primary) return { slug: primary[1], enRoute: false };
  return null;
};

export const absoluteUrl = (path: string, lang: Lang): string => `${BASE_URL}${localizePath(path, lang)}`;

export interface HreflangEntry {
  lang: string;
  href: string;
}

/**
 * Wederkerige hreflang-set voor een EN-basispad. x-default = EN (de
 * internationale variant). Niet-gelokaliseerde routes krijgen geen set.
 */
export const alternatesFor = (path: string): HreflangEntry[] => {
  const { path: base } = parsePath(path);
  if (!isLocalizedRoute(base)) return [];
  return [
    { lang: "en", href: absoluteUrl(base, "en") },
    { lang: "nl", href: absoluteUrl(base, "nl") },
    { lang: "x-default", href: absoluteUrl(base, "en") },
  ];
};

export const OG_LOCALE: Record<Lang, string> = { nl: "nl_NL", en: "en_US" };
