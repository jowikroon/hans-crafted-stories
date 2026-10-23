import { describe, expect, it } from "vitest";
import type { BlogPostRow } from "@/lib/api/content";
import { buildRssFeed, rssItemLink } from "./rssFeed";

const base: BlogPostRow = {
  id: "1",
  title: "English title",
  excerpt: "English excerpt",
  content: "English body text",
  title_nl: "",
  excerpt_nl: "",
  content_nl: "",
  category: "E-commerce",
  tags: [],
  slug: "en-only",
  read_time: "3 min",
  published: true,
  status: "published",
  image_url: "",
  meta_title: "",
  meta_description: "",
  og_image: "",
  og_title: "",
  og_description: "",
  canonical_url: "",
  primary_keyword: "",
  scheduled_at: null,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-02T10:00:00Z",
};

const channel = { title: "Artikelen", description: "Alle artikelen", link: "https://hansvanleeuwen.com/writing", language: "nl" as const };

describe("buildRssFeed", () => {
  it("writes a valid RSS 2.0 document with a self link", () => {
    const xml = buildRssFeed([base], channel);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<atom:link href="https://hansvanleeuwen.com/feed.xml" rel="self" type="application/rss+xml" />');
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.getElementsByTagName("parsererror").length).toBe(0);
    expect(doc.getElementsByTagName("item").length).toBe(1);
  });

  it("uses the primary language version and its on-site URL", () => {
    const nl = { ...base, slug: "nl-artikel", title_nl: "Nederlandse titel", excerpt_nl: "Nederlandse samenvatting", content_nl: "Nederlandse tekst over marketplaces" };
    const xml = buildRssFeed([nl], channel);
    expect(xml).toContain("<title>Nederlandse titel</title>");
    expect(xml).toContain("<description>Nederlandse samenvatting</description>");
    expect(rssItemLink(nl)).toBe("https://hansvanleeuwen.com/writing/nl-artikel");
    expect(xml).toContain("<link>https://hansvanleeuwen.com/writing/nl-artikel</link>");
  });

  it("escapes XML and sorts newest first on published_at, then created_at", () => {
    const older = { ...base, slug: "older", title: "A & B <tags>", created_at: "2025-05-01T00:00:00Z" };
    const newer = { ...base, slug: "newer", created_at: "2024-01-01T00:00:00Z", published_at: "2026-06-01T00:00:00Z" };
    const xml = buildRssFeed([older, newer], channel);
    expect(xml).toContain("<title>A &amp; B &lt;tags&gt;</title>");
    expect(xml.indexOf("/writing/newer")).toBeLessThan(xml.indexOf("/writing/older"));
    expect(xml).toContain("<lastBuildDate>Mon, 01 Jun 2026 00:00:00 GMT</lastBuildDate>");
  });
});
