import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  url: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = "E-commerce Manager & Marketplace Specialist (Amazon & Bol.com) | Hans van Leeuwen";

const setMeta = (name: string, content: string, attr = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
};

export const useSEO = ({ title, description, url, type = "website", jsonLd }: SEOConfig) => {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", type, "property");
    setMeta("og:image:alt", title, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image:alt", title);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

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
    };
  }, [title, description, url, type, jsonLd]);
};
