import { describe, expect, it } from "vitest";
import { clearRootHtml, replaceSsrFallbackHtml, serializeJsonForHtmlScript } from "./staticHtml";

describe("static HTML template helpers", () => {
  it("removes all nested homepage markup from the root before prerender injection", () => {
    const html = [
      "<!doctype html>",
      "<html>",
      "<head><title>Home</title></head>",
      "<body>",
      '<div id="root"><main><section><h1>Homepage H1</h1><div>Nested</div></section></main></div>',
      "<script src=\"/assets/app.js\"></script>",
      "</body>",
      "</html>",
    ].join("");

    const cleaned = clearRootHtml(html);

    expect(cleaned).toContain('<div id="root"></div>');
    expect(cleaned).not.toContain("Homepage H1");
    expect(cleaned).toContain('<script src="/assets/app.js"></script>');
  });

  it("replaces only the crawlable SSR fallback noscript and preserves GTM noscript", () => {
    const html = [
      "<body>",
      "<!-- SSR fallback: rich crawlable content for search engines -->",
      "<noscript><main><h1>Homepage H1</h1></main></noscript>",
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K22B6627"></iframe></noscript>',
      '<div id="root"></div>',
      "</body>",
    ].join("");

    const replaced = replaceSsrFallbackHtml(html, "<main><h1>Article H1</h1></main>");

    expect(replaced).toContain("<noscript><main><h1>Article H1</h1></main></noscript>");
    expect(replaced).not.toContain("Homepage H1");
    expect(replaced).toContain("googletagmanager.com/ns.html");
  });

  it("serializes JSON safely for embedding in HTML script tags", () => {
    const serialized = serializeJsonForHtmlScript({
      content: '</script><script>alert("xss")</script>',
      ampersand: "A & B",
      separators: "\u2028\u2029",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("\\u003C/script\\u003E");
    expect(serialized).toContain("\\u0026");
    expect(serialized).toContain("\\u2028\\u2029");
  });
});
