import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CompareMode, Period, PresetId, defaultPeriod, isYmd, makePeriod, periodFromPreset,
} from "@/lib/dashboardPeriod";

/**
 * Eén periode per dashboard, gedeeld door alle widgets.
 * Toestand leeft in de URL (?from=&to=&cmp=) zodat een view deelbaar en bookmarkbaar is;
 * de laatste keuze wordt per dashboard onthouden.
 */
export function useDashboardPeriod(scope: string) {
  const [params, setParams] = useSearchParams();
  const storageKey = `dashboard-period:${scope}`;

  const period = useMemo<Period>(() => {
    const from = params.get("from");
    const to = params.get("to");
    const cmp = params.get("cmp") as CompareMode | null;
    const compare: CompareMode = cmp === "yoy" || cmp === "none" ? cmp : "prev";

    if (isYmd(from) && isYmd(to)) return makePeriod(from, to, compare);

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && isYmd(saved.from) && isYmd(saved.to)) {
        return makePeriod(saved.from, saved.to, saved.compare ?? "prev");
      }
    } catch { /* val terug op de standaard */ }

    return defaultPeriod();
  }, [params, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        from: period.from, to: period.to, compare: period.compare,
      }));
    } catch { /* privémodus: niet erg */ }
  }, [period.from, period.to, period.compare, storageKey]);

  const apply = useCallback((p: Period) => {
    const next = new URLSearchParams(params);
    next.set("from", p.from);
    next.set("to", p.to);
    next.set("cmp", p.compare);
    setParams(next, { replace: false });
  }, [params, setParams]);

  const setPreset = useCallback((id: PresetId) => apply(periodFromPreset(id, period.compare)), [apply, period.compare]);
  const setRange = useCallback((from: string, to: string) => apply(makePeriod(from, to, period.compare)), [apply, period.compare]);
  const setCompare = useCallback((c: CompareMode) => apply(makePeriod(period.from, period.to, c)), [apply, period.from, period.to]);

  return { period, setPreset, setRange, setCompare };
}
