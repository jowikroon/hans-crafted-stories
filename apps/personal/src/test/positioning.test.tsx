import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import indexHtml from "../../index.html?raw";
import llmsTxt from "../../public/llms.txt?raw";
import { translations } from "@/data/translations";
import { HOME_FAQ, homeFaqJsonLd } from "@/data/homeFaq";
import { IDENTITY } from "@/lib/seo/identity";
import { PERSON_ENTITY, PROFESSIONAL_SERVICE_ENTITY } from "@/lib/seo/sharedEntities";

/* Positionering 2026-09-24: marketplace manager primair (Amazon en bol), eBay aanvullend,
   geen lange gedachtestreep in eigen publiekscopy, CMS kan gewijzigde velden niet terugzetten. */

// jsdom kent geen IntersectionObserver (framer-motion whileInView); minimale stub voor deze test.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;

const EM_DASH = /—|&mdash;|&#8212;|&#x2014;/i;

// Stale CMS-rijen simuleren: usePageContent geeft voor ELKE sleutel een oude waarde terug.
vi.mock("@/hooks/usePageContent", () => ({
  usePageContent: () => ({
    getValue: (key: string, fallback: string) => (key.startsWith("hero_") || key.startsWith("expertise_") || key.startsWith("about_h1") ? `OUDE CMS ${key}` : fallback),
  }),
}));
vi.mock("@/components/FeaturedArticles", () => ({ default: () => null }));

import Hero from "@/components/Hero";
import { HOME_CODE_OWNED_KEYS } from "@/data/codeOwnedCms";

const renderHero = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Hero />
    </MemoryRouter>,
  );

describe("homepage positioning (EN, rendered)", () => {
  it("H1 = name + 'Marketplace manager for Amazon and bol', kicker and intro from code", () => {
    renderHero();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Hans van LeeuwenMarketplace manager for Amazon and bol");
    expect(screen.getByText("Freelance and interim marketplace manager")).toBeInTheDocument();
    expect(screen.getByText(/I help brands and retailers manage their strategy and day-to-day operations on Amazon and bol/)).toBeInTheDocument();
    expect(screen.getByText(/More recently, I have also worked with eBay\./)).toBeInTheDocument();
  });

  it("stale CMS rows cannot bring old copy back after load (code-owned keys)", () => {
    renderHero();
    expect(document.body.textContent).not.toMatch(/OUDE CMS hero_(subtitle|description|cta_consult|cta_work|heading_emphasis)/);
    expect(document.body.textContent).not.toMatch(/OUDE CMS expertise_/);
    for (const k of ["hero_subtitle", "hero_description", "hero_heading_emphasis", "hero_cta_consult", "hero_cta_work"]) {
      expect(HOME_CODE_OWNED_KEYS.has(k)).toBe(true);
    }
  });

  it("primary CTA is visible and points to the contact section", () => {
    renderHero();
    const cta = screen.getByRole("link", { name: /Discuss your marketplace needs/ });
    expect(cta.getAttribute("href")).toMatch(/\/about#contact$/);
    expect(cta.getAttribute("data-cta")).toBe("hero_primary");
    expect(screen.getByRole("link", { name: /View marketplace cases/ })).toBeInTheDocument();
  });

  it("portrait alt text uses the new positioning", () => {
    renderHero();
    expect(screen.getByRole("img", { name: /marketplace manager for Amazon and bol/ })).toBeInTheDocument();
  });

  it("the hero section contains no em dash", () => {
    renderHero();
    const intro = screen.getByRole("region", { name: "Introduction" });
    expect(within(intro).queryByText(EM_DASH)).toBeNull();
    expect(intro.textContent).not.toMatch(/—/);
  });
});

describe("copy sources (EN + NL)", () => {
  it("hero and home SEO use marketplace manager in both languages; no e-commerce manager as current identity", () => {
    for (const lang of ["en", "nl"] as const) {
      const h = translations[lang].hero;
      const seo = translations[lang].seo;
      expect(h.subtitle.toLowerCase()).toContain("marketplace manager");
      expect(h.heading.toLowerCase()).toContain("marketplace manager");
      expect(seo.homeTitle.startsWith("Hans van Leeuwen")).toBe(true);
      expect(seo.homeTitle.toLowerCase()).toContain("marketplace manager");
      for (const text of [h.subtitle, h.heading, h.description, seo.homeTitle, seo.homeDescription, seo.aboutTitle]) {
        expect(text).not.toMatch(/e-?commerce manager/i);
        expect(text).not.toMatch(EM_DASH);
      }
      expect(seo.homeDescription.length).toBeGreaterThanOrEqual(90);
    }
    expect(translations.nl.hero.description).toBe(
      "Ik help merken en retailers met hun marketplace-strategie en dagelijkse uitvoering op Amazon en bol. Van productcontent en advertenties tot assortiment en operationele afstemming. Recent werk ik ook met eBay.",
    );
    expect(translations.nl.hero.ctaConsult).toBe("Bespreek je marketplace-vraag");
    expect(translations.nl.hero.ctaWork).toBe("Bekijk marketplace-cases");
    expect(translations.en.hero.ctaConsult).toBe("Discuss your marketplace needs");
  });

  it("eBay is supplementary: mentioned as recent, never as a specialism, certification or with a duration", () => {
    const all = JSON.stringify([translations.en.hero, translations.nl.hero, HOME_FAQ, IDENTITY]);
    expect(all).toMatch(/eBay/);
    expect(all).not.toMatch(/eBay (specialist|expert|partner|certified)/i);
    expect(all).not.toMatch(/\d+\+?\s*(years|jaar)[^."]{0,40}eBay/i);
    expect(all).not.toMatch(/eBay vendor/i);
  });

  it("no generic AI-sounding phrases in hero copy", () => {
    const all = JSON.stringify([translations.en.hero, translations.nl.hero]);
    expect(all).not.toMatch(/revenue engine|scalable growth|schaalbare groei|revenue scaling|omzetschaling/i);
  });
});

describe("structured data consistency", () => {
  it("visible FAQ and FAQPage JSON-LD come from the same source per language", () => {
    for (const lang of ["en", "nl"] as const) {
      const ld = homeFaqJsonLd(lang);
      expect(ld.mainEntity.map((q) => q.name)).toEqual(HOME_FAQ[lang].map((f) => f.question));
      expect(ld.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(HOME_FAQ[lang].map((f) => f.answer));
    }
    // De template bevat geen (Engelstalige) FAQPage meer; de prerender schrijft hem per taal.
    expect(indexHtml).not.toMatch(/"@type":\s*"FAQPage"/);
  });

  it("jobTitle / organisation name are identical across template, client entities and identity", () => {
    expect(indexHtml).toContain(`"jobTitle": "${IDENTITY.jobTitle.en}"`);
    expect(PERSON_ENTITY.jobTitle).toBe(IDENTITY.jobTitle.en);
    expect(PROFESSIONAL_SERVICE_ENTITY.name).toBe(IDENTITY.organizationName);
    expect(indexHtml).toContain(`"name": "${IDENTITY.organizationName}"`);
    expect(IDENTITY.jobTitle.en.toLowerCase()).toContain("marketplace manager");
    expect(IDENTITY.knowsAbout).toContain("eBay");
  });

  it("template head has no em dash and no e-commerce-manager identity", () => {
    const head = indexHtml.slice(0, indexHtml.indexOf("</head>"));
    expect(head).not.toMatch(EM_DASH);
    expect(head).not.toMatch(/E-commerce Manager/);
    expect(head).not.toMatch(/revenue engine/i);
  });

  it("llms.txt leads with marketplace manager, mentions eBay and no em dash", () => {
    const lead = llmsTxt.split("\n").find((l) => l.startsWith(">")) ?? "";
    expect(lead.toLowerCase()).toContain("marketplace manager");
    expect(lead).not.toMatch(/e-commerce manager/i);
    expect(llmsTxt).toMatch(/eBay/);
    expect(llmsTxt).not.toMatch(/—/);
  });
});
