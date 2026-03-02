import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, FileText, HeartPulse, ScrollText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WORKFLOWS, N8N_BASE } from "@/lib/config/workflows";

interface QuickAction {
  icon: typeof Zap;
  label: string;
  description: string;
  webhookKey: string;
}

const ICON_MAP: Record<string, typeof Zap> = {
  autoseo: Zap,
  "product-titles": FileText,
  "health-check": HeartPulse,
};

const ACTIONS: QuickAction[] = [
  ...WORKFLOWS.filter((w) => ["autoseo", "product-titles", "health-check"].includes(w.name)).map((w) => ({
    icon: ICON_MAP[w.name] || Zap,
    label: w.label,
    description: w.description,
    webhookKey: w.name,
  })),
  { icon: ScrollText, label: "Audit Trail", description: "View recent events", webhookKey: "audit" },
];

const EmpireQuickActions = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerAction = async (action: QuickAction) => {
    setLoading(action.webhookKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const authHeader = `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

      const wfDef = WORKFLOWS.find((w) => w.name === action.webhookKey);

      if (wfDef?.direct) {
        const res = await fetch(wfDef.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ source: "empire-dashboard", timestamp: new Date().toISOString() }),
        });
        const data = await res.json();
        const online = data.services
          ? Object.values(data.services as Record<string, { ok: boolean }>).filter((s) => s.ok).length
          : 0;
        const total = data.services ? Object.keys(data.services).length : 0;
        toast({
          title: res.ok ? `${action.label}: ${online}/${total} online` : `${action.label} failed`,
          description: res.ok ? "Health check completed." : "Edge function error.",
        });
      } else {
        const webhookUrl = wfDef?.webhook || `${N8N_BASE}/webhook/${action.webhookKey}`;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({
            webhook_url: webhookUrl,
            payload: { source: "empire-dashboard", action: action.webhookKey, timestamp: new Date().toISOString() },
          }),
        });
        const data = await res.json();
        toast({
          title: data.success ? `${action.label} triggered` : `${action.label} failed`,
          description: data.success ? "Workflow started successfully." : (data.error || "Check n8n logs."),
        });
      }
    } catch {
      toast({ title: "Connection error", description: "Could not reach webhook endpoint." });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/70">
          Quick Actions
        </h2>
        <span className="text-[10px] text-muted-foreground/40">
          For intent-based runs, use <span className="text-orange-400/60">Command Center</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          const isLoading = loading === action.webhookKey;
          return (
            <motion.button
              key={action.webhookKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => triggerAction(action)}
              disabled={!!loading}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-secondary/10 px-3 py-4 transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.05] disabled:opacity-40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/40 text-amber-400/70 transition-colors group-hover:text-amber-400">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
              </div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default EmpireQuickActions;
