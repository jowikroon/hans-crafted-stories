import { deltaPct } from "@/lib/dashboardPeriod";

interface Props {
  label: string;
  value: string;
  current?: number | null;
  previous?: number | null;
  compareLabel?: string | null;
  sub?: string;
  /** Lager is beter (bijv. bouncepercentage, gemiddelde positie). */
  invert?: boolean;
}

/**
 * KPI met delta. Zonder vergelijkbasis wordt er GEEN percentage getoond —
 * een percentage zonder zichtbare basis is misleiding, geen informatie.
 */
export default function DashboardKpi({ label, value, current, previous, compareLabel, sub, invert }: Props) {
  const pct = deltaPct(current, previous);
  const good = pct == null ? null : invert ? pct < 0 : pct > 0;

  return (
    <div className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7E7A6F]">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#15140F] tabular-nums">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {pct == null ? (
          <span className="text-[#7E7A6F]" title="Er is geen bruikbare vergelijkbasis in de vorige periode.">
            geen vergelijkbasis
          </span>
        ) : (
          <span
            className={`font-semibold tabular-nums ${good ? "text-[#2D9255]" : pct === 0 ? "text-[#7E7A6F]" : "text-[#B4483C]"}`}
            title={compareLabel ? `Vergeleken met ${compareLabel}` : undefined}
          >
            {pct > 0 ? "+" : ""}{pct}%
          </span>
        )}
        {sub && <span className="text-[#7E7A6F]">{sub}</span>}
      </div>
    </div>
  );
}
