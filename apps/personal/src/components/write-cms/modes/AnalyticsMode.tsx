import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsLive, type AnalyticsRange } from "../analytics/useAnalyticsLive";
import ConnectBar from "../analytics/ConnectBar";
import SessionsChart from "../analytics/SessionsChart";
import TopPostsList from "../analytics/TopPostsList";
import SearchTermsList from "../analytics/SearchTermsList";
import InsightsRow from "../analytics/InsightsRow";

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

const RANGES: { id: AnalyticsRange; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
];

function RangeTabs({ value, onChange }: { value: AnalyticsRange; onChange: (r: AnalyticsRange) => void }) {
  return (
    <div className="range-tabs" role="tablist" aria-label="Range">
      {RANGES.map((r) => (
        <button
          key={r.id}
          className={value === r.id ? "on" : ""}
          onClick={() => onChange(r.id)}
          role="tab"
          aria-selected={value === r.id}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function configureHint(source: "ga4" | "gsc") {
  const where = source === "ga4" ? "Google Analytics" : "Search Console";
  const url = source === "ga4"
    ? "https://analytics.google.com"
    : "https://search.google.com/search-console";
  // eslint-disable-next-line no-alert
  alert(
    `${where} is not connected yet.\n\nTo enable:\n` +
    `1. Open ${url} and grant access to the n8n service account.\n` +
    `2. Run the analytics sync workflow (writes to public.analytics_daily).\n` +
    `3. Click Refresh.\n\nUntil then the aggregate panel below is the source.`
  );
}

export default function AnalyticsMode() {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const live = useAnalyticsLive(range);
  const [topSort, setTopSort] = useState<"sessions" | "trend">("sessions");

  // Aggregate fallback (existing behaviour)
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [loadingAggregate, setLoadingAggregate] = useState(true);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, status, published, word_count, voice_match_score, completeness_score, seo_score, category, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as PostMetric[]);
        setLoadingAggregate(false);
      });
  }, []);

  const aggregate = useMemo(() => {
    const total = posts.length;
    const liveCount = posts.filter((p) => p.status === "published" || p.published).length;
    const drafts = posts.filter((p) => !p.published && p.status !== "published" && p.status !== "scheduled").length;
    const scheduled = posts.filter((p) => p.status === "scheduled").length;
    const totalWords = posts.reduce((sum, p) => sum + (p.word_count ?? 0), 0);
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0;
    const withVoice = posts.filter((p) => p.voice_match_score != null && p.voice_match_score > 0);
    const avgVoice = withVoice.length > 0 ? Math.round(withVoice.reduce((s, p) => s + (p.voice_match_score ?? 0), 0) / withVoice.length) : 0;
    const withCompleteness = posts.filter((p) => p.completeness_score != null && p.completeness_score > 0);
    const avgCompleteness = withCompleteness.length > 0 ? Math.round(withCompleteness.reduce((s, p) => s + (p.completeness_score ?? 0), 0) / withCompleteness.length) : 0;
    const withSeo = posts.filter((p) => p.seo_score != null && p.seo_score > 0);
    const avgSeo = withSeo.length > 0 ? Math.round(withSeo.reduce((s, p) => s + (p.seo_score ?? 0), 0) / withSeo.length) : 0;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const recentPosts = posts.filter((p) => new Date(p.updated_at).getTime() > weekAgo);
    return { total, liveCount, drafts, scheduled, totalWords, avgWords, avgVoice, avgCompleteness, avgSeo, recentPosts };
  }, [posts]);

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Analytics<em>.</em></h1>
      <div className="manage-stats">
        <strong>{aggregate.total}</strong> articles
        <span className="sep">·</span>
        <strong>{aggregate.totalWords.toLocaleString()}</strong> total words
        <span className="sep">·</span>
        <RangeTabs value={range} onChange={setRange} />
        {(live.loading || loadingAggregate) && (
          <>
            <span className="sep">·</span>
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading…</span>
          </>
        )}
      </div>

      <ConnectBar
        connectors={live.connectors}
        onConfigure={configureHint}
        onRefresh={live.refresh}
        refreshing={live.loading}
      />

      <SessionsChart points={live.sessions} label={`Sessions — ${range}`} />

      <div className="analytics-two-col">
        <TopPostsList posts={live.topPosts} sort={topSort} onSortChange={setTopSort} />
        <SearchTermsList terms={live.searchTerms} />
      </div>

      <InsightsRow insights={live.insights} />

      {/* ──────────── Aggregate fallback panel (always rendered) ──────────── */}
      <h2 className="rail-h" style={{ marginTop: 28 }}>Aggregate<em>.</em></h2>
      <div className="analytics-grid">
        {[
          { k: "Total articles", v: String(aggregate.total) },
          { k: "Live", v: String(aggregate.liveCount) },
          { k: "Drafts", v: String(aggregate.drafts) },
          { k: "Scheduled", v: String(aggregate.scheduled) },
          { k: "Avg. words", v: aggregate.avgWords.toLocaleString() },
          { k: "Total words", v: aggregate.totalWords.toLocaleString() },
          { k: "Avg. voice score", v: aggregate.avgVoice > 0 ? `${aggregate.avgVoice}/100` : "–" },
          { k: "Avg. completeness", v: aggregate.avgCompleteness > 0 ? `${aggregate.avgCompleteness}/100` : "–" },
          { k: "Avg. SEO score", v: aggregate.avgSeo > 0 ? `${aggregate.avgSeo}/100` : "–" },
          { k: "Updated this week", v: String(aggregate.recentPosts.length) },
        ].map((m) => (
          <div key={m.k} className="metric-cell">
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
