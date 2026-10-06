/**
 * Eén URL per taal — de enige manier waarop Google en AI-crawlers een tweetalige
 * site correct lezen (HAN-167 / HAN-83).
 *
 * Sinds 2026-10-06 (besluit Hans: "de site opent standaard in het Nederlands"):
 *
 *   NL (standaard):  /interim-ecommerce-manager
 *   EN:              /en/interim-ecommerce-manager
 *
 * Het oude /nl-prefix bestaat alleen nog als 308-redirect naar het kale pad
 * (vercel.json). Dat sluit aan op het artikelmodel dat al NL-eerst was
 * (/writing/<slug> primair, /en/writing/<slug> Engels).
 *
 * De URL is de enige bron van waarheid voor de taal. Geen navigator.language,
 * geen localStorage, geen geo: Google vraagt expliciet om níet automatisch te
 * wisselen op browsertaal en om zichtbare taal-links te bieden.
 * https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
 */
export type Lang = "nl" | "en";

export const BASE_URL = "https://hansvanleeuwen.com";
export const EN_PREFIX = "/en";
/** Oud NL-prefix (tot 2026-10-06). Wordt nog geparsed zodat oude links de juiste taal krijgen; vercel.json stuurt het met 308 door. */
export const LEGACY_NL_PREFIX = "/nl";
/** Standaardtaal: kale paden zijn Nederlands. */
export const DEFAULT_LANG = "nl" as const;

/** Routes die in beide talen bestaan (basispad = NL-pad zonder prefix). */
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

/** Splits een pathname in taal + basispad. `/en/about` -> { lang: "en", path: "/about" }, `/about` -> { lang: "nl", path: "/about" }. */
export const parsePath = (pathname: string): { lang: Lang; path: string } => {
  const p = normalize(pathname);
  if (p === EN_PREFIX) return { lang: "en", path: "/" };
  if (p.startsWith(EN_PREFIX + "/")) return { lang: "en", path: p.slice(EN_PREFIX.length) || "/" };
  if (p === LEGACY_NL_PREFIX) return { lang: "nl", path: "/" };
  if (p.startsWith(LEGACY_NL_PREFIX + "/")) return { lang: "nl", path: p.slice(LEGACY_NL_PREFIX.length) || "/" };
  return { lang: DEFAULT_LANG, path: p };
};

/** Taal van een pathname, uitsluitend op basis van het /en-prefix (geen prefix = NL). */
export const langFromPath = (pathname: string): Lang => parsePath(pathname).lang;

/**
 * Maakt van een basispad het pad in de gevraagde taal. Alleen routes uit
 * LOCALIZED_ROUTES krijgen het /en-prefix; andere paden (artikelen, portal, cms)
 * blijven ongewijzigd zodat er nooit een niet-bestaande /en-URL ontstaat.
 */
export const localizePath = (path: string, lang: Lang): string => {
  const { path: base } = parsePath(path);
  if (lang === "en" && isLocalizedRoute(base)) return base === "/" ? EN_PREFIX : `${EN_PREFIX}${base}`;
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
 * Wederkerige hreflang-set voor een basispad. x-default = EN (de
 * internationale variant voor wie geen Nederlands spreekt). Niet-gelokaliseerde routes krijgen geen set.
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
