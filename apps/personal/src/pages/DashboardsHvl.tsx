import { Link } from "react-router-dom";
import { TrendingUp, ShoppingBag, Layers, Activity, Search, Globe, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardsHvl() {
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
            <span className="text-foreground">Hans van Leeuwen</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-base shadow-md shadow-emerald-500/20">
              HVL
            </div>
            <span>Hans van Leeuwen — SEO, Traffic & AI Visibility</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GA4 (395015361) · Google Search Console · Brand Radar Weekly · Content Audit
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
          className="flex items-center gap-2 rounded-xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 py-2 text-xs font-semibold transition shrink-0"
        >
          <Layers size={14} />
          <span>Marketplace Growth (MPG SaaS)</span>
        </Link>

        <Link
          to="/dashboards/hvl"
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs shrink-0"
        >
          <TrendingUp size={14} />
          <span>Hans van Leeuwen (SEO & Traffic)</span>
          <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-bold">Live</span>
        </Link>
      </div>

      {/* HVL Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">GSC Vertoningen (28d)</div>
          <div className="mt-2 text-xl font-bold text-foreground">18.420</div>
          <div className="mt-1 text-xs text-emerald-500 font-semibold">+14.2% vs vorige periode</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organische Klikken</div>
          <div className="mt-2 text-xl font-bold text-foreground">1.140</div>
          <div className="mt-1 text-xs text-emerald-500 font-semibold">CTR 6.19% (Sterk)</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gepubliceerde Artikelen</div>
          <div className="mt-2 text-xl font-bold text-foreground">46 Blogs</div>
          <div className="mt-1 text-xs text-muted-foreground">100% SEO Guard groen</div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Brand Visibility</div>
          <div className="mt-2 text-xl font-bold text-foreground">92 / 100</div>
          <div className="mt-1 text-xs text-purple-400 font-semibold">Gemini / Claude Citations</div>
        </div>
      </div>
    </div>
  );
}
