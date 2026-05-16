import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export default function AnalyticsMode() {
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const total = posts.length;
    const live = posts.filter((p) => p.status === "published" || p.published).length;
    const drafts = posts.filter((p) => !p.published && p.status !== "published" && p.status !== "scheduled").length;
    const scheduled = posts.filter((p) => p.status === "scheduled").length;
    const totalWords = posts.reduce((sum, p) => sum + (p.word_count ?? 0), 0);
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0;

    const withVoice = posts.filter((p) => p.voice_match_score != null && p.voice_match_score > 0);
    const avgVoice = withVoice.length > 0
      ? Math.round(withVoice.reduce((s, p) => s + (p.voice_match_score ?? 0), 0) / withVoice.length)
      : 0;

    const withCompleteness = posts.filter((p) => p.completeness_score != null && p.completeness_score > 0);
    const avgCompleteness = withCompleteness.length > 0
      ? Math.round(withCompleteness.reduce((s, p) => s + (p.completeness_score ?? 0), 0) / withCompleteness.length)
      : 0;

    const withSeo = posts.filter((p) => p.seo_score != null && p.seo_score > 0);
    const avgSeo = withSeo.length > 0
      ? Math.round(withSeo.reduce((s, p) => s + (p.seo_score ?? 0), 0) / withSeo.length)
      : 0;

    // Category breakdown
    const categories: Record<string, number> = {};
    for (const p of posts) {
      categories[p.category] = (categories[p.category] ?? 0) + 1;
    }
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Recent activity (last 7 days)
    const weekAgo = Date.now() - 7 * 86400000;
    const recentPosts = posts.filter((p) => new Date(p.updated_at).getTime() > weekAgo);

    return { total, live, drafts, scheduled, totalWords, avgWords, avgVoice, avgCompleteness, avgSeo, topCategories, recentPosts };
  }, [posts]);

  return (
    <main className="main manage-main">
      <h1 className="manage-h">Analytics<em>.</em></h1>
      <div className="manage-stats">
        <strong>{stats.total}</strong> articles
        <span className="sep">·</span>
        <strong>{stats.totalWords.toLocaleString()}</strong> total words
        {loading && (
          <>
            <span className="sep">·</span>
            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>loading...</span>
          </>
        )}
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

      {/* Category breakdown */}
      {stats.topCategories.length > 0 && (
        <div className="chart-card">
          <h3>Categories</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "var(--s-3) 0" }}>
            {stats.topCategories.map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cat}
                </span>
                <div style={{ flex: 1, height: 6, background: "var(--bg-1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.round((count / stats.total) * 100)}%`,
                    height: "100%",
                    background: "var(--ink-0)",
                    borderRadius: 3,
                    minWidth: 4,
                  }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-2)", minWidth: 24, textAlign: "right" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentPosts.length > 0 && (
        <div className="chart-card">
          <h3>Updated this week</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "var(--s-3) 0" }}>
            {stats.recentPosts.slice(0, 10).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--bg-1)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                  {p.title || "(Untitled)"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>
                  {p.word_count?.toLocaleString() ?? "–"} words
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GSC placeholder */}
      <div className="chart-card">
        <h3>Search Console</h3>
        <svg className="chart-svg" viewBox="0 0 600 120" preserveAspectRatio="none">
          <text x="300" y="65" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-3)">
            GSC / Ahrefs integration — connect via n8n or MCP
          </text>
        </svg>
      </div>
    </main>
  );
}
