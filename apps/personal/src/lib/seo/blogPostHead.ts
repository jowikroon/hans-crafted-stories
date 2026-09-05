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

const NL_STOPWORDS = new Set([
  "de", "het", "een", "en", "van", "voor", "met", "niet", "naar", "zijn", "worden",
  "je", "ik", "dat", "is", "op", "om", "ook", "maar", "dan", "als", "bij", "hoe",
  "wat", "waarom", "meer", "dus", "die", "deze", "wordt", "kun", "kunt", "geen",
  "wel", "nog", "al", "onze", "jouw", "over",
]);

/**
 * Deterministic build-time language detection for a blog post (HAN-158).
 * blog_posts has no lang column; the primary content field itself is either
 * Dutch or English. Counts Dutch stopwords in title + excerpt + first 800
 * chars of content; >= 8 hits = Dutch. Mirrors the external SEO engine
 * heuristic so audits and build agree.
 */
export function detectBlogPostLang(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content">,
): "nl" | "en" {
  const sample = `${clean(post.title)} ${clean(post.excerpt)} ${clean(post.content).slice(0, 800)}`;
  const words = sample.toLowerCase().split(/[^a-z\u00e0-\u00ff']+/);
  let hits = 0;
  for (const w of words) if (NL_STOPWORDS.has(w)) hits += 1;
  return hits >= 8 ? "nl" : "en";
}

/**
 * Primaire taal van een artikel-URL: Nederlands zodra er een NL-versie is (de
 * doelmarkt), anders de gedetecteerde taal van de EN-velden. Eén URL = één
 * taal; de EN-versie is bereikbaar via ?lang=en zonder eigen canonical (HAN-167).
 */
export function primaryBlogPostLang(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content"> & { content_nl?: string | null },
): "nl" | "en" {
  if (post.content_nl && clean(post.content_nl).length > 0) return "nl";
  return detectBlogPostLang(post);
}

export function getBlogPostCanonical(post: Pick<BlogPostRow, "slug" | "canonical_url">): string {
  return clean(post.canonical_url) || `${BASE_URL}/writing/${post.slug}`;
}

/**
 * De taalversie van een artikel zoals de URL die serveert: title/excerpt/content
 * uit de *_nl-velden wanneer de artikeltaal NL is (en die velden gevuld zijn),
 * anders de EN-basisvelden. Head, JSON-LD en prerender-fallback lezen hier
 * allemaal doorheen zodat ze nooit een andere taal tonen dan de <h1>.
 */
export function localizeBlogPost<T extends Pick<BlogPostRow, "title" | "excerpt" | "content"> & { title_nl?: string | null; excerpt_nl?: string | null; content_nl?: string | null }>(
  post: T,
  lang: "nl" | "en" = primaryBlogPostLang(post),
): T {
  if (lang !== "nl") return post;
  return {
    ...post,
    title: clean(post.title_nl) || post.title,
    excerpt: clean(post.excerpt_nl) || post.excerpt,
    content: clean(post.content_nl) || post.content,
  };
}

export function getBlogPostHead(input: BlogPostRow, lang?: "nl" | "en"): SeoHead {
  const post = localizeBlogPost(input, lang);
  const metaTitle = clean(post.meta_title);
  const title = metaTitle || `${post.title} | Hans van Leeuwen`;
  const description = clean(post.meta_description) || clean(post.excerpt) || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    canonical: getBlogPostCanonical(post),
  };
}

export function getBlogPostJsonLd(input: BlogPostRow, lang?: "nl" | "en"): Record<string, unknown> {
  const articleLang = lang ?? primaryBlogPostLang(input);
  const post = localizeBlogPost(input, articleLang);
  const head = getBlogPostHead(input, articleLang);
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
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Hans van Leeuwen \u2013 E-commerce & Marketplace Management",
      url: BASE_URL,
    },
    image: clean(post.og_image) || clean(post.image_url) || `${BASE_URL}/og-image.png`,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    ...(wordCount > 0 ? { wordCount } : {}),
    inLanguage: articleLang,
  };
}
