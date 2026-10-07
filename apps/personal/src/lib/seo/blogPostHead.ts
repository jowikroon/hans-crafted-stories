import type { BlogPostRow } from "@/lib/api/content";

const BASE_URL = "https://hansvanleeuwen.com";
const DEFAULT_DESCRIPTION =
  "Read this article by Hans van Leeuwen on e-commerce, marketplace strategy, and digital commerce.";

export interface SeoHead {
  title: string;
  description: string;
  canonical: string;
  /** Absolute URL of the 1200x630 header for og:image / twitter:image; never empty. */
  image: string;
  /** Alt text for the header image: the localized post title. */
  imageAlt: string;
}

export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * Only absolute https URLs are usable as og:image (crawlers do not resolve
 * relative paths against the page). Anything else falls back to the site image.
 */
function absoluteImage(value: string | null | undefined): string {
  const v = clean(value);
  if (!v) return "";
  try {
    // Rebuild the URL from its parsed parts so only https origin + path survive
    // (no query, hash or odd characters). Mirrors sameOriginUrl in useSEO.
    const u = new URL(v);
    if (u.protocol !== "https:") return "";
    return `${u.origin}${encodeURI(decodeURI(u.pathname))}`;
  } catch {
    return "";
  }
}

/**
 * Header image per language (blog-header design system, 2026-09-25). Every post
 * carries an NL header in og_image / cover_image_url / image_url and, when made,
 * an EN header in og_image_en. The EN switch falls back to the NL header, and
 * a post without any header falls back to the site-wide og-image.png, so
 * sharing never shows an empty card.
 */
export function getBlogPostImage(
  post: Pick<BlogPostRow, "og_image" | "image_url"> & { og_image_en?: string | null; cover_image_url?: string | null },
  lang: "nl" | "en" = "nl",
): string {
  const primary = absoluteImage(post.og_image) || absoluteImage(post.cover_image_url) || absoluteImage(post.image_url);
  if (lang === "en") return absoluteImage(post.og_image_en) || primary || DEFAULT_OG_IMAGE;
  return primary || DEFAULT_OG_IMAGE;
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
 * Primaire taal van een artikel: Nederlands zodra er een NL-versie is (de
 * doelmarkt), anders de gedetecteerde taal van de EN-velden. De primaire versie
 * staat op /writing/<slug>; een Engelse versie van een NL-primair artikel staat
 * sinds 2026-10-02 op /en/writing/<slug> (zie blogPostPath).
 */
export function primaryBlogPostLang(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content"> & { content_nl?: string | null },
): "nl" | "en" {
  if (post.content_nl && clean(post.content_nl).length > 0) return "nl";
  return detectBlogPostLang(post);
}

const normalizeBody = (value: string | null | undefined): string => clean(value).replace(/\s+/g, " ");

// Sterk-Nederlandse functiewoorden, zonder Engelse homografen als "is", "over", "al" of "die".
const NL_FUNCTION_WORDS = new Set([
  "de", "het", "een", "en", "van", "voor", "niet", "naar", "zijn", "worden", "je", "ik",
  "dat", "wat", "waarom", "dus", "deze", "wordt", "geen", "wel", "nog", "jouw", "onze",
  "ook", "maar", "bij", "hoe", "met", "om", "op", "dan", "kun", "kunt", "meer",
]);

/**
 * Is deze body Nederlands? Aandeel Nederlandse functiewoorden over de hele body
 * (tot 12.000 tekens), zodat een Nederlands citaat of voorbeeld bovenaan een
 * Engels artikel niet beslist. Gemeten op alle posts met twee bodies
 * (2026-10-03): Engelse bodies scoren 0 tot 0,8%, Nederlandse 17 tot 34%; de
 * grens ligt ruim daartussen op 8%. Codeblokken, citaten (`> `), URL's en
 * link-doelen tellen niet mee (`/en/` is geen Nederlands), net als
 * hoofdlettercodes als "DE" in "Amazon DE", ook niet in de noemer. Er moeten
 * minstens vier verschillende functiewoorden in staan, zodat één herhaald woord
 * niet beslist. Korte teksten (< 20 woorden) gelden niet als Nederlands.
 */
export function isDutchBody(text: string | null | undefined): boolean {
  const sample = clean(text)
    .slice(0, 12000)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*>.*$/gm, " ")
    .replace(/\]\([^)]*\)/g, "] ")
    .replace(/https?:\/\/\S+/g, " ");
  const words = sample
    .split(/[^A-Za-z\u00c0-\u00ff']+/)
    .filter((token) => token && !(token.length <= 3 && token === token.toUpperCase()))
    .map((token) => token.toLowerCase());
  if (words.length < 20) return false;
  let hits = 0;
  const distinct = new Set<string>();
  for (const w of words) {
    if (NL_FUNCTION_WORDS.has(w)) {
      hits += 1;
      distinct.add(w);
    }
  }
  return distinct.size >= 4 && hits / words.length >= 0.08;
}

/**
 * Bestaat er een échte Engelse versie van dit artikel? (i18n-audit 2026-09-22)
 *
 * De CMS-pipeline schreef maandenlang dezelfde Nederlandse tekst in `content` én
 * `content_nl` ("content = content_nl, identiek"); `translation_status` wordt door
 * de site niet bijgehouden. Daardoor toonde de ENG-schakelaar een Engelse kop
 * boven een Nederlandse tekst. Een EN-versie telt alleen als `content` gevuld is
 * én inhoudelijk afwijkt van `content_nl`. Zonder NL-veld is `content` de enige
 * versie: die is Engels als de detectie dat zegt (dan is er geen NL-versie, de
 * schakelaar heeft dan niets om naar te wisselen).
 *
 * Pipeline-fix 2026-10-03: een afwijkende body telt alleen als die ook echt niet
 * Nederlands is. In de CMS bewerkte Nederlandse tekst in `content` (naast een
 * oudere `content_nl`) leverde anders een /en/-URL met Nederlandse tekst op.
 */
export function hasEnglishVersion(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content"> & { content_nl?: string | null },
): boolean {
  const en = normalizeBody(post.content);
  if (!en) return false;
  const nl = normalizeBody(post.content_nl);
  if (!nl) return detectBlogPostLang(post) === "en";
  return en !== nl && !isDutchBody(post.content);
}

/**
 * Bestaat er een Nederlandse versie van dit artikel? Een gevuld `content_nl`
 * telt altijd; zonder `content_nl` is `content` de enige versie en is die
 * Nederlands als de detectie dat zegt (de CMS-pipeline schreef soms Nederlandse
 * tekst in de EN-kolommen, i18n-audit 2026-10-01).
 */
export function hasDutchVersion(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content"> & { content_nl?: string | null },
): boolean {
  if (normalizeBody(post.content_nl)) return true;
  return !!normalizeBody(post.content) && detectBlogPostLang(post) === "nl";
}

/** Heeft het artikel een versie in `lang`? Bron voor de lijstfilters en de taalschakelaar. */
export function hasBlogPostVersion(
  post: Pick<BlogPostRow, "title" | "excerpt" | "content"> & { content_nl?: string | null },
  lang: "nl" | "en",
): boolean {
  return lang === "nl" ? hasDutchVersion(post) : hasEnglishVersion(post);
}

type LangSource = Pick<BlogPostRow, "slug" | "title" | "excerpt" | "content"> & { content_nl?: string | null };

/** Heeft dit artikel naast de primaire (NL) versie een eigen Engelse URL? */
export function hasEnglishArticleUrl(post: LangSource): boolean {
  return primaryBlogPostLang(post) === "nl" && hasEnglishVersion(post);
}

/**
 * Pad van de versie van een artikel in `lang` (besluit 2026-10-02, optie A):
 * /en/writing/<slug> voor de Engelse versie van een NL-primair artikel, anders
 * /writing/<slug>. Een lezer van /writing (EN) landt zo direct op de Engelse tekst.
 */
export function blogPostPath(post: LangSource, lang: "nl" | "en"): string {
  if (lang === "en" && hasEnglishArticleUrl(post)) return `/en/writing/${post.slug}`;
  return `/writing/${post.slug}`;
}

/** Interne link naar de versie in `lang` (alias van blogPostPath, PR #387). */
export const blogPostHref = blogPostPath;

/**
 * Wederkerige hreflang-set voor een artikel met NL- én EN-URL: nl, en en
 * x-default (= nl, zoals de rest van de site sinds 2026-10-07). Eentalige artikelen: geen set.
 */
export function blogPostAlternates(post: LangSource & { canonical_url?: string | null }): { lang: string; href: string }[] {
  if (!hasEnglishArticleUrl(post)) return [];
  // De NL-alternate is de echte canonical van de primaire versie; wijst die naar
  // een ander domein, dan geen taalpaar (Codex-review PR #388).
  const nl = getBlogPostCanonical({ slug: post.slug, canonical_url: post.canonical_url ?? "" });
  if (!nl.startsWith(`${BASE_URL}/`)) return [];
  const en = `${BASE_URL}${blogPostPath(post, "en")}`;
  return [
    { lang: "nl", href: nl },
    { lang: "en", href: en },
    { lang: "x-default", href: nl },
  ];
}

/**
 * Canonical van de versie in `lang`. canonical_url (CMS) geldt alleen voor de
 * primaire versie; de Engelse versie is altijd self-canonical op /en/writing.
 */
export function getBlogPostCanonical(
  post: Pick<BlogPostRow, "slug" | "canonical_url"> & Partial<LangSource>,
  lang?: "nl" | "en",
): string {
  if (lang === "en" && post.title !== undefined && hasEnglishArticleUrl(post as LangSource)) {
    return `${BASE_URL}${blogPostPath(post as LangSource, "en")}`;
  }
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
  const articleLang = lang ?? primaryBlogPostLang(input);
  const post = localizeBlogPost(input, articleLang);
  // meta_title / meta_description zijn eentalig en horen bij de primaire taal
  // van het artikel. Op de andere taalversie (/en/writing) bleef de <title> anders
  // Nederlands boven een Engelse tekst (i18n-audit 2026-09-22 R5, 2026-10-01).
  const isPrimary = articleLang === primaryBlogPostLang(input);
  const metaTitle = isPrimary ? clean(post.meta_title) : "";
  const title = metaTitle || `${clean(post.title)} | Hans van Leeuwen`;
  const description = (isPrimary ? clean(post.meta_description) : "") || clean(post.excerpt) || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    canonical: getBlogPostCanonical(input, articleLang),
    image: getBlogPostImage(input, articleLang),
    imageAlt: clean(post.title) || title,
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
    image: head.image,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    ...(wordCount > 0 ? { wordCount } : {}),
    inLanguage: articleLang,
  };
}
