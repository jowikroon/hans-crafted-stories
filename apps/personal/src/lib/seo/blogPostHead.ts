import type { BlogPostRow } from "@/lib/api/content";

const BASE_URL = "https://hansvanleeuwen.com";
const DEFAULT_DESCRIPTION =
  "Read this article by Hans van Leeuwen on e-commerce, marketplace strategy, and digital commerce.";

export interface SeoHead {
  title: string;
  description: string;
  canonical: string;
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function getBlogPostCanonical(post: Pick<BlogPostRow, "slug" | "canonical_url">): string {
  const routeCanonical = `${BASE_URL}/writing/${post.slug}`;
  const configuredCanonical = clean(post.canonical_url);

  if (!configuredCanonical) return routeCanonical;

  try {
    const canonicalUrl = new URL(configuredCanonical, BASE_URL);
    const routeUrl = new URL(routeCanonical);

    // An internal CMS canonical must resolve to the post's actual route. Stale
    // clean-slug values otherwise canonicalize suffixed live posts to a soft 404.
    if (
      canonicalUrl.origin === routeUrl.origin &&
      canonicalUrl.pathname.replace(/\/+$/, "") !== routeUrl.pathname
    ) {
      return routeCanonical;
    }

    return canonicalUrl.toString().replace(/\/$/, "");
  } catch {
    return routeCanonical;
  }
}

export function getBlogPostHead(post: BlogPostRow): SeoHead {
  const metaTitle = clean(post.meta_title);
  const title = metaTitle || `${post.title} | Hans van Leeuwen`;
  const description = clean(post.meta_description) || clean(post.excerpt) || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    canonical: getBlogPostCanonical(post),
  };
}

export function getBlogPostJsonLd(post: BlogPostRow): Record<string, unknown> {
  const head = getBlogPostHead(post);
  const url = head.canonical;
  const content = clean(post.content);
  const wordCount = content ? content.split(/\s+/).length : 0;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: head.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Hans van Leeuwen",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Person",
      "@id": `${BASE_URL}/#person`,
      name: "Hans van Leeuwen",
      url: BASE_URL,
    },
    image: clean(post.og_image) || clean(post.image_url) || `${BASE_URL}/og-image.png`,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    ...(wordCount > 0 ? { wordCount } : {}),
    inLanguage: "en",
  };
}
