// AnalyticsMode — stub for Phase 1.
// Real GSC + blog_posts metrics added in Phase 7.
export default function AnalyticsMode() {
  return (
    <main className="main manage-main">
      <h1 className="manage-h">Analytics<em>.</em></h1>
      <div className="manage-stats">
        <strong>Last 7 days</strong>
        <span className="sep">·</span>
        <span style={{ color: "var(--ink-3)" }}>Real data in Phase 7</span>
      </div>

      <div className="analytics-grid">
        {[
          { k: "Sessions / 7d", v: "–" },
          { k: "Avg. position", v: "–" },
          { k: "Indexed pages", v: "–" },
          { k: "AI tokens / mo", v: "–" },
        ].map((m) => (
          <div key={m.k} className="metric-cell">
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
            <div className="delta flat">pending</div>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <h3>Sessions · last 30 days</h3>
        <svg className="chart-svg" viewBox="0 0 600 220" preserveAspectRatio="none">
          <g stroke="var(--line)" strokeWidth="1">
            <line x1="0" y1="40" x2="600" y2="40"/>
            <line x1="0" y1="100" x2="600" y2="100"/>
            <line x1="0" y1="160" x2="600" y2="160"/>
          </g>
          <text x="300" y="120" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--ink-3)" textDecoration="uppercase">
            GSC data — Phase 7
          </text>
        </svg>
      </div>
    </main>
  );
}
