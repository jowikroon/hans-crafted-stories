import { describe, expect, it } from "vitest";
import { alternatesFor, absoluteUrl, langFromPath, localizePath, parsePath } from "./routes";

// HAN-167 / HAN-83: één URL per taal, wederkerige hreflang, geen self-referentie.
describe("i18n routes", () => {
  it("parses the /nl prefix as Dutch and everything else as English", () => {
    expect(parsePath("/nl/about")).toEqual({ lang: "nl", path: "/about" });
    expect(parsePath("/nl")).toEqual({ lang: "nl", path: "/" });
    expect(parsePath("/about")).toEqual({ lang: "en", path: "/about" });
    expect(langFromPath("/writing/x")).toBe("en");
  });
  it("localizes only routes that exist in both languages", () => {
    expect(localizePath("/about", "nl")).toBe("/nl/about");
    expect(localizePath("/", "nl")).toBe("/nl");
    expect(localizePath("/nl/about", "en")).toBe("/about");
    expect(localizePath("/writing/slug", "nl")).toBe("/writing/slug");
    expect(localizePath("/portal", "nl")).toBe("/portal");
  });
  it("builds a reciprocal hreflang set where en ≠ nl and x-default = en", () => {
    const alts = alternatesFor("/nl/interim-ecommerce-manager");
    expect(alts).toEqual([
      { lang: "en", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
      { lang: "nl", href: "https://hansvanleeuwen.com/nl/interim-ecommerce-manager" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
    ]);
    const hrefs = alts.map((a) => a.href);
    expect(hrefs[0]).not.toBe(hrefs[1]);
    expect(alternatesFor("/writing/slug")).toEqual([]);
  });
  it("derives canonical URLs per language", () => {
    expect(absoluteUrl("/about", "nl")).toBe("https://hansvanleeuwen.com/nl/about");
    expect(absoluteUrl("/", "en")).toBe("https://hansvanleeuwen.com/");
  });
});
