import { describe, it, expect } from "vitest";
import {
  summarizeSitemaps,
  dedupeSitemaps,
  parseSitemapLocs,
  inspectableUrls,
  selectInspectionWindow,
  rankTopQueries,
  timingSafeEqualStr,
  applySectionResult,
  coverageStatus,
  coverageFields,
  SITE_ORIGIN,
  type SitemapEntry,
  type SitemapSummary,
  type IndexingResult,
} from "../../supabase/functions/analytics-ga4-gsc/coverage";
// Vite's ?raw import: the real generated file, with no Node APIs (the app tsconfig has no node types).
import realSitemapXml from "../../public/sitemap.xml?raw";

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
    // The fixture must not trip the zero-fill rule (indexed 0 beside submitted
    // > 0), or this passes whether or not the missing-field branch exists —
    // which it did in an earlier version of this test. Here the known entry
    // has a non-zero count, so only the missing-field branch can null it.
    const s = summarizeSitemaps([{ path: "/sitemap.xml", contents: [web(10, 5), web(10)] }]);
    expect(s.indexed_pages).toBeNull(); // not 5: a partial sum is not the site total
    expect(s.submitted_pages).toBe(20);
  });

  it("does not fold a sibling sitemap's missing indexed count in as zero", () => {
    const s = summarizeSitemaps([
      { path: "/a.xml", contents: [web(50, 30)] },
      { path: "/b.xml", contents: [{ type: "web", submitted: "0" }] },
    ]);
    expect(s.indexed_pages).toBeNull(); // not 30
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

  it("makes the submitted total unknown when a web entry omits `submitted`", () => {
    // SitemapContentEntry marks `submitted` optional, so `?? 0` would fold a
    // missing count into the sum as zero — the same dishonesty the `indexed`
    // handling already guards against.
    const s = summarizeSitemaps([
      { path: "/a.xml", contents: [web(50, 30)] },
      { path: "/b.xml", contents: [{ type: "web", indexed: "5" }] },
    ]);
    expect(s.submitted_pages).toBeNull();
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

  it("reports unknown for an unexpanded index rather than a possibly-wrong number", () => {
    // The edge function expands indexes via sitemaps.list?sitemapIndex=, so an
    // index reaching this function on its own means GSC listed no children yet.
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

describe("dedupeSitemaps", () => {
  it("keeps a child listed both on its own and under its index only once", () => {
    const top: SitemapEntry[] = [
      { path: "/index.xml", isSitemapsIndex: true, contents: [web(100, 60)] },
      { path: "/posts.xml", contents: [web(60, 40)] },
    ];
    const children: SitemapEntry[] = [
      { path: "/posts.xml", contents: [web(60, 40)] },
      { path: "/pages.xml", contents: [web(40, 20)] },
    ];
    const merged = dedupeSitemaps([top, children]);
    expect(merged.map((e) => e.path)).toEqual(["/index.xml", "/posts.xml", "/pages.xml"]);
    const s = summarizeSitemaps(merged);
    expect(s.submitted_pages).toBe(100); // 60 + 40, index excluded, /posts.xml once
    expect(s.indexed_pages).toBe(60);
  });

  it("gives an index-only property real totals once its children are listed", () => {
    const top: SitemapEntry[] = [{ path: "/index.xml", isSitemapsIndex: true, contents: [web(100, 60)] }];
    const children: SitemapEntry[] = [
      { path: "/a.xml", contents: [web(70, 50)] },
      { path: "/b.xml", contents: [web(30, 10)] },
    ];
    const s = summarizeSitemaps(dedupeSitemaps([top, children]));
    expect(s.submitted_pages).toBe(100);
    expect(s.indexed_pages).toBe(60);
  });
});

describe("parseSitemapLocs", () => {
  it("reads only <loc>, not the hreflang <xhtml:link href> alternates", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://hansvanleeuwen.com/</loc>
    <xhtml:link rel="alternate" hreflang="nl" href="https://hansvanleeuwen.com/nl" />
  </url>
</urlset>`;
    const r = parseSitemapLocs(xml);
    expect(r.kind).toBe("urlset");
    expect(r.locs).toEqual(["https://hansvanleeuwen.com/"]);
  });

  it("recognises a sitemap index", () => {
    const r = parseSitemapLocs(`<sitemapindex><sitemap><loc>https://hansvanleeuwen.com/a.xml</loc></sitemap></sitemapindex>`);
    expect(r.kind).toBe("sitemapindex");
    expect(r.locs).toEqual(["https://hansvanleeuwen.com/a.xml"]);
  });

  it("decodes XML entities and CDATA, and trims whitespace", () => {
    const r = parseSitemapLocs(
      `<urlset><url><loc>
        https://hansvanleeuwen.com/x?a=1&amp;b=2
      </loc></url><url><loc><![CDATA[https://hansvanleeuwen.com/y?c=3&d=4]]></loc></url><url><loc>https://hansvanleeuwen.com/caf&#233;</loc></url></urlset>`,
    );
    expect(r.locs).toEqual([
      "https://hansvanleeuwen.com/x?a=1&b=2",
      "https://hansvanleeuwen.com/y?c=3&d=4",
      "https://hansvanleeuwen.com/café",
    ]);
  });

  it("parses the site's real generated sitemap into the full inspectable set", () => {
    // Ties the parser to the actual artifact scripts/generate-sitemap.mjs
    // produces, not just to fixtures: every <loc> must survive as an
    // inspectable URL, and the /nl/ variants and service pages must be in it
    // (the old sample of 4 static pages + recent posts never inspected them).
    const xml = realSitemapXml;
    const parsed = parseSitemapLocs(xml);
    expect(parsed.kind).toBe("urlset");
    const locCount = (xml.match(/<loc>/g) ?? []).length;
    expect(parsed.locs).toHaveLength(locCount);
    const urls = inspectableUrls(parsed.locs);
    expect(urls).toHaveLength(locCount);
    expect(urls.some((u) => new URL(u).pathname.startsWith("/nl"))).toBe(true);
    expect(urls.some((u) => new URL(u).pathname.startsWith("/writing/"))).toBe(true);
    expect(urls.every((u) => new URL(u).origin === SITE_ORIGIN)).toBe(true);
  });
});

describe("inspectableUrls", () => {
  it("drops off-origin, lookalike, relative and malformed locs", () => {
    const urls = inspectableUrls([
      "https://hansvanleeuwen.com/ok",
      "https://example.com/other",
      "https://hansvanleeuwen.com.evil.example/x", // prefix match would accept this
      "/relative",
      "not a url",
      "http://hansvanleeuwen.com/insecure", // different origin (scheme)
    ]);
    expect(urls).toEqual(["https://hansvanleeuwen.com/ok"]);
  });

  it("normalizes and deduplicates in first-seen order", () => {
    const urls = inspectableUrls([
      "https://HANSVANLEEUWEN.com/a",
      "  https://hansvanleeuwen.com/a  ",
      "https://hansvanleeuwen.com:443/b",
      "https://hansvanleeuwen.com/b",
    ]);
    expect(urls).toEqual(["https://hansvanleeuwen.com/a", "https://hansvanleeuwen.com/b"]);
  });
});

describe("selectInspectionWindow", () => {
  const make = (n: number) => Array.from({ length: n }, (_, i) => `https://hansvanleeuwen.com/p${String(i).padStart(3, "0")}`);

  it("inspects everything when the site fits in one run", () => {
    const r = selectInspectionWindow(make(34), 60, 12345);
    expect(r).toEqual({ urls: make(34), total: 34, rotated: false });
  });

  it("rotates so every URL is covered within ceil(total / max) days", () => {
    const all = make(130);
    const covered = new Set<string>();
    for (let day = 0; day < Math.ceil(130 / 60); day++) {
      const r = selectInspectionWindow(all, 60, day);
      expect(r.rotated).toBe(true);
      expect(r.urls).toHaveLength(60);
      expect(r.total).toBe(130);
      r.urls.forEach((u) => covered.add(u));
    }
    expect(covered.size).toBe(130);
  });

  it("handles a negative day index without dropping URLs", () => {
    const r = selectInspectionWindow(make(130), 60, -1);
    expect(r.urls).toHaveLength(60);
  });
});

describe("rankTopQueries", () => {
  it("ranks by impressions, then clicks, then query text", () => {
    const rows = [
      { keys: ["zero clicks, few impressions"], clicks: 0, impressions: 1 },
      { keys: ["b"], clicks: 0, impressions: 68 },
      { keys: ["a"], clicks: 0, impressions: 68 },
      { keys: ["clicked"], clicks: 3, impressions: 68 },
      { keys: ["top"], clicks: 0, impressions: 400 },
    ];
    expect(rankTopQueries(rows, 4).map((r) => r.keys?.[0])).toEqual(["top", "clicked", "a", "b"]);
  });

  it("does not reorder the caller's array", () => {
    const rows = [{ keys: ["x"], impressions: 1 }, { keys: ["y"], impressions: 2 }];
    rankTopQueries(rows, 2);
    expect(rows.map((r) => r.keys[0])).toEqual(["x", "y"]);
  });
});

describe("timingSafeEqualStr", () => {
  it("accepts only an exact match", () => {
    expect(timingSafeEqualStr("sb_secret_abc", "sb_secret_abc")).toBe(true);
    expect(timingSafeEqualStr("sb_secret_abc", "sb_secret_abd")).toBe(false);
    expect(timingSafeEqualStr("sb_secret_abc", "sb_secret_ab")).toBe(false);
    expect(timingSafeEqualStr("é", "e")).toBe(false);
  });

  it("never treats an empty key as a match", () => {
    // An unset SUPABASE_SERVICE_ROLE_KEY must not let an empty bearer through.
    expect(timingSafeEqualStr("", "")).toBe(false);
  });
});

describe("applySectionResult", () => {
  const prev = { data: { n: 1 }, fetched_at: "2026-09-01T00:00:00.000Z", error: null, error_at: null };

  it("replaces the data and clears the error on success", () => {
    const r = applySectionResult({ ...prev, error: "old", error_at: "x" }, { ok: true, data: { n: 2 } }, "2026-09-24T00:00:00.000Z");
    expect(r).toEqual({ data: { n: 2 }, fetched_at: "2026-09-24T00:00:00.000Z", error: null, error_at: null });
  });

  it("keeps the last good data beside the error on failure", () => {
    const r = applySectionResult(prev, { ok: false, error: "HTTP 503" }, "2026-09-24T00:00:00.000Z");
    expect(r).toEqual({ data: { n: 1 }, fetched_at: "2026-09-01T00:00:00.000Z", error: "HTTP 503", error_at: "2026-09-24T00:00:00.000Z" });
  });

  it("records a failure with no previous snapshot as no data, not empty data", () => {
    const r = applySectionResult<{ n: number }>(null, { ok: false, error: "boom" }, "t");
    expect(r.data).toBeNull();
    expect(r.error).toBe("boom");
  });
});

describe("coverageStatus", () => {
  it("distinguishes refreshed, fresh, stale and missing", () => {
    expect(coverageStatus({ hasSnapshot: true, fresh: false, refreshed: true })).toBe("refreshed");
    expect(coverageStatus({ hasSnapshot: true, fresh: true, refreshed: false })).toBe("fresh");
    expect(coverageStatus({ hasSnapshot: true, fresh: false, refreshed: false })).toBe("stale");
    expect(coverageStatus({ hasSnapshot: false, fresh: false, refreshed: false })).toBe("missing");
  });
});

describe("coverageFields", () => {
  const sitemaps: SitemapSummary = { indexed_pages: 30, submitted_pages: 34, sitemap_warnings: 0, sitemap_errors: 0, sitemaps: [] };
  const indexing: IndexingResult = { checked: 33, skipped: 1, total: 34, rotated: false, issues: [] };

  it("flattens both sections into the gsc fields the dashboards read", () => {
    const { gsc, errors } = coverageFields(
      {
        sitemaps: { data: sitemaps, fetched_at: "t1", error: null, error_at: null },
        indexing: { data: indexing, fetched_at: "t2", error: null, error_at: null },
      },
      "fresh",
    );
    expect(gsc).toMatchObject({
      coverage_status: "fresh",
      coverage_blocked: null,
      indexed_pages: 30,
      submitted_pages: 34,
      indexing_checked: 33,
      indexing_skipped: 1,
      indexing_total: 34,
      indexing_fetched_at: "t2",
    });
    expect(errors).toEqual({});
  });

  it("surfaces a section's error while still showing its last good data", () => {
    const { gsc, errors } = coverageFields(
      { indexing: { data: indexing, fetched_at: "t2", error: "HTTP 429", error_at: "t3" } },
      "stale",
    );
    expect(gsc.indexing_checked).toBe(33);
    expect(errors).toEqual({ indexing: "HTTP 429" });
  });

  it("adds no data fields at all when there is no snapshot", () => {
    // Absent, not zero: the dashboard must render "–", never "0 indexed".
    const { gsc } = coverageFields(null, "missing", "denied");
    expect(gsc).toEqual({ coverage_status: "missing", coverage_blocked: "denied" });
  });
});
