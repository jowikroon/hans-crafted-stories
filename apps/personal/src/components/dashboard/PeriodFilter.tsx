import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  CompareMode, PRESETS, Period, PresetId, formatRange, matchPreset,
} from "@/lib/dashboardPeriod";

interface Props {
  period: Period;
  onPreset: (id: PresetId) => void;
  onRange: (from: string, to: string) => void;
  onCompare: (c: CompareMode) => void;
  right?: React.ReactNode;
}

const COMPARE_LABEL: Record<CompareMode, string> = {
  prev: "vorige periode",
  yoy: "vorig jaar",
  none: "niet vergelijken",
};

/**
 * Eén filter per dashboard. Widgets hebben géén eigen datumkiezer — dat is bewust,
 * anders kan een pagina twee verschillende periodes tegelijk tonen.
 */
export default function PeriodFilter({ period, onPreset, onRange, onCompare, right }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const wrap = useRef<HTMLDivElement>(null);
  const active = matchPreset(period);

  useEffect(() => { setFrom(period.from); setTo(period.to); }, [period.from, period.to]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const pill = "rounded-full px-3 py-1.5 text-xs font-medium transition-colors";

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-[#E5DFCE] bg-[#FBF8F0]/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPreset(p.id)}
              aria-pressed={active === p.id}
              className={`${pill} ${active === p.id
                ? "bg-[#15140F] text-[#FBF8F0]"
                : "text-[#4B4842] hover:bg-[#E5DFCE]/70"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative" ref={wrap}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={`${pill} inline-flex items-center gap-1.5 border border-[#E5DFCE] ${
              active === null ? "bg-[#15140F] text-[#FBF8F0]" : "text-[#4B4842] hover:bg-[#E5DFCE]/70"}`}
          >
            <CalendarDays size={13} />
            {formatRange(period.from, period.to)}
            <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {open && (
            <div role="dialog" aria-label="Periode kiezen"
              className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[#E5DFCE] bg-[#FBF8F0] p-3 shadow-lg">
              <label className="mb-2 block text-xs font-medium text-[#4B4842]">
                Van
                <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5DFCE] bg-white px-2 py-1.5 text-sm text-[#15140F]" />
              </label>
              <label className="mb-3 block text-xs font-medium text-[#4B4842]">
                Tot en met
                <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5DFCE] bg-white px-2 py-1.5 text-sm text-[#15140F]" />
              </label>
              <p className="mb-3 text-[11px] leading-snug text-[#7E7A6F]">
                Vandaag telt nooit mee — die dag is incompleet en zou elke vergelijking vertekenen.
              </p>
              <button
                onClick={() => { onRange(from, to); setOpen(false); }}
                className="w-full rounded-lg bg-[#15140F] px-3 py-2 text-sm font-medium text-[#FBF8F0] hover:bg-[#2c2a22]"
              >
                Toepassen
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="cmp">Vergelijken met</label>
          <select
            id="cmp"
            value={period.compare}
            onChange={(e) => onCompare(e.target.value as CompareMode)}
            className="rounded-full border border-[#E5DFCE] bg-transparent px-3 py-1.5 text-xs text-[#4B4842]"
          >
            {(Object.keys(COMPARE_LABEL) as CompareMode[]).map((c) => (
              <option key={c} value={c}>vs. {COMPARE_LABEL[c]}</option>
            ))}
          </select>
          {right}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[#7E7A6F]">
        {period.days} volledige {period.days === 1 ? "dag" : "dagen"} · {formatRange(period.from, period.to)}
        {period.prevFrom
          ? <> · vergeleken met {formatRange(period.prevFrom, period.prevTo!)}</>
          : <> · geen vergelijking</>}
      </p>
    </div>
  );
}
