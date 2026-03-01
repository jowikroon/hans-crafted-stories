import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, PenLine, HelpCircle, Clock, CheckCircle2 } from "lucide-react";

const PLACEHOLDERS = [
  "Research keywords for brake pads",
  "Write a meta description for the homepage",
  "Check SEO score for /products",
];

const getRecentCommands = (): string[] => {
  try {
    const raw = localStorage.getItem("portal_chat_history_unified");
    if (!raw) return PLACEHOLDERS;
    const parsed = JSON.parse(raw);
    const msgs = Array.isArray(parsed) ? parsed : parsed?.messages ?? [];
    const userMsgs = msgs
      .filter((m: any) => m.role === "user" && m.content?.trim())
      .map((m: any) => m.content.trim())
      .slice(-3)
      .reverse();
    return userMsgs.length ? userMsgs : PLACEHOLDERS;
  } catch {
    return PLACEHOLDERS;
  }
};

const Node = ({
  children,
  accent = "orange",
  small = false,
  className = "",
}: {
  children: React.ReactNode;
  accent?: string;
  small?: boolean;
  className?: string;
}) => {
  const colors: Record<string, string> = {
    orange: "border-orange-500/40 bg-orange-500/5",
    emerald: "border-emerald-500/40 bg-emerald-500/5",
    amber: "border-amber-500/40 bg-amber-500/5",
    violet: "border-violet-500/40 bg-violet-500/5",
    cyan: "border-cyan-500/40 bg-cyan-500/5",
    muted: "border-border bg-card/60",
  };
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center ${small ? "text-[10px]" : "text-xs"} ${colors[accent] ?? colors.muted} ${className}`}
    >
      {children}
    </div>
  );
};

const Connector = ({ className = "" }: { className?: string }) => (
  <div className={`mx-auto h-5 w-px bg-orange-500/30 ${className}`} />
);

const WikiCommandFlow = () => {
  const commands = useMemo(getRecentCommands, []);
  const isLive = commands !== PLACEHOLDERS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-3 space-y-0"
    >
      {/* Live badge */}
      {isLive && (
        <p className="mb-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live — showing your recent commands
        </p>
      )}

      {/* Step 1: Your Request */}
      <Node accent="orange">
        <p className="font-semibold text-foreground">Your Request</p>
        <p className="mt-0.5 truncate text-muted-foreground italic">
          "{commands[0]}"
        </p>
      </Node>

      <Connector />

      {/* Step 2: Understand Intent */}
      <Node accent="amber">
        <p className="font-semibold text-foreground">Understand Intent</p>
        <p className="text-muted-foreground">AI analyzes your goal</p>
      </Node>

      <Connector />

      {/* Step 3: Preview Action */}
      <Node accent="muted">
        <p className="mb-1.5 font-semibold text-foreground">Preview Action</p>
        <p className="text-muted-foreground">What should happen next?</p>
      </Node>

      {/* 3 branches */}
      <div className="relative flex items-start justify-center gap-2 py-1">
        {/* Horizontal connector line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-orange-500/20" />

        {[
          { label: "Execute", desc: "Run workflow", icon: Play, accent: "emerald" as const },
          { label: "Modify", desc: "Adjust input", icon: PenLine, accent: "amber" as const },
          { label: "Clarify", desc: "Ask follow-up", icon: HelpCircle, accent: "violet" as const },
        ].map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="h-3 w-px bg-orange-500/20" />
            <Node accent={b.accent} small className="w-full">
              <b.icon size={11} className="mx-auto mb-0.5 text-muted-foreground" />
              <p className="font-medium text-foreground">{b.label}</p>
              <p className="text-muted-foreground">{b.desc}</p>
            </Node>
          </div>
        ))}
      </div>

      <Connector />

      {/* Step 4: Live Result */}
      <Node accent="emerald">
        <p className="font-semibold text-foreground">Live Result</p>
        <p className="text-muted-foreground">Answer appears in real time</p>
      </Node>

      <Connector />

      {/* Step 5: Saved to History */}
      <Node accent="muted">
        <div className="flex items-center justify-center gap-1.5">
          <Clock size={11} className="text-muted-foreground" />
          <p className="font-semibold text-foreground">Saved to History</p>
        </div>
        <p className="text-muted-foreground">Stored for next time</p>
      </Node>

      {/* Recent commands list */}
      {commands.length > 1 && (
        <div className="mt-3 rounded-lg border border-border bg-card/40 p-2.5">
          <p className="mb-1.5 text-[10px] font-medium text-muted-foreground/70">
            {isLive ? "Your recent commands" : "Example commands"}
          </p>
          <div className="space-y-1">
            {commands.map((cmd, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CheckCircle2 size={10} className="shrink-0 text-orange-400/60" />
                <span className="truncate">{cmd}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WikiCommandFlow;
