// The "Indexed pages" tile on the CMS analytics view.
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

const fmt = (n: number) => n.toLocaleString();

export function indexedHeadline(g: IndexedInput | null | undefined): IndexedHeadline {
  const checked = g?.indexing_checked ?? null;
  const total = g?.indexing_total ?? null;
  const flagged = g?.indexing_issues?.length ?? 0;

  let secondary: string;
  if (g?.indexed_pages != null) {
    secondary = `sitemap-reported ${fmt(g.indexed_pages)}${g.submitted_pages ? ` of ${fmt(g.submitted_pages)}` : ""}`;
  } else if (g?.sitemaps_fetched_at && (g.sitemaps?.length ?? 0) === 0) {
    secondary = "no sitemap submitted in Search Console";
  } else {
    secondary = "sitemap count unavailable";
  }

  if (checked == null || total == null || total === 0) {
    // No URL Inspection snapshot yet: fall back to the sitemap figure, labelled as such.
    return {
      value: g?.indexed_pages != null ? fmt(g.indexed_pages) : "–",
      sub: g?.indexed_pages != null ? `${secondary} (approximate)` : secondary,
    };
  }

  if (checked >= total) {
    // Every sitemap URL got a verdict this run, so every flagged URL is one of them.
    const indexed = Math.max(0, total - flagged);
    return { value: `${fmt(indexed)} / ${fmt(total)}`, sub: `URL Inspection · ${secondary}` };
  }

  // Partial run: flagged may include issues carried over for URLs not re-checked,
  // so checked - flagged is a lower bound on what is indexed.
  const atLeast = Math.max(0, checked - flagged);
  return {
    value: `≥ ${fmt(atLeast)} / ${fmt(total)}`,
    sub: `URL Inspection, ${fmt(checked)} of ${fmt(total)} checked · ${secondary}`,
  };
}
