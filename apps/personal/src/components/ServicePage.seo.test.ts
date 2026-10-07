import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SERVICE_PAGES } from "@/data/servicePages";
import { LangProvider } from "@/hooks/useLang";
import { localizePath } from "@/lib/i18n/routes";
import { computeSeoScore } from "@/lib/api/seoAudits";
import ServicePage from "./ServicePage";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("service page SEO in both languages", () => {
  for (const page of SERVICE_PAGES) {
    for (const lang of ["nl", "en"] as const) {
      const route = localizePath(page.path, lang);
      it(`${route}: keeps the rendered revision and SEO metadata consistent`, () => {
        const { container } = render(createElement(MemoryRouter, { initialEntries: [route] },
          createElement(LangProvider, { children: createElement(ServicePage, { page }) })));
        const revised = lang === "nl" && ["/interim-ecommerce-manager", "/amazon-nl-specialist"].includes(page.path);
        const expectedDate = revised ? "2026-10-05" : "2026-09-22";
        expect(container.querySelector("time")?.dateTime).toBe(expectedDate);
        const graphs = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .flatMap((script) => JSON.parse(script.textContent || "{}")["@graph"] || []);
        expect(graphs.find((node) => node["@type"] === "WebPage")?.dateModified).toBe(expectedDate);
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
          .toBe(`https://hansvanleeuwen.com${route}`);
        const description = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        expect(computeSeoScore({
          titleLength: document.title.length,
          metaDescriptionLength: description.length,
          h1Count: container.querySelectorAll("h1").length,
          imagesWithoutAlt: container.querySelectorAll('img:not([alt]), img[alt=""]').length,
          wordCount: (container.textContent || "").split(/\s+/).length,
          issues: [],
        })).toEqual({ score: 100, critical: 0, warning: 0, passed: 5 });
        if (revised) {
          const term = page.path === "/amazon-nl-specialist" ? "amazon specialist inhuren" : "e-commerce specialist inhuren";
          expect(document.title.toLowerCase()).toContain(term);
          expect(container.querySelector("h1")?.textContent?.toLowerCase()).toContain(term);
        }
      });
    }
  }
});
