import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Activity, ChevronRight, ChevronLeft, Zap, Terminal, Hash } from "lucide-react";

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

const intensityColor = (count: number): string => {
  if (count === 0) return "rgba(0,255,136,0.05)";
  if (count === 1) return "rgba(0,255,136,0.2)";
  if (count <= 3) return "rgba(0,255,136,0.4)";
  if (count <= 6) return "rgba(0,255,136,0.6)";
  return "rgba(0,255,136,0.85)";
};

const typeIcon = (type: string) => {
  if (type === "slash") return <Hash size={10} className="shrink-0" style={{ color: "#00ff88" }} />;
  if (type === "workflow") return <Zap size={10} className="shrink-0" style={{ color: "#ffaa00" }} />;
  return <Terminal size={10} className="shrink-0" style={{ color: "#888" }} />;
};

const CommandSidebar = ({ commandHistory, onReplayCommand }: CommandSidebarProps) => {
  const [open, setOpen] = useState(false);
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
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute right-0 top-14 z-20 flex h-8 w-6 items-center justify-center rounded-l-md transition-all"
        style={{
          background: open ? "rgba(0,255,136,0.1)" : "#111",
          borderTop: "1px solid #1e1e1e",
          borderBottom: "1px solid #1e1e1e",
          borderLeft: "1px solid #1e1e1e",
          color: "#00ff88",
        }}
      >
        {open ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 overflow-hidden"
            style={{ borderLeft: "1px solid #1e1e1e" }}
          >
            <div className="flex h-full w-[260px] flex-col" style={{ background: "#0d0d0d" }}>
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid #1e1e1e" }}>
                <Activity size={12} style={{ color: "#00ff88" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#00ff88" }}>
                  Command Center
                </span>
              </div>

              {/* Activity Matrix */}
              <div className="px-3 py-3" style={{ borderBottom: "1px solid #1e1e1e" }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "#444" }}>
                    Activity — 12 weeks
                  </span>
                  <span className="text-[10px]" style={{ color: "#00ff88", opacity: 0.7 }}>
                    {totalToday} today
                  </span>
                </div>
                <div className="flex gap-[2px]">
                  {matrix.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[2px]">
                      {week.map((count, di) => (
                        <div
                          key={di}
                          className="h-[10px] w-[10px] rounded-[2px] transition-colors"
                          style={{ background: intensityColor(count) }}
                          title={`${count} command${count !== 1 ? "s" : ""}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-1 justify-end">
                  <span className="text-[9px]" style={{ color: "#333" }}>Less</span>
                  {[0, 1, 3, 6, 10].map((v, i) => (
                    <div
                      key={i}
                      className="h-[8px] w-[8px] rounded-[1px]"
                      style={{ background: intensityColor(v) }}
                    />
                  ))}
                  <span className="text-[9px]" style={{ color: "#333" }}>More</span>
                </div>
              </div>

              {/* Search */}
              <div className="px-3 py-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
                <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: "#1e1e1e", background: "#111" }}>
                  <Search size={11} style={{ color: "#444" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search commands..."
                    className="flex-1 bg-transparent text-[11px] outline-none placeholder:opacity-30"
                    style={{ color: "#ccc", fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* Recent Commands */}
              <div className="flex-1 overflow-y-auto px-1 py-1">
                <div className="px-2 py-1.5">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "#444" }}>
                    <Clock size={9} className="mr-1 inline" />
                    Recent Commands
                  </span>
                </div>
                {filtered.length === 0 ? (
                  <p className="px-2 py-4 text-center text-[11px]" style={{ color: "#333" }}>
                    {search ? "No matches" : "No commands yet"}
                  </p>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => onReplayCommand(cmd.text)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors"
                      style={{ color: "#888" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.06)";
                        (e.currentTarget as HTMLElement).style.color = "#ccc";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#888";
                      }}
                    >
                      {typeIcon(cmd.type)}
                      <span className="flex-1 truncate">{cmd.text}</span>
                      <span className="shrink-0 text-[9px]" style={{ color: "#333" }}>
                        {fmtTime(cmd.timestamp)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Keyboard hints */}
              <div className="px-3 py-2" style={{ borderTop: "1px solid #1e1e1e" }}>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {[
                    { key: "⌘E", label: "Empire" },
                    { key: "⌘J", label: "n8n" },
                    { key: "↑↓", label: "History" },
                    { key: "/", label: "Commands" },
                  ].map((h) => (
                    <div key={h.key} className="flex items-center gap-1">
                      <kbd
                        className="rounded px-1 py-0.5 font-mono text-[9px]"
                        style={{ background: "#1a1a1a", color: "#00ff88", border: "1px solid #222" }}
                      >
                        {h.key}
                      </kbd>
                      <span className="text-[9px]" style={{ color: "#444" }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandSidebar;
