import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Download, Crown } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import EmpireStatusGrid from "@/components/empire/EmpireStatusGrid";
import EmpireQuickActions from "@/components/empire/EmpireQuickActions";
import EmpireAuditTrail from "@/components/empire/EmpireAuditTrail";
import EmpireClaudePanel from "@/components/empire/EmpireClaudePanel";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const BOOTSTRAP_FILES = [
  { name: "CLAUDE.md", path: "/empire/CLAUDE.md" },
  { name: "docker-compose.yml", path: "/empire/docker-compose.yml" },
  { name: "setup.sh", path: "/empire/setup.sh" },
];

const Empire = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [claudeOpen, setClaudeOpen] = useState(false);

  // SEO — noindex internal tool
  useEffect(() => {
    document.title = "Empire Dashboard — Sovereign AI Operations";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, []);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220,20%,6%)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/portal" replace />;

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] text-[hsl(160,20%,85%)]">
      {/* Force dark overrides */}
      <style>{`
        .empire-page { --background: 220 20% 6%; --foreground: 160 20% 85%; --card: 220 18% 10%; --card-foreground: 160 20% 85%; --border: 220 15% 16%; --secondary: 220 15% 12%; --muted: 220 12% 18%; --muted-foreground: 160 10% 45%; }
      `}</style>

      <div className="empire-page mx-auto max-w-6xl px-6 pb-20 pt-24">
        <PageBreadcrumb items={[{ label: "Empire" }]} className="text-emerald-400/60 [&_a]:text-emerald-400/60 [&_a:hover]:text-emerald-300 [&_span.font-medium]:text-emerald-300" />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold tracking-tight text-emerald-300">
                Sovereign AI Empire
              </h1>
              <p className="text-xs text-emerald-400/40">Operations Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setClaudeOpen(true)}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
              size="sm"
            >
              <Terminal size={14} />
              Ask Claude
            </Button>
          </div>
        </motion.div>

        {/* Status Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <EmpireStatusGrid />
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <EmpireQuickActions />
        </motion.div>

        {/* Audit Trail */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
          <EmpireAuditTrail />
        </motion.div>

        {/* Bootstrap Files */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-purple-400/70">
            Bootstrap Files
          </h2>
          <div className="flex flex-wrap gap-2">
            {BOOTSTRAP_FILES.map((f) => (
              <a
                key={f.name}
                href={f.path}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/10 px-3 py-2 font-mono text-xs text-muted-foreground transition-all hover:border-purple-500/30 hover:text-purple-300"
              >
                <Download size={12} />
                {f.name}
              </a>
            ))}
          </div>
        </motion.div>
      </div>

      <EmpireClaudePanel open={claudeOpen} onClose={() => setClaudeOpen(false)} />
    </div>
  );
};

export default Empire;
