import type { SearchTerm } from "./useAnalyticsLive";

export default function SearchTermsList({ terms }: { terms: SearchTerm[] }) {
  if (terms.length === 0) {
    return (
      <div className="chart-card">
        <h3><span>Search terms</span><em>no data yet</em></h3>
        <p className="chart-empty-hint">Top queries appear after Search Console syncs.</p>
      </div>
    );
  }
  return (
    <div className="chart-card">
      <h3>
        <span>Search terms</span>
        <em>{terms.length} of top 10</em>
      </h3>
      <table className="kw-table" role="table">
        <thead>
          <tr>
            <th>Query</th>
            <th className="num">Impr.</th>
            <th className="num">Clicks</th>
            <th className="num">CTR</th>
            <th className="num">Pos.</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((t) => (
            <tr key={t.query} className="kw-row">
              <td className="kw-q" title={t.query}>{t.query}</td>
              <td className="num">{t.impressions.toLocaleString()}</td>
              <td className="num">{t.clicks.toLocaleString()}</td>
              <td className="num">{(t.ctr * 100).toFixed(1)}%</td>
              <td className="num">{t.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
