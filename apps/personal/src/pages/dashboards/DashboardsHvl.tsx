import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ExternalLink, Plus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import { formatRange } from "@/lib/dashboardPeriod";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import DashboardKpi from "@/components/dashboard/DashboardKpi";
import EmptyWidget from "@/components/dashboard/EmptyWidget";
import { Funnel, SERIES_1, SERIES_2, TrendChart, type Marker } from "@/components/dashboard/SiteCharts";
import { buildInsights, label, MONEY_PAGES, type ChangeRow, type Insight, type SiteDashboard } from "@/lib/siteInsights";
import DashboardShell from "./DashboardShell";

// The generated types predate the measurement tables (site_*, hvl_gsc_daily, ...).
const db = supabase as unknown as SupabaseClient;
const REPO = "https://github.com/jowikroon/hans-crafted-stories";
const LINEAR = "https://linear.app/hansvanleeuwen/issue";

const nf = (n: number | null | undefined, d = 0) => (n == null ? "–" : Number(n).toLocaleString("nl-NL", { maximumFractionDigits: d }));
const pct = (a: number | null | undefined, b: number | null | undefined) => (a != null && b ? Math.round((1000 * a) / b) / 10 : null);
const pctTxt = (a: number | null | undefined, b: number | null | undefined) => { const v = pct(a, b); return v == null ? "–" : `${nf(v, 1)}%`; };
const day = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "–");
const ago = (s: string | null | undefined) => {
  if (!s) return "nooit";
  const h = Math.round((Date.now() - new Date(s).getTime()) / 3_600_000);
  return h < 1 ? "zojuist" : h < 48 ? `${h} uur geleden` : `${Math.round(h / 24)} dagen geleden`;
};
const pathOf = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };

const H2 = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <h2 className="mb-2 mt-8 flex flex-wrap items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">
    {children}{hint && <span className="font-normal normal-case tracking-normal text-[#9A958A]">{hint}</span>}
  </h2>
);
const Card = ({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-[#E5DFCE] bg-white/70 p-4 ${className}`}>
    {title && <h3 className="mb-3 text-sm font-semibold text-[#15140F]">{title}</h3>}
    {children}
  </section>
);

const SEV: Record<Insight["severity"], { label: string; cls: string }> = {
  critical: { label: "Kritiek", cls: "bg-[#FDECEB] text-[#8F1D13] border-[#F8CCC7]" },
  high: { label: "Hoog", cls: "bg-[#FDF4E3] text-[#7A5206] border-[#F0D9A8]" },
  win: { label: "Werkt", cls: "bg-[#E7F4EC] text-[#1E6B3C] border-[#BFE3CC]" },
  medium: { label: "Kans", cls: "bg-[#EEF3FB] text-[#1F4F8F] border-[#CFDDF3]" },
  info: { label: "Info", cls: "bg-[#F3EFE3] text-[#4B4842] border-[#E5DFCE]" },
};
const VERDICT: Record<string, { label: string; cls: string }> = {
  win: { label: "Werkt", cls: "bg-[#E7F4EC] text-[#1E6B3C]" },
  loss: { label: "Averechts", cls: "bg-[#FDECEB] text-[#8F1D13]" },
  flat: { label: "Geen effect", cls: "bg-[#F3EFE3] text-[#4B4842]" },
  measuring: { label: "Meten", cls: "bg-[#EEF3FB] text-[#1F4F8F]" },
  insufficient: { label: "Te weinig data", cls: "bg-[#F3EFE3] text-[#4B4842]" },
  no_baseline: { label: "Geen nulmeting", cls: "bg-[#F3EFE3] text-[#4B4842]" },
};
const METRICS = ["search_impressions", "search_clicks", "search_ctr", "search_position", "visits", "engaged_rate", "leads", "lead_rate"];

function fmtMetric(metric: string | null, v: number | null | undefined) {
  if (v == null) return "–";
  if (metric === "search_ctr" || metric === "engaged_rate" || metric === "lead_rate") return `${nf(v, 1)}%`;
  if (metric === "search_position") return nf(v, 1);
  return `${nf(v, 1)}/dag`;
}

export default function DashboardsHvl() {
  const { period, setPreset, setRange, setCompare } = useDashboardPeriod("hvl");
  const [d, setD] = useState<SiteDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [seo, setSeo] = useState<{ severity: string; count: number }[]>([]);

  const load = async () => {
    setBusy(true);
    setErr(null);
    const [{ data, error }, { data: items }] = await Promise.all([
      db.rpc("site_dashboard", { p_from: period.from, p_to: period.to, p_prev_from: period.prevFrom, p_prev_to: period.prevTo }),
      db.from("seo_action_items").select("severity,status"),
    ]);
    if (error) setErr(error.message);
    setD((data as SiteDashboard) ?? null);
    const bySev = new Map<string, number>();
    for (const it of (items as { severity?: string; status?: string }[] | null) ?? []) {
      if (["done", "ignored", "verified", "auto_applied"].includes(it.status ?? "")) continue;
      bySev.set(it.severity ?? "onbekend", (bySev.get(it.severity ?? "onbekend") ?? 0) + 1);
    }
    setSeo([...bySev.entries()].map(([severity, count]) => ({ severity, count })).sort((a, b) => b.count - a.count));
    setBusy(false);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.from, period.to, period.compare]);

  const harvest = async () => {
    setHarvesting(true);
    await supabase.functions.invoke("site-metrics", { body: { action: "harvest", force: true } });
    setHarvesting(false);
    await load();
  };

  const insights = useMemo(() => (d ? buildInsights(d) : []), [d]);
  const markers: Marker[] = useMemo(() => (d?.changes ?? [])
    .filter((c) => c.deployed_at)
    .map((c) => ({ d: new Date(c.deployed_at!).toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" }), label: c.pr_number ? `#${c.pr_number}` : c.linear_issue ?? "wijziging", title: c.title })), [d]);

  const k = d?.kpi.cur ?? {};
  const p = d?.kpi.prev ?? null;
  const cmp = period.prevFrom ? formatRange(period.prevFrom, period.prevTo!) : null;
  const series = d?.series ?? [];
  const measured = (d?.changes ?? []).filter((c) => c.deployed_at && c.primary_metric);
  const logged = (d?.changes ?? []).filter((c) => c.deployed_at && !c.primary_metric);
  const planned = (d?.changes ?? []).filter((c) => !c.deployed_at);
  const issues = d?.coverage?.indexing?.data?.issues ?? [];
  const idxTotal = d?.coverage?.indexing?.data?.total ?? null;
  const tracking = !!d?.quality.tracking_since;

  return (
    <DashboardShell domain="hansvanleeuwen.com" title="Site-prestaties & impact">
      <PeriodFilter period={period} onPreset={setPreset} onRange={setRange} onCompare={setCompare}
        right={
          <button onClick={() => void harvest()} disabled={busy || harvesting} title="Search Console en GA4 opnieuw ophalen en alle verbeteringen herberekenen"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFCE] px-3 py-1.5 text-xs text-[#4B4842] hover:bg-[#E5DFCE]/70 disabled:opacity-50">
            <RefreshCw size={12} className={busy || harvesting ? "animate-spin" : ""} /> {harvesting ? "Ophalen…" : "Ververs"}
          </button>
        } />

      {err && <div className="mb-4 rounded-xl border border-[#F8CCC7] bg-[#FDECEB] p-4 text-xs text-[#8F1D13]">Dashboard laden mislukt: {err}</div>}

      {/* 1. What needs attention */}
      <H2 hint="op volgorde van impact">Wat vraagt aandacht</H2>
      {insights.length ? (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {insights.slice(0, 10).map((i) => (
            <article key={i.id} className="rounded-xl border border-[#E5DFCE] bg-white/80 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SEV[i.severity].cls}`}>{SEV[i.severity].label}</span>
                <span className="text-[10px] uppercase tracking-wide text-[#9A958A]">{i.area}</span>
              </div>
              <p className="text-sm font-semibold text-[#15140F]">{i.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#4B4842]">{i.evidence}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#15140F]"><span className="font-semibold">Actie: </span>{i.action}</p>
            </article>
          ))}
        </div>
      ) : busy ? <p className="text-xs text-[#7E7A6F]">Laden…</p> : <EmptyWidget title="Geen signalen" pipeline="site_dashboard + siteInsights" />}

      {/* 2. KPIs */}
      <H2 hint={tracking ? "eigen meting zonder cookies: elk bezoek telt" : "eigen meting start zodra deze versie live staat"}>Bezoek & conversie</H2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DashboardKpi label="Bezoeken" value={nf(k.visits)} current={k.visits} previous={p?.visits} compareLabel={cmp} sub={k.ga4_sessions != null ? `GA4: ${nf(k.ga4_sessions)}` : undefined} />
        <DashboardKpi label="Betrokken" value={pctTxt(k.engaged, k.visits)} current={pct(k.engaged, k.visits)} previous={pct(p?.engaged, p?.visits)} compareLabel={cmp} sub="10s+, 2+ pagina's of lead" />
        <DashboardKpi label="Leads" value={nf(k.leads)} current={k.leads} previous={p?.leads} compareLabel={cmp} sub={`${nf(k.submissions)} via formulier`} />
        <DashboardKpi label="Leadconversie" value={pctTxt(k.leads, k.visits)} current={pct(k.leads, k.visits)} previous={pct(p?.leads, p?.visits)} compareLabel={cmp} />
        <DashboardKpi label="Gem. actieve tijd" value={k.avg_engaged_s != null ? `${nf(k.avg_engaged_s, 0)}s` : "–"} current={k.avg_engaged_s} previous={p?.avg_engaged_s} compareLabel={cmp} />
      </div>

      <H2 hint={k.search_last_day ? `Search Console t/m ${day(k.search_last_day)}, loopt ~2 dagen achter` : undefined}>Zoeken & indexatie</H2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DashboardKpi label="Vertoningen" value={nf(k.search_impressions)} current={k.search_impressions} previous={p?.search_impressions} compareLabel={cmp} />
        <DashboardKpi label="Klikken" value={nf(k.search_clicks)} current={k.search_clicks} previous={p?.search_clicks} compareLabel={cmp} />
        <DashboardKpi label="CTR" value={k.search_ctr != null ? `${nf(k.search_ctr, 2)}%` : "–"} current={k.search_ctr} previous={p?.search_ctr} compareLabel={cmp} />
        <DashboardKpi label="Gem. positie" value={nf(k.search_position, 1)} current={k.search_position} previous={p?.search_position} compareLabel={cmp} invert />
        <DashboardKpi label="Geïndexeerd" value={idxTotal != null ? `${idxTotal - issues.length} / ${idxTotal}` : "–"} sub={`URL-inspectie, ${ago(d?.coverage?.indexing?.fetched_at)}`} />
      </div>

      {/* 3. Trends with change markers */}
      <H2 hint="stippellijn = verbetering live (PR-nummer)">Trend</H2>
      <div className="grid gap-3 lg:grid-cols-3">
        <TrendChart title="Bezoeken per dag" data={series} markers={markers}
          series={[{ key: "visits", name: "Eigen meting", color: SERIES_1 }, { key: "ga4_sessions", name: "GA4 (met cookies)", color: SERIES_2, dashed: true }]} />
        <TrendChart title="Zoekvertoningen per dag" subtitle="Google Search Console" data={series} markers={markers} series={[{ key: "impressions", name: "Vertoningen", color: SERIES_1 }]} />
        <TrendChart title="Zoekklikken per dag" subtitle="Google Search Console" data={series} markers={markers} series={[{ key: "clicks", name: "Klikken", color: SERIES_1 }]} />
      </div>

      {/* 4. Funnel + channels */}
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Card title="Van bezoek naar lead">
          {d && d.funnel.visits > 0 ? (
            <>
              <Funnel steps={[
                { label: "Bezoeken", n: d.funnel.visits },
                { label: "Betrokken bezoek", n: d.funnel.engaged, hint: "10s+ actief, 2+ pagina's of een leadactie" },
                { label: "Interesse (klik op contact, tarieven, LinkedIn)", n: d.funnel.intent },
                { label: "Lead", n: d.funnel.lead, hint: "formulier verstuurd, gesprek gepland, e-mail of LinkedIn" },
              ]} />
              <p className="mt-3 text-[11px] text-[#7E7A6F]">
                Leads: {d.funnel.form_submit} formulier · {d.funnel.book} gesprek · {d.funnel.email} e-mail · {d.funnel.linkedin} LinkedIn.
                {d.funnel.form_start > 0 && ` Formulier: ${d.funnel.form_start} gestart, ${d.funnel.form_submit} verstuurd.`}
              </p>
            </>
          ) : <EmptyWidget title="Nog geen bezoekdata" pipeline="first-party meting (site_events)" detail="Vult zich zodra deze versie van de site live staat." />}
        </Card>
        <Card title="Kanalen">
          {(d?.channels?.length ?? 0) > 0 ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#7E7A6F]"><th className="pb-1">Kanaal</th><th className="pb-1 text-right">Bezoek</th><th className="pb-1 text-right">Betrokken</th><th className="pb-1 text-right">Leads</th><th className="pb-1 text-right">Conversie</th></tr></thead>
              <tbody>{d!.channels!.map((c) => (
                <tr key={c.channel} className="border-t border-[#E5DFCE]/70">
                  <td className="py-1.5 text-[#15140F]">{c.channel}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf(c.visits)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pctTxt(c.engaged, c.visits)}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf(c.leads)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pctTxt(c.leads, c.visits)}</td>
                </tr>))}</tbody>
            </table>
          ) : <EmptyWidget title="Nog geen kanaaldata" pipeline="first-party meting (verwijzer + UTM)" />}
        </Card>
      </div>

      {/* 5. Improvements */}
      <H2 hint="voor- en nameting per wijziging, gecorrigeerd voor de rest van de site">Verbeteringen</H2>
      <Card>
        {measured.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead><tr className="text-left text-[#7E7A6F]">
                <th className="pb-1.5">Wijziging</th><th className="pb-1.5">Live</th><th className="pb-1.5">Metriek</th>
                <th className="pb-1.5 text-right">Voor</th><th className="pb-1.5 text-right">Na</th>
                <th className="pb-1.5 text-right" title="Effect op de gewijzigde pagina's, na correctie voor de beweging van de rest van de site">Effect</th>
                <th className="pb-1.5 text-right">Zekerheid</th><th className="pb-1.5 pl-4">Oordeel</th>
              </tr></thead>
              <tbody>{measured.map((c) => <ChangeLine key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        ) : <EmptyWidget title="Nog geen gemeten verbeteringen" pipeline="site-metrics (PR-sync + impactmeting)" />}
        {logged.length > 0 && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-[#4B4842]">{logged.length} overige wijzigingen op de tijdlijn (zonder metriek)</summary>
            <ul className="mt-2 space-y-1">{logged.map((c) => (
              <li key={c.id} className="flex gap-2 text-[#4B4842]"><span className="w-14 shrink-0 tabular-nums text-[#7E7A6F]">{day(c.deployed_at)}</span>
                {c.pr_number ? <a className="underline-offset-2 hover:underline" href={`${REPO}/pull/${c.pr_number}`} target="_blank" rel="noreferrer">#{c.pr_number}</a> : null}<span>{c.title}</span></li>))}</ul>
          </details>
        )}
        {planned.length > 0 && (
          <details className="mt-2 text-xs" open>
            <summary className="cursor-pointer text-[#4B4842]">{planned.length} gepland: meting start automatisch bij de PR die het Linear-nummer noemt</summary>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">{planned.map((c) => (
              <li key={c.id} className="flex gap-2 text-[#4B4842]">
                {c.linear_issue && <a className="shrink-0 font-medium text-[#1F4F8F] hover:underline" href={`${LINEAR}/${c.linear_issue}`} target="_blank" rel="noreferrer">{c.linear_issue}</a>}
                <span>{c.title} <span className="text-[#9A958A]">({label(c.primary_metric)})</span></span></li>))}</ul>
          </details>
        )}
        <AddChange onAdded={load} />
      </Card>

      {/* 6. Pages */}
      <H2 hint="eigen meting + Search Console per pagina">Pagina's</H2>
      <Card>
        {(d?.pages?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead><tr className="text-left text-[#7E7A6F]">
                <th className="pb-1.5">Pagina</th><th className="pb-1.5 text-right">Weergaven</th><th className="pb-1.5 text-right">Actieve tijd</th>
                <th className="pb-1.5 text-right">Scroll</th><th className="pb-1.5 text-right">Interesse</th>
                <th className="pb-1.5 text-right">Vert.</th><th className="pb-1.5 text-right">Klikken</th><th className="pb-1.5 text-right">Positie</th><th className="pb-1.5 pl-4">Index</th>
              </tr></thead>
              <tbody>{d!.pages!.map((r) => {
                const issue = issues.find((i) => pathOf(i.url) === r.path);
                return (
                  <tr key={r.path} className="border-t border-[#E5DFCE]/70">
                    <td className="max-w-[260px] truncate py-1.5 text-[#15140F]" title={r.path}>{MONEY_PAGES.test(r.path) && <span className="mr-1 text-[#C2810A]" title="geldpagina">€</span>}{r.path}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(r.views)}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.avg_engaged_s != null ? `${nf(r.avg_engaged_s)}s` : "–"}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.avg_scroll != null ? `${nf(r.avg_scroll)}%` : "–"}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.intent_rate != null ? `${nf(r.intent_rate, 1)}%` : "–"}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(r.impressions)}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(r.clicks)}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(r.position, 1)}</td>
                    <td className="py-1.5 pl-4">{issue ? <span className="text-[#8F1D13]" title={issue.coverage_state ?? ""}>niet geïndexeerd</span> : <span className="text-[#7E7A6F]">ok</span>}</td>
                  </tr>);
              })}</tbody>
            </table>
          </div>
        ) : <EmptyWidget title="Geen paginadata in deze periode" pipeline="site_events + hvl_gsc_daily" />}
      </Card>

      {/* 7. Search queries + landing pages */}
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Card title="Zoekopdrachten">
          {(d?.queries?.length ?? 0) > 0 ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#7E7A6F]"><th className="pb-1">Zoekopdracht</th><th className="pb-1 text-right">Vert.</th><th className="pb-1 text-right">Klikken</th><th className="pb-1 text-right">Positie</th><th className="pb-1 text-right">Was</th></tr></thead>
              <tbody>{d!.queries!.slice(0, 15).map((q) => {
                const up = q.prev_position != null && q.position != null ? q.prev_position - q.position : null;
                return (
                  <tr key={q.query} className="border-t border-[#E5DFCE]/70">
                    <td className="py-1.5 pr-2 text-[#15140F]">{q.query}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(q.impressions)}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(q.clicks)}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(q.position, 1)}</td>
                    <td className={`py-1.5 text-right tabular-nums ${up == null ? "text-[#9A958A]" : up >= 1 ? "text-[#2D9255]" : up <= -1 ? "text-[#B4483C]" : "text-[#7E7A6F]"}`}>
                      {q.prev_position != null ? `${nf(q.prev_position, 1)}${up != null && Math.abs(up) >= 1 ? (up > 0 ? " ▲" : " ▼") : ""}` : "nieuw"}
                    </td>
                  </tr>);
              })}</tbody>
            </table>
          ) : <EmptyWidget title="Geen zoekopdrachten in deze periode" pipeline="site-metrics → hvl_gsc_daily" />}
        </Card>
        <Card title="Landingspagina's">
          {(d?.landing?.length ?? 0) > 0 ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#7E7A6F]"><th className="pb-1">Eerste pagina van het bezoek</th><th className="pb-1 text-right">Bezoek</th><th className="pb-1 text-right">Betrokken</th><th className="pb-1 text-right">Leads</th></tr></thead>
              <tbody>{d!.landing!.map((l) => (
                <tr key={l.path} className="border-t border-[#E5DFCE]/70">
                  <td className="max-w-[240px] truncate py-1.5 text-[#15140F]" title={l.path}>{l.path}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf(l.visits)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pctTxt(l.engaged, l.visits)}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf(l.leads)}</td>
                </tr>))}</tbody>
            </table>
          ) : <EmptyWidget title="Nog geen landingsdata" pipeline="first-party meting (site_events)" />}
        </Card>
      </div>

      {/* 8. Technical health */}
      <H2 hint="Core Web Vitals, 75e percentiel van echte bezoekers">Techniek</H2>
      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Snelheid (Web Vitals)">
          {(d?.vitals?.length ?? 0) > 0 ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#7E7A6F]"><th className="pb-1">Meting</th><th className="pb-1">Apparaat</th><th className="pb-1 text-right">p75</th><th className="pb-1 text-right">Goed</th></tr></thead>
              <tbody>{d!.vitals!.map((v) => (
                <tr key={`${v.metric}-${v.device}`} className="border-t border-[#E5DFCE]/70">
                  <td className="py-1.5 text-[#15140F]">{v.metric}</td><td className="py-1.5">{v.device}</td>
                  <td className="py-1.5 text-right tabular-nums">{v.metric === "CLS" ? v.p75 : `${nf(v.p75)}ms`}</td>
                  <td className="py-1.5 text-right tabular-nums">{nf(v.good_pct)}% <span className="text-[#9A958A]">(n={v.n})</span></td>
                </tr>))}</tbody>
            </table>
          ) : <EmptyWidget title="Nog geen snelheidsmetingen" pipeline="first-party meting (web_vital)" />}
        </Card>
        <Card title="Indexatie">
          {idxTotal != null ? (
            <>
              <p className="text-xs text-[#4B4842]"><strong className="text-[#15140F]">{idxTotal - issues.length}</strong> van {idxTotal} sitemap-URL's in Google, gecontroleerd {ago(d?.coverage?.indexing?.fetched_at)}.</p>
              {issues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">{issues.map((i) => (
                  <li key={i.url} className="flex justify-between gap-2 border-t border-[#E5DFCE]/70 pt-1">
                    <span className="truncate text-[#15140F]">{MONEY_PAGES.test(pathOf(i.url)) && <span className="mr-1 text-[#C2810A]">€</span>}{pathOf(i.url)}</span>
                    <span className="shrink-0 text-[#7E7A6F]">{/unknown/i.test(i.coverage_state ?? "") ? "onbekend" : "niet opgenomen"}</span>
                  </li>))}</ul>
              )}
            </>
          ) : <EmptyWidget title="Nog geen indexatiecontrole" pipeline="analytics-ga4-gsc (URL-inspectie)" />}
        </Card>
        <Card title="Fouten">
          {(d?.errors?.not_found?.length ?? 0) + (d?.errors?.js?.length ?? 0) > 0 ? (
            <ul className="space-y-1 text-xs">
              {(d?.errors?.not_found ?? []).map((e) => <li key={`404${e.path}`} className="flex justify-between"><span className="truncate">404 {e.path}</span><span className="tabular-nums text-[#7E7A6F]">{e.n}×</span></li>)}
              {(d?.errors?.js ?? []).map((e) => <li key={`js${e.message}`} className="flex justify-between gap-2"><span className="truncate" title={e.message}>JS: {e.message}</span><span className="tabular-nums text-[#7E7A6F]">{e.n}×</span></li>)}
            </ul>
          ) : <p className="text-xs text-[#7E7A6F]">{tracking ? "Geen 404's of JavaScript-fouten gemeten in deze periode." : "Wordt gemeten zodra de eigen meting live staat."}</p>}
        </Card>
      </div>

      {/* 9. Leads + SEO actions */}
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Card title="Laatste aanvragen">
          {(d?.submissions?.length ?? 0) > 0 ? (
            <ul className="space-y-2 text-xs">{d!.submissions!.map((s) => (
              <li key={s.created_at} className="border-t border-[#E5DFCE]/70 pt-2 first:border-0 first:pt-0">
                <div className="flex justify-between gap-2"><a className="font-medium text-[#15140F] hover:underline" href={`mailto:${s.email}`}>{s.name}</a><span className="text-[#7E7A6F]">{day(s.created_at)} · {s.reason}</span></div>
                <p className="mt-0.5 line-clamp-2 text-[#4B4842]">{s.message}</p>
              </li>))}</ul>
          ) : <p className="text-xs text-[#7E7A6F]">Nog geen aanvragen via het formulier. Nieuwe aanvragen komen ook direct binnen via Telegram.</p>}
        </Card>
        <Card title="Openstaande SEO-acties">
          {seo.length ? (
            <ul className="space-y-1.5 text-xs">{seo.map((s) => (
              <li key={s.severity} className="flex justify-between border-t border-[#E5DFCE]/70 pt-1.5 first:border-0 first:pt-0"><span className="capitalize text-[#15140F]">{s.severity}</span><span className="tabular-nums text-[#7E7A6F]">{s.count}</span></li>))}</ul>
          ) : <EmptyWidget title="Geen openstaande acties" pipeline="seo-orchestrator → seo_action_items" />}
        </Card>
      </div>

      {/* 10. Data quality */}
      <H2>Meetkwaliteit</H2>
      <div className="rounded-xl border border-[#E5DFCE] bg-white/50 p-4 text-xs leading-relaxed text-[#4B4842]">
        <p>
          <strong className="text-[#15140F]">Eigen meting</strong> (zonder cookies, geen toestemming nodig): {tracking ? `actief sinds ${day(d?.quality.tracking_since)}, laatste event ${ago(d?.quality.last_event)}` : "nog geen data"}.
          {d?.quality.internal_events ? ` ${nf(d.quality.internal_events)} events van ingelogde bezoeken (jijzelf) zijn uitgesloten.` : ""}
        </p>
        <p><strong className="text-[#15140F]">Search Console</strong> dagdata vanaf {day(d?.quality.gsc_since)}, <strong className="text-[#15140F]">GA4</strong> vanaf {day(d?.quality.ga4_since)}; laatste oogst {ago(d?.harvest?.at)}{d?.harvest?.data?.complete === false ? " (nog bezig met de historie, loopt door bij de volgende run)" : ""}.</p>
        {d?.harvest?.data?.errors && Object.keys(d.harvest.data.errors).length > 0 && (
          <p className="text-[#8F1D13]">Fouten bij de laatste oogst: {Object.entries(d.harvest.data.errors).map(([k2, v]) => `${k2}: ${v.slice(0, 80)}`).join("; ")}</p>
        )}
        <p className="text-[#7E7A6F]">GA4 ziet alleen bezoekers die cookies accepteren. Stuur op de eigen meting voor aantallen; GA4 blijft bruikbaar voor verhoudingen en de volledige historie.</p>
      </div>
    </DashboardShell>
  );
}

function ChangeLine({ c }: { c: ChangeRow }) {
  const r = c.result;
  const v = VERDICT[r?.verdict ?? "measuring"];
  const lift = r?.lift_pct;
  return (
    <tr className="border-t border-[#E5DFCE]/70 align-top">
      <td className="py-2 pr-3">
        <p className="font-medium text-[#15140F]">{c.title}</p>
        <p className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-[#7E7A6F]">
          {c.pr_number && <a className="inline-flex items-center gap-0.5 hover:underline" href={`${REPO}/pull/${c.pr_number}`} target="_blank" rel="noreferrer">#{c.pr_number} <ExternalLink size={9} /></a>}
          {c.linear_issue && <a className="hover:underline" href={`${LINEAR}/${c.linear_issue}`} target="_blank" rel="noreferrer">{c.linear_issue}</a>}
          <span>{c.paths.length ? c.paths.slice(0, 2).join(", ") + (c.paths.length > 2 ? ` +${c.paths.length - 2}` : "") : "hele site"}</span>
        </p>
        {r?.note && <p className="mt-0.5 text-[11px] text-[#9A958A]">{r.note}</p>}
      </td>
      <td className="py-2 tabular-nums text-[#4B4842]">{day(c.deployed_at)}</td>
      <td className="py-2 text-[#4B4842]">{label(c.primary_metric)}</td>
      <td className="py-2 text-right tabular-nums">{fmtMetric(c.primary_metric, r?.treated.pre)}</td>
      <td className="py-2 text-right tabular-nums">{fmtMetric(c.primary_metric, r?.treated.post)}</td>
      <td className={`py-2 text-right font-semibold tabular-nums ${lift == null ? "text-[#9A958A]" : (lift > 0) === (c.expected === "up" || c.primary_metric === "search_position") ? "text-[#2D9255]" : "text-[#B4483C]"}`}>
        {lift == null ? "–" : `${lift > 0 ? "+" : ""}${nf(lift, 1)}%`}
      </td>
      <td className="py-2 text-right tabular-nums text-[#4B4842]">{r?.confidence != null ? `${Math.round(r.confidence * 100)}%` : "–"}</td>
      <td className="py-2 pl-4"><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.cls}`}>{v.label}</span>
        {r && r.verdict === "measuring" && <p className="mt-0.5 text-[10px] text-[#9A958A]">t/m {day(r.windows.planned_post_to)}</p>}
      </td>
    </tr>
  );
}

/** Log a change that has no PR (off-site work, a LinkedIn update, a Search Console action). */
function AddChange({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", date: new Date().toISOString().slice(0, 10), paths: "", metric: "search_impressions", expected: "up", linear: "", kind: "seo" });
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    setMsg(null);
    const { error } = await db.from("site_changes").insert({
      title: f.title.trim(), kind: f.kind, linear_issue: f.linear.trim().toUpperCase() || null,
      deployed_at: `${f.date}T12:00:00+02:00`, paths: f.paths.split(",").map((x) => x.trim()).filter((x) => x.startsWith("/")),
      primary_metric: f.metric, expected: f.expected, status: "measuring", source: "manual",
    });
    if (error) { setMsg(error.message); return; }
    setOpen(false);
    setF({ ...f, title: "", paths: "", linear: "" });
    await db.functions.invoke("site-metrics", { body: { action: "evaluate" } });
    onAdded();
  };
  const input = "rounded-md border border-[#E5DFCE] bg-white px-2 py-1 text-xs";
  if (!open) return (
    <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs text-[#1F4F8F] hover:underline"><Plus size={12} /> Wijziging zonder PR vastleggen</button>
  );
  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-[#E5DFCE] bg-[#FBF8F0] p-3 sm:grid-cols-6">
      <input className={`${input} sm:col-span-3`} placeholder="Wat is er veranderd?" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <input className={input} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      <select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
        {["seo", "content", "ux", "tech", "offsite", "tracking"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <input className={input} placeholder="HAN-123" value={f.linear} onChange={(e) => setF({ ...f, linear: e.target.value })} />
      <input className={`${input} sm:col-span-3`} placeholder="Pagina's, bv. /rates,/nl/rates (leeg = hele site)" value={f.paths} onChange={(e) => setF({ ...f, paths: e.target.value })} />
      <select className={input} value={f.metric} onChange={(e) => setF({ ...f, metric: e.target.value })}>
        {METRICS.map((m) => <option key={m} value={m}>{label(m)}</option>)}
      </select>
      <select className={input} value={f.expected} onChange={(e) => setF({ ...f, expected: e.target.value })}>
        <option value="up">verwacht omhoog</option><option value="down">verwacht omlaag</option>
      </select>
      <div className="flex gap-2">
        <button disabled={f.title.trim().length < 3} onClick={() => void save()} className="rounded-full bg-[#15140F] px-3 py-1 text-xs text-[#FBF8F0] disabled:opacity-40">Opslaan</button>
        <button onClick={() => setOpen(false)} className="text-xs text-[#7E7A6F]">Annuleer</button>
      </div>
      {msg && <p className="text-xs text-[#8F1D13] sm:col-span-6">{msg}</p>}
    </div>
  );
}
