// The "Indexed pages" tile on the CMS analytics view, and (via indexedCount) the
// "Geïndexeerd" tile and Indexatie card on /dashboards/hvl.
//
// Headline: the URL Inspection result over every sitemap URL (exact, per URL).
// Secondary: the sitemap-reported count, which Google documents as deprecated
// and zero-fills in practice, so it is context, never the headline.

export interface IndexedInput {
  indexing_checked?: number | null;
  indexing_skipped?: number | null;
  indexing_total?: number | null;
  indexing_issues?: unknown[] | null;
  indexed_pages?: number | null;
  submitted_pages?: number | null;
  sitemaps?: unknown[] | null;
  sitemaps_fetched_at?: string | null;
}

export interface IndexedHeadline {
  value: string;
  sub: string;
}

export interface IndexedCount {
  /** Sitemap URLs known to be indexed: exact on a complete run, a lower bound on a partial one. */
  indexed: number;
  checked: number;
  /** Inspections that failed or ran out of time this run (0 when the snapshot does not say). */
  skipped: number;
  total: number;
  /** Not every sitemap URL got a verdict this run (rotation above the cap, or skipped requests). */
  partial: boolean;
}

const fmt = (n: number) => n.toLocaleString();

/**
 * The indexed count behind the headline, for views that word it themselves (the Dutch
 * /dashboards/hvl). Null without a URL Inspection snapshot. A URL that was never inspected
 * never counts as indexed.
 */
export function indexedCount(g: IndexedInput | null | undefined): IndexedCount | null {
  const checked = g?.indexing_checked ?? null;
  const total = g?.indexing_total ?? null;
  if (checked == null || total == null || total === 0) return null;
  const flagged = g?.indexing_issues?.length ?? 0;
  const skipped = g?.indexing_skipped ?? 0;
  if (checked >= total) {
    // Every sitemap URL got a verdict this run, so every flagged URL is one of them.
    return { indexed: Math.max(0, total - flagged), checked, skipped, total, partial: false };
  }
  // Partial run: flagged may include issues carried over for URLs not re-checked,
  // so checked - flagged is a lower bound on what is indexed.
  return { indexed: Math.max(0, checked - flagged), checked, skipped, total, partial: true };
}

export function indexedHeadline(g: IndexedInput | null | undefined): IndexedHeadline {
  let secondary: string;
  if (g?.indexed_pages != null) {
    secondary = `sitemap-reported ${fmt(g.indexed_pages)}${g.submitted_pages ? ` of ${fmt(g.submitted_pages)}` : ""}`;
  } else if (g?.sitemaps_fetched_at && (g.sitemaps?.length ?? 0) === 0) {
    secondary = "no sitemap submitted in Search Console";
  } else {
    secondary = "sitemap count unavailable";
  }

  const c = indexedCount(g);
  if (!c) {
    // No URL Inspection snapshot yet: fall back to the sitemap figure, labelled as such.
    return {
      value: g?.indexed_pages != null ? fmt(g.indexed_pages) : "–",
      sub: g?.indexed_pages != null ? `${secondary} (approximate)` : secondary,
    };
  }

  if (!c.partial) return { value: `${fmt(c.indexed)} / ${fmt(c.total)}`, sub: `URL Inspection · ${secondary}` };
  return {
    value: `≥ ${fmt(c.indexed)} / ${fmt(c.total)}`,
    sub: `URL Inspection, ${fmt(c.checked)} of ${fmt(c.total)} checked · ${secondary}`,
  };
}
