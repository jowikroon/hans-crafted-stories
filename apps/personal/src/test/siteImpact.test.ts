import { describe, expect, it } from "vitest";
import {
  addDays, countDispersion, dailyOf, deployDay, evaluate, rateDispersion, totals, valueOf, windowsFor,
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

  it("leaves a control group that is thin in either window out instead of letting it swing a count", () => {
    // Treated pages flat at 10 clicks a day; the rest of the site goes from 1 click to 19. Taken as
    // a trend, that rise would make the flat treated pages a confident loss.
    const lopsided = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: 10, impressions: 200 },
      { scope: "control", clicks: i === -10 || (i > 0 && i <= 19) ? 1 : 0, impressions: 50 },
    ]);
    const res = evaluate(change(), lopsided, "2026-09-29");
    expect(res.adjusted).toBe(false);
    expect(res.lift_pct).toBe(0);
    expect(res.verdict).toBe("flat");
    expect(res.note).toContain("Niet gecorrigeerd voor de rest van de site");

    // One stray control event must not block a clear verdict either (it used to give z 0, 0%).
    const doubled = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: i > 0 ? 2 : 1, impressions: 100 },
      { scope: "control", clicks: i === 10 ? 1 : 0, impressions: 50 },
    ]);
    const res2 = evaluate(change(), doubled, "2026-09-29");
    expect(res2.adjusted).toBe(false);
    expect(res2.verdict).toBe("win");
    expect(res2.z).toBeCloseTo(3.06, 1);
  });

  it("leaves a thin control out of rates and position as well", () => {
    // One control impression per window: CTR 0% to 100%, position 50 to 3.
    const r = rows("2026-08-04", "2026-09-29", (i) => [
      { scope: "treated", clicks: 5, impressions: 100, pos_impr: 800 },
      { scope: "control", clicks: i === 3 ? 1 : 0, impressions: i === -3 || i === 3 ? 1 : 0, pos_impr: i === -3 ? 50 : i === 3 ? 3 : 0 },
    ]);
    for (const metric of ["search_ctr", "search_position"] as const) {
      const res = evaluate(change({ primary_metric: metric, expected: metric === "search_position" ? "down" : "up" }), r, "2026-09-29");
      expect(res).toMatchObject({ adjusted: false, verdict: "flat" });
    }
  });

  it("asks for a stricter z while the measurement window runs, because it is re-tested daily", () => {
    // Whole site, 10 clicks a day before and 13 after: z 2.8 after 14 days, 3.3 after 28.
    const mild = rows("2026-08-04", "2026-09-29", (i) => [{ scope: "treated", clicks: i > 0 ? 13 : 10, impressions: 100 }]);
    const mid = evaluate(change({ paths: [] }), mild, "2026-09-15");
    expect(mid.z).toBeGreaterThan(1.96);
    expect(mid.z).toBeLessThan(3);
    expect(mid.verdict).toBe("measuring");
    expect(evaluate(change({ paths: [] }), mild, "2026-09-29").verdict).toBe("win");

    const strong = rows("2026-08-04", "2026-09-29", (i) => [{ scope: "treated", clicks: i > 0 ? 20 : 10, impressions: 100 }]);
    const early = evaluate(change({ paths: [] }), strong, "2026-09-15");
    expect(early.verdict).toBe("win");
    expect(early.status).toBe("measuring");
    expect(early.note).toContain("strengere drempel");
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

describe("dispersion", () => {
  it("zero-fills the days the RPC returns no row for", () => {
    const r = rows("2026-08-30", "2026-09-01", (i) => (i === -1 ? [] : [{ scope: "treated", clicks: 4 }]));
    expect(dailyOf(r, "treated", { from: "2026-08-29", to: "2026-09-01", days: 4 }, "clicks")).toEqual([0, 4, 0, 4]);
  });

  it("is 1 for Poisson-like or steady counts and measures extra noise around each window's own mean", () => {
    expect(countDispersion([[5, 5, 5], [9, 9, 9]])).toBe(1); // a step between windows is the effect, not noise
    expect(countDispersion([[0, 10], [0, 10]])).toBe(10); // (25 + 25) / 5 per window, 1 degree of freedom each
    expect(countDispersion([[], [0, 0]])).toBe(1);
  });

  it("does the same for daily proportions", () => {
    expect(rateDispersion([[[5, 100], [5, 100]], [[9, 100], [9, 100]]])).toBe(1);
    expect(rateDispersion([[[0, 100], [20, 100]]])).toBeGreaterThan(10);
    expect(rateDispersion([[[0, 0], [3, 50]]])).toBe(1); // a day without trials says nothing
  });
});

// Seeded simulations: daily counts with the extra-Poisson noise production shows (variance up to
// 6x the mean), where a plain Poisson test called about a quarter of no-effect changes a win or
// loss. Deterministic, so a regression shows up as a fixed number.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (u: () => number) => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
function gamma(k: number, u: () => number): number {
  if (k < 1) return gamma(k + 1, u) * u() ** (1 / k);
  const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number, v: number;
    do { x = normal(u); v = 1 + c * x; } while (v <= 0);
    v = v ** 3;
    const r = u();
    if (r < 1 - 0.0331 * x ** 4 || Math.log(r) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function poisson(mean: number, u: () => number): number {
  const limit = Math.exp(-mean);
  let k = 0, p = 1;
  do { k++; p *= u(); } while (p > limit);
  return k - 1;
}
/** A daily count with this mean and variance mean * vm (gamma-Poisson; vm 1 is plain Poisson). */
const draw = (mean: number, vm: number, u: () => number) =>
  poisson(vm > 1 ? gamma(mean / (vm - 1), u) * (vm - 1) : mean, u);

function verdictRate(o: {
  metric?: "search_impressions" | "search_ctr"; paths?: string[]; seed: number; runs?: number; lift?: number;
  treated: [number, number]; control?: [number, number];
}): number {
  const u = rng(o.seed), runs = o.runs ?? 400, metric = o.metric ?? "search_impressions";
  let hits = 0;
  for (let run = 0; run < runs; run++) {
    const r = rows("2026-08-04", "2026-09-29", (i) => {
      const f = i > 0 ? o.lift ?? 1 : 1;
      const t = draw(o.treated[0] * f, o.treated[1], u);
      const out: Partial<DailyRow>[] = [metric === "search_ctr"
        ? { scope: "treated", clicks: t, impressions: 100 }
        : { scope: "treated", impressions: t }];
      if (o.control) {
        const k = draw(o.control[0], o.control[1], u);
        out.push(metric === "search_ctr" ? { scope: "control", clicks: k, impressions: 200 } : { scope: "control", impressions: k });
      }
      return out;
    });
    const v = evaluate(change({ primary_metric: metric, paths: o.paths ?? ["/x"] }), r, "2026-09-29").verdict;
    if (v === "win" || v === "loss") hits++;
  }
  return hits / runs;
}

describe("evaluate on noisy daily data", () => {
  // Nominal 5%; at 400 runs the bound leaves room for sampling noise. The Poisson-only test this
  // replaced scored 26%, 63%, 17% and 37% on the overdispersed cases.
  it("keeps the false-alarm rate near 5% when daily counts are overdispersed", () => {
    expect(verdictRate({ seed: 1, treated: [4, 2], control: [6, 5] })).toBeLessThan(0.09);
    expect(verdictRate({ seed: 2, treated: [40, 10], control: [60, 30] })).toBeLessThan(0.09);
    expect(verdictRate({ seed: 3, treated: [4, 2], paths: [] })).toBeLessThan(0.09);
    expect(verdictRate({ seed: 4, treated: [4, 1], control: [6, 1] })).toBeLessThan(0.09); // plain Poisson
  });

  it("does the same for a rate whose daily values swing more than binomial", () => {
    expect(verdictRate({ seed: 5, metric: "search_ctr", treated: [5, 4], control: [10, 4] })).toBeLessThan(0.09);
  });

  it("still finds a real effect", () => {
    expect(verdictRate({ seed: 6, treated: [10, 2], control: [30, 5], lift: 1.6 })).toBeGreaterThan(0.7);
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
