import { describe, expect, it } from "vitest";
import { escapeArticleHtml, renderArticleInline, safeArticleImageSource } from "./articleInline";

describe("published article Markdown", () => {
  it("renders single and double emphasis without leaking Markdown markers", () => {
    expect(renderArticleInline("*In een dashboard past niet alles.*"))
      .toBe("<em>In een dashboard past niet alles.</em>");
    expect(renderArticleInline("**IETS MOOIS** en ***een belofte***"))
      .toBe("<strong>IETS MOOIS</strong> en <strong><em>een belofte</em></strong>");
  });

  it("repairs the orphan escaped opening marker from the published opa paragraph", () => {
    expect(renderArticleInline("\\*Het herinnert me aan mijn opa en **IETS MOOIS**."))
      .toBe("Het herinnert me aan mijn opa en <strong>IETS MOOIS</strong>.");
    expect(renderArticleInline("Een letterlijke \\*ster\\* hoort geen cursief te worden."))
      .toContain("Een letterlijke *ster* hoort geen cursief te worden.");
  });

  it("gives real internal album links and normalizes legacy blog destinations", () => {
    expect(renderArticleInline("[Het verhaal](/music/albums/iets-moois/brand)"))
      .toBe('<a href="/music/albums/iets-moois/brand">Het verhaal</a>');
    expect(renderArticleInline("[Ander artikel](/blog/de-kracht-van-focus)"))
      .toBe('<a href="/writing/de-kracht-van-focus">Ander artikel</a>');
  });

  it("links sources and standalone URLs but not code", () => {
    expect(renderArticleInline("[Bron](https://example.org/path?q=1&x=2)"))
      .toContain('href="https://example.org/path?q=1&amp;x=2" target="_blank" rel="noopener noreferrer"');
    const html = renderArticleInline("https://example.com staat buiten `https://private.invalid`");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<code>https://private.invalid</code>");
    expect(html).not.toContain('href="https://private.invalid"');
  });

  it("does not introduce executable HTML from CMS text or unsafe links", () => {
    expect(renderArticleInline("<img src=x onerror=alert(1)>")).not.toContain("<img");
    const html = renderArticleInline("[Klik](javascript:alert%281%29) en [X](/x\"onmouseover=evil)");
    expect(html).not.toContain('<a href="javascript:');
    expect(html).not.toContain(" onmouseover=");
    expect(escapeArticleHtml('"&<\'')).toBe("&quot;&amp;&lt;&#39;");
  });

  it("keeps declared masking spans intact", () => {
    const html = renderArticleInline("{{m:metric|€67|~€70|bedrag}}", { cfg: null, counters: {} });
    expect(html).toContain('class="mask-token"');
    expect(html).toContain('data-mask-id="metric-1"');
  });
});

describe("safe article images", () => {
  it("accepts a normal HTTP image and denies data/SVG and attribute injection", () => {
    expect(safeArticleImageSource("https://images.example.com/cover.jpg?x=1&y=2"))
      .toBe("https://images.example.com/cover.jpg?x=1&y=2");
    expect(safeArticleImageSource("data:image/svg+xml,<svg onload=alert(1) />")).toBeNull();
    expect(safeArticleImageSource('https://x.example/a" onerror="alert(1)')).toBeNull();
    expect(safeArticleImageSource("javascript:alert(1)")).toBeNull();
  });
});
