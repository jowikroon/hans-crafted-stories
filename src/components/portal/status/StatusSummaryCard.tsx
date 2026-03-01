import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import StatusChip, { type StatusLevel } from "./StatusChip";
import { cn } from "@/lib/utils";

interface StatusSummaryCardProps {
  icon: LucideIcon;
  title: string;
  summary: string;
  level: StatusLevel;
  onClick: () => void;
  className?: string;
}

const StatusSummaryCard = ({ icon: Icon, title, summary, level, onClick, className }: StatusSummaryCardProps) => {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-2xl border border-border/40 bg-card px-5 py-4 transition-all duration-300",
        "hover:border-primary/20 hover:bg-primary/[0.02] hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-muted-foreground">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground tracking-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">{summary}</p>
      </div>
      <StatusChip level={level} />
    </Card>
  );
};

export default StatusSummaryCard;
