import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusLevel = "ok" | "warning" | "critical" | "checking";

interface StatusChipProps {
  level: StatusLevel;
  className?: string;
}

const config: Record<StatusLevel, { label: string; icon: typeof CheckCircle2; bg: string; text: string }> = {
  ok: { label: "OK", icon: CheckCircle2, bg: "bg-emerald-500/[0.08]", text: "text-emerald-500" },
  warning: { label: "Warning", icon: AlertTriangle, bg: "bg-amber-500/[0.08]", text: "text-amber-500" },
  critical: { label: "Critical", icon: XCircle, bg: "bg-destructive/[0.08]", text: "text-destructive" },
  checking: { label: "Checking", icon: CheckCircle2, bg: "bg-muted", text: "text-muted-foreground/40" },
};

const StatusChip = ({ level, className }: StatusChipProps) => {
  const c = config[level];
  const Icon = c.icon;

  if (level === "checking") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", c.bg, c.text, className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        {c.label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", c.bg, c.text, className)}>
      <Icon size={12} strokeWidth={2} />
      {c.label}
    </span>
  );
};

export default StatusChip;
