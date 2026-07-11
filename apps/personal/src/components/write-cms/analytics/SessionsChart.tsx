// SessionsChart — Phase E inline SVG area chart for sessions over the period.
//
// No external chart lib. Hand-drawn SVG using ./useAnalyticsLive's SessionsPoint[].
// X axis = days, Y axis = sessions. Renders an area path + line + endpoint dot.
// Empty state: a placeholder strip.

import type { SessionsPoint } from "./useAnalyticsLive";

interface Props {
  points: SessionsPoint[];
  height?: number;
  label?: string;
}

function ymd(s: string): string {
  // "2026-05-26" → "26 May"
  const d = new Date(s + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function SessionsChart({ points, height = 160, label = "Sessions" }: Props) {
  if (points.length === 0) {
    return (
      <div className="chart-card chart-card--empty" style={{ height: height + 60 }}>
        <h3>
          <span>{label}</span>
          <em>no data yet</em>
        </h3>
        <p className="chart-empty-hint">Connect GA4 to start seeing sessions here.</p>
      </div>
    );
  }

  const padL = 38, padR = 16, padT = 14, padB = 22;
  const w = 600;
  const h = height;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const max = Math.max(1, ...points.map((p) => p.sessions));
  const stepX = innerW / Math.max(1, points.length - 1);
  const xFor = (i: number) => padL + stepX * i;
  const yFor = (v: number) => padT + innerH - (v / max) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.sessions).toFixed(1)}`)
    .join(" ");
  const areaPath =
    linePath +
    ` L${xFor(points.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)}` +
    ` L${xFor(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((max * i) / yTicks));
  const totalSessions = points.reduce((s, p) => s + p.sessions, 0);

  return (
    <div className="chart-card">
      <h3>
        <span>{label}</span>
        <em>{totalSessions.toLocaleString()} total · peak {max.toLocaleString()}</em>
      </h3>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="chart-svg"
        role="img"
        aria-label={`Sessions chart for ${points.length} days, total ${totalSessions}`}
      >
        {/* gridlines + y ticks */}
        {ticks.map((v, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={w - padR}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeDasharray="2 4"
            />
            <text
              x={padL - 6}
              y={yFor(v) + 3}
              textAnchor="end"
              fontFamily="var(--font-mono, monospace)"
              fontSize="9"
              fill="currentColor"
              opacity="0.6"
            >
              {v.toLocaleString()}
            </text>
          </g>
        ))}
        {/* area */}
        <path d={areaPath} fill="var(--accent)" opacity="0.18" />
        {/* line */}
        <path d={linePath} fill="none" stroke="var(--ink-0)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* endpoint dot */}
        {points.length > 0 && (
          <circle
            cx={xFor(points.length - 1)}
            cy={yFor(points[points.length - 1].sessions)}
            r="3.5"
            fill="var(--accent)"
            stroke="var(--ink-0)"
            strokeWidth="1.2"
          />
        )}
        {/* x labels, first, mid, last */}
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) =>
          points[i] ? (
            <text
              key={i}
              x={xFor(i)}
              y={h - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              fontFamily="var(--font-mono, monospace)"
              fontSize="9"
              fill="currentColor"
              opacity="0.6"
            >
              {ymd(points[i].date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
