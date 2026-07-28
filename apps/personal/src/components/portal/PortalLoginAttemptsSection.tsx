import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { attemptsApi, parseBrowser, PortalLoginAttempt } from "@/lib/api/portalAccess";

function relTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

const outcomeStyle: Record<PortalLoginAttempt["outcome"], { label: string; cls: string }> = {
  granted_admin: { label: "Admin", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  granted_member: { label: "Member", cls: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  denied: { label: "Denied", cls: "text-red-500 bg-red-500/10 border-red-500/20" },
};

const PortalLoginAttemptsSection = () => {
  const [attempts, setAttempts] = useState<PortalLoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "denied">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setAttempts(await attemptsApi.list(100)); }
    catch (e) { console.error("Failed to load login attempts:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "denied" ? attempts.filter((a) => a.outcome === "denied") : attempts;

  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <Shield size={15} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Login attempts</h3>
            <p className="text-xs text-muted-foreground/60">Everyone who signed in via Google or e-mail — including denied access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/60 bg-secondary/20 p-0.5 text-[10px]">
            <button onClick={() => setFilter("all")} className={`rounded-md px-2 py-1 font-medium transition-all ${filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}>All</button>
            <button onClick={() => setFilter("denied")} className={`rounded-md px-2 py-1 font-medium transition-all ${filter === "denied" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"}`}>Denied</button>
          </div>
          <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">{loading ? "Loading…" : filter === "denied" ? "No denied attempts. Good." : "No login attempts recorded yet."}</p>
      ) : (
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {visible.map((a) => {
            const st = outcomeStyle[a.outcome] ?? outcomeStyle.denied;
            return (
              <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{a.email || "unknown"}</span>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                <span className="hidden shrink-0 text-muted-foreground sm:inline">{a.user_agent ? parseBrowser(a.user_agent) : "—"}</span>
                <span className="hidden shrink-0 text-muted-foreground md:inline">{a.device || "—"}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground/60" title={new Date(a.created_at).toLocaleString()}>{relTime(a.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalLoginAttemptsSection;
