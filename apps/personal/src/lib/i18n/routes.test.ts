import { describe, expect, it } from "vitest";
import { alternatesFor, absoluteUrl, langFromPath, localizePath, parseArticlePath, parsePath } from "./routes";

// HAN-167 / HAN-83: één URL per taal, wederkerige hreflang, geen self-referentie.
// Sinds 2026-10-06: NL is de standaardtaal (kale paden), EN leeft onder /en.
describe("i18n routes", () => {
  it("parses bare paths as Dutch and the /en prefix as English", () => {
    expect(parsePath("/about")).toEqual({ lang: "nl", path: "/about" });
    expect(parsePath("/")).toEqual({ lang: "nl", path: "/" });
    expect(parsePath("/en/about")).toEqual({ lang: "en", path: "/about" });
    expect(parsePath("/en")).toEqual({ lang: "en", path: "/" });
    expect(langFromPath("/writing/x")).toBe("nl");
    expect(langFromPath("/en/writing/x")).toBe("en");
  });
  it("still reads the legacy /nl prefix as Dutch (308 in vercel.json)", () => {
    expect(parsePath("/nl/about")).toEqual({ lang: "nl", path: "/about" });
    expect(parsePath("/nl")).toEqual({ lang: "nl", path: "/" });
    expect(localizePath("/nl/about", "nl")).toBe("/about");
    expect(localizePath("/nl/about", "en")).toBe("/en/about");
  });
  it("localizes only routes that exist in both languages", () => {
    expect(localizePath("/about", "en")).toBe("/en/about");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/en/about", "nl")).toBe("/about");
    expect(localizePath("/writing/slug", "en")).toBe("/writing/slug");
    expect(localizePath("/portal", "en")).toBe("/portal");
  });
  it("treats the article index as localised but articles as single-URL", () => {
    expect(localizePath("/writing", "en")).toBe("/en/writing");
    expect(localizePath("/en/writing", "nl")).toBe("/writing");
    expect(alternatesFor("/writing").map((a) => a.href)).toEqual([
      "https://hansvanleeuwen.com/en/writing",
      "https://hansvanleeuwen.com/writing",
      "https://hansvanleeuwen.com/en/writing",
    ]);
    expect(alternatesFor("/writing/slug")).toEqual([]);
    expect(localizePath("/writing/slug?lang=en", "en")).toBe("/writing/slug");
    expect(parseArticlePath("/en/writing/slug")).toEqual({ slug: "slug", enRoute: true });
    expect(parseArticlePath("/writing/slug")).toEqual({ slug: "slug", enRoute: false });
  });
  it("builds a reciprocal hreflang set where en ≠ nl and x-default = en", () => {
    const alts = alternatesFor("/en/interim-ecommerce-manager");
    expect(alts).toEqual([
      { lang: "en", href: "https://hansvanleeuwen.com/en/interim-ecommerce-manager" },
      { lang: "nl", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/en/interim-ecommerce-manager" },
    ]);
    expect(alternatesFor("/interim-ecommerce-manager")).toEqual(alts);
    expect(alternatesFor("/writing/slug")).toEqual([]);
  });
  it("derives canonical URLs per language", () => {
    expect(absoluteUrl("/about", "nl")).toBe("https://hansvanleeuwen.com/about");
    expect(absoluteUrl("/about", "en")).toBe("https://hansvanleeuwen.com/en/about");
    expect(absoluteUrl("/", "nl")).toBe("https://hansvanleeuwen.com/");
    expect(absoluteUrl("/", "en")).toBe("https://hansvanleeuwen.com/en");
  });
});
