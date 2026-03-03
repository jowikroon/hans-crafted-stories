import { motion } from "framer-motion";
import { Activity, FileText, LayoutDashboard, Wrench, Users, TrendingUp, Clock } from "lucide-react";

interface PortalDashboardTabProps {
  onNavigate: (tab: string) => void;
}

const quickLinks = [
  { id: "tools", label: "Tools", icon: Wrench, description: "Manage SEO tools and integrations", accent: "text-orange-500" },
  { id: "content", label: "Content", icon: FileText, description: "Blog posts and case studies", accent: "text-emerald-500" },
  { id: "pages", label: "Pages", icon: LayoutDashboard, description: "Page visibility and elements", accent: "text-sky-500" },
  { id: "status", label: "Status", icon: Activity, description: "System health and uptime", accent: "text-violet-500" },
  { id: "users", label: "Users", icon: Users, description: "Manage user roles and access", accent: "text-amber-500" },
];

const PortalDashboardTab = ({ onNavigate }: PortalDashboardTabProps) => {
  return (
    <div className="space-y-8">
      {/* Quick access grid */}
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Quick Access</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(link.id)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-foreground/[0.03]"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/60 ${link.accent} transition-colors group-hover:bg-secondary`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{link.label}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/60">{link.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Activity summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-muted-foreground/50">
            <TrendingUp size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Overview</span>
          </div>
          <p className="text-sm text-muted-foreground">Your portal is running smoothly. Use the quick access cards above to manage your tools and content.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-muted-foreground/50">
            <Clock size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Recent</span>
          </div>
          <p className="text-sm text-muted-foreground">Check the Status tab for system health, or manage Content to keep your site fresh.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalDashboardTab;
