import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LangProvider, useLang } from "./useLang";
import { PreloadedDataProvider } from "@/contexts/PreloadedDataContext";
import { setArticleLangInfo } from "@/lib/i18n/articleLang";
import type { BlogPostRow } from "@/lib/api/content";

const Probe = () => { const { lang } = useLang(); return <span data-testid="lang">{lang}</span>; };
const nlPost = {
  slug: "vendor-of-seller", title: "Vendor or seller", excerpt: "x", content: "Bij Alpine stapten we over van vendor naar seller op Bol.com. De rekensom.",
  title_nl: "Vendor of seller", excerpt_nl: "x", content_nl: "Bij Alpine stapten we over van vendor naar seller op Bol.com. De rekensom.",
} as unknown as BlogPostRow;

const mount = (path: string, preloaded?: BlogPostRow | null, initialLang?: "nl" | "en") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PreloadedDataProvider value={{ blogPost: preloaded ?? null, blogPosts: null }}>
        <LangProvider initialLang={initialLang}><Probe /></LangProvider>
      </PreloadedDataProvider>
    </MemoryRouter>,
  );

afterEach(cleanup);

// i18n-audit 2026-09-22: de UI-taal op een artikel volgt het artikel, niet "en".
describe("LangProvider on article routes", () => {
  it("uses the /nl prefix on localised routes", () => {
    mount("/nl/about");
    expect(screen.getByTestId("lang").textContent).toBe("nl");
  });
  it("follows the preloaded article language instead of defaulting to English", () => {
    mount("/writing/vendor-of-seller", nlPost);
    expect(screen.getByTestId("lang").textContent).toBe("nl");
  });
  it("ignores ?lang=en when the article has no English version", () => {
    setArticleLangInfo("vendor-of-seller", { hasEn: false, lang: "nl" });
    mount("/writing/vendor-of-seller?lang=en", nlPost);
    expect(screen.getByTestId("lang").textContent).toBe("nl");
  });
  it("honours ?lang=en when an English version exists", () => {
    setArticleLangInfo("codex", { hasEn: true, lang: "nl" });
    mount("/writing/codex?lang=en");
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });
  it("keeps English on non-localised English pages", () => {
    mount("/music");
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });
});
