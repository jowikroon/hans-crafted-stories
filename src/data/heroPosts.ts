import type { BlogPostRow } from "@/lib/api/content";
import { blogContent } from "@/data/blogContent";

/**
 * Hero posts: slugs we prerender at build time using blogContent fallback (no Supabase).
 * Add slug → metadata here; body comes from blogContent[slug].
 */
const HERO_METADATA: Record<
  string,
  Omit<BlogPostRow, "content" | "content_nl" | "title_nl" | "excerpt_nl"> & { content?: string }
> = {
  "designing-with-llms": {
    id: "hero-designing-with-llms",
    slug: "designing-with-llms",
    title: "Designing with LLMs: A Practical UX Framework",
    excerpt:
      "Learn a practical framework for designing LLM-powered products: define confidence boundaries, keep humans in the loop, design for failure, and ship AI experiences users trust.",
    category: "professional",
    tags: ["LLM", "UX", "AI", "Product design"],
    read_time: "5 min read",
    published: true,
    image_url: "https://hansvanleeuwen.com/og-image.png",
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  },
};

const BASE_URL = "https://hansvanleeuwen.com";

export type HeroPostRow = BlogPostRow;

/** Build a full BlogPostRow for a hero slug using blogContent body. Returns null if slug not in hero list or no content. */
export function getHeroPost(slug: string): BlogPostRow | null {
  const meta = HERO_METADATA[slug];
  const content = blogContent[slug];
  if (!meta || !content) return null;

  return {
    ...meta,
    content,
    content_nl: "",
    title_nl: "",
    excerpt_nl: "",
  } as BlogPostRow;
}

/** Slugs that are prerendered as hero posts (no Supabase at build time). */
export const HERO_SLUGS = Object.keys(HERO_METADATA) as string[];

/** Head tags for a hero post (for prerender script). */
export function getHeroPostHead(slug: string): { title: string; description: string; canonical: string } | null {
  const meta = HERO_METADATA[slug];
  if (!meta) return null;
  return {
    title: `${meta.title} | Hans van Leeuwen`,
    description: meta.excerpt,
    canonical: `${BASE_URL}/writing/${slug}`,
  };
}
