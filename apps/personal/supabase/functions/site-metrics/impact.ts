// Before/after impact of one site change, with the rest of the site as control.
//
// Pure logic (no Deno, no network) so vitest covers it: see src/test/siteImpact.test.ts.
//
// Method, in the terms an e-commerce manager expects:
// - Baseline window: the `baseline_days` full days before the deploy day. Measurement window:
//   the `measure_days` full days after it. The deploy day itself is partial and left out.
// - Treated = the pages the change touched (`paths`); control = every other page. Search
//   metrics come from Search Console page rows, visit metrics from first-party visits.
// - Counts (clicks, impressions, visits, leads) are compared as daily rates, adjusted for the
//   control group's movement (difference in differences on a ratio scale), and tested with a
//   conditional Poisson test: given the total count, is the share that fell after the deploy
//   larger than the window lengths (and the control trend) predict?
// - Rates (CTR, engaged rate, lead rate) use a two-proportion z-test on the change in
//   percentage points, minus the control group's change.
// - Position has no per-day variance in Search Console, so it uses a practical rule: a move of
//   at least one position with at least 100 impressions in both windows.
// - Below a minimum sample there is no verdict, only the numbers: a low-traffic site produces
//   plenty of +200% swings that mean nothing.

export type Metric =
  | "search_clicks" | "search_impressions" | "search_ctr" | "search_position"
  | "visits" | "engaged_rate" | "leads" | "lead_rate";

export interface DailyRow {
  d: string;
  scope: "treated" | "control";
  clicks: number;
  impressions: number;
  pos_impr: number;
  visits: number;
  engaged: number;
  leads: number;
}

export interface ChangeInput {
  deployed_at: string;
  paths: string[];
  primary_metric: Metric;
  expected: "up" | "down";
  baseline_days: number;
  measure_days: number;
}

export interface Window { from: string; to: string; days: number }

export interface Windows {
  pre: Window;
  post: Window;
  planned_post_to: string;
  complete: boolean;
}

export interface Totals {
  days: number;
  clicks: number;
  impressions: number;
  pos_impr: number;
  visits: number;
  engaged: number;
  leads: number;
}

export type Verdict = "win" | "loss" | "flat" | "measuring" | "insufficient" | "no_baseline";

export interface ImpactResult {
  metric: Metric;
  windows: Windows;
  treated: { pre: number | null; post: number | null };
  control: { pre: number | null; post: number | null } | null;
  change_pct: number | null; // treated, relative
  control_change_pct: number | null;
  lift_pct: number | null; // treated relative to control (the headline effect)
  abs_change: number | null; // points for rates, positions for position, per-day for counts
  z: number | null;
  confidence: number | null; // 1 - two-sided p
  verdict: Verdict;
  status: "measuring" | "concluded";
  note: string;
  snapshot: Record<string, { pre: number | null; post: number | null }>;
  computed_at: string;
}

const DAY = 86_400_000;
export const MIN_POST_DAYS = 7;

const toDay = (s: string) => new Date(`${s.slice(0, 10)}T12:00:00Z`);
export const addDays = (s: string, n: number) => new Date(toDay(s).getTime() + n * DAY).toISOString().slice(0, 10);
const daysIncl = (a: string, b: string) => Math.round((toDay(b).getTime() - toDay(a).getTime()) / DAY) + 1;

/** Deploy date as the Amsterdam calendar day. */
export function deployDay(deployedAt: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(deployedAt));
}

export const isSearchMetric = (m: Metric) => m.startsWith("search_");

/**
 * @param lastDay the last day with complete data for this metric's source
 *   (Search Console lags ~3 days; first-party data is complete through yesterday).
 */
export function windowsFor(c: ChangeInput, lastDay: string, since?: string | null): Windows {
  const dd = deployDay(c.deployed_at);
  // The baseline never reaches back before the data source existed: zero-filled days would
  // read as a collapse in the rate. `since` is the first day with data.
  let preFrom = addDays(dd, -c.baseline_days);
  if (since && toDay(since) > toDay(preFrom)) preFrom = since.slice(0, 10);
  const preTo = addDays(dd, -1);
  const pre: Window = { from: preFrom, to: preTo, days: Math.max(0, daysIncl(preFrom, preTo)) };
  const plannedTo = addDays(dd, c.measure_days);
  const postFrom = addDays(dd, 1);
  const to = toDay(plannedTo) <= toDay(lastDay) ? plannedTo : lastDay;
  const days = Math.max(0, daysIncl(postFrom, to));
  return { pre, post: { from: postFrom, to, days }, planned_post_to: plannedTo, complete: to === plannedTo };
}

export function totals(rows: DailyRow[], scope: DailyRow["scope"], w: Window): Totals {
  const t: Totals = { days: w.days, clicks: 0, impressions: 0, pos_impr: 0, visits: 0, engaged: 0, leads: 0 };
  if (w.days <= 0) return t;
  for (const r of rows) {
    if (r.scope !== scope || r.d < w.from || r.d > w.to) continue;
    t.clicks += Number(r.clicks) || 0;
    t.impressions += Number(r.impressions) || 0;
    t.pos_impr += Number(r.pos_impr) || 0;
    t.visits += Number(r.visits) || 0;
    t.engaged += Number(r.engaged) || 0;
    t.leads += Number(r.leads) || 0;
  }
  return t;
}

/** The metric's value for a window: per-day rate for counts, a percentage for rates, a position. */
export function valueOf(m: Metric, t: Totals): number | null {
  const perDay = (n: number) => (t.days > 0 ? n / t.days : null);
  const pct = (a: number, b: number) => (b > 0 ? (100 * a) / b : null);
  switch (m) {
    case "search_clicks": return perDay(t.clicks);
    case "search_impressions": return perDay(t.impressions);
    case "visits": return perDay(t.visits);
    case "leads": return perDay(t.leads);
    case "search_ctr": return pct(t.clicks, t.impressions);
    case "engaged_rate": return pct(t.engaged, t.visits);
    case "lead_rate": return pct(t.leads, t.visits);
    case "search_position": return t.impressions > 0 ? t.pos_impr / t.impressions : null;
  }
}

const countOf = (m: Metric, t: Totals) =>
  m === "search_clicks" ? t.clicks : m === "search_impressions" ? t.impressions : m === "visits" ? t.visits : t.leads;
const propOf = (m: Metric, t: Totals): [number, number] =>
  m === "search_ctr" ? [t.clicks, t.impressions] : m === "engaged_rate" ? [t.engaged, t.visits] : [t.leads, t.visits];

// Abramowitz-Stegun 7.1.26, accurate to ~1e-7: plenty for a confidence label.
function normCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
const confidenceOf = (z: number) => 1 - 2 * (1 - normCdf(Math.abs(z)));
const round = (n: number | null, d = 1) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const rel = (post: number | null, pre: number | null) => (post != null && pre != null && pre > 0 ? (post / pre - 1) * 100 : null);

export const MIN_COUNT = 20; // pre + post events for a count metric
export const MIN_DENOM = 30; // per window, for a rate
export const MIN_IMPR_POSITION = 100; // per window, for position
export const POSITION_STEP = 1; // positions

export const MIN_BASELINE_DAYS = 7;

export function evaluate(c: ChangeInput, rows: DailyRow[], lastDay: string, since?: string | null, now = new Date()): ImpactResult {
  const m = c.primary_metric;
  const w = windowsFor(c, lastDay, since);
  const hasControl = c.paths.length > 0;
  const tPre = totals(rows, "treated", w.pre), tPost = totals(rows, "treated", w.post);
  const cPre = totals(rows, "control", w.pre), cPost = totals(rows, "control", w.post);

  const snapshot: ImpactResult["snapshot"] = {};
  for (const k of ["search_clicks", "search_impressions", "search_ctr", "search_position", "visits", "engaged_rate", "leads", "lead_rate"] as Metric[]) {
    snapshot[k] = { pre: round(valueOf(k, tPre), 2), post: round(valueOf(k, tPost), 2) };
  }

  const tv = { pre: valueOf(m, tPre), post: w.post.days > 0 ? valueOf(m, tPost) : null };
  const cv = hasControl ? { pre: valueOf(m, cPre), post: w.post.days > 0 ? valueOf(m, cPost) : null } : null;
  const change = rel(tv.post, tv.pre);
  const cChange = cv ? rel(cv.post, cv.pre) : null;

  let lift: number | null = null;
  let abs: number | null = null;
  let z: number | null = null;
  let enough = false;
  const baseline = w.pre.days >= Math.min(MIN_BASELINE_DAYS, c.baseline_days)
    && (m.startsWith("search_") ? tPre.impressions : tPre.visits) > 0;

  if (m === "search_clicks" || m === "search_impressions" || m === "visits" || m === "leads") {
    const n1 = countOf(m, tPre), n2 = countOf(m, tPost);
    // Control trend as a ratio of daily rates; 1 when there is no usable control.
    const rc = cv && cv.pre && cv.post != null && cv.pre > 0 ? cv.post / cv.pre : 1;
    lift = change == null ? null : ((1 + change / 100) / rc - 1) * 100;
    abs = tv.post != null && tv.pre != null ? tv.post - tv.pre : null;
    const n = n1 + n2;
    enough = n >= MIN_COUNT;
    if (n > 0 && w.post.days > 0) {
      const p = (w.post.days * rc) / (w.pre.days + w.post.days * rc);
      const sd = Math.sqrt(n * p * (1 - p));
      z = sd > 0 ? (n2 - n * p) / sd : null;
    }
  } else if (m === "search_ctr" || m === "engaged_rate" || m === "lead_rate") {
    const [x1, d1] = propOf(m, tPre), [x2, d2] = propOf(m, tPost);
    enough = d1 >= MIN_DENOM && d2 >= MIN_DENOM;
    if (d1 > 0 && d2 > 0) {
      const p1 = x1 / d1, p2 = x2 / d2;
      let diff = p2 - p1;
      let v = (p1 * (1 - p1)) / d1 + (p2 * (1 - p2)) / d2;
      if (cv) {
        const [y1, e1] = propOf(m, cPre), [y2, e2] = propOf(m, cPost);
        if (e1 > 0 && e2 > 0) {
          const q1 = y1 / e1, q2 = y2 / e2;
          diff -= q2 - q1;
          v += (q1 * (1 - q1)) / e1 + (q2 * (1 - q2)) / e2;
        }
      }
      abs = diff * 100;
      lift = p1 > 0 ? (diff / p1) * 100 : null;
      // Pooled floor on the variance: with 0 successes on both sides the plain estimate is 0.
      const floor = 1 / (4 * Math.max(d1, d2) ** 2);
      z = diff / Math.sqrt(Math.max(v, floor));
    }
  } else {
    // search_position: lower is better; abs is the move in positions (negative = improved)
    enough = tPre.impressions >= MIN_IMPR_POSITION && tPost.impressions >= MIN_IMPR_POSITION;
    if (tv.pre != null && tv.post != null) {
      let move = tv.post - tv.pre;
      if (cv && cv.pre != null && cv.post != null) move -= cv.post - cv.pre;
      abs = move;
      lift = tv.pre > 0 ? (-move / tv.pre) * 100 : null;
    }
  }

  const confidence = z == null ? null : confidenceOf(z);
  const wentUp = m === "search_position" ? (abs ?? 0) > 0 : (lift ?? abs ?? 0) > 0;
  const good = c.expected === "up" ? wentUp : !wentUp;
  const significant = m === "search_position"
    ? Math.abs(abs ?? 0) >= POSITION_STEP
    : z != null && Math.abs(z) >= 1.96;

  let verdict: Verdict;
  let note: string;
  if (!baseline) {
    verdict = "no_baseline";
    note = isSearchMetric(m)
      ? "Geen Search Console-data in de basisperiode voor deze pagina's."
      : "Geen first-party bezoekdata in de basisperiode: meting start bij de volgende wijziging.";
  } else if (w.post.days < Math.min(MIN_POST_DAYS, c.measure_days)) {
    verdict = "measuring";
    note = `Nog ${Math.min(MIN_POST_DAYS, c.measure_days) - w.post.days} dag(en) tot een eerste oordeel.`;
  } else if (!enough) {
    verdict = "insufficient";
    note = "Te weinig volume voor een betrouwbaar oordeel; de cijfers zijn indicatief.";
  } else if (significant) {
    verdict = good ? "win" : "loss";
    note = good ? "Effect in de verwachte richting, statistisch overtuigend." : "Effect tegen de verwachting in, statistisch overtuigend.";
  } else if (w.complete) {
    verdict = "flat";
    note = "Geen overtuigend verschil na de volledige meetperiode.";
  } else {
    verdict = "measuring";
    note = `Tussenstand na ${w.post.days} van ${c.measure_days} dagen, nog niet overtuigend.`;
  }

  return {
    metric: m,
    windows: w,
    treated: { pre: round(tv.pre, 2), post: round(tv.post, 2) },
    control: cv ? { pre: round(cv.pre, 2), post: round(cv.post, 2) } : null,
    change_pct: round(change),
    control_change_pct: round(cChange),
    lift_pct: round(lift),
    abs_change: round(abs, 2),
    z: round(z, 2),
    confidence: round(confidence, 3),
    verdict,
    status: w.complete || verdict === "no_baseline" ? "concluded" : "measuring",
    note,
    snapshot,
    computed_at: now.toISOString(),
  };
}
