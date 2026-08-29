import { describe, expect, it } from "vitest";
import { getBlogPostHead, getBlogPostJsonLd } from "./blogPostHead";
import type { BlogPostRow } from "@/lib/api/content";

const basePost: BlogPostRow = {
  id: "post-1",
  title: "Amazon vs Bol.com in 2026",
  excerpt: "A practical comparison for Dutch marketplace teams.",
  content: "Useful article content.",
  title_nl: "",
  excerpt_nl: "",
  content_nl: "",
  category: "e-commerce-strategy",
  tags: ["Amazon", "Bol.com", "Marketplaces"],
  slug: "amazon-vs-bol-com-2026-nederland",
  read_time: "7 min read",
  published: true,
  image_url: "https://hansvanleeuwen.com/og-image.png",
  meta_title: "",
  meta_description: "",
  og_image: "",
  og_title: "",
  og_description: "",
  canonical_url: "",
  primary_keyword: "amazon vs bol.com",
  scheduled_at: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z",
};

describe("blog post SEO head", () => {
  it("builds per-post canonical metadata instead of falling back to the homepage", () => {
    const head = getBlogPostHead(basePost);

    expect(head).toEqual({
      title: "Amazon vs Bol.com in 2026 | Hans van Leeuwen",
      description: "A practical comparison for Dutch marketplace teams.",
      canonical: "https://hansvanleeuwen.com/writing/amazon-vs-bol-com-2026-nederland",
    });
  });

  it("prefers explicit SEO fields while keeping canonical on the writing URL", () => {
    const head = getBlogPostHead({
      ...basePost,
      meta_title: "Marketplace Strategy: Amazon vs Bol.com",
      meta_description: "SEO description from the CMS.",
      canonical_url: "https://hansvanleeuwen.com/writing/amazon-vs-bol-com-2026-nederland",
    });

    expect(head.title).toBe("Marketplace Strategy: Amazon vs Bol.com");
    expect(head.description).toBe("SEO description from the CMS.");
    expect(head.canonical).toBe("https://hansvanleeuwen.com/writing/amazon-vs-bol-com-2026-nederland");
  });

  it("rejects a stale internal canonical that does not match a suffixed live slug", () => {
    const head = getBlogPostHead({
      ...basePost,
      slug: "tragic-mistake-anthropic-leaks-claude-s-source-code-mnhjf9uo",
      canonical_url:
        "https://hansvanleeuwen.com/writing/tragic-mistake-anthropic-leaks-claude-s-source-code",
    });

    expect(head.canonical).toBe(
      "https://hansvanleeuwen.com/writing/tragic-mistake-anthropic-leaks-claude-s-source-code-mnhjf9uo",
    );
  });

  it("emits BlogPosting JSON-LD for the exact post URL", () => {
    const jsonLd = getBlogPostJsonLd(basePost);

    expect(jsonLd["@type"]).toBe("BlogPosting");
    expect(jsonLd.url).toBe("https://hansvanleeuwen.com/writing/amazon-vs-bol-com-2026-nederland");
    expect(jsonLd.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://hansvanleeuwen.com/writing/amazon-vs-bol-com-2026-nederland",
    });
  });
});
