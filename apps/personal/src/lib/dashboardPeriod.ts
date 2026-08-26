/**
 * Periodecontract voor alle dashboards.
 *
 * Normatief: de standaardperiode is de laatste 14 VOLLEDIGE dagen, eindigend gisteren.
 * Vandaag telt nooit mee — die dag is incompleet en vervuilt elke vergelijking.
 * De vergelijkperiode is automatisch even lang en ligt er direct voor.
 *
 * Alle datums zijn kalenderdagen in Europe/Amsterdam, geen UTC. Dat is bewust:
 * stilzwijgende UTC-aannames zijn eerder fout gebleken op Magento-tijdstempels.
 */

export const DASHBOARD_TZ = "Europe/Amsterdam";
export const DEFAULT_PERIOD_DAYS = 14;

export type CompareMode = "prev" | "yoy" | "none";

export interface Period {
  from: string;
  to: string;
  days: number;
  compare: CompareMode;
  prevFrom: string | null;
  prevTo: string | null;
}

/** YYYY-MM-DD zoals die dag in Amsterdam heet, ongeacht de UTC-offset. */
export function ymd(date: Date, tz: string = DASHBOARD_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

/** Middaganker voorkomt dat zomertijd een dag laat verspringen. */
const anchor = (s: string) => new Date(`${s}T12:00:00Z`);

export const addDays = (s: string, n: number): string =>
  ymd(new Date(anchor(s).getTime() + n * 86_400_000));

/** Inclusief beide einddagen: 27-07 t/m 09-08 = 14. */
export const daysBetween = (from: string, to: string): number =>
  Math.round((anchor(to).getTime() - anchor(from).getTime()) / 86_400_000) + 1;

export const isYmd = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const today = (now: Date = new Date()): string => ymd(now);
export const yesterday = (now: Date = new Date()): string => addDays(today(now), -1);

/** Bouwt een geldige periode; kapt vandaag en de toekomst af. */
export function makePeriod(
  from: string, to: string, compare: CompareMode = "prev", now: Date = new Date(),
): Period {
  let a = from, b = to;
  if (anchor(a) > anchor(b)) [a, b] = [b, a];

  const last = yesterday(now);
  if (anchor(b) > anchor(last)) b = last;
  if (anchor(a) > anchor(b)) a = addDays(b, -(DEFAULT_PERIOD_DAYS - 1));

  const days = daysBetween(a, b);
  let prevFrom: string | null = null;
  let prevTo: string | null = null;
  if (compare === "prev") { prevTo = addDays(a, -1); prevFrom = addDays(prevTo, -(days - 1)); }
  else if (compare === "yoy") { prevFrom = addDays(a, -365); prevTo = addDays(b, -365); }

  return { from: a, to: b, days, compare, prevFrom, prevTo };
}

/** De standaard: 14 volledige dagen t/m gisteren. */
export function defaultPeriod(now: Date = new Date()): Period {
  const to = yesterday(now);
  return makePeriod(addDays(to, -(DEFAULT_PERIOD_DAYS - 1)), to, "prev", now);
}

export type PresetId = "7d" | "14d" | "28d" | "90d" | "mtd" | "lastMonth" | "qtd" | "ytd";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "7d", label: "7 dagen" },
  { id: "14d", label: "14 dagen" },
  { id: "28d", label: "28 dagen" },
  { id: "90d", label: "90 dagen" },
  { id: "mtd", label: "Deze maand" },
  { id: "lastMonth", label: "Vorige maand" },
  { id: "qtd", label: "Dit kwartaal" },
  { id: "ytd", label: "Dit jaar" },
];

export function periodFromPreset(
  id: PresetId, compare: CompareMode = "prev", now: Date = new Date(),
): Period {
  const end = yesterday(now);
  const [y, m] = today(now).split("-").map(Number);
  const first = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}-01`;

  switch (id) {
    case "7d":  return makePeriod(addDays(end, -6), end, compare, now);
    case "14d": return makePeriod(addDays(end, -13), end, compare, now);
    case "28d": return makePeriod(addDays(end, -27), end, compare, now);
    case "90d": return makePeriod(addDays(end, -89), end, compare, now);
    case "mtd": return makePeriod(first(y, m), end, compare, now);
    case "lastMonth": {
      const pm = m === 1 ? 12 : m - 1;
      const py = m === 1 ? y - 1 : y;
      return makePeriod(first(py, pm), addDays(first(y, m), -1), compare, now);
    }
    case "qtd": return makePeriod(first(y, Math.floor((m - 1) / 3) * 3 + 1), end, compare, now);
    case "ytd": return makePeriod(`${y}-01-01`, end, compare, now);
  }
}

/** Herkent of een periode exact met een preset overeenkomt, zodat de UI hem kan markeren. */
export function matchPreset(p: Period, now: Date = new Date()): PresetId | null {
  for (const { id } of PRESETS) {
    const c = periodFromPreset(id, p.compare, now);
    if (c.from === p.from && c.to === p.to) return id;
  }
  return null;
}

const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export function formatDay(s: string): string {
  const [, m, d] = s.split("-");
  return `${Number(d)} ${NL_MONTHS[Number(m) - 1]}`;
}
export const formatRange = (from: string, to: string): string =>
  `${formatDay(from)} – ${formatDay(to)}`;

/** Percentageverschil. null zodra er geen vergelijkbasis is — nooit oneindig of 100% verzinnen. */
export function deltaPct(
  current: number | null | undefined, previous: number | null | undefined,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function toQuery(p: Period): Record<string, string> {
  return { from: p.from, to: p.to, cmp: p.compare };
}
