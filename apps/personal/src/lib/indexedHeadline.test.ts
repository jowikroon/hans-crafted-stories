import { describe, expect, it } from "vitest";
import { indexedCount, indexedHeadline } from "./indexedHeadline";

const issues = (n: number) => Array.from({ length: n }, (_, i) => ({ url: `u${i}` }));

describe("indexedHeadline", () => {
  it("headlines the exact URL Inspection count when every sitemap URL was checked", () => {
    // Production 2026-09-25: 34 checked, 9 flagged, GSC lists no sitemap.
    const h = indexedHeadline({
      indexing_checked: 34, indexing_total: 34, indexing_issues: issues(9),
      indexed_pages: null, sitemaps: [], sitemaps_fetched_at: "2026-09-24T23:59:03Z",
    });
    expect(h.value).toBe("25 / 34");
    expect(h.sub).toBe("URL Inspection · no sitemap submitted in Search Console");
  });

  it("shows the sitemap-reported figure only as secondary context", () => {
    const h = indexedHeadline({ indexing_checked: 10, indexing_total: 10, indexing_issues: [], indexed_pages: 8, submitted_pages: 10 });
    expect(h.value).toBe("10 / 10");
    expect(h.sub).toContain("sitemap-reported 8 of 10");
  });

  it("gives a lower bound on a partial run, since flagged issues can be carried over", () => {
    const h = indexedHeadline({ indexing_checked: 30, indexing_total: 34, indexing_issues: issues(9) });
    expect(h.value).toBe("≥ 21 / 34");
    expect(h.sub).toContain("30 of 34 checked");
  });

  it("falls back to the sitemap figure, labelled approximate, without an inspection snapshot", () => {
    expect(indexedHeadline({ indexed_pages: 12, submitted_pages: 20 })).toEqual({ value: "12", sub: "sitemap-reported 12 of 20 (approximate)" });
    expect(indexedHeadline(null)).toEqual({ value: "–", sub: "sitemap count unavailable" });
  });

  it("never renders a negative count", () => {
    expect(indexedHeadline({ indexing_checked: 2, indexing_total: 5, indexing_issues: issues(4) }).value).toBe("≥ 0 / 5");
  });
});

describe("indexedCount", () => {
  it("is exact when every sitemap URL got a verdict", () => {
    expect(indexedCount({ indexing_checked: 34, indexing_skipped: 0, indexing_total: 34, indexing_issues: issues(9) }))
      .toEqual({ indexed: 25, checked: 34, skipped: 0, total: 34, partial: false });
  });

  it("never counts an uninspected URL as indexed above the inspection cap", () => {
    // 120 sitemap URLs, a rotation window of 50 inspected, 3 flagged: total - flagged would claim 117.
    const c = indexedCount({ indexing_checked: 50, indexing_skipped: 0, indexing_total: 120, indexing_issues: issues(3) });
    expect(c).toEqual({ indexed: 47, checked: 50, skipped: 0, total: 120, partial: true });
  });

  it("treats skipped inspections as unknown, not indexed", () => {
    expect(indexedCount({ indexing_checked: 30, indexing_skipped: 4, indexing_total: 34, indexing_issues: issues(2) }))
      .toEqual({ indexed: 28, checked: 30, skipped: 4, total: 34, partial: true });
  });

  it("is null without an inspection snapshot", () => {
    expect(indexedCount(null)).toBeNull();
    expect(indexedCount({ indexed_pages: 12 })).toBeNull();
    expect(indexedCount({ indexing_checked: 0, indexing_total: 0, indexing_issues: [] })).toBeNull();
  });
});
