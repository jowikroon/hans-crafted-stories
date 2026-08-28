import { describe, it, expect } from "vitest";
import {
  summarizeSitemaps,
  selfCanonicalUrl,
  collectInspectionUrls,
  SITE_ORIGIN,
  type SitemapEntry,
} from "../../supabase/functions/analytics-ga4-gsc/coverage";

// Regression suite for the analytics-ga4-gsc edge function (HAN-93).
//
// This file exists because `apps/personal/supabase/functions/**` is outside
// both tsconfig.app.json's `include` and vitest's collection glob — the whole
// feature shipped without CI ever compiling or running it. Importing the pure
// logic from here pulls it into both. Each case below pins a bug that actually
// occurred during review, so a regression fails the build rather than the
// dashboard.

const web = (submitted: number | string, indexed?: number | string) => ({
  type: "web",
  submitted: String(submitted),
  ...(indexed === undefined ? {} : { indexed: String(indexed) }),
});

describe("summarizeSitemaps", () => {
  it("reports indexed_pages as unknown when Google zero-fills the deprecated field", () => {
    // The headline bug: real responses return indexed:"0" for sitemaps whose
    // URLs are indexed, which rendered "0 of 890 submitted" on a healthy site.
    const entries: SitemapEntry[] = [
      { path: "https://hansvanleeuwen.com/sitemap.xml", contents: [web(890, 0)] },
    ];
    const s = summarizeSitemaps(entries);
    expect(s.indexed_pages).toBeNull();
    expect(s.submitted_pages).toBe(890);
  });

  it("keeps a genuine indexed count when it is non-zero", () => {
    const s = summarizeSitemaps([{ path: "/sitemap.xml", contents: [web(890, 412)] }]);
    expect(s.indexed_pages).toBe(412);
    expect(s.submitted_pages).toBe(890);
  });

  it("treats a missing indexed field as unknown rather than zero", () => {
    const s = summarizeSitemaps([{ path: "/sitemap.xml", contents: [web(120)] }]);
    expect(s.indexed_pages).toBeNull();
    expect(s.submitted_pages).toBe(120);
  });

  it("counts only web content, not images or video", () => {
    const s = summarizeSitemaps([
      {
        path: "/sitemap.xml",
        contents: [web(10, 7), { type: "image", submitted: "10", indexed: "9" }],
      },
    ]);
    expect(s.submitted_pages).toBe(10); // not 20
    expect(s.indexed_pages).toBe(7); // not 16
  });

  it("does not let an image-only sitemap null out the site total", () => {
    // A processed image-only sitemap legitimately holds zero web pages; it
    // must not poison a sibling web sitemap's counts.
    const s = summarizeSitemaps([
      { path: "/sitemap.xml", contents: [web(50, 30)] },
      { path: "/image-sitemap.xml", contents: [{ type: "image", submitted: "80", indexed: "80" }] },
    ]);
    expect(s.indexed_pages).toBe(30);
    expect(s.submitted_pages).toBe(50);
  });

  it("reports unknown when every leaf is non-web (no web sitemap was examined)", () => {
    const s = summarizeSitemaps([
      { path: "/image-sitemap.xml", contents: [{ type: "image", submitted: "80", indexed: "80" }] },
    ]);
    expect(s.indexed_pages).toBeNull();
  });

  it("makes BOTH totals unknown when a leaf is still unprocessed", () => {
    // An empty `contents` means GSC hasn't crawled it; its pages are missing
    // from the submitted sum just as much as from the indexed sum.
    const s = summarizeSitemaps([
      { path: "/sitemap.xml", contents: [web(50, 30)] },
      { path: "/pending.xml", contents: [] },
    ]);
    expect(s.indexed_pages).toBeNull();
    expect(s.submitted_pages).toBeNull();
  });

  it("never double-counts a sitemap index alongside its children", () => {
    const s = summarizeSitemaps([
      { path: "/sitemap-index.xml", isSitemapsIndex: true, contents: [web(100, 60)] },
      { path: "/sitemap-1.xml", contents: [web(60, 40)] },
      { path: "/sitemap-2.xml", contents: [web(40, 20)] },
    ]);
    expect(s.submitted_pages).toBe(100); // leaves only, not 200
    expect(s.indexed_pages).toBe(60);
  });

  it("reports unknown for an index-only submission rather than a possibly-wrong number", () => {
    const s = summarizeSitemaps([
      { path: "/sitemap-index.xml", isSitemapsIndex: true, contents: [web(100, 60)] },
    ]);
    expect(s.indexed_pages).toBeNull();
    expect(s.submitted_pages).toBeNull();
  });

  it("surfaces sitemap warnings and errors as totals", () => {
    const s = summarizeSitemaps([
      { path: "/a.xml", contents: [web(1, 1)], warnings: "3", errors: "2" },
      { path: "/b.xml", contents: [web(1, 1)], warnings: "1", errors: "0" },
    ]);
    expect(s.sitemap_warnings).toBe(4);
    expect(s.sitemap_errors).toBe(2);
  });

  it("handles an empty response without inventing zeros", () => {
    const s = summarizeSitemaps([]);
    expect(s.indexed_pages).toBeNull();
    expect(s.submitted_pages).toBeNull();
    expect(s.sitemaps).toEqual([]);
  });
});

describe("selfCanonicalUrl", () => {
  it("falls back to the slug URL when no canonical is set", () => {
    expect(selfCanonicalUrl(null, "my-post")).toBe(`${SITE_ORIGIN}/writing/my-post`);
  });

  it("falls back to the slug URL for a whitespace-only canonical", () => {
    // The CMS stores the column untrimmed; the page itself emits the slug
    // canonical in this case, so the post must stay in the sample.
    expect(selfCanonicalUrl("   ", "my-post")).toBe(`${SITE_ORIGIN}/writing/my-post`);
  });

  it("trims a padded same-origin canonical instead of sending it verbatim", () => {
    expect(selfCanonicalUrl(`  ${SITE_ORIGIN}/writing/custom  `, "slug")).toBe(
      `${SITE_ORIGIN}/writing/custom`,
    );
  });

  it("prefers an explicit same-origin canonical over the slug URL", () => {
    expect(selfCanonicalUrl(`${SITE_ORIGIN}/writing/custom-canonical`, "slug")).toBe(
      `${SITE_ORIGIN}/writing/custom-canonical`,
    );
  });

  it("resolves a root-relative canonical against the site origin", () => {
    // getBlogPostCanonical() emits canonical_url verbatim and the CMS field
    // accepts relative values, so "/writing/custom" is a valid same-origin
    // canonical the page really serves — it must not be dropped.
    expect(selfCanonicalUrl("/writing/custom", "slug")).toBe(`${SITE_ORIGIN}/writing/custom`);
  });

  it("rejects a protocol-relative canonical pointing at another host", () => {
    expect(selfCanonicalUrl("//evil.example/x", "slug")).toBeNull();
  });

  it("skips posts canonicalized off-site", () => {
    expect(selfCanonicalUrl("https://medium.com/@hans/post", "slug")).toBeNull();
  });

  it("is not fooled by a lookalike origin (substring sanitization)", () => {
    // The CodeQL finding: startsWith() accepted this.
    expect(selfCanonicalUrl("https://hansvanleeuwen.com.evil.example/x", "slug")).toBeNull();
  });

  it("skips an unparseable canonical", () => {
    expect(selfCanonicalUrl("not a url", "slug")).toBeNull();
  });
});

describe("collectInspectionUrls", () => {
  it("deduplicates posts sharing one canonical", () => {
    const seen = new Set<string>();
    const out: string[] = [];
    collectInspectionUrls(
      [
        { slug: "a", canonical_url: `${SITE_ORIGIN}/hub` },
        { slug: "b", canonical_url: `${SITE_ORIGIN}/hub` },
        { slug: "c", canonical_url: `${SITE_ORIGIN}/hub` },
      ],
      seen,
      out,
    );
    expect(out).toEqual([`${SITE_ORIGIN}/hub`]);
  });

  it("does not re-add a canonical that collides with a seeded static URL", () => {
    const staticUrls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/writing`];
    const seen = new Set<string>(staticUrls);
    const out: string[] = [];
    collectInspectionUrls([{ slug: "a", canonical_url: `${SITE_ORIGIN}/writing` }], seen, out);
    expect(out).toEqual([]);
  });

  it("excludes externally canonicalized posts from the sample", () => {
    const seen = new Set<string>();
    const out: string[] = [];
    collectInspectionUrls(
      [
        { slug: "local", canonical_url: null },
        { slug: "syndicated", canonical_url: "https://medium.com/@hans/x" },
      ],
      seen,
      out,
    );
    expect(out).toEqual([`${SITE_ORIGIN}/writing/local`]);
  });

  it("accumulates uniques across successive pages", () => {
    const seen = new Set<string>();
    const out: string[] = [];
    collectInspectionUrls([{ slug: "a", canonical_url: null }], seen, out);
    collectInspectionUrls([{ slug: "a", canonical_url: null }, { slug: "b", canonical_url: null }], seen, out);
    expect(out).toEqual([`${SITE_ORIGIN}/writing/a`, `${SITE_ORIGIN}/writing/b`]);
  });
});
