import { motion } from "framer-motion";
import { Download } from "lucide-react";
import EmpireStatusGrid from "@/components/empire/EmpireStatusGrid";
import EmpireQuickActions from "@/components/empire/EmpireQuickActions";
import EmpireAuditTrail from "@/components/empire/EmpireAuditTrail";

const BOOTSTRAP_FILES = [
  { name: "CLAUDE.md", path: "/empire/CLAUDE.md" },
  { name: "docker-compose.yml", path: "/empire/docker-compose.yml" },
  { name: "setup.sh", path: "/empire/setup.sh" },
  { name: "backup.sh", path: "/empire/backup.sh" },
  { name: "self-repair-v1.json", path: "/workflows/self-repair-v1.json", hint: "Import into n8n: Settings → Import Workflow" },
];

const PortalEmpireTab = () => {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <EmpireStatusGrid />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <EmpireQuickActions />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <EmpireAuditTrail />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          Bootstrap Files
        </h2>
        <div className="flex flex-wrap gap-2">
          {BOOTSTRAP_FILES.map((f) => (
            <a
              key={f.name}
              href={f.path}
              download
              title={f.hint}
              className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 font-mono text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
            >
              <Download size={12} />
              {f.name}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PortalEmpireTab;
