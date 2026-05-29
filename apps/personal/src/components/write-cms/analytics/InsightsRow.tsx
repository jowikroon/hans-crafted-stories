import type { Insight } from "./useAnalyticsLive";

const KIND_LABEL: Record<Insight["kind"], string> = {
  up: "what's working",
  warn: "needs attention",
  idea: "next play",
};

export default function InsightsRow({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="insights-row insights-row--empty">
        <p className="chart-empty-hint">
          Once a connector reports data, Haiku 4.5 writes a 3-card summary here.
        </p>
      </div>
    );
  }
  return (
    <div className="insights-row">
      {insights.map((ins) => (
        <article key={ins.id} className={`insight-card insight-${ins.kind}`}>
          <span className="ic-tag">{KIND_LABEL[ins.kind]}</span>
          <h4>{ins.headline}<em>.</em></h4>
          {ins.body && <p>{ins.body}</p>}
        </article>
      ))}
    </div>
  );
}
