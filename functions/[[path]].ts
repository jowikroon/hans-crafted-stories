// Cloudflare Pages Function — injects page-specific OG meta tags for social media crawlers.
// Runs on the edge before serving static files.

interface RouteMetadata {
  title: string;
  description: string;
  twitterDescription?: string;
}

const SITE_URL = "https://hansvanleeuwen.com";

const ROUTE_META: Record<string, RouteMetadata> = {
  "/about": {
    title:
      "About Hans van Leeuwen – E-commerce Manager, 10+ Years Experience",
    description:
      "Learn about Hans van Leeuwen's 10+ years of experience in e-commerce management, marketplace strategy on Amazon & Bol.com, UX optimization, and revenue scaling. Based in Amersfoort, NL.",
    twitterDescription:
      "10+ years in e-commerce management — Amazon, Bol.com, UX & growth strategy. Based in Amersfoort, NL.",
  },
  "/work": {
    title:
      "Design Portfolio & Case Studies – E-commerce, 3D & UX | Hans van Leeuwen",
    description:
      "Explore Hans van Leeuwen's portfolio of e-commerce UX projects, 3D creative work, VR game design, and branding case studies with real results.",
    twitterDescription:
      "E-commerce UX, 3D, VR & branding case studies by Hans van Leeuwen.",
  },
  "/writing": {
    title: "E-commerce Insights & Articles | Hans van Leeuwen",
    description:
      "Read Hans van Leeuwen's thoughts on e-commerce strategy, marketplace optimization, Amazon growth, Bol.com best practices, and digital commerce trends.",
    twitterDescription:
      "E-commerce strategy, Amazon & Bol.com insights by Hans van Leeuwen.",
  },
  "/privacy": {
    title: "Privacy Policy | Hans van Leeuwen",
    description:
      "Read the privacy policy of hansvanleeuwen.com. Learn how your data is collected, used, and protected.",
  },
  "/docs": {
    title: "Documentation Index | Hans van Leeuwen",
    description:
      "Browse the documentation index for hansvanleeuwen.com — project docs, hosting, architecture, integrations, and more.",
  },
};

// Route-specific JSON-LD structured data (injected via HTMLRewriter, replacing homepage schema)
const ROUTE_JSONLD: Record<string, string> = {
  "/about": JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "mainEntity": { "@id": "https://hansvanleeuwen.com/#person" },
        "name": "About Hans van Leeuwen – E-commerce Manager",
        "url": "https://hansvanleeuwen.com/about",
        "isPartOf": { "@id": "https://hansvanleeuwen.com/#website" },
      },
      {
        "@type": "Person",
        "@id": "https://hansvanleeuwen.com/#person",
        "name": "Hans van Leeuwen",
        "url": "https://hansvanleeuwen.com/about",
        "jobTitle": "Freelance E-commerce Manager",
        "description": "Freelance e-commerce manager with 10+ years of experience in marketplace strategy, Amazon, Bol.com, and digital commerce.",
        "image": {
          "@type": "ImageObject",
          "url": "https://hansvanleeuwen.com/og-image.png",
          "width": 1200,
          "height": 630,
          "caption": "Hans van Leeuwen – Freelance E-commerce Manager",
        },
        "knowsAbout": ["E-commerce", "Amazon", "Bol.com", "Marketplace optimization", "UX design", "Conversion optimization", "Digital commerce", "SEO", "Amazon Ads", "Bol Ads"],
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Amersfoort",
          "addressCountry": "NL",
        },
        "sameAs": [
          "https://www.linkedin.com/in/hansvl3",
          "https://www.behans.nl",
        ],
      },
        {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", "position": 2, "name": "About", "item": "https://hansvanleeuwen.com/about" },
        ],
      },
    ],
  }),
  "/work": JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://hansvanleeuwen.com/work#page",
        "name": "Design Portfolio & Case Studies – E-commerce, 3D & UX | Hans van Leeuwen",
        "description": ROUTE_META["/work"].description,
        "url": "https://hansvanleeuwen.com/work",
        "isPartOf": { "@id": "https://hansvanleeuwen.com/#website" },
        "about": { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
        "author": { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", "name": "Hans van Leeuwen" },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", "position": 2, "name": "Work", "item": "https://hansvanleeuwen.com/work" },
        ],
      },
    ],
  }),
  "/writing": JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://hansvanleeuwen.com/writing#page",
        "name": ROUTE_META["/writing"].title,
        "description": ROUTE_META["/writing"].description,
        "url": "https://hansvanleeuwen.com/writing",
        "isPartOf": { "@id": "https://hansvanleeuwen.com/#website" },
        "about": { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
        "author": { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", "name": "Hans van Leeuwen" },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", "position": 2, "name": "Writing", "item": "https://hansvanleeuwen.com/writing" },
        ],
      },
    ],
  }),
};

// HTMLRewriter element handlers

class TitleHandler {
  private newTitle: string;
  constructor(title: string) {
    this.newTitle = title;
  }
  text(text: Text) {
    text.replace(text.lastInTextNode ? this.newTitle : "", { html: false });
  }
}

class MetaHandler {
  private attribute: string;
  private matchValue: string;
  private newContent: string;

  constructor(attribute: string, matchValue: string, newContent: string) {
    this.attribute = attribute;
    this.matchValue = matchValue;
    this.newContent = newContent;
  }
  element(element: Element) {
    const attr = element.getAttribute(this.attribute);
    if (attr === this.matchValue) {
      element.setAttribute("content", this.newContent);
    }
  }
}

class CanonicalHandler {
  private newHref: string;
  constructor(href: string) {
    this.newHref = href;
  }
  element(element: Element) {
    const rel = element.getAttribute("rel");
    if (rel === "canonical") {
      element.setAttribute("href", this.newHref);
    }
  }
}

class HreflangRemover {
  element(element: Element) {
    const rel = element.getAttribute("rel");
    if (rel === "alternate" && element.getAttribute("hreflang")) {
      element.remove();
    }
  }
}

class HreflangInjector {
  private path: string;
  private injected = false;
  constructor(path: string) {
    this.path = path;
  }
  element(element: Element) {
    if (this.injected) return;
    const rel = element.getAttribute("rel");
    if (rel === "canonical") {
      const enUrl = `${SITE_URL}${this.path === "/" ? "/" : this.path}`;
      const nlUrl = `${enUrl}${enUrl.includes("?") ? "&" : "?"}lang=nl`;
      element.after(
        `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
        { html: true }
      );
      element.after(
        `<link rel="alternate" hreflang="nl" href="${nlUrl}" />`,
        { html: true }
      );
      element.after(
        `<link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
        { html: true }
      );
      this.injected = true;
    }
  }
}

class JsonLdHandler {
  private newContent: string;
  private replaced = false;
  constructor(content: string) {
    this.newContent = content;
  }
  element(element: Element) {
    if (this.replaced) return;
    const type = element.getAttribute("type");
    if (type === "application/ld+json") {
      element.setInnerContent(this.newContent, { html: false });
      this.replaced = true;
    }
  }
}

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  // Only intercept HTML navigation requests (not JS/CSS/images)
  const accept = request.headers.get("Accept") || "";
  if (!accept.includes("text/html")) {
    return env.ASSETS.fetch(request);
  }

  const meta = ROUTE_META[path];
  if (!meta) {
    const assetResponse = await env.ASSETS.fetch(request);
    const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
    return new HTMLRewriter()
      .on("link[rel='alternate']", new HreflangRemover())
      .on("link[rel='canonical']", new CanonicalHandler(canonicalUrl))
      .on("link[rel='canonical']", new HreflangInjector(path))
      .transform(assetResponse);
  }

  // Fetch the static index.html from the asset pipeline
  const assetResponse = await env.ASSETS.fetch(request);

  const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
  const ogUrl = canonicalUrl;
  const twitterDesc = meta.twitterDescription || meta.description;

  let rewriter = new HTMLRewriter()
    .on("title", new TitleHandler(meta.title))
    .on("meta[property='og:title']", new MetaHandler("property", "og:title", meta.title))
    .on("meta[property='og:description']", new MetaHandler("property", "og:description", meta.description))
    .on("meta[property='og:url']", new MetaHandler("property", "og:url", ogUrl))
    .on("meta[name='description']", new MetaHandler("name", "description", meta.description))
    .on("meta[name='twitter:title']", new MetaHandler("name", "twitter:title", meta.title))
    .on("meta[name='twitter:description']", new MetaHandler("name", "twitter:description", twitterDesc))
    .on("link[rel='alternate']", new HreflangRemover())
    .on("link[rel='canonical']", new CanonicalHandler(canonicalUrl))
    .on("link[rel='canonical']", new HreflangInjector(path));

  // Replace homepage JSON-LD with route-specific schema if available
  const routeJsonLd = ROUTE_JSONLD[path];
  if (routeJsonLd) {
    rewriter = rewriter.on("script[type='application/ld+json']", new JsonLdHandler(routeJsonLd));
  }

  return rewriter.transform(assetResponse);
};
