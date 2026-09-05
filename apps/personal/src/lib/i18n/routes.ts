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
  "/work/connect-car-parts",
  "/amazon-nl-specialist",
  "/bol-com-consultant",
  "/interim-ecommerce-manager",
  "/ai-ecommerce-automation",
  "/privacy",
  "/rates",
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
