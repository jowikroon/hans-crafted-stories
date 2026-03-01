import type { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

const QuickActionCard = ({ icon: Icon, label, description, onClick }: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/30 p-4 text-left transition-all duration-300 hover:border-primary/30 hover:bg-card/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary/60 transition-colors group-hover:bg-primary/[0.15] group-hover:text-primary">
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-1">{description}</p>
      </div>
    </button>
  );
};

export default QuickActionCard;
