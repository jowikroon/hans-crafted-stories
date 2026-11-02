import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Keep unsupported Nielsen category-share figures out of public source, SSR
// fallbacks, schema inputs and promotional metadata. Historical provenance
// belongs in docs/content-evidence, not in crawlable site copy.
const publicSurfaces = [
  "../../index.html",
  "./aboutPage.ts",
  "./translations.ts",
  "./servicePages.ts",
  "../pages/Work.tsx",
  "../pages/BlogPostPage.tsx",
  "../components/writing-v2/WritingV2.tsx",
  "../../public/llms.txt",
  "../../scripts/prerender.mjs",
  "../../scripts/inject-static-content.cjs",
  "../../scripts/make-og-image.py",
  "../../functions/_middleware.js",
  "../../../../functions/_middleware.js",
];

describe("Alpine market-share evidence gate", () => {
  it.each(publicSurfaces)("%s contains no unverified 70 percent share", (relativePath) => {
    const content = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    expect(content).not.toMatch(/\b70\s*%/);
  });

  it.each([
    "../../index.html",
    "../hooks/useSEO.ts",
    "../lib/seo/blogPostHead.ts",
    "../data/heroPosts.ts",
    "../../public/site.webmanifest",
  ])("%s does not advertise the old claim-bearing OG image", (relativePath) => {
    const content = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    expect(content).not.toContain("/og-image.png");
  });
});
