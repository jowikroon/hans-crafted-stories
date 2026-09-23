import { describe, expect, it } from "vitest";
import { getBlogPostHead, getBlogPostJsonLd, hasEnglishVersion } from "./blogPostHead";
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
      canonical_url: "https://hansvanleeuwen.com/writing/custom-canonical",
    });

    expect(head.title).toBe("Marketplace Strategy: Amazon vs Bol.com");
    expect(head.description).toBe("SEO description from the CMS.");
    expect(head.canonical).toBe("https://hansvanleeuwen.com/writing/custom-canonical");
  });

  it("does not use the single-language meta_title for the other language version (R5)", () => {
    const nlPost = {
      ...basePost,
      title: "Amazon vs Bol.com in 2026",
      title_nl: "Amazon vs Bol.com in 2026: kiezen als Nederlandse verkoper",
      content: "An English article body that differs from the Dutch one.",
      content_nl: "Een Nederlandse tekst over Amazon en Bol.com voor verkopers in Nederland, met de keuzes die je maakt.",
      excerpt: "English excerpt.",
      meta_title: "Amazon vs Bol.com 2026: Kiezen als Nederlandse Verkoper",
      meta_description: "Nederlandse metabeschrijving.",
    };
    const en = getBlogPostHead(nlPost, "en");
    expect(en.title).toBe("Amazon vs Bol.com in 2026 | Hans van Leeuwen");
    expect(en.description).toBe("English excerpt.");
    const nl = getBlogPostHead(nlPost, "nl");
    expect(nl.title).toBe("Amazon vs Bol.com 2026: Kiezen als Nederlandse Verkoper");
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

// i18n-audit 2026-09-22 (R2): de ENG-schakelaar mag alleen een Engelse versie beloven
// als `content` echt afwijkt van `content_nl`; de CMS kopieerde maandenlang NL in beide.
describe("hasEnglishVersion", () => {
  const nl = "Bij Alpine stapten we op Bol.com over van vendor naar seller. De rekensom per productgroep en wat het opleverde.";
  it("is false when the EN column is a copy of the NL column", () => {
    expect(hasEnglishVersion({ ...basePost, content: nl, content_nl: nl })).toBe(false);
    expect(hasEnglishVersion({ ...basePost, content: nl + "\n", content_nl: "  " + nl })).toBe(false);
  });
  it("is true when EN and NL bodies differ", () => {
    expect(hasEnglishVersion({ ...basePost, content: "At Alpine we moved from vendor to seller on Bol.com.", content_nl: nl })).toBe(true);
  });
  it("falls back to language detection when there is no NL column", () => {
    expect(hasEnglishVersion({ ...basePost, content: "Useful article content in English.", content_nl: "" })).toBe(true);
    expect(hasEnglishVersion({ ...basePost, title: "Wat kost een interim e-commerce manager", excerpt: "Mijn eigen tarieven en de rekensom erachter voor je bedrijf", content: nl + " " + nl, content_nl: "" })).toBe(false);
  });
  it("is false without any EN body", () => {
    expect(hasEnglishVersion({ ...basePost, content: "", content_nl: nl })).toBe(false);
  });
});
