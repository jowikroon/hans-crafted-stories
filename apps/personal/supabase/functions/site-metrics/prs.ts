// Merged pull requests -> site_changes rows. Pure, tested in src/test/siteImpact.test.ts.
//
// A PR declares what it should move with one line in its body (the PR template asks for it):
//
//   Measure: metric=search_clicks paths=/nl/interim-ecommerce-manager,/services/* expect=up days=28
//
// Without that line a PR that references a planned Linear issue (HAN-123) activates the
// planned row for that issue; any other product PR is logged as a timeline annotation, and
// dependency bumps and bot PRs are skipped.

import type { Metric } from "./impact.ts";

export const METRICS: Metric[] = [
  "search_clicks", "search_impressions", "search_ctr", "search_position",
  "visits", "engaged_rate", "leads", "lead_rate",
];

export interface Measure {
  metric: Metric;
  paths: string[];
  expect: "up" | "down";
  days: number | null;
  baseline: number | null;
}

export function parseMeasure(body: string | null | undefined): Measure | null {
  if (!body) return null;
  const line = body.split(/\r?\n/).find((l) => /^\s*[-*]?\s*\**measure\**\s*:/i.test(l));
  if (!line) return null;
  const kv: Record<string, string> = {};
  for (const m of line.replace(/^[^:]*:/, "").matchAll(/([a-z_]+)\s*=\s*([^\s]+)/gi)) kv[m[1].toLowerCase()] = m[2].replace(/`/g, "");
  const metric = kv.metric as Metric;
  if (!METRICS.includes(metric)) return null;
  // The PR template's placeholder, left unedited: not a measurement.
  if (/(^|,)\/example(,|$)/.test(kv.paths ?? kv.path ?? "")) return null;
  const paths = (kv.paths ?? kv.path ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => /^\/[\w\-./*]*$/.test(p) && p.length <= 200);
  const num = (v?: string) => {
    const n = v ? Number.parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n >= 7 && n <= 180 ? n : null;
  };
  const expect = kv.expect === "down" ? "down" : kv.expect === "up" ? "up" : metric === "search_position" ? "down" : "up";
  return { metric, paths, expect, days: num(kv.days), baseline: num(kv.baseline) };
}

export function linearIssues(...texts: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  // Branch names carry the id in lower case (hansvl3/han-170-...).
  for (const t of texts) for (const m of (t ?? "").matchAll(/\b(han-\d{1,5})\b/gi)) out.add(m[1].toUpperCase());
  return [...out];
}

export interface PrLike {
  number: number;
  title: string;
  body?: string | null;
  merged_at?: string | null;
  user?: { login?: string; type?: string } | null;
  base?: { ref?: string } | null;
  head?: { ref?: string } | null;
}

export type Kind = "seo" | "content" | "ux" | "tech" | "offsite" | "tracking";

export function isSkippable(pr: PrLike): boolean {
  const login = (pr.user?.login ?? "").toLowerCase();
  if (pr.user?.type === "Bot" || login.includes("dependabot") || login.endsWith("[bot]")) return true;
  if (/^(chore|build|ci)\(deps/i.test(pr.title) || /^bump /i.test(pr.title)) return true;
  // Changes that never reach a public page: docs, CI, ops, and the admin tools behind login.
  if (/^(docs|ci|build|test|ops|chore\(claude\))\b/i.test(pr.title)) return true;
  if (/\b(portal|cowork|mcp|empire[- ]health|dashboards?|write ?cms|voice template|bijlagen|edit[- ]overlay|overlay|samantha|claude|lovable|gateway)\b/i.test(pr.title)
    && !/\b(seo|sitemap|hreflang|homepage|landing|rates|tarieven)\b/i.test(pr.title)) return true;
  if ((pr.base?.ref ?? "main") !== "main") return true;
  return false;
}

export function kindOf(pr: PrLike): Kind {
  const t = `${pr.title} ${pr.head?.ref ?? ""}`.toLowerCase();
  if (/\b(analytics|tracking|measure|meting|dashboard)\b/.test(t)) return "tracking";
  if (/\b(seo|sitemap|hreflang|schema|canonical|index|prerender|title)\b/.test(t)) return "seo";
  if (/\b(content|blog|article|artikel|copy|case)\b/.test(t)) return "content";
  if (/^feat/.test(t) || /\b(ux|ui|design|cta|form)\b/.test(t)) return "ux";
  return "tech";
}

export type PrAction =
  | { type: "skip" }
  | { type: "activate"; issues: string[]; measure: Measure | null }
  | { type: "insert"; status: "measuring" | "logged"; kind: Kind; measure: Measure | null; issues: string[] };

/** What to do with a merged PR, given the Linear issues that have a planned change row. */
export function planPr(pr: PrLike, plannedIssues: Set<string>): PrAction {
  if (!pr.merged_at || isSkippable(pr)) return { type: "skip" };
  const measure = parseMeasure(pr.body);
  const issues = linearIssues(pr.title, pr.body, pr.head?.ref);
  const planned = issues.filter((i) => plannedIssues.has(i));
  if (planned.length > 0) return { type: "activate", issues: planned, measure };
  return { type: "insert", status: measure ? "measuring" : "logged", kind: kindOf(pr), measure, issues };
}
