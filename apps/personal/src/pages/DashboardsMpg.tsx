import { Link } from "react-router-dom";
import { Layers, ShoppingBag, TrendingUp, Code2, GitBranch, Cpu, CheckCircle2 } from "lucide-react";

export default function DashboardsMpg() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link to="/portal" className="hover:text-primary transition-colors">Portal</Link>
            <span>/</span>
            <Link to="/dashboards" className="hover:text-primary transition-colors">Dashboards</Link>
            <span>/</span>
            <span className="text-foreground">Marketplace Growth</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-bold text-base shadow-md shadow-purple-500/20">
              MPG
            </div>
            <span>Marketplace Growth — SaaS Build Status</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-brand Marketplace Automation Platform · Git SHA Sync · Vercel Staging & Production
          </p>
        </div>
      </div>

      {/* Domain Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          to="/dashboards/ccp"
          className="flex items-center gap-2 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-2 text-xs font-semibold transition shrink-0"
        >
          <ShoppingBag size={14} />
          <span>Connect Car Parts (eBay DE Live)</span>
        </Link>

        <Link
          to="/dashboards/mpg"
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs shrink-0"
        >
          <Layers size={14} />
          <span>Marketplace Growth (MPG SaaS)</span>
          <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-bold">Build OK</span>
        </Link>

        <Link
          to="/dashboards/hvl"
          className="flex items-center gap-2 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-2 text-xs font-semibold transition shrink-0"
        >
          <TrendingUp size={14} />
          <span>Hans van Leeuwen (SEO & Traffic)</span>
        </Link>
      </div>

      {/* MPG Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SaaS Workspace Hub</div>
          <div className="mt-2 text-xl font-bold text-foreground">13 Workspaces</div>
          <div className="mt-1 text-xs text-muted-foreground">5 Actieve merken gekoppeld</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Automated Jobs (LLM)</div>
          <div className="mt-2 text-xl font-bold text-foreground">275 Runs</div>
          <div className="mt-1 text-xs text-emerald-500 font-semibold">100% Success rate</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Production Deployment</div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono text-base">main @ dd39ddc</div>
          <div className="mt-1 text-xs text-emerald-500 font-semibold">Synced with Vercel</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">API Connectors</div>
          <div className="mt-2 text-xl font-bold text-foreground">Channable / Bol / eBay</div>
          <div className="mt-1 text-xs text-purple-400 font-semibold">K2 Secret Broker Ready</div>
        </div>
      </div>
    </div>
  );
}
