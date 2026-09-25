import { describe, expect, it } from "vitest";
import { buildInsights, type SiteDashboard } from "./siteInsights";

const base = (): SiteDashboard => ({
  period: { from: "2026-09-11", to: "2026-09-24", prev_from: "2026-08-28", prev_to: "2026-09-10" },
  kpi: { cur: { visits: 0, leads: 0 }, prev: { visits: 0, leads: 0 } },
  funnel: { visits: 0, engaged: 0, intent: 0, form_start: 0, lead: 0, form_submit: 0, book: 0, email: 0, linkedin: 0 },
  series: null, pages: null, channels: null, landing: null, devices: null, queries: null, vitals: null, vitals_pages: null,
  errors: null, events: null, changes: null, submissions: null, coverage: null, harvest: null,
  quality: { last_event: null, internal_events: 0, tracking_since: "2026-08-01T00:00:00Z", gsc_since: "2026-07-17", ga4_since: "2026-08-01" },
});
const NOW = new Date("2026-09-25T12:00:00Z");
const ids = (d: SiteDashboard) => buildInsights(d, NOW).map((i) => i.id);

describe("buildInsights", () => {
  it("escalates unindexed money pages to critical and names them", () => {
    const d = base();
    d.coverage = { indexing: { data: { checked: 34, total: 34, issues: [
      { url: "https://hansvanleeuwen.com/rates", verdict: "NEUTRAL", coverage_state: "Crawled - currently not indexed", last_crawl: null },
      { url: "https://hansvanleeuwen.com/privacy", verdict: "NEUTRAL", coverage_state: "URL is unknown to Google", last_crawl: null },
    ] } } };
    const [first] = buildInsights(d, NOW);
    expect(first.id).toBe("indexing");
    expect(first.severity).toBe("critical");
    expect(first.evidence).toContain("/rates");
  });

  it("reports the automatic sitemap submission as a win and a missing sitemap as critical", () => {
    const d = base();
    d.harvest = { at: "", data: { sitemap: "submitted: /sitemap.xml ingediend" } };
    expect(buildInsights(d, NOW).find((i) => i.id === "sitemap")?.severity).toBe("win");
    d.harvest = { at: "", data: { sitemap: "missing: geen rechten" } };
    expect(buildInsights(d, NOW).find((i) => i.id === "sitemap")?.severity).toBe("critical");
  });

  it("flags a leaking contact form", () => {
    const d = base();
    d.funnel = { ...d.funnel, form_start: 5, form_submit: 1 };
    expect(ids(d)).toContain("form-dropoff");
  });

  it("finds pages that rank but do not get clicked, and queries just off page one", () => {
    const d = base();
    d.pages = [{ path: "/nl/rates", views: 0, visits: 0, avg_engaged_s: null, avg_scroll: null, intent_rate: null, clicks: 0, impressions: 120, position: 6.2 }];
    d.queries = [{ query: "interim ecommerce manager", clicks: 0, impressions: 40, position: 11.3, prev_position: 18 }];
    const got = ids(d);
    expect(got).toContain("ctr:/nl/rates");
    expect(got).toContain("striking");
    expect(got).toContain("climbers");
  });

  it("turns measured improvements into scale-up or roll-back advice", () => {
    const d = base();
    const result = { verdict: "win" as const, lift_pct: 41.6, abs_change: 3, confidence: 0.999, note: "", treated: { pre: 5, post: 8 }, windows: { post: { days: 19 }, planned_post_to: "2026-10-03" } };
    d.changes = [
      { id: "a", title: "Q4 A+B", kind: "seo", linear_issue: "HAN-171", pr_number: 336, deployed_at: "2026-09-05", paths: [], primary_metric: "search_impressions", expected: "up", hypothesis: null, measure_days: 28, status: "measuring", result, result_at: null },
      { id: "b", title: "Iets", kind: "seo", linear_issue: null, pr_number: 1, deployed_at: "2026-09-05", paths: [], primary_metric: "search_ctr", expected: "up", hypothesis: null, measure_days: 28, status: "concluded", result: { ...result, verdict: "loss", lift_pct: -30 }, result_at: null },
    ];
    const out = buildInsights(d, NOW);
    expect(out.find((i) => i.id === "win:a")?.evidence).toContain("+41.6%");
    expect(out.find((i) => i.id === "loss:b")?.severity).toBe("high");
  });

  it("flags slow pages by the p75 thresholds and ignores tiny samples", () => {
    const d = base();
    d.vitals = [{ metric: "LCP", device: "mobile", p75: 4600, n: 12, good_pct: 20 }, { metric: "INP", device: "mobile", p75: 900, n: 1, good_pct: 0 }];
    const out = buildInsights(d, NOW);
    expect(out.find((i) => i.id === "lcp")?.severity).toBe("high");
    expect(out.find((i) => i.id === "inp")).toBeUndefined();
  });

  it("says so honestly when first-party tracking has no data yet, and sorts by severity", () => {
    const d = base();
    d.quality.tracking_since = null;
    d.errors = { not_found: [{ path: "/oud", n: 3 }], js: null };
    const out = buildInsights(d, NOW);
    expect(out.map((i) => i.id)).toEqual(["404", "tracking-none"]);
  });
});
