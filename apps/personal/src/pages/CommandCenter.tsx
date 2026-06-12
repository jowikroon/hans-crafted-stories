import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════
   COMMAND CENTER — live operations: alles inzichtelijk, echt repareren
   Inzicht: empire-health · connector-status · analytics-ga4-gsc
   Repair:  command-repair (admin-gated) · trigger-webhook (site-audit)
   ═══════════════════════════════════════════════════════════════ */

interface ServiceCheck { ok: boolean; latency: number; error?: string }
interface HealthData { services: Record<string, ServiceCheck>; timestamp: string }
interface Connector { id: string; label: string; connected: boolean }
interface GscData { clicks: number; impressions: number; ctr: number | null; position: number | null }
interface N8nWorkflow { id: string; name: string; active: boolean; updatedAt?: string }
interface DiagnoseResult { fn: string; ok: boolean; status: number; latency: number; error?: string }

const card = "rounded-xl border border-white/10 bg-white/[0.03] p-4";
const btn = "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30`;
const btnDanger = `${btn} bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30`;
const btnGhost = `${btn} bg-white/5 text-white/70 hover:bg-white/10 border border-white/10`;

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"} ${ok ? "" : "animate-pulse"}`} />;
}

export default function CommandCenter() {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [gsc, setGsc] = useState<GscData | null>(null);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [wfError, setWfError] = useState<string | null>(null);
  const [diagnose, setDiagnose] = useState<DiagnoseResult[] | null>(null);
  const [advice, setAdvice] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("empire-health");
      if (!error && data?.services) setHealth(data as HealthData);
    } catch { /* surface stays empty */ }
    setHealthLoading(false);
  }, []);

  const loadConnectors = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("connector-status");
      if (!error && data?.data) setConnectors(data.data as Connector[]);
    } catch { /* optional */ }
  }, []);

  const loadGsc = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("analytics-ga4-gsc");
      if (!error && data?.data?.gsc) setGsc(data.data.gsc as GscData);
    } catch { /* optional */ }
  }, []);

  const loadWorkflows = useCallback(async () => {
    setWfError(null);
    try {
      const { data, error } = await supabase.functions.invoke("command-repair", { body: { action: "n8n_list" } });
      if (error) { setWfError("command-repair niet bereikbaar — is de functie gedeployed?"); return; }
      if (data?.success) setWorkflows(data.workflows as N8nWorkflow[]);
      else setWfError(data?.error ?? "n8n lijst ophalen faalde");
    } catch (e) { setWfError((e as Error).message); }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadHealth(); loadConnectors(); loadGsc(); loadWorkflows();
  }, [user, loadHealth, loadConnectors, loadGsc, loadWorkflows]);

  const repair = async (action: string, extra: Record<string, unknown> = {}, label?: string) => {
    setBusy(action + (extra.workflow_id ?? ""));
    try {
      const { data, error } = await supabase.functions.invoke("command-repair", { body: { action, ...extra } });
      if (error) flash(`${label ?? action}: function niet bereikbaar`);
      else if (data?.success) {
        flash(data.message ?? `${label ?? action}: OK`);
        if (action === "diagnose") { setDiagnose(data.results); setAdvice(data.advice ?? []); }
        if (action.startsWith("n8n_") && action !== "n8n_list") loadWorkflows();
      } else flash(`${label ?? action}: ${data?.error ?? "faalde"}`);
    } catch (e) { flash(`${label ?? action}: ${(e as Error).message}`); }
    setBusy(null);
  };

  const runSeoAudit = async () => {
    setBusy("seo");
    try {
      const { data, error } = await supabase.functions.invoke("trigger-webhook", { body: { workflow_name: "site-audit" } });
      if (error) flash("SEO audit: trigger-webhook niet bereikbaar");
      else flash(data?.success ? `SEO audit gestart (run ${String(data.run_id).slice(0, 8)}…)` : `SEO audit: ${data?.error ?? "faalde"}`);
    } catch (e) { flash(`SEO audit: ${(e as Error).message}`); }
    setBusy(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const { error } = await signInWithEmail(email, password);
    if (error) setLoginError(error);
  };

  if (loading) return <div className="min-h-screen bg-[hsl(220,18%,5%)]" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(220,18%,5%)] flex items-center justify-center p-6">
        <div className={`${card} w-full max-w-sm`}>
          <h1 className="text-lg font-semibold text-white mb-1">Command Center</h1>
          <p className="text-xs text-white/50 mb-4">Inloggen vereist — repair-acties zijn admin-only.</p>
          <form onSubmit={handleLogin} className="space-y-2">
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30" />
            <input type="password" placeholder="Wachtwoord" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30" />
            {loginError && <p className="text-xs text-red-400">{loginError}</p>}
            <button type="submit" className={`${btnPrimary} w-full py-2`}>Inloggen</button>
          </form>
          <button onClick={signInWithGoogle} className={`${btnGhost} w-full py-2 mt-2`}>Inloggen met Google</button>
        </div>
      </div>
    );
  }

  const services = health?.services ?? {};
  const downCount = Object.values(services).filter((s) => !s.ok).length;

  return (
    <div className="min-h-screen bg-[hsl(220,18%,5%)] text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Command Center</h1>
            <p className="text-xs text-white/40">
              {health ? (downCount === 0 ? "Alle systemen operationeel" : `${downCount} systeem${downCount > 1 ? "en" : ""} down`) : "Status laden…"}
              {health && <span className="ml-2 text-white/25">· {new Date(health.timestamp).toLocaleTimeString("nl-NL")}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadHealth} disabled={healthLoading} className={btnGhost}>{healthLoading ? "…" : "Ververs"}</button>
            <button onClick={signOut} className={btnGhost}>Uitloggen</button>
          </div>
        </header>

        {toast && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{toast}</div>
        )}

        {/* ── SYSTEM HEALTH ─────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Systemen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(services).map(([name, svc]) => (
              <div key={name} className={`${card} flex items-center justify-between`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><Dot ok={svc.ok} /><span className="text-sm truncate">{name}</span></div>
                  {svc.error && <p className="text-[10px] text-red-400/80 mt-1 truncate">{svc.error}</p>}
                </div>
                <span className="text-xs text-white/40 shrink-0 ml-2">{svc.latency}ms</span>
              </div>
            ))}
            {!health && !healthLoading && (
              <div className={`${card} text-sm text-white/40`}>Geen health-data — klik Ververs</div>
            )}
          </div>
        </section>

        {/* ── SEO ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">SEO · laatste 28 dagen</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className={card}><p className="text-[10px] text-white/40">Clicks</p><p className="text-lg font-semibold">{gsc ? gsc.clicks.toLocaleString("nl-NL") : "—"}</p></div>
            <div className={card}><p className="text-[10px] text-white/40">Impressies</p><p className="text-lg font-semibold">{gsc ? gsc.impressions.toLocaleString("nl-NL") : "—"}</p></div>
            <div className={card}><p className="text-[10px] text-white/40">CTR</p><p className="text-lg font-semibold">{gsc?.ctr != null ? `${(gsc.ctr * 100).toFixed(1)}%` : "—"}</p></div>
            <div className={card}><p className="text-[10px] text-white/40">Positie</p><p className="text-lg font-semibold">{gsc?.position != null ? gsc.position.toFixed(1) : "—"}</p></div>
            <div className={`${card} flex items-center`}>
              <button onClick={runSeoAudit} disabled={busy === "seo"} className={`${btnPrimary} w-full`}>
                {busy === "seo" ? "Start…" : "Run live audit"}
              </button>
            </div>
          </div>
        </section>

        {/* ── CONNECTORS ────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Connectors</h2>
          <div className="flex flex-wrap gap-2">
            {connectors.map((c) => (
              <span key={c.id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${c.connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/40"}`}>
                <Dot ok={c.connected} />{c.label}
              </span>
            ))}
            {connectors.length === 0 && <span className="text-xs text-white/30">—</span>}
          </div>
        </section>

        {/* ── REPAIR ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Repair</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            <div className={card}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Site</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => repair("redeploy_site", {}, "Redeploy")} disabled={busy === "redeploy_site"} className={btnDanger}>
                  {busy === "redeploy_site" ? "Triggeren…" : "Redeploy site"}
                </button>
                <button onClick={() => repair("diagnose", {}, "Diagnose")} disabled={busy === "diagnose"} className={btnGhost}>
                  {busy === "diagnose" ? "Pingen…" : "Diagnose edge functions"}
                </button>
              </div>
              {diagnose && (
                <div className="mt-3 space-y-1">
                  {diagnose.map((d) => (
                    <div key={d.fn} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><Dot ok={d.ok} />{d.fn}</span>
                      <span className="text-white/40">{d.ok ? `${d.latency}ms` : (d.error ?? d.status)}</span>
                    </div>
                  ))}
                  {advice.map((a, i) => <p key={i} className="text-[11px] text-amber-300/80 pt-1">{a}</p>)}
                </div>
              )}
            </div>

            <div className={card}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">n8n workflows</h3>
                <button onClick={loadWorkflows} className={btnGhost}>Ververs</button>
              </div>
              {wfError && <p className="text-xs text-amber-300/80 mb-2">{wfError}</p>}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {workflows.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 min-w-0"><Dot ok={w.active} /><span className="truncate">{w.name}</span></span>
                    <span className="flex gap-1 shrink-0">
                      <button onClick={() => repair(w.active ? "n8n_deactivate" : "n8n_activate", { workflow_id: w.id }, w.name)}
                        disabled={busy === (w.active ? "n8n_deactivate" : "n8n_activate") + w.id} className={btnGhost}>
                        {w.active ? "Stop" : "Start"}
                      </button>
                      <button onClick={() => repair("n8n_run", { workflow_id: w.id }, w.name)}
                        disabled={busy === "n8n_run" + w.id} className={btnPrimary}>Run</button>
                    </span>
                  </div>
                ))}
                {workflows.length === 0 && !wfError && <p className="text-xs text-white/30">Geen workflows geladen</p>}
              </div>
            </div>

          </div>
        </section>

        <footer className="text-[10px] text-white/25 pb-4">
          Repair-acties zijn server-side admin-gated (command-repair · trigger-webhook). Alles wordt gelogd.
        </footer>
      </div>
    </div>
  );
}
