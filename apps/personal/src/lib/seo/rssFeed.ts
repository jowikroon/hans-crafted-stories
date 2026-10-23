import type { BlogPostRow } from "@/lib/api/content";
import { blogPostPath, localizeBlogPost, primaryBlogPostLang } from "@/lib/seo/blogPostHead";

const BASE_URL = "https://hansvanleeuwen.com";
export const RSS_FEED_PATH = "/feed.xml";

type FeedPost = BlogPostRow & { published_at?: string | null };

export interface RssChannel {
  title: string;
  description: string;
  /** Pagina waar de feed bij hoort, bv. https://hansvanleeuwen.com/writing */
  link: string;
  language: "nl" | "en";
}

function xml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML 1.0 staat geen stuurtekens toe (behalve tab, LF, CR).
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function rfc822(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toUTCString();
}

/** De URL van de primaire taalversie: dezelfde pagina die prerender.mjs schrijft (/writing/<slug>). */
export function rssItemLink(post: FeedPost): string {
  return `${BASE_URL}${blogPostPath(post, primaryBlogPostLang(post))}`;
}

/**
 * RSS 2.0 voor de gepubliceerde artikelen, gebouwd uit dezelfde rijen als de geprerenderde
 * artikelpagina's (geen eigen tekst: titel en excerpt komen uit blog_posts, in de primaire taal).
 * Nieuwste eerst op published_at, anders created_at. Guard 27 controleert de uitvoer.
 */
export function buildRssFeed(posts: FeedPost[], channel: RssChannel): string {
  const dated = posts
    .filter((p) => p?.slug)
    .map((p) => ({ post: p, date: p.published_at || p.created_at || null }))
    .sort((a, b) => (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0));

  const items = dated.map(({ post, date }) => {
    const local = localizeBlogPost(post, primaryBlogPostLang(post));
    const link = rssItemLink(post);
    const description = (local.excerpt || "").trim() || (post.meta_description || "").trim();
    const pubDate = rfc822(date);
    return [
      "    <item>",
      `      <title>${xml((local.title || "").trim())}</title>`,
      `      <link>${xml(link)}</link>`,
      `      <guid isPermaLink="true">${xml(link)}</guid>`,
      description ? `      <description>${xml(description)}</description>` : null,
      post.category ? `      <category>${xml(post.category)}</category>` : null,
      pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const lastBuild = rfc822(dated[0]?.date ?? null);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(channel.title)}</title>`,
    `    <link>${xml(channel.link)}</link>`,
    `    <description>${xml(channel.description)}</description>`,
    `    <language>${channel.language}</language>`,
    `    <atom:link href="${BASE_URL}${RSS_FEED_PATH}" rel="self" type="application/rss+xml" />`,
    lastBuild ? `    <lastBuildDate>${lastBuild}</lastBuildDate>` : null,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
}
