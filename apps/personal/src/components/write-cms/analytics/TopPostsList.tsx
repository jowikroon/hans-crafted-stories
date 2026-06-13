import type { TopPost } from "./useAnalyticsLive";

type Sort = "sessions" | "trend";

export default function TopPostsList({ posts, sort, onSortChange }: {
  posts: TopPost[];
  sort: Sort;
  onSortChange: (s: Sort) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="chart-card">
        <h3><span>Top posts</span><em>no data yet</em></h3>
        <p className="chart-empty-hint">Posts will appear here once GA4 reports per-page sessions.</p>
      </div>
    );
  }
  const sorted = [...posts].sort((a, b) => (sort === "trend" ? b.trend - a.trend : b.sessions - a.sessions));
  return (
    <div className="chart-card">
      <h3>
        <span>Top posts</span>
        <em>
          <button
            className={`top-sort${sort === "sessions" ? " on" : ""}`}
            onClick={() => onSortChange("sessions")}
          >sessions</button>
          <span className="sep">·</span>
          <button
            className={`top-sort${sort === "trend" ? " on" : ""}`}
            onClick={() => onSortChange("trend")}
          >trend</button>
        </em>
      </h3>
      <ol className="top-list">
        {sorted.slice(0, 6).map((p, i) => (
          <li key={p.postId} className="top-row">
            <span className="rank">{i + 1}</span>
            <span className="title" title={p.title}>{p.title}</span>
            <span className="val">{p.sessions.toLocaleString()}</span>
            <span className={`trend ${p.trend > 5 ? "up" : p.trend < -5 ? "down" : "flat"}`}>
              {p.trend > 0 ? "+" : ""}{p.trend}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
