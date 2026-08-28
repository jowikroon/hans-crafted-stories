import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HoverChart, InsightCards, DrilldownDrawer, type DrillPost } from "./AnalyticsExtras";

interface PostMetric {
  id: string;
  title: string;
  status: string;
  published: boolean;
  word_count: number | null;
  voice_match_score: number | null;
  completeness_score: number | null;
  seo_score: number | null;
  category: string;
  updated_at: string;
}

interface SeriesPoint { date: string; value: number; }
interface TopPage { path: string; title: string; sessions: number; }
interface Query { query: string; clicks: number; impressions: number; ctr: number | null; position: number | null; }
interface Sitemap { path: string; is_index?: boolean; submitted: number; indexed: number | null; warnings: number; errors: number; last_downloaded: string | null; }
interface IndexingIssue { url: string; verdict: string; coverage_state: string | null; last_crawl: string | null; }
interface Dashboard {
  configured?: boolean;
  generated_at?: string;
  fetched_at?: string;
  ga4?: { sessions_30d: number; sessions_prev_30d: number; sessions_change_pct: number | null; series: SeriesPoint[]; top_pages: TopPage[] };
  gsc?: {
    site: string; clicks: number; impressions: number; ctr: number | null; position: number | null;
    pages_with_traffic: number; queries: Query[];
    indexed_pages?: number | null; submitted_pages?: number | null; sitemaps?: Sitemap[];
    sitemap_warnings?: number; sitemap_errors?: number;
    indexing_checked?: number; indexing_skipped?: number; indexing_issues?: IndexingIssue[];
  };
  errors?: { ga4?: string; gsc?: string; sitemaps?: string; indexing?: string };
}

export default function AnalyticsMode() {
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drill, setDrill] = useState<DrillPost | null>(null);
  const [kwSort, setKwSort] = useState<"impressions" | "ctr" | "position">("impressions");

  // Content metrics from blog_posts (always available; kept as the editorial layer).
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, status, published, word_count, voice_match_score, completeness_score, seo_score, category, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as PostMetric[]);
        setLoading(false);
      });
  }, []);

  // Live traffic from the cache table (written by the analytics-ga4-gsc edge function).
  const loadDash = useCallback(async () => {
    setDashLoading(true);
    const { data } = await supabase
      .from("hvl_analytics_cache")
      .select("data, fetched_at")
      .eq("key", "dashboard")
      .maybeSingle();
    if (data?.data) setDash({ ...(data.data as Dashboard), fetched_at: data.fetched_at as string });
    else setDash(null);
    setDashLoading(false);
  }, []);

  useEffect(() => { loadDash(); }, [loadDash]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase.functions.invoke("analytics-ga4-gsc", { body: { force: true } });
      if (data) setDash(data as Dashboard);
      else await loadDash();
    } catch {
      // ignore — keep last good data
    } finally {
      setRefreshing(false);
    }
  }, [loadDash]);

  const stats = useMemo(() => {
    const total = posts.length;
    const live = posts.filter((p) => p.status === "published" || p.published).length;
    const drafts = posts.filter((p) => !p.published && p.status !== "published" && p.status !== "scheduled").length;
    const scheduled = posts.filter((p) => p.status === "scheduled").length;
    const totalWords = posts.reduce((sum, p) => sum + (p.word_count ?? 0), 0);
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0;
    const avg = (key: keyof PostMetric) => {
      const w = posts.filter((p) => (p[key] as number) != null && (p[key] as number) > 0);
      return w.length > 0 ? Math.round(w.reduce((s, p) => s + (p[key] as number), 0) / w.length) : 0;
    };
    const categories: Record<string, number> = {};
    for (const p of posts) categories[p.category] = (categories[p.category] ?? 0) + 1;
    const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const weekAgo = Date.now() - 7 * 86400000;
    const recentPosts = posts.filter((p) => new Date(p.updated_at).getTime() > weekAgo);
    return { total, live, drafts, scheduled, totalWords, avgWords, avgVoice: avg("voice_match_score"), avgCompleteness: avg("completeness_score"), avgSeo: avg("seo_score"), topCategories, recentPosts };
  }, [posts]);

  const ga4 = dash?.ga4;
  const gsc = dash?.gsc;
  const connected = !!(dash && dash.configured !== false && (ga4 || gsc));
  const num = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString());

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Analytics<em>.</em></h1>
      <div className="manage-stats">
        {connected ? (
          <>
            <span style={{ color: "var(--accent, #2f7d4f)" }}>● GA4</span>
            <span className="sep">·</span>
            <span style={{ color: "var(--accent, #2f7d4f)" }}>● Search Console</span>
            {dash?.fetched_at && (<><span className="sep">·</span><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>synced {new Date(dash.fetched_at).toLocaleString()}</span></>)}
          </>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            live data not connected, set GOOGLE_SA_KEY secret, then refresh
          </span>
        )}
        <span className="sep">·</span>
        <button onClick={refresh} disabled={refreshing} style={{ fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer", background: "none", border: "1px solid var(--bg-1)", borderRadius: 4, padding: "2px 8px" }}>
          {refreshing ? "refreshing…" : "↻ refresh"}
        </button>
        {(dashLoading || loading) && (<><span className="sep">·</span><span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading…</span></>)}
      </div>

      {/* Live traffic hero */}
      <div className="analytics-grid">
        {[
          { k: "Sessions · 30d", v: num(ga4?.sessions_30d), sub: ga4?.sessions_change_pct != null ? `${ga4.sessions_change_pct > 0 ? "+" : ""}${ga4.sessions_change_pct}% vs prev` : undefined },
          { k: "Avg. position", v: gsc?.position != null ? gsc.position.toFixed(1) : "–", sub: "Search Console" },
          { k: "Avg. CTR", v: gsc?.ctr != null ? `${gsc.ctr}%` : "–", sub: "Search Console" },
          { k: "Clicks · 28d", v: num(gsc?.clicks), sub: gsc?.impressions != null ? `${num(gsc.impressions)} impr.` : undefined },
          // Provenance matters here: the only site-wide indexed count Google
          // exposes by API is the sitemap-reported one, which is deprecated
          // and approximate. Say where it comes from rather than presenting
          // it as an exact figure.
          { k: "Indexed pages", v: num(gsc?.indexed_pages), sub: gsc?.submitted_pages ? `of ${num(gsc.submitted_pages)} in sitemaps` : "Search Console · sitemap-reported" },
        ].map((m) => (
          <div key={m.k} className="metric-cell">
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
            {m.sub && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Sessions trend */}
      {ga4?.series && ga4.series.length > 1 && (
        <div className="chart-card">
          <h3>Sessions · last 30 days <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>from Google Analytics 4</span></h3>
          <HoverChart series={ga4.series} />
        </div>
      )}

      {/* Top pages by sessions */}
      {ga4?.top_pages && ga4.top_pages.length > 0 && (
        <div className="chart-card">
          <h3>Top pages · sessions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "var(--s-3) 0" }}>
            {ga4.top_pages.map((p) => (
              <div key={p.path} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--bg-1)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }} title={p.path}>{p.title || p.path}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)" }}>{p.sessions.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search terms (sorteerbaar, design contract D4) */}
      {gsc?.queries && gsc.queries.length > 0 && (
        <div className="chart-card">
          <h3>Search terms <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>from Search Console · last 28 days</span></h3>
          <div className="an-kw-sortbar">
            {(["impressions", "ctr", "position"] as const).map((k) => (
              <button key={k} className={`an-kw-sort${kwSort === k ? " on" : ""}`} onClick={() => setKwSort(k)}>
                {k === "impressions" ? "Impressies" : k === "ctr" ? "CTR" : "Positie"}{kwSort === k ? " ▾" : ""}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "var(--s-3) 0" }}>
            {[...gsc.queries].sort((a, b) => {
              if (kwSort === "position") return (a.position ?? 999) - (b.position ?? 999);
              if (kwSort === "ctr") return (b.ctr ?? 0) - (a.ctr ?? 0);
              return (b.impressions ?? 0) - (a.impressions ?? 0);
            }).map((q) => (
              <div key={q.query} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--bg-1)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "52%" }}>{q.query}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>
                  {(q.impressions ?? 0).toLocaleString()} impr · {q.ctr != null ? `${q.ctr}%` : "–"} · #{q.position != null ? Math.round(q.position) : "–"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI insight cards (design contract D1) */}
      <InsightCards
        statsSummary={[
          `${stats.total} artikelen (${stats.live} live, ${stats.drafts} drafts)`,
          ga4 ? `GA4 sessions 30d: ${ga4.sessions_30d} (${ga4.sessions_change_pct != null ? (ga4.sessions_change_pct >= 0 ? "+" : "") + ga4.sessions_change_pct + "%" : "—"})` : "GA4: niet verbonden",
          ga4?.top_pages?.[0] ? `Top page: ${ga4.top_pages[0].title || ga4.top_pages[0].path} (${ga4.top_pages[0].sessions} sessions)` : "",
          gsc ? `GSC: ${gsc.impressions} impressies, CTR ${gsc.ctr ?? "—"}%, gem. positie ${gsc.position != null ? Math.round(gsc.position) : "—"}` : "GSC: niet verbonden",
          gsc?.queries?.[0] ? `Top query: ${gsc.queries[0].query} (pos ${gsc.queries[0].position != null ? Math.round(gsc.queries[0].position) : "—"})` : "",
          `Categorieen: ${stats.topCategories.map(([c, n]) => `${c} ${n}`).join(", ")}`,
        ].filter(Boolean).join(". ")}
      />

      {/* Per-post drilldown list (design contract D3) */}
      {posts.length > 0 && (
        <div className="chart-card">
          <h3>Per artikel <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>klik voor drilldown</span></h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "var(--s-3) 0" }}>
            {posts.slice(0, 12).map((p) => (
              <button key={p.id} className="an-post-row" onClick={() => setDrill(p as DrillPost)}>
                <span className="an-post-title" title={p.title}>{p.title}</span>
                <span className="an-post-meta">{(p.word_count ?? 0).toLocaleString()}w · SEO {p.seo_score ?? "–"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indexing issues, surfaced automatically from URL Inspection sampling +
          sitemap health (HAN-93) */}
      {/* Each operand must be a boolean: `a != null || 0 || 0` evaluates to the
          last operand (0), and `0 && <jsx>` renders a literal "0" text node. */}
      {(gsc?.indexing_checked != null || !!gsc?.sitemap_warnings || !!gsc?.sitemap_errors) && (
        <div className="chart-card">
          <h3>
            Indexing issues{" "}
            {gsc.indexing_checked != null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>
                {gsc.indexing_issues?.length ? `${gsc.indexing_issues.length} flagged` : "none flagged"} · {gsc.indexing_checked} pages checked
                {/* These are failed inspection REQUESTS (quota, auth, 5xx,
                    network) — they say nothing about whether the page is
                    reachable, so don't report them as a page-health problem. */}
                {gsc.indexing_skipped ? ` · ${gsc.indexing_skipped} not checked` : ""}
              </span>
            )}
          </h3>
          {(gsc.sitemap_errors || gsc.sitemap_warnings) ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--warn, #b45309)", padding: "4px 0" }}>
              Sitemap: {gsc.sitemap_errors ?? 0} errors, {gsc.sitemap_warnings ?? 0} warnings reported by Search Console.
            </div>
          ) : null}
          {gsc.indexing_issues && gsc.indexing_issues.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "var(--s-3) 0" }}>
              {gsc.indexing_issues.map((iss) => (
                <div key={iss.url} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--bg-1)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }} title={iss.url}>{iss.url}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>{iss.coverage_state ?? iss.verdict}</span>
                </div>
              ))}
            </div>
          ) : gsc.indexing_checked != null ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", padding: "var(--s-3) 0" }}>
              {gsc.indexing_skipped
                ? `All ${gsc.indexing_checked} successfully checked pages are indexed (${gsc.indexing_skipped} could not be checked).`
                : "All sampled pages are indexed."}
            </div>
          ) : null}
        </div>
      )}

      {dash?.errors && (dash.errors.ga4 || dash.errors.gsc || dash.errors.sitemaps || dash.errors.indexing) && (
        <div className="chart-card" style={{ borderColor: "var(--bg-1)" }}>
          <h3>Connection notes</h3>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", whiteSpace: "pre-wrap" }}>
            {dash.errors.ga4 && <div>GA4: {dash.errors.ga4}</div>}
            {dash.errors.gsc && <div>GSC: {dash.errors.gsc}</div>}
            {dash.errors.sitemaps && <div>Sitemaps: {dash.errors.sitemaps}</div>}
            {dash.errors.indexing && <div>Indexing: {dash.errors.indexing}</div>}
          </div>
        </div>
      )}

      {/* Editorial layer (always available) */}
      <div className="manage-stats" style={{ marginTop: "var(--s-5, 24px)" }}>
        <strong>{stats.total}</strong> articles<span className="sep">·</span><strong>{stats.totalWords.toLocaleString()}</strong> total words
      </div>
      <div className="analytics-grid">
        {[
          { k: "Total articles", v: String(stats.total) },
          { k: "Live", v: String(stats.live) },
          { k: "Drafts", v: String(stats.drafts) },
          { k: "Scheduled", v: String(stats.scheduled) },
          { k: "Avg. words", v: stats.avgWords.toLocaleString() },
          { k: "Total words", v: stats.totalWords.toLocaleString() },
          { k: "Avg. voice score", v: stats.avgVoice > 0 ? `${stats.avgVoice}/100` : "–" },
          { k: "Avg. completeness", v: stats.avgCompleteness > 0 ? `${stats.avgCompleteness}/100` : "–" },
          { k: "Avg. SEO score", v: stats.avgSeo > 0 ? `${stats.avgSeo}/100` : "–" },
          { k: "Updated this week", v: String(stats.recentPosts.length) },
        ].map((m) => (
          <div key={m.k} className="metric-cell">
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      {stats.topCategories.length > 0 && (
        <div className="chart-card">
          <h3>Categories</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "var(--s-3) 0" }}>
            {stats.topCategories.map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</span>
                <div style={{ flex: 1, height: 6, background: "var(--bg-1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / stats.total) * 100)}%`, height: "100%", background: "var(--ink-0)", borderRadius: 3, minWidth: 4 }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-2)", minWidth: 24, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    <DrilldownDrawer post={drill} onClose={() => setDrill(null)} />
    </main>
  );
}
