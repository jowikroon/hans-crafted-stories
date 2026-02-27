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
    return env.ASSETS.fetch(request);
  }

  // Fetch the static index.html from the asset pipeline
  const assetResponse = await env.ASSETS.fetch(request);

  const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
  const ogUrl = canonicalUrl;
  const twitterDesc = meta.twitterDescription || meta.description;

  // Use HTMLRewriter for safe, streaming tag replacement
  return new HTMLRewriter()
    .on("title", new TitleHandler(meta.title))
    .on("meta[property='og:title']", new MetaHandler("property", "og:title", meta.title))
    .on("meta[property='og:description']", new MetaHandler("property", "og:description", meta.description))
    .on("meta[property='og:url']", new MetaHandler("property", "og:url", ogUrl))
    .on("meta[name='description']", new MetaHandler("name", "description", meta.description))
    .on("meta[name='twitter:title']", new MetaHandler("name", "twitter:title", meta.title))
    .on("meta[name='twitter:description']", new MetaHandler("name", "twitter:description", twitterDesc))
    .on("link[rel='canonical']", new CanonicalHandler(canonicalUrl))
    .transform(assetResponse);
};
