import { describe, expect, it } from "vitest";
import { alternatesFor, absoluteUrl, langFromPath, localizePath, parsePath } from "./routes";

// HAN-167 / HAN-83: één URL per taal, wederkerige hreflang, geen self-referentie.
// Nederlands-eerst sinds 2026-10-07: NL op het kale pad, EN onder /en.
describe("i18n routes", () => {
  it("parses the /en prefix as English and everything else as Dutch", () => {
    expect(parsePath("/en/about")).toEqual({ lang: "en", path: "/about" });
    expect(parsePath("/en")).toEqual({ lang: "en", path: "/" });
    expect(parsePath("/about")).toEqual({ lang: "nl", path: "/about" });
    expect(langFromPath("/writing/x")).toBe("nl");
  });
  it("localizes only routes that exist in both languages", () => {
    expect(localizePath("/about", "en")).toBe("/en/about");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/en/about", "nl")).toBe("/about");
    expect(localizePath("/writing/slug", "en")).toBe("/writing/slug");
    expect(localizePath("/portal", "en")).toBe("/portal");
  });
  it("treats the article index as localised but articles as single-URL (audit 2026-09-22)", () => {
    expect(localizePath("/writing", "en")).toBe("/en/writing");
    expect(localizePath("/en/writing", "nl")).toBe("/writing");
    expect(alternatesFor("/writing").map((a) => a.href)).toEqual([
      "https://hansvanleeuwen.com/writing",
      "https://hansvanleeuwen.com/en/writing",
      "https://hansvanleeuwen.com/writing",
    ]);
    expect(alternatesFor("/writing/slug")).toEqual([]);
    expect(localizePath("/writing/slug?lang=en", "en")).toBe("/writing/slug");
  });
  it("builds a reciprocal hreflang set where en ≠ nl and x-default = nl", () => {
    const alts = alternatesFor("/en/interim-ecommerce-manager");
    expect(alts).toEqual([
      { lang: "nl", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
      { lang: "en", href: "https://hansvanleeuwen.com/en/interim-ecommerce-manager" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
    ]);
    const hrefs = alts.map((a) => a.href);
    expect(hrefs[0]).not.toBe(hrefs[1]);
    expect(alternatesFor("/writing/slug")).toEqual([]);
  });
  it("derives canonical URLs per language", () => {
    expect(absoluteUrl("/about", "en")).toBe("https://hansvanleeuwen.com/en/about");
    expect(absoluteUrl("/", "nl")).toBe("https://hansvanleeuwen.com/");
    expect(absoluteUrl("/", "en")).toBe("https://hansvanleeuwen.com/en");
  });
});
