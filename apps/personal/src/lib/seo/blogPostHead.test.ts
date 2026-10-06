import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE, getBlogPostHead, getBlogPostImage, getBlogPostJsonLd, hasEnglishVersion, isDutchBody } from "./blogPostHead";
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
      image: DEFAULT_OG_IMAGE,
      imageAlt: "Amazon vs Bol.com in 2026",
    });
  });

  describe("share image per language (blog-header design system, 2026-09-25)", () => {
    const NL = "https://x.supabase.co/storage/v1/object/public/bucket/blog-images/post-header-20260925.png";
    const EN = "https://x.supabase.co/storage/v1/object/public/bucket/blog-images/post-header-en-20260925.png";
    const bilingual = {
      ...basePost,
      title_nl: "Amazon versus Bol.com in 2026",
      excerpt_nl: "Een praktische vergelijking.",
      content_nl: "Nederlandse tekst van het artikel.",
      og_image: NL,
      og_image_en: EN,
    };

    it("uses the NL header for the NL version and the EN header for the EN version", () => {
      expect(getBlogPostImage(bilingual, "nl")).toBe(NL);
      expect(getBlogPostImage(bilingual, "en")).toBe(EN);
      expect(getBlogPostHead(bilingual, "nl").image).toBe(NL);
      expect(getBlogPostHead(bilingual, "en").image).toBe(EN);
      expect(getBlogPostHead(bilingual, "nl").imageAlt).toBe("Amazon versus Bol.com in 2026");
    });

    it("falls back from EN header to NL header, then to the site image", () => {
      expect(getBlogPostImage({ ...bilingual, og_image_en: null }, "en")).toBe(NL);
      expect(getBlogPostImage({ ...bilingual, og_image: "", og_image_en: null, image_url: "" }, "en")).toBe(DEFAULT_OG_IMAGE);
      expect(getBlogPostImage({ ...bilingual, og_image: "", cover_image_url: NL }, "nl")).toBe(NL);
    });

    it("never emits a relative or empty og:image", () => {
      expect(getBlogPostImage({ ...bilingual, og_image: "/blog-images/x.png", og_image_en: " ", image_url: "" }, "en")).toBe(DEFAULT_OG_IMAGE);
    });

    it("keeps JSON-LD image in sync with the head image", () => {
      expect(getBlogPostJsonLd(bilingual, "en").image).toBe(EN);
      expect(getBlogPostJsonLd(bilingual, "nl").image).toBe(NL);
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
  });  // Pipeline-fix 2026-10-03: Nederlandse tekst die in de CMS in `content` is bewerkt.
  it("is false when the EN column holds a different, edited Dutch text", () => {
    const edited = `${nl} ${nl} Deze alinea heb ik later in de editor toegevoegd voor de lezer.`;
    expect(hasEnglishVersion({ ...basePost, content: edited, content_nl: nl })).toBe(false);
  });
  it("stays true for a full English body next to a Dutch one", () => {
    const en = "At Alpine we moved from vendor to seller on Bol.com. This is the calculation per product group and what it delivered over the first year, including the fees we paid and the margin we kept.";
    expect(hasEnglishVersion({ ...basePost, content: en, content_nl: nl })).toBe(true);
  });
});

describe("isDutchBody", () => {
  it("separates Dutch from English prose", () => {
    expect(isDutchBody("Bij Alpine stapten we op Bol.com over van vendor naar seller. De rekensom per productgroep en wat het opleverde in het eerste jaar, met de kosten die we betaalden.")).toBe(true);
    expect(isDutchBody("At Alpine we moved from vendor to seller on Bol.com. This is the calculation per product group and what it delivered over the first year, including the fees we paid.")).toBe(false);
  });
  it("ignores marketplace codes and locale paths in English prose", () => {
    const en = "Selling on Amazon DE and eBay DE is not the same as selling on Amazon NL. DE buyers expect fast delivery, DE listings need German titles, and DE returns are high. Read the [guide](/en/writing/amazon-de) and https://example.com/en/de/en for more on DE fees.";
    expect(isDutchBody(en)).toBe(false);
  });
  it("does not let uppercase codes dilute a Dutch body", () => {
    const nl = "Op Amazon DE en eBay DE werkt het anders dan op Bol.com in NL. Een SKU met een goede titel en de juiste EAN haalt de Buy Box, maar de marge is dan nog niet binnen. Kijk dus ook naar de kosten per order en het aantal retouren per SKU.";
    expect(isDutchBody(`${nl} DE NL SKU EAN DE NL SKU EAN DE NL SKU EAN DE NL SKU EAN DE NL SKU EAN`)).toBe(true);
  });
  it("judges the whole body, not a Dutch quote at the top", () => {
    const quote = "> Bij ons stapten we op Bol.com over van vendor naar seller en dat was de beste keuze die we in jaren hebben gemaakt, zegt de oprichter.";
    const en = "This article explains why that switch worked. The numbers per product group show higher margins, faster payouts and more control over pricing. ".repeat(4);
    expect(isDutchBody(`${quote}\n\n${en}`)).toBe(false);
    const dutchIntro = "Bij ons stapten we op Bol.com over van vendor naar seller en dat was de beste keuze die we in jaren hebben gemaakt. ";
    expect(isDutchBody(`${dutchIntro}\n\n${en.repeat(3)}`)).toBe(false);
  });
  it("does not call short text Dutch", () => {
    expect(isDutchBody("De kop van een artikel")).toBe(false);
  });
});
