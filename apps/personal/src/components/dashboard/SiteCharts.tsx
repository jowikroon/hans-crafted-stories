import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Two validated series slots (dataviz reference palette, light surface: CVD dE 9.2, both >= 3:1).
export const SERIES_1 = "#2a78d6";
export const SERIES_2 = "#eb6834";
const INK_2 = "#7E7A6F";
const GRID = "#EFEADB";
const MARKER = "#15140F";

export interface Marker { d: string; label: string; title: string }
export interface SeriesDef { key: string; name: string; color: string; dashed?: boolean }

const shortDay = (s: string) => {
  const [, m, d] = s.split("-");
  return `${Number(d)}/${Number(m)}`;
};
const nf = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

/**
 * Daily trend with change markers. One y-axis; at most two series of the same measure
 * (never two scales: different measures get their own chart).
 */
export function TrendChart({ title, subtitle, data, series, markers, height = 190, invert }: {
  title: string; subtitle?: string; data: Record<string, unknown>[]; series: SeriesDef[]; markers: Marker[]; height?: number; invert?: boolean;
}) {
  const hasData = data.some((r) => series.some((s) => typeof r[s.key] === "number"));
  const inRange = markers.filter((m) => data.some((r) => r.d === m.d));
  return (
    <figure className="rounded-xl border border-[#E5DFCE] bg-white p-4">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-[#15140F]">{title}</span>
        {series.length > 1 && (
          <span className="flex gap-3 text-[11px] text-[#4B4842]">
            {series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <svg width="16" height="8" aria-hidden><line x1="0" y1="4" x2="16" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} /></svg>
                {s.name}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      {subtitle && <p className="-mt-1 mb-2 text-[11px] text-[#7E7A6F]">{subtitle}</p>}
      {hasData ? (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="d" tickFormatter={shortDay} tick={{ fontSize: 10, fill: INK_2 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: INK_2 }} tickLine={false} axisLine={false} allowDecimals={false} reversed={invert} width={44} />
              <Tooltip
                cursor={{ stroke: "#C9C2AE", strokeWidth: 1 }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5DFCE", boxShadow: "0 4px 12px rgba(0,0,0,.06)" }}
                labelFormatter={(d: string) => {
                  const m = inRange.filter((x) => x.d === d);
                  return `${shortDay(d)}${m.length ? `  |  live: ${m.map((x) => x.label).join(", ")}` : ""}`;
                }}
                formatter={(v: number, name: string) => [typeof v === "number" ? nf(v) : "geen data", name]}
              />
              {inRange.map((m) => (
                <ReferenceLine key={`${m.d}-${m.label}`} x={m.d} stroke={MARKER} strokeOpacity={0.35} strokeDasharray="3 3"
                  label={{ value: m.label, position: "insideTopLeft", fontSize: 9, fill: INK_2 }} />
              ))}
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2}
                  strokeDasharray={s.dashed ? "4 3" : undefined} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-xs text-[#7E7A6F]">Nog geen data in deze periode.</p>
      )}
    </figure>
  );
}

/** Funnel as horizontal bars on one scale, with step conversion between bars. */
export function Funnel({ steps }: { steps: { label: string; n: number; hint?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.n));
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].n : null;
        const conv = prev ? Math.round((1000 * s.n) / prev) / 10 : null;
        return (
          <li key={s.label} title={s.hint}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-[#15140F]">{s.label}</span>
              <span className="tabular-nums text-[#4B4842]">
                <strong className="font-semibold text-[#15140F]">{s.n.toLocaleString("nl-NL")}</strong>
                {conv != null && <span className="ml-2 text-[#7E7A6F]">{conv.toLocaleString("nl-NL")}% van vorige stap</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F3EFE3]">
              <div className="h-2.5 rounded-full" style={{ width: `${Math.max(s.n > 0 ? 2 : 0, (100 * s.n) / max)}%`, background: SERIES_1 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
