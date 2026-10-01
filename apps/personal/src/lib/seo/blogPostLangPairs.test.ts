import { describe, expect, it } from "vitest";
import { blogPostHref, getBlogPostHead, hasBlogPostVersion, hasDutchVersion } from "./blogPostHead";
import type { BlogPostRow } from "@/lib/api/content";

// i18n-audit 2026-10-01: taalparen per artikel, lijstfilters en de ?lang=en-head.
const NL_BODY =
  "Dit is de Nederlandse tekst van het artikel. Het gaat over de vraag hoe je een marketplace aanpakt en waarom dat niet vanzelf gaat. We kijken naar de cijfers en naar wat je zelf kunt doen om het beter te maken.";
const EN_BODY =
  "This is the English text of the article. It covers how to approach a marketplace and why that does not happen by itself. We look at the numbers and at what you can do yourself to make it better.";

const base: BlogPostRow = {
  id: "p",
  title: "Designing with LLMs",
  excerpt: "A practical framework.",
  content: EN_BODY,
  title_nl: "Ontwerpen met LLM's",
  excerpt_nl: "Een praktisch framework.",
  content_nl: NL_BODY,
  category: "ux",
  tags: [],
  slug: "designing-with-llms",
  read_time: "5 min",
  published: true,
  image_url: "",
  meta_title: "Ontwerpen met LLM's: UX-framework | Hans van Leeuwen",
  meta_description: "Nederlandse meta-omschrijving.",
  og_image: "",
  og_title: "",
  og_description: "",
  canonical_url: "",
  primary_keyword: "",
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

describe("blog post language pairs", () => {
  it("treats a post with distinct EN and NL bodies as a complete pair", () => {
    expect(hasBlogPostVersion(base, "nl")).toBe(true);
    expect(hasBlogPostVersion(base, "en")).toBe(true);
    expect(blogPostHref(base, "nl")).toBe("/writing/designing-with-llms");
    expect(blogPostHref(base, "en")).toBe("/writing/designing-with-llms?lang=en");
  });

  it("treats identical columns as NL-only (pipeline wrote NL into the EN column)", () => {
    const nlOnly = { ...base, title: "Waarom je slechte antwoorden krijgt", title_nl: "", content: NL_BODY };
    expect(hasBlogPostVersion(nlOnly, "en")).toBe(false);
    expect(hasBlogPostVersion(nlOnly, "nl")).toBe(true);
    expect(blogPostHref(nlOnly, "en")).toBe("/writing/designing-with-llms");
  });

  it("detects a Dutch-only post that has no content_nl at all", () => {
    const legacy = { ...base, title: "Waarom het niet werkt", excerpt: "Dit is de reden dat het niet werkt.", content: NL_BODY, content_nl: "" };
    expect(hasDutchVersion(legacy)).toBe(true);
    expect(hasBlogPostVersion(legacy, "en")).toBe(false);
  });

  it("treats an English-only post as not available in Dutch", () => {
    const enOnly = { ...base, content_nl: "", title_nl: "", excerpt_nl: "" };
    expect(hasBlogPostVersion(enOnly, "nl")).toBe(false);
    expect(hasBlogPostVersion(enOnly, "en")).toBe(true);
    expect(blogPostHref(enOnly, "en")).toBe("/writing/designing-with-llms");
  });
});

describe("blog post head per language (R5)", () => {
  it("uses meta_title/meta_description only for the primary (NL) version", () => {
    const nl = getBlogPostHead(base, "nl");
    expect(nl.title).toBe("Ontwerpen met LLM's: UX-framework | Hans van Leeuwen");
    expect(nl.description).toBe("Nederlandse meta-omschrijving.");
  });

  it("builds the ?lang=en title from the English fields instead of the Dutch meta_title", () => {
    const en = getBlogPostHead(base, "en");
    expect(en.title).toBe("Designing with LLMs | Hans van Leeuwen");
    expect(en.description).toBe("A practical framework.");
    // canonical blijft de artikel-URL (één URL per artikel, HAN-167)
    expect(en.canonical).toBe("https://hansvanleeuwen.com/writing/designing-with-llms");
  });
});
