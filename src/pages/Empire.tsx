import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Download } from "lucide-react";
import EmpireStatusGrid from "@/components/empire/EmpireStatusGrid";
import EmpireQuickActions from "@/components/empire/EmpireQuickActions";
import EmpireAuditTrail from "@/components/empire/EmpireAuditTrail";
import EmpireClaudePanel from "@/components/empire/EmpireClaudePanel";
import { Button } from "@/components/ui/button";

const BOOTSTRAP_FILES = [
  { name: "CLAUDE.md", path: "/empire/CLAUDE.md" },
  { name: "docker-compose.yml", path: "/empire/docker-compose.yml" },
  { name: "setup.sh", path: "/empire/setup.sh" },
];

const Empire = () => {
  const [claudeOpen, setClaudeOpen] = useState(false);

  useEffect(() => {
    document.title = "Empire Dashboard — Sovereign AI Operations";
  }, []);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => setClaudeOpen(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Terminal size={14} />
          Ask Claude
        </Button>
      </div>

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
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Bootstrap Files
        </h2>
        <div className="flex flex-wrap gap-2">
          {BOOTSTRAP_FILES.map((f) => (
            <a
              key={f.name}
              href={f.path}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/10 px-3 py-2 font-mono text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
            >
              <Download size={12} />
              {f.name}
            </a>
          ))}
        </div>
      </motion.div>

      <EmpireClaudePanel open={claudeOpen} onClose={() => setClaudeOpen(false)} />
    </div>
  );
};

export default Empire;
