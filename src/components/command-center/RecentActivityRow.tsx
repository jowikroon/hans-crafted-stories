import { Clock, Hash, Zap, Terminal } from "lucide-react";

interface CommandEntry {
  text: string;
  timestamp: number;
  type: "slash" | "ai" | "workflow";
}

interface RecentActivityRowProps {
  commands: CommandEntry[];
  onReplay: (cmd: string) => void;
  onViewAll?: () => void;
}

const typeIcon = (type: string) => {
  if (type === "slash") return <Hash size={10} className="shrink-0 text-primary" />;
  if (type === "workflow") return <Zap size={10} className="shrink-0 text-amber-500" />;
  return <Terminal size={10} className="shrink-0 text-muted-foreground" />;
};

const RecentActivityRow = ({ commands, onReplay, onViewAll }: RecentActivityRowProps) => {
  const recent = commands.slice(-5).reverse();

  if (recent.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-card/30 px-4 py-3">
        <Clock size={12} className="text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/40">No recent commands</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
          <Clock size={9} />
          Recent
        </span>
        {onViewAll && commands.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-[10px] font-medium text-primary/60 transition-colors hover:text-primary"
          >
            View all
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {recent.map((cmd, i) => (
          <button
            key={i}
            onClick={() => onReplay(cmd.text)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 px-3 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
          >
            {typeIcon(cmd.type)}
            <span className="max-w-[120px] truncate">{cmd.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityRow;
