import { useState, useMemo } from "react";
import { Search, Clock, Activity, Hash, Zap, Terminal } from "lucide-react";

interface CommandEntry {
  text: string;
  timestamp: number;
  type: "slash" | "ai" | "workflow";
}

interface CommandSidebarProps {
  commandHistory: CommandEntry[];
  onReplayCommand: (cmd: string) => void;
}

// Generate activity matrix data (last 12 weeks × 7 days)
const generateActivityMatrix = (history: CommandEntry[]) => {
  const now = Date.now();
  const DAY = 86400000;
  const weeks = 12;
  const grid: number[][] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = now - (w * 7 + (6 - d)) * DAY;
      const dayEnd = dayStart + DAY;
      const count = history.filter((c) => c.timestamp >= dayStart && c.timestamp < dayEnd).length;
      week.push(count);
    }
    grid.push(week);
  }
  return grid;
};

const intensityClass = (count: number): string => {
  if (count === 0) return "bg-primary/5";
  if (count === 1) return "bg-primary/20";
  if (count <= 3) return "bg-primary/40";
  if (count <= 6) return "bg-primary/60";
  return "bg-primary/80";
};

const typeIcon = (type: string) => {
  if (type === "slash") return <Hash size={10} className="shrink-0 text-primary" />;
  if (type === "workflow") return <Zap size={10} className="shrink-0 text-amber-500" />;
  return <Terminal size={10} className="shrink-0 text-muted-foreground" />;
};

const CommandSidebar = ({ commandHistory, onReplayCommand }: CommandSidebarProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return commandHistory.slice(-20).reverse();
    const q = search.toLowerCase();
    return commandHistory
      .filter((c) => c.text.toLowerCase().includes(q))
      .slice(-20)
      .reverse();
  }, [commandHistory, search]);

  const matrix = useMemo(() => generateActivityMatrix(commandHistory), [commandHistory]);
  const totalToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return commandHistory.filter((c) => c.timestamp >= start.getTime()).length;
  }, [commandHistory]);

  const fmtTime = (t: number) => {
    const d = new Date(t);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Activity Matrix */}
      <div className="border-b border-border/30 px-1 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">
            Activity — 12 weeks
          </span>
          <span className="text-[10px] text-primary/60">
            {totalToday} today
          </span>
        </div>
        <div className="flex gap-[2px]">
          {matrix.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((count, di) => (
                <div
                  key={di}
                  className={`h-[10px] w-[10px] rounded-[2px] transition-colors ${intensityClass(count)}`}
                  title={`${count} command${count !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1 justify-end">
          <span className="text-[9px] text-muted-foreground/30">Less</span>
          {[0, 1, 3, 6, 10].map((v, i) => (
            <div key={i} className={`h-[8px] w-[8px] rounded-[1px] ${intensityClass(v)}`} />
          ))}
          <span className="text-[9px] text-muted-foreground/30">More</span>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border/30 px-1 py-2">
        <div className="flex items-center gap-2 rounded-md border border-border/30 bg-card/40 px-2 py-1.5">
          <Search size={11} className="text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* Recent Commands */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="px-1 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">
            <Clock size={9} className="mr-1 inline" />
            Recent Commands
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-muted-foreground/30">
            {search ? "No matches" : "No commands yet"}
          </p>
        ) : (
          filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => onReplayCommand(cmd.text)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
            >
              {typeIcon(cmd.type)}
              <span className="flex-1 truncate">{cmd.text}</span>
              <span className="shrink-0 text-[9px] text-muted-foreground/30">
                {fmtTime(cmd.timestamp)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CommandSidebar;
