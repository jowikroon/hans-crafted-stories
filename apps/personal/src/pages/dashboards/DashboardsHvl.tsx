import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardPeriod } from "@/hooks/useDashboardPeriod";
import { formatRange } from "@/lib/dashboardPeriod";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import DashboardKpi from "@/components/dashboard/DashboardKpi";
import EmptyWidget from "@/components/dashboard/EmptyWidget";
import DashboardShell from "./DashboardShell";

interface Analytics {
  ok?: boolean;
  ga4?: {
    current?: { sessions: number; users: number; pageviews: number; bounce_rate: number; avg_session_sec: number };
    previous?: { sessions: number; users: number; pageviews: number; bounce_rate: number } | null;
    top_pages?: { path: string; title: string; sessions: number }[];
    channels?: { channel: string; sessions: number }[];
  };
  gsc?: {
    current?: { clicks: number; impressions: number; ctr: number | null; position: number | null };
    previous?: { clicks: number; impressions: number; ctr: number | null; position: number | null } | null;
    queries?: { query: string; clicks: number; impressions: number; ctr: number | null; position: number | null }[];
    truncated?: boolean;
    last_reliable_day?: string;
  };
  meta?: { plausibility?: { suspect: boolean | null; note: string | null; ga4_sessions?: number; gsc_clicks?: number } };
  errors?: Record<string, string>;
  cached?: boolean;
  fetched_at?: string;
}

const nf = (n: number | null | undefined) => (n ?? 0).toLocaleString("nl-NL");

export default function DashboardsHvl() {
  const { period, setPreset, setRange, setCompare } = useDashboardPeriod("hvl");
  const [a, setA] = useState<Analytics | null>(null);
  const [seo, setSeo] = useState<{ severity: string | null; count: number }[]>([]);
  const [radar, setRadar] = useState<Record<string, unknown>[]>([]);
  const [posts, setPosts] = useState<{ total: number; inPeriod: number; drafts: number }>({ total: 0, inPeriod: 0, drafts: 0 });
  const [busy, setBusy] = useState(true);

  const load = async (force = false) => {
    setBusy(true);
    const { data } = await supabase.functions.invoke("analytics-ga4-gsc", {
      body: { from: period.from, to: period.to, compare: period.compare, force },
    });
    setA((data as Analytics) ?? null);

    const [{ data: items }, { data: rr }, { data: bp }] = await Promise.all([
      supabase.from("seo_action_items").select("severity,status"),
      supabase.from("brand_radar_weekly").select("*").order("created_at", { ascending: false }).limit(1),
      supabase.from("blog_posts").select("id,status,published_at"),
    ]);

    const bySev = new Map<string, number>();
    for (const it of items ?? []) {
      if ((it as { status?: string }).status === "done") continue;
      const s = ((it as { severity?: string }).severity ?? "onbekend");
      bySev.set(s, (bySev.get(s) ?? 0) + 1);
    }
    setSeo([...bySev.entries()].map(([severity, count]) => ({ severity, count })).sort((x, y) => y.count - x.count));
    setRadar((rr as Record<string, unknown>[]) ?? []);

    const all = (bp as { status?: string; published_at?: string }[]) ?? [];
    setPosts({
      total: all.length,
      inPeriod: all.filter((p) => p.published_at && p.published_at.slice(0, 10) >= period.from && p.published_at.slice(0, 10) <= period.to).length,
      drafts: all.filter((p) => p.status !== "published").length,
    });
    setBusy(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [period.from, period.to, period.compare]);

  const ga = a?.ga4?.current;
  const gaPrev = a?.ga4?.previous;
  const gs = a?.gsc?.current;
  const gsPrev = a?.gsc?.previous;
  const cmpLabel = period.prevFrom ? formatRange(period.prevFrom, period.prevTo!) : null;
  const suspect = a?.meta?.plausibility?.suspect;

  return (
    <DashboardShell domain="hansvanleeuwen.com" title="Zichtbaarheid & content">
      <PeriodFilter
        period={period} onPreset={setPreset} onRange={setRange} onCompare={setCompare}
        right={
          <button onClick={() => void load(true)} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DFCE] px-3 py-1.5 text-xs text-[#4B4842] hover:bg-[#E5DFCE]/70 disabled:opacity-50">
            <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> Ververs
          </button>
        }
      />

      {suspect && (
        <div className="mb-5 flex gap-3 rounded-xl border border-[#F0D9A8] bg-[#FDF4E3] p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#C2810A]" />
          <p className="text-xs leading-relaxed text-[#7A5206]">
            <strong>Meetprobleem, geen realiteit.</strong> GA4 telt {nf(a?.meta?.plausibility?.ga4_sessions)} sessies
            terwijl Search Console {nf(a?.meta?.plausibility?.gsc_clicks)} klikken registreert in dezelfde periode.
            Een bezoeker die doorklikt uit Google hoort een sessie te zijn. Controleer Consent Mode en de GTM-tagging
            voordat je op deze cijfers stuurt.
          </p>
        </div>
      )}

      {a?.errors?.ga4 && (
        <div className="mb-5 rounded-xl border border-[#F8CCC7] bg-[#FDECEB] p-4 text-xs text-[#8F1D13]">
          GA4 gaf een fout: {a.errors.ga4.slice(0, 200)}
        </div>
      )}

      <h2 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">Bezoek</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardKpi label="Sessies" value={nf(ga?.sessions)} current={ga?.sessions} previous={gaPrev?.sessions} compareLabel={cmpLabel} />
        <DashboardKpi label="Gebruikers" value={nf(ga?.users)} current={ga?.users} previous={gaPrev?.users} compareLabel={cmpLabel} />
        <DashboardKpi label="Paginaweergaven" value={nf(ga?.pageviews)} current={ga?.pageviews} previous={gaPrev?.pageviews} compareLabel={cmpLabel} />
        <DashboardKpi label="Bouncepercentage" value={`${ga?.bounce_rate ?? 0}%`} current={ga?.bounce_rate} previous={gaPrev?.bounce_rate} compareLabel={cmpLabel} invert />
      </div>

      <h2 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]">
        Zoekprestatie{a?.gsc?.truncated && <span className="ml-2 font-normal normal-case text-[#C2810A]">venster ingekort tot {a.gsc.last_reliable_day} — Search Console loopt ~3 dagen achter</span>}
      </h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardKpi label="Klikken" value={nf(gs?.clicks)} current={gs?.clicks} previous={gsPrev?.clicks} compareLabel={cmpLabel} />
        <DashboardKpi label="Vertoningen" value={nf(gs?.impressions)} current={gs?.impressions} previous={gsPrev?.impressions} compareLabel={cmpLabel} />
        <DashboardKpi label="CTR" value={`${gs?.ctr ?? 0}%`} current={gs?.ctr} previous={gsPrev?.ctr} compareLabel={cmpLabel} />
        <DashboardKpi label="Gem. positie" value={`${gs?.position ?? "–"}`} current={gs?.position} previous={gsPrev?.position} compareLabel={cmpLabel} invert />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#15140F]">Zoekopdrachten</h3>
          {(a?.gsc?.queries?.length ?? 0) > 0 ? (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[#7E7A6F]"><th className="pb-1">Query</th><th className="pb-1 text-right">Klikken</th><th className="pb-1 text-right">Vert.</th><th className="pb-1 text-right">Positie</th></tr></thead>
              <tbody>
                {a!.gsc!.queries!.slice(0, 10).map((q) => (
                  <tr key={q.query} className="border-t border-[#E5DFCE]/70">
                    <td className="py-1.5 pr-2 text-[#15140F]">{q.query}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(q.clicks)}</td>
                    <td className="py-1.5 text-right tabular-nums">{nf(q.impressions)}</td>
                    <td className="py-1.5 text-right tabular-nums">{q.position ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyWidget title="Geen zoekopdrachten in deze periode" pipeline="Search Console via analytics-ga4-gsc" />}
        </section>

        <section className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#15140F]">Best bezochte pagina's</h3>
          {(a?.ga4?.top_pages?.length ?? 0) > 0 ? (
            <ul className="space-y-1.5 text-xs">
              {a!.ga4!.top_pages!.map((p) => (
                <li key={p.path} className="flex justify-between gap-3 border-t border-[#E5DFCE]/70 pt-1.5 first:border-0 first:pt-0">
                  <span className="truncate text-[#15140F]">{p.title || p.path}</span>
                  <span className="tabular-nums text-[#7E7A6F]">{nf(p.sessions)}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyWidget title="Geen paginaverkeer gemeten" pipeline="GA4 via analytics-ga4-gsc" detail="Zolang de tagging niet klopt blijft dit leeg." />}
        </section>

        <section className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#15140F]">Openstaande SEO-acties</h3>
          {seo.length > 0 ? (
            <ul className="space-y-1.5 text-xs">
              {seo.map((s) => (
                <li key={s.severity ?? "onbekend"} className="flex justify-between border-t border-[#E5DFCE]/70 pt-1.5 first:border-0 first:pt-0">
                  <span className="capitalize text-[#15140F]">{s.severity ?? "onbekend"}</span>
                  <span className="tabular-nums text-[#7E7A6F]">{s.count}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyWidget title="Geen openstaande acties" pipeline="seo-orchestrator → seo_action_items" />}
          <p className="mt-3 text-[11px] text-[#7E7A6F]">Momentopname, niet periodegebonden — deze tabel houdt geen historie per dag bij.</p>
        </section>

        <section className="rounded-xl border border-[#E5DFCE] bg-white/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#15140F]">Content</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Gepubliceerd in periode", posts.inPeriod], ["Concepten", posts.drafts], ["Totaal", posts.total]].map(([l, v]) => (
              <div key={String(l)}>
                <p className="text-xl font-semibold tabular-nums text-[#15140F]">{v as number}</p>
                <p className="text-[11px] text-[#7E7A6F]">{l as string}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#7E7A6F]">Bron: blog_posts (canoniek). Per-artikel verkeer vereist blog_post_metrics_daily — die tabel is nog leeg.</p>
        </section>
      </div>

      {radar.length === 0 && (
        <div className="mt-4">
          <EmptyWidget title="AI-zichtbaarheid" pipeline="brand-radar → brand_radar_weekly" detail="Laatste run niet gevonden." />
        </div>
      )}

      {a?.fetched_at && (
        <p className="mt-6 text-[11px] text-[#7E7A6F]">
          Opgehaald {new Date(a.fetched_at).toLocaleString("nl-NL")}{a.cached ? " (uit cache)" : ""}
        </p>
      )}
    </DashboardShell>
  );
}
