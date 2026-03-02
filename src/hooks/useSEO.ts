import { useEffect } from "react";

interface HreflangEntry {
  lang: string;
  href: string;
}

interface SEOConfig {
  title: string;
  description: string;
  url: string;
  type?: string;
  hreflang?: HreflangEntry[];
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = "Freelance E-commerce Manager (Amazon & Bol.com) | Hans van Leeuwen";
const DEFAULT_OG_IMAGE = "https://hansvanleeuwen.com/og-image.png";
const DEFAULT_OG_IMAGE_TYPE = "image/png";

const setMeta = (name: string, content: string, attr = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
};

export const useSEO = ({ title, description, url, type = "website", hreflang, jsonLd }: SEOConfig) => {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", type, "property");
    setMeta("og:image", DEFAULT_OG_IMAGE, "property");
    setMeta("og:image:type", DEFAULT_OG_IMAGE_TYPE, "property");
    setMeta("og:image:alt", title, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:image", DEFAULT_OG_IMAGE);
    setMeta("twitter:description", description);
    setMeta("twitter:image:alt", title);

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
    };
  }, [title, description, url, type, hreflang, jsonLd]);
};
