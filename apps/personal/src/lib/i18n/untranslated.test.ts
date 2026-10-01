import { describe, expect, it } from "vitest";
import { parseUntranslatedNotice, safeInternalPath, untranslatedFallback } from "./untranslated";
import { localizeHref } from "./routes";
import { resolvePageContentValue } from "@/lib/pageContentLang";

// i18n-audit 2026-10-01: taalschakelaar zonder vertaling, query-behoud in links,
// en CMS-copy die op /nl niet meer naar de Engelse basissleutel terugvalt.
describe("untranslated fallback", () => {
  it("sends an NL-only article to the English article index with a notice", () => {
    expect(untranslatedFallback("en", "/writing/vendor-of-seller-bol-com-alpine", true)).toBe(
      "/writing?notice=only-nl&from=%2Fwriting%2Fvendor-of-seller-bol-com-alpine",
    );
  });
  it("sends the EN-only music page to the Dutch home with a notice", () => {
    expect(untranslatedFallback("nl", "/music", false)).toBe("/nl?notice=only-en&from=%2Fmusic");
  });
  it("parses the notice and only accepts internal paths", () => {
    expect(parseUntranslatedNotice("?notice=only-nl&from=%2Fwriting%2Fx")).toEqual({ notice: "only-nl", from: "/writing/x" });
    expect(parseUntranslatedNotice("?notice=only-nl&from=https%3A%2F%2Fevil.example")).toBeNull();
    expect(parseUntranslatedNotice("?notice=only-nl&from=%2F%2Fevil.example")).toBeNull();
    expect(parseUntranslatedNotice("?notice=other&from=%2Fx")).toBeNull();
    expect(safeInternalPath("/writing/a?b")).toBeNull();
  });
});

describe("localizeHref keeps query and hash", () => {
  it("keeps ?lang=en on article links and localizes the path part only", () => {
    expect(localizeHref("/writing/slug?lang=en", "nl")).toBe("/writing/slug?lang=en");
    expect(localizeHref("/rates#faq", "nl")).toBe("/nl/rates#faq");
    expect(localizeHref("/about", "nl")).toBe("/nl/about");
  });
});

describe("page_content language resolution", () => {
  const rows = [
    { content_key: "about_h1", content_value: "English heading" },
    { content_key: "hero_subtitle", content_value: "English subtitle" },
    { content_key: "hero_subtitle_nl", content_value: "Nederlandse ondertitel" },
  ];
  it("uses the base key for EN", () => {
    expect(resolvePageContentValue(rows, "about_h1", "en", "fallback")).toBe("English heading");
  });
  it("uses the _nl key for NL", () => {
    expect(resolvePageContentValue(rows, "hero_subtitle", "nl", "fallback")).toBe("Nederlandse ondertitel");
  });
  it("shares language-neutral values (name, location, URLs) across both languages", () => {
    const neutral = [{ content_key: "about_linkedin_url", content_value: "https://linkedin.com/in/new" }, { content_key: "about_location", content_value: "Utrecht, NL" }];
    expect(resolvePageContentValue(neutral, "about_linkedin_url", "nl", "https://old")).toBe("https://linkedin.com/in/new");
    expect(resolvePageContentValue(neutral, "about_location", "nl", "Amersfoort, NL")).toBe("Utrecht, NL");
  });
  it("falls back to the Dutch code copy instead of the English base row on NL", () => {
    expect(resolvePageContentValue(rows, "about_h1", "nl", "Nederlandse kop")).toBe("Nederlandse kop");
  });
});
