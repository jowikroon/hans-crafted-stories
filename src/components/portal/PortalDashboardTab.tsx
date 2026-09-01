import { motion } from "framer-motion";
import { Activity, FileText, LayoutDashboard, Wrench, Users, TrendingUp, Clock, ArrowUpRight, Database, Zap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface PortalDashboardTabProps {
  onNavigate: (tab: string) => void;
}

const quickLinks = [
  { id: "tools", label: "Tools", icon: Wrench, description: "Manage SEO tools and integrations", gradient: "from-orange-500/10 to-amber-500/5", iconBg: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20", border: "hover:border-orange-500/25" },
  { id: "content", label: "Content", icon: FileText, description: "Blog posts and case studies", gradient: "from-emerald-500/10 to-green-500/5", iconBg: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20", border: "hover:border-emerald-500/25" },
  { id: "pages", label: "Pages", icon: LayoutDashboard, description: "Page visibility and elements", gradient: "from-sky-500/10 to-blue-500/5", iconBg: "bg-sky-500/10 text-sky-500 group-hover:bg-sky-500/20", border: "hover:border-sky-500/25" },
  { id: "status", label: "Status", icon: Activity, description: "System health and uptime", gradient: "from-violet-500/10 to-purple-500/5", iconBg: "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20", border: "hover:border-violet-500/25" },
  { id: "users", label: "Users", icon: Users, description: "Manage user roles and access", gradient: "from-amber-500/10 to-yellow-500/5", iconBg: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20", border: "hover:border-amber-500/25" },
];

const PortalDashboardTab = ({ onNavigate }: PortalDashboardTabProps) => {
  return (
    <div className="space-y-10">
      {/* Featured Master Catalog Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-950 p-6 sm:p-8 backdrop-blur"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE DATABASE · BANDEL 30-MIN SCRAPER ACTIVE
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="text-blue-400" size={22} />
              CCP Marketplace Master Catalogus
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Single Source of Truth voor al onze 7.423 marketplace producten, GPSR-beschrijvingen, OE-nummers, 1600px afbeeldingen en automatische Bandel concurrentie-analyses.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition shrink-0"
          >
            <Zap size={14} /> Open Master Dashboard <ArrowUpRight size={14} />
          </Link>
        </div>
      </motion.div>

      {/* Quick access grid */}
      <div>
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">Quick Access</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(link.id)}
                className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border-2 border-border/50 bg-gradient-to-br ${link.gradient} p-5 text-left backdrop-blur-sm transition-all duration-300 ${link.border} hover:shadow-xl hover:shadow-foreground/[0.04]`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.iconBg} transition-all duration-300`}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className="flex w-full items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-foreground">{link.label}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/50">{link.description}</p>
                  </div>
                  <ArrowUpRight size={12} className="shrink-0 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-muted-foreground/40" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortalDashboardTab;
