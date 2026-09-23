import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EmptyWidget from "@/components/dashboard/EmptyWidget";
import DashboardShell from "./DashboardShell";

/**
 * MPG is geen advisory-tak meer maar een SaaS in ontwikkeling. Dit dashboard stuurt
 * daarom op bouwvoortgang, niet op omzet.
 *
 * Alles komt uit de edge function `mpg-build-status`, die het afleidt uit GitHub:
 * de SHA van de laatste productie-deployment tegenover die van de default branch.
 * Geen handmatige vinkjes — een statusdashboard dat je zelf vult, liegt binnen twee weken.
 *
 * Er staat bewust geen periodefilter op deze pagina. "Laatste 14 dagen" betekent niets
 * voor een roadmap.
 */

interface BuildStatus {
  ok: boolean;
  configured: boolean;
  reason?: string;
  error?: string;
  repo?: { full_name: string; default_branch: string; pushed_at: string; dormant_days: number; language: string };
  release?: {
    main_sha: string; prod_sha: string | null; prod_date: string | null;
    days_since_prod: number | null; drift: boolean | null;
    not_deployed: string[]; deployed_count: number;
  };
  capabilities?: { edge_functions: string[]; routes: string[]; hollow_routes: string[] };
  prs?: { open: { n: number; title: string; since: string; age_days: number }[]; open_count: number };
  branches?: { stray: string[]; count: number };
  deploys?: { date: string; sha: string; age_days: number }[];
  next_step?: { headline: string; why: string; rule: string };
  generated_at?: string;
  cached?: boolean;
}

const card = "rounded-xl border border-[#E5DFCE] bg-white/60 p-4";
const label = "text-[11px] font-semibold uppercase tracking-wide text-[#7E7A6F]";
const heading = "mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7E7A6F]";
const nf = (n: number) => n.toLocaleString("nl-NL");

export default function DashboardsMpg() {
  const [d, setD] = useState<BuildStatus | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke("mpg-build-status", { body: {} });
      setD(error ? { ok: false, configured: false, reason: error.message } : (data as BuildStatus));
      setBusy(false);
    })();
  }, []);

  if (busy) {
    return (
      <DashboardShell domain="marketplacegrowth.nl" title="Bouwstatus">
        <p className="mt-6 text-[11px] text-[#7E7A6F]">Bouwstatus ophalen uit GitHub…</p>
      </DashboardShell>
    );
  }

  if (!d?.ok) {
    return (
      <DashboardShell domain="marketplacegrowth.nl" title="Bouwstatus">
        <EmptyWidget
          title="Bouwstatus niet beschikbaar"
          pipeline="mpg-build-status → GitHub API"
          detail={d?.reason ?? d?.error ?? "Onbekende fout bij het ophalen van de bouwstatus."}
        />
      </DashboardShell>
    );
  }

  const rel = d.release!;
  const repo = d.repo!;
  const dormant = repo.dormant_days;
  const stale = dormant > 21;
  const drift = rel.drift === true && rel.not_deployed.length > 0;
  const hollow = d.capabilities?.hollow_routes ?? [];

  return (
    <DashboardShell domain="marketplacegrowth.nl" title="Bouwstatus">
      {/* Wat er te weten valt vóór je scrollt. */}
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className={label}>Repo ligt stil</p>
          <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${stale ? "text-[#B4483C]" : "text-[#15140F]"}`}>
            {nf(dormant)} <span className="text-base font-normal">dgn</span>
          </p>
          <p className="mt-1 text-xs text-[#7E7A6F]">laatste push {repo.pushed_at}</p>
        </div>
        <div className={card}>
          <p className={label}>Uitgerold</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#15140F]">{nf(rel.deployed_count)}</p>
          <p className="mt-1 text-xs text-[#7E7A6F]">edge functions in productie</p>
        </div>
        <div className={card}>
          <p className={label}>Ongereleased</p>
          <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${drift ? "text-[#B4483C]" : "text-[#15140F]"}`}>
            {nf(rel.not_deployed.length)}
          </p>
          <p className="mt-1 text-xs text-[#7E7A6F]">
            {drift ? "staat klaar op " + repo.default_branch : `${repo.default_branch} = productie`}
          </p>
        </div>
        <div className={card}>
          <p className={label}>Openstaande PR's</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#15140F]">{nf(d.prs?.open_count ?? 0)}</p>
          <p className="mt-1 text-xs text-[#7E7A6F]">{nf(d.branches?.count ?? 0)} losse branches</p>
        </div>
      </div>

      {/* De SHA-vergelijking is de kern. Toon hem, want hij is het bewijs. */}
      <div className={`mt-3 ${card}`}>
        <p className="font-mono text-xs text-[#15140F]">
          {repo.default_branch} {rel.main_sha}
          {" "}{rel.prod_sha && rel.main_sha === rel.prod_sha ? "=" : "≠"}{" "}
          productie {rel.prod_sha ?? "onbekend"}
        </p>
        <p className="mt-1 text-xs text-[#7E7A6F]">
          {drift
            ? `Er staat werk klaar dat niet live is: ${rel.not_deployed.join(", ")}.`
            : "Er staat niets ongereleased — alles wat gebouwd is, draait."}
          {rel.prod_date && ` Laatste productie-deploy ${rel.prod_date}.`}
        </p>
      </div>

      {stale && !drift && (
        <div className="mt-3 rounded-xl border border-[#E3C6C1] bg-[#FBF1EF] p-4">
          <p className="text-sm text-[#B4483C]">
            {nf(dormant)} dagen geen enkele commit, en niets ongereleased. Dit is geen release-
            of bouwprobleem — het werk is gestopt.
          </p>
        </div>
      )}

      {d.next_step && (
        <>
          <h2 className={heading}>Exacte volgende stap</h2>
          <div className="rounded-xl border border-[#D8CFA8] bg-[#FAF7EC] p-5">
            <p className="text-base font-semibold text-[#15140F]">{d.next_step.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4740]">{d.next_step.why}</p>
            <p className="mt-3 text-xs text-[#7E7A6F]">
              <span className="font-semibold">Beslisregel:</span> {d.next_step.rule}
            </p>
          </div>
        </>
      )}

      <h2 className={heading}>Wat er draait</h2>
      <div className={card}>
        <p className="text-xs text-[#7E7A6F]">
          {nf(d.capabilities?.edge_functions.length ?? 0)} edge functions ·{" "}
          {nf(d.capabilities?.routes.length ?? 0)} routes
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(d.capabilities?.edge_functions ?? []).map((f) => (
            <span
              key={f}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                rel.not_deployed.includes(f)
                  ? "bg-[#FBF1EF] text-[#B4483C]"
                  : "bg-[#F2EFE4] text-[#4A4740]"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
        {rel.not_deployed.length > 0 && (
          <p className="mt-2 text-[11px] text-[#B4483C]">Rood = op {repo.default_branch}, niet in de productie-deploy.</p>
        )}
      </div>

      {hollow.length > 0 && (
        <div className={`mt-3 ${card}`}>
          <p className={label}>Routes zonder implementatie</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hollow.map((r) => (
              <span key={r} className="rounded bg-[#F2EFE4] px-1.5 py-0.5 font-mono text-[10px] text-[#7E7A6F]">/{r}</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#7E7A6F]">
            Een route bestaat, maar er is geen edge function die erbij hoort. Geparkeerd of vergeten.
          </p>
        </div>
      )}

      {(d.prs?.open.length ?? 0) > 0 && (
        <>
          <h2 className={heading}>Wat blijft liggen</h2>
          <div className={card}>
            {d.prs!.open.map((p) => (
              <div key={p.n} className="flex items-baseline gap-2 border-b border-[#EFEADC] py-1.5 last:border-0">
                <span className="shrink-0 font-mono text-xs text-[#7E7A6F]">#{p.n}</span>
                <span className="truncate text-sm text-[#15140F]">{p.title}</span>
                <span className={`ml-auto shrink-0 text-xs tabular-nums ${p.age_days > 60 ? "text-[#B4483C]" : "text-[#7E7A6F]"}`}>
                  {nf(p.age_days)}d
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {(d.deploys?.length ?? 0) > 0 && (
        <>
          <h2 className={heading}>Uitrolgeschiedenis</h2>
          <div className={card}>
            {d.deploys!.map((x, i) => (
              <div key={x.sha + i} className="flex items-baseline gap-3 border-b border-[#EFEADC] py-1.5 last:border-0">
                <span className="font-mono text-xs text-[#7E7A6F]">{x.sha}</span>
                <span className="text-sm text-[#15140F]">{x.date}</span>
                <span className="ml-auto text-xs tabular-nums text-[#7E7A6F]">{nf(x.age_days)} dagen geleden</span>
                {i === 0 && <span className="rounded bg-[#EAF2E6] px-1.5 py-0.5 text-[10px] text-[#4A6B3A]">nu live</span>}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-[11px] text-[#7E7A6F]">
        {repo.full_name} · afgeleid uit de GitHub API, niet uit handmatige invoer
        {d.cached && " · uit cache"}
        {d.generated_at && ` · ${d.generated_at.slice(0, 16).replace("T", " ")}`}
      </p>
    </DashboardShell>
  );
}
