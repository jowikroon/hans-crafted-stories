/**
 * command-repair — authenticated repair gateway for the /command Command Center.
 *
 * Enforces (same pattern as trigger-webhook):
 *   1. Valid Supabase JWT OR x-commander-token
 *   2. Admin role check via has_role() RPC for JWT callers — non-admin gets 403
 *   3. Allowlist of repair actions — no open proxy
 *
 * Actions:
 *   redeploy_site    → POST to CF_DEPLOY_HOOK_URL (Cloudflare Pages deploy hook)
 *   n8n_list         → GET  {N8N_BASE}/api/v1/workflows  (X-N8N-API-KEY)
 *   n8n_activate     → POST {N8N_BASE}/api/v1/workflows/{id}/activate
 *   n8n_deactivate   → POST {N8N_BASE}/api/v1/workflows/{id}/deactivate
 *   n8n_run          → POST {N8N_BASE}/api/v1/workflows/{id}/run (best effort;
 *                      falls back with instructive error if the n8n version
 *                      doesn't expose manual runs via public API)
 *   diagnose         → OPTIONS-ping critical edge functions, report ok/latency
 *
 * Every action writes an audit row to command_repair_log (best effort).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const N8N_BASE = Deno.env.get("N8N_BASE") || "https://n8n.srv1402218.hstgr.cloud";

const CRITICAL_FUNCTIONS = [
  "empire-health",
  "connector-status",
  "trigger-webhook",
  "analytics-ga4-gsc",
  "hansai-chat",
  "portal-api",
];

async function n8nFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const key = Deno.env.get("N8N_API_KEY");
  if (!key) throw new Error("N8N_API_KEY ontbreekt als function secret — zet hem via Supabase dashboard of CLI");
  return await fetch(`${N8N_BASE}/api/v1${path}`, {
    ...init,
    headers: { "X-N8N-API-KEY": key, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── Auth: commander token of JWT + admin role ──────────────────────────────
  let actor = "commander";
  const commanderToken = req.headers.get("x-commander-token");
  const expectedToken = Deno.env.get("COMMANDER_TOKEN");
  const isCommander = !!commanderToken && !!expectedToken && commanderToken === expectedToken;

  if (!isCommander) {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return json({ success: false, error: "Unauthorized — valid session required" }, 401);

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      console.warn(`[command-repair] non-admin attempt user=${user.id}`);
      return json({ success: false, error: "Admin role required for repair actions" }, 403);
    }
    actor = user.id;
  }

  const body = await req.json().catch(() => ({}));
  const action = (body as { action?: string }).action;
  const workflowId = (body as { workflow_id?: string }).workflow_id;

  const audit = async (status: string, detail: unknown) => {
    try {
      await supabaseAdmin.from("command_repair_log").insert({
        actor, action, status, detail: JSON.stringify(detail).slice(0, 2000),
      });
    } catch { /* audit is best effort */ }
  };

  try {
    switch (action) {
      case "redeploy_site": {
        const hook = Deno.env.get("CF_DEPLOY_HOOK_URL");
        if (!hook) {
          return json({
            success: false,
            error: "CF_DEPLOY_HOOK_URL ontbreekt. Maak in Cloudflare Pages (project hansvanleeuwen) een Deploy Hook aan en zet de URL als function secret CF_DEPLOY_HOOK_URL.",
          }, 501);
        }
        const res = await fetch(hook, { method: "POST" });
        const ok = res.ok;
        await audit(ok ? "ok" : "failed", { status: res.status });
        return json({ success: ok, message: ok ? "Deploy getriggerd — live in ±2 min" : `Deploy hook gaf ${res.status}` });
      }

      case "n8n_list": {
        const res = await n8nFetch("/workflows?limit=50");
        if (!res.ok) return json({ success: false, error: `n8n API gaf ${res.status}` }, 502);
        const data = await res.json();
        const workflows = (data.data ?? []).map((w: { id: string; name: string; active: boolean; updatedAt?: string }) => ({
          id: w.id, name: w.name, active: w.active, updatedAt: w.updatedAt,
        }));
        return json({ success: true, workflows });
      }

      case "n8n_activate":
      case "n8n_deactivate": {
        if (!workflowId) return json({ success: false, error: "workflow_id is required" }, 400);
        const verb = action === "n8n_activate" ? "activate" : "deactivate";
        const res = await n8nFetch(`/workflows/${workflowId}/${verb}`, { method: "POST" });
        const ok = res.ok;
        await audit(ok ? "ok" : "failed", { workflowId, verb, status: res.status });
        return json({ success: ok, message: ok ? `Workflow ${verb}d` : `n8n gaf ${res.status}` });
      }

      case "n8n_run": {
        if (!workflowId) return json({ success: false, error: "workflow_id is required" }, 400);
        const res = await n8nFetch(`/workflows/${workflowId}/run`, { method: "POST", body: JSON.stringify({}) });
        if (res.ok) {
          await audit("ok", { workflowId });
          return json({ success: true, message: "Run gestart" });
        }
        await audit("failed", { workflowId, status: res.status });
        return json({
          success: false,
          error: `n8n gaf ${res.status} — deze n8n-versie ondersteunt mogelijk geen handmatige run via API. Gebruik de webhook-trigger (trigger-webhook) of activeer de workflow.`,
        }, 502);
      }

      case "diagnose": {
        const base = Deno.env.get("SUPABASE_URL")!;
        const results = await Promise.all(CRITICAL_FUNCTIONS.map(async (fn) => {
          const start = Date.now();
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${base}/functions/v1/${fn}`, { method: "OPTIONS", signal: controller.signal });
            clearTimeout(timer);
            return { fn, ok: res.ok || res.status === 204, status: res.status, latency: Date.now() - start };
          } catch (e) {
            return { fn, ok: false, status: 0, latency: Date.now() - start, error: (e as Error).message };
          }
        }));
        const failing = results.filter((r) => !r.ok);
        await audit(failing.length ? "issues" : "ok", { failing: failing.map((f) => f.fn) });
        return json({
          success: true,
          results,
          advice: failing.length
            ? failing.map((f) => `${f.fn}: niet bereikbaar (${f.status || f.error}) — check Supabase dashboard → Edge Functions → logs, en redeploy de functie`)
            : ["Alle kritieke functions bereikbaar"],
        });
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    await audit("error", { message: (e as Error).message });
    return json({ success: false, error: (e as Error).message }, 500);
  }
});
