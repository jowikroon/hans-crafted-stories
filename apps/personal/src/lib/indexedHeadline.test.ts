import { describe, expect, it } from "vitest";
import { indexedHeadline } from "./indexedHeadline";

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
