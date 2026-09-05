import { useEffect } from "react";
import { absoluteUrl, alternatesFor, isLocalizedRoute, parsePath, OG_LOCALE, type HreflangEntry, type Lang } from "@/lib/i18n/routes";

interface SEOConfig {
  enabled?: boolean;
  title: string;
  description: string;
  /** Optional page-specific alt text for og:image / twitter:image. Falls back to title. */
  imageAlt?: string;
  /**
   * Absolute URL van de pagina. Voor gelokaliseerde routes liever `path` + `lang`
   * gebruiken: dan worden canonical, hreflang en og:locale automatisch consistent.
   */
  url?: string;
  /** EN-basispad (bv. "/about"). Samen met `lang` de bron voor canonical + hreflang. */
  path?: string;
  /** Taal van de gerenderde content; bepaalt canonical (/nl/...) en og:locale. */
  lang?: Lang;
  type?: string;
  /** Expliciete hreflang-set. Wordt genegeerd wanneer `path` is opgegeven (dan wederkerig afgeleid). */
  hreflang?: HreflangEntry[];
  jsonLd?: Record<string, unknown>;
  /**
   * When true, emit <meta name="robots" content="noindex,nofollow"> so
   * crawlers don't index this page. Used for draft blog posts visible
   * to Hans only.
   */
  noindex?: boolean;
  /**
   * Explicit robots directive (e.g. "noindex,follow" for filtered/sorted
   * views). Takes precedence over noindex. Omit to index normally.
   */
  robots?: string;
}

const DEFAULT_TITLE = "Freelance E-commerce Manager (Amazon & Bol.com) | Hans van Leeuwen";
const DEFAULT_OG_IMAGE = "https://hansvanleeuwen.com/og-image.png";
const DEFAULT_OG_IMAGE_TYPE = "image/png";
const DEFAULT_OG_IMAGE_WIDTH = "1200";
const DEFAULT_OG_IMAGE_HEIGHT = "630";

const setMeta = (name: string, content: string, attr = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
};

const removeMeta = (name: string, attr = "name") => {
  document.querySelector(`meta[${attr}="${name}"]`)?.remove();
};

export const useSEO = ({ enabled = true, title, description, url: explicitUrl, path, lang, type = "website", hreflang: explicitHreflang, jsonLd, noindex = false, robots, imageAlt }: SEOConfig) => {
  // Eén URL per taal: canonical en hreflang volgen uit (path, lang), nooit uit de
  // bezoeker. Zie lib/i18n/routes.ts (HAN-167 / HAN-83).
  const resolvedLang: Lang = lang ?? (path ? parsePath(path).lang : "en");
  const url = path ? absoluteUrl(path, resolvedLang) : (explicitUrl ?? "https://hansvanleeuwen.com/");
  const hreflang = path && isLocalizedRoute(parsePath(path).path) ? alternatesFor(path) : explicitHreflang;
  const hreflangKey = JSON.stringify(hreflang ?? null);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.lang = resolvedLang;
    setMeta("og:locale", OG_LOCALE[resolvedLang], "property");
    const cl = document.querySelector('meta[http-equiv="content-language"]') as HTMLMetaElement | null;
    if (cl) cl.content = resolvedLang;

    document.title = title;
    setMeta("description", description);
    if (robots) {
      setMeta("robots", robots);
    } else if (noindex) {
      setMeta("robots", "noindex,nofollow");
    } else {
      removeMeta("robots");
    }
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", type, "property");
    setMeta("og:image", DEFAULT_OG_IMAGE, "property");
    setMeta("og:image:type", DEFAULT_OG_IMAGE_TYPE, "property");
    setMeta("og:image:width", DEFAULT_OG_IMAGE_WIDTH, "property");
    setMeta("og:image:height", DEFAULT_OG_IMAGE_HEIGHT, "property");
    setMeta("og:image:alt", imageAlt || title, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:image", DEFAULT_OG_IMAGE);
    setMeta("twitter:description", description);
    setMeta("twitter:image:alt", imageAlt || title);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const hreflangClass = "seo-hreflang";
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    if (hreflang) {
      hreflang.forEach(({ lang, href }) => {
        const link = document.createElement("link");
        link.rel = "alternate";
        link.hreflang = lang;
        link.href = href;
        link.className = hreflangClass;
        document.head.appendChild(link);
      });
    }

    const ldId = "page-jsonld";
    if (jsonLd) {
      let ldScript = document.getElementById(ldId) as HTMLScriptElement | null;
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.id = ldId;
        ldScript.type = "application/ld+json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      document.getElementById(ldId)?.remove();
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
      document.querySelector('link[rel="canonical"]')?.remove();
      removeMeta("robots");
      [
        "description",
        "twitter:card",
        "twitter:title",
        "twitter:image",
        "twitter:description",
        "twitter:image:alt",
      ].forEach((name) => removeMeta(name));
      [
        "og:title",
        "og:description",
        "og:url",
        "og:type",
        "og:image",
        "og:image:type",
        "og:image:width",
        "og:image:height",
        "og:image:alt",
      ].forEach((name) => removeMeta(name, "property"));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hreflang wordt via hreflangKey (stringified) vergeleken
  }, [enabled, title, description, url, type, hreflangKey, jsonLd, noindex, robots, imageAlt, resolvedLang]);
};
