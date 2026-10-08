import { describe, expect, it } from "vitest";
import {
  addDays, deployDay, evaluate, totals, valueOf, windowsFor,
  type ChangeInput, type DailyRow,
} from "../../supabase/functions/site-metrics/impact";
import { isSkippable, kindOf, linearIssues, looksInternal, parseMeasure, planPr } from "../../supabase/functions/site-metrics/prs";

const change = (over: Partial<ChangeInput> = {}): ChangeInput => ({
  deployed_at: "2026-09-01T10:00:00Z",
  paths: ["/nl/*"],
  primary_metric: "search_clicks",
  expected: "up",
  baseline_days: 28,
  measure_days: 28,
  ...over,
});

/** Daily rows from a generator per day offset relative to the deploy day. */
function rows(from: string, to: string, fn: (i: number, d: string) => Partial<DailyRow>[]): DailyRow[] {
  const out: DailyRow[] = [];
  const dd = "2026-09-01";
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const i = Math.round((new Date(`${d}T12:00:00Z`).getTime() - new Date(`${dd}T12:00:00Z`).getTime()) / 86_400_000);
    for (const r of fn(i, d)) {
      out.push({ d, scope: "treated", clicks: 0, impressions: 0, pos_impr: 0, visits: 0, engaged: 0, leads: 0, ...r });
    }
  }
  return out;
}

describe("windowsFor", () => {
  it("leaves the partial deploy day out of both windows", () => {
    const w = windowsFor(change(), "2026-12-31");
    expect(w.pre).toEqual({ from: "2026-08-04", to: "2026-08-31", days: 28 });
    expect(w.post).toEqual({ from: "2026-09-02", to: "2026-09-29", days: 28 });
    expect(w.complete).toBe(true);
  });

  it("clamps the measurement window to the last day with data", () => {
    const w = windowsFor(change(), "2026-09-10");
    expect(w.post).toEqual({ from: "2026-09-02", to: "2026-09-10", days: 9 });
    expect(w.complete).toBe(false);
  });

  it("never lets the baseline reach back before the data source existed", () => {
    const w = windowsFor(change(), "2026-12-31", "2026-08-20");
    expect(w.pre).toEqual({ from: "2026-08-20", to: "2026-08-31", days: 12 });
  });

  it("uses the Amsterdam calendar day for the deploy", () => {
    expect(deployDay("2026-09-01T22:30:00Z")).toBe("2026-09-02");
  });
});

describe("evaluate", () => {
  it("calls a clear, control-adjusted rise in clicks a win", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: i > 0 ? 6 : 2, impressions: 100 },
      { scope: "control", clicks: 5, impressions: 200 },
    ]);
    const res = evaluate(change(), r, "2026-09-29");
    expect(res.verdict).toBe("win");
    expect(res.status).toBe("concluded");
    expect(res.lift_pct).toBe(200);
    expect(res.confidence).toBeGreaterThan(0.99);
  });

  it("does not credit the change for a site-wide rise the control group shows too", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: i > 0 ? 6 : 3, impressions: 100 },
      { scope: "control", clicks: i > 0 ? 20 : 10, impressions: 200 },
    ]);
    const res = evaluate(change(), r, "2026-09-29");
    expect(res.change_pct).toBe(100);
    expect(res.lift_pct).toBe(0);
    expect(res.verdict).toBe("flat");
  });

  it("adjusts for the control trend on large volumes, also with windows of different length", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: i > 0 ? 80 : 50, impressions: 2000 },
      { scope: "control", clicks: i > 0 ? 220 : 200, impressions: 8000 },
    ]);
    const res = evaluate(change({ baseline_days: 14 }), r, "2026-09-29");
    expect(res.windows.pre.days).toBe(14);
    expect(res.change_pct).toBe(60);
    expect(res.control_change_pct).toBe(10);
    expect(res.lift_pct).toBe(45.5); // 1.6 / 1.1 - 1
    expect(res.verdict).toBe("win");
    expect(res.confidence).toBeGreaterThan(0.99);
  });

  it("does not let a thin control group swing a count verdict", () => {
    // Treated pages flat at 10 clicks a day; the rest of the site goes from 1 click to 6. Taken as
    // an exact trend that sixfold rise would make the flat treated pages a confident loss.
    const flat = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: 10, impressions: 200 },
      { scope: "control", clicks: i === -10 || (i > 0 && i <= 6) ? 1 : 0, impressions: 50 },
    ]);
    const res = evaluate(change(), flat, "2026-09-29");
    expect(res.lift_pct).toBeLessThan(-80);
    expect(res.confidence).toBeLessThan(0.95);
    expect(res.verdict).toBe("insufficient");

    // The other way round: a thin control that drops must not turn a flat page into a win.
    const drop = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: 10, impressions: 200 },
      { scope: "control", clicks: (i < 0 && i >= -6) || i === 10 ? 1 : 0, impressions: 50 },
    ]);
    expect(["insufficient", "flat"]).toContain(evaluate(change(), drop, "2026-09-29").verdict);
  });

  it("applies the control volume gate to rates and position as well", () => {
    // One control impression per window: CTR 0% to 100%, position 50 to 3.
    const r = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: 5, impressions: 100, pos_impr: 800 },
      { scope: "control", clicks: i === 3 ? 1 : 0, impressions: i === -3 || i === 3 ? 1 : 0, pos_impr: i === -3 ? 50 : i === 3 ? 3 : 0 },
    ]);
    expect(evaluate(change({ primary_metric: "search_ctr" }), r, "2026-09-29").verdict).toBe("insufficient");
    expect(evaluate(change({ primary_metric: "search_position", expected: "down" }), r, "2026-09-29").verdict).toBe("insufficient");
  });

  it("gives no verdict on tiny volumes, however large the swing", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [{ scope: "treated", clicks: i === 5 ? 3 : i === -3 ? 1 : 0, impressions: 10 }]);
    const res = evaluate(change({ paths: [] }), r, "2026-09-29");
    expect(res.change_pct).toBe(200);
    expect(res.verdict).toBe("insufficient");
  });

  it("reports a loss when the metric moves against the expectation", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [{ scope: "treated", clicks: i > 0 ? 2 : 8, impressions: 100 }]);
    expect(evaluate(change({ paths: [] }), r, "2026-09-29").verdict).toBe("loss");
  });

  it("waits a week before judging", () => {
    const r = rows("2026-08-04", "2026-09-04", (i) => [{ scope: "treated", clicks: i > 0 ? 20 : 2, impressions: 100 }]);
    const res = evaluate(change({ paths: [] }), r, "2026-09-04");
    expect(res.verdict).toBe("measuring");
    expect(res.status).toBe("measuring");
  });

  it("marks first-party metrics without a baseline instead of inventing one", () => {
    const r = rows("2026-09-02", "2026-09-29", () => [{ scope: "treated", visits: 10 }]);
    const res = evaluate(change({ primary_metric: "visits" }), r, "2026-09-29", "2026-09-02");
    expect(res.verdict).toBe("no_baseline");
    expect(res.status).toBe("concluded");
  });

  it("keeps a missing baseline open until the measurement window is complete", () => {
    // A chunked backfill can still supply the baseline, so no_baseline must not conclude early.
    const r = rows("2026-09-02", "2026-09-10", () => [{ scope: "treated", clicks: 5, impressions: 100 }]);
    const res = evaluate(change(), r, "2026-09-10");
    expect(res.verdict).toBe("no_baseline");
    expect(res.status).toBe("measuring");
  });

  it("treats a lower position as the improvement", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => {
      const pos = i > 0 ? 6 : 12;
      return [{ scope: "treated", impressions: 20, pos_impr: 20 * pos, clicks: 1 }];
    });
    const res = evaluate(change({ primary_metric: "search_position", expected: "down", paths: [] }), r, "2026-09-29");
    expect(res.abs_change).toBe(-6);
    expect(res.lift_pct).toBe(50);
    expect(res.verdict).toBe("win");
  });

  it("tests rates on the change in percentage points", () => {
    const r = rows("2026-08-04", "2026-09-29", (i) => [{ scope: "treated", visits: 20, leads: i > 0 ? 2 : 0 }]);
    const res = evaluate(change({ primary_metric: "lead_rate", paths: [] }), r, "2026-09-29", "2026-08-04");
    expect(res.treated).toEqual({ pre: 0, post: 10 });
    expect(res.abs_change).toBe(10);
    expect(res.verdict).toBe("win");
  });

  it("snapshots every metric for context", () => {
    const r = rows("2026-08-04", "2026-09-29", () => [{ scope: "treated", clicks: 1, impressions: 50, pos_impr: 400, visits: 4, engaged: 2 }]);
    const res = evaluate(change({ paths: [] }), r, "2026-09-29");
    expect(res.snapshot.search_position).toEqual({ pre: 8, post: 8 });
    expect(res.snapshot.engaged_rate).toEqual({ pre: 50, post: 50 });
  });
});

describe("totals and valueOf", () => {
  it("normalises counts to a daily rate, so windows of different length compare", () => {
    const r = rows("2026-08-30", "2026-08-31", () => [{ scope: "treated", clicks: 3 }]);
    const t = totals(r, "treated", { from: "2026-08-30", to: "2026-08-31", days: 2 });
    expect(valueOf("search_clicks", t)).toBe(3);
  });
});

describe("PR parsing", () => {
  it("reads the Measure line", () => {
    expect(parseMeasure("## Measure\nMeasure: metric=search_clicks paths=/nl/interim-ecommerce-manager,/services/* expect=up days=42"))
      .toEqual({ metric: "search_clicks", paths: ["/nl/interim-ecommerce-manager", "/services/*"], pathsGiven: true, expect: "up", days: 42, baseline: null });
  });

  it("tells an explicit empty paths= (whole site) apart from no paths key", () => {
    expect(parseMeasure("Measure: metric=leads paths= expect=up baseline=56"))
      .toEqual({ metric: "leads", paths: [], pathsGiven: true, expect: "up", days: null, baseline: 56 });
    expect(parseMeasure("Measure: metric=leads path=")?.pathsGiven).toBe(true);
    expect(parseMeasure("Measure: metric=leads path=/nl/contact")).toMatchObject({ paths: ["/nl/contact"], pathsGiven: true });
    expect(parseMeasure("Measure: metric=leads expect=up days=42"))
      .toEqual({ metric: "leads", paths: [], pathsGiven: false, expect: "up", days: 42, baseline: null });
  });

  it("does not widen a plan to the whole site when every given path was rejected", () => {
    expect(parseMeasure("Measure: metric=leads paths=https://evil.example,nl/contact")).toMatchObject({ paths: [], pathsGiven: false });
    expect(parseMeasure("Measure: metric=leads paths=https://evil.example,/ok")).toMatchObject({ paths: ["/ok"], pathsGiven: true });
  });

  it("defaults position to 'down' and ignores unknown metrics and unsafe paths", () => {
    expect(parseMeasure("Measure: metric=search_position paths=/x")?.expect).toBe("down");
    expect(parseMeasure("Measure: metric=revenue")).toBeNull();
    expect(parseMeasure("Measure: metric=search_impressions paths=/example expect=up days=28")).toBeNull();
    expect(parseMeasure("Measure: metric=search_position paths= expect=up days=42")).toMatchObject({ paths: [], expect: "up", days: 42 });
    expect(parseMeasure("Measure: metric=visits paths=https://evil.example,/ok")?.paths).toEqual(["/ok"]);
  });

  it("finds Linear ids in titles, bodies and lower-case branch names", () => {
    expect(linearIssues("fix: thing (HAN-93)", "closes HAN-156", "hansvl3/han-170-plan")).toEqual(["HAN-93", "HAN-156", "HAN-170"]);
  });

  it("skips dependency bumps and bots", () => {
    expect(isSkippable({ number: 1, title: "chore(deps): bump vite", user: { login: "dependabot[bot]", type: "Bot" } })).toBe(true);
    expect(isSkippable({ number: 2, title: "feat: rates page", user: { login: "jowikroon", type: "User" } })).toBe(false);
  });

  it("skips changes that never reach a public page", () => {
    const u = { login: "jowikroon", type: "User" };
    for (const title of [
      "docs(claude): Git & PR workflow",
      "fix(mcp): afgevoerde n8n Cloud-host uit alle runtime-paden verwijderen",
      "feat(portal): add admin Cowork shortcut",
      "feat(edit-overlay): tekst-edits live",
      "feat(dashboards): periodefilter",
      "ops: content-redeploy watch",
    ]) expect(looksInternal({ number: 1, title, user: u })).toBe(true);
    for (const title of ["content(home): H1 -> 'Marketplace Manager'", "SEO run 2026-09-11: contrasttoken", "fix(i18n): localise /writing"]) {
      expect(looksInternal({ number: 1, title, user: u })).toBe(false);
    }
  });

  it("measures an internal-looking PR when it declares a Measure line", () => {
    const pr = { number: 371, title: "feat(analytics): site measurement and insights dashboard", merged_at: "2026-09-25T10:00:00Z", user: { login: "jowikroon" } };
    expect(planPr(pr, new Set())).toEqual({ type: "skip" });
    expect(planPr({ ...pr, body: "Measure: metric=leads paths= expect=up days=28" }, new Set())).toMatchObject({ type: "insert", status: "measuring", measure: { metric: "leads", paths: [] } });
  });

  it("activates a planned change for a referenced issue, else inserts", () => {
    const pr = { number: 7, title: "seo: money pages indexable (HAN-156)", body: "", merged_at: "2026-09-26T10:00:00Z", user: { login: "jowikroon" } };
    expect(planPr(pr, new Set(["HAN-156"]))).toEqual({ type: "activate", issues: ["HAN-156"], measure: null });
    // The activation applies these overrides to the planned row (site-metrics syncPrs).
    expect(planPr({ ...pr, body: "Measure: metric=search_clicks paths= baseline=56" }, new Set(["HAN-156"])))
      .toMatchObject({ type: "activate", measure: { paths: [], pathsGiven: true, baseline: 56 } });
    expect(planPr(pr, new Set())).toMatchObject({ type: "insert", status: "logged", kind: "seo" });
    expect(planPr({ ...pr, merged_at: null }, new Set())).toEqual({ type: "skip" });
  });

  it("classifies PR kinds", () => {
    expect(kindOf({ number: 1, title: "feat(analytics): site measurement" })).toBe("tracking");
    expect(kindOf({ number: 1, title: "content: new case study" })).toBe("content");
  });
});
