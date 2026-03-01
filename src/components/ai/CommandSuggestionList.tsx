import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import {
  type CommandSuggestion,
  getUsageCounts,
  incrementUsage,
  getTop10Commands,
} from "./commandSuggestions";

interface CommandSuggestionListProps {
  subId: string;
  context: "empire" | "hansai" | "unified";
  onSelect: (text: string) => void;
  onDismiss: () => void;
  accentColor: "emerald" | "violet" | "orange";
}

const colorStyles = {
  emerald: {
    bg: "bg-[hsl(220,20%,7%)] border-emerald-500/15",
    item: "hover:bg-emerald-500/8 text-emerald-300/70 hover:text-emerald-200",
    verified: "text-emerald-400",
    suggested: "text-emerald-500/40",
    badge: "bg-emerald-500/10 text-emerald-400/60",
    divider: "border-emerald-500/8",
  },
  violet: {
    bg: "bg-[hsl(220,20%,7%)] border-violet-500/15",
    item: "hover:bg-violet-500/8 text-violet-300/70 hover:text-violet-200",
    verified: "text-violet-400",
    suggested: "text-violet-500/40",
    badge: "bg-violet-500/10 text-violet-400/60",
    divider: "border-violet-500/8",
  },
  orange: {
    bg: "bg-[hsl(220,20%,7%)] border-orange-500/15",
    item: "hover:bg-orange-500/8 text-orange-300/70 hover:text-orange-200",
    verified: "text-orange-400",
    suggested: "text-orange-500/40",
    badge: "bg-orange-500/10 text-orange-400/60",
    divider: "border-orange-500/8",
  },
};

const CommandSuggestionList = ({ subId, context, onSelect, onDismiss, accentColor }: CommandSuggestionListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const colors = colorStyles[accentColor];
  const usageCounts = useMemo(() => getUsageCounts(context), [context, subId]);
  const sorted = useMemo(
    () => getTop10Commands(subId, context, usageCounts),
    [subId, context, usageCounts]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onDismiss(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onDismiss]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // Delay to avoid the subcategory click from immediately dismissing
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [onDismiss]);

  if (sorted.length === 0) return null;

  const handleClick = (cmd: CommandSuggestion) => {
    incrementUsage(context, cmd.text);
    onSelect(cmd.text);
  };

  return (
    <motion.div
      ref={listRef}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`relative z-30 overflow-hidden rounded-b-lg border-b border-x ${colors.bg} shadow-xl`}
    >
      <div className="max-h-[280px] overflow-y-auto py-1">
        {sorted.map((cmd, i) => {
          const usage = usageCounts[cmd.text] || 0;
          return (
            <button
              key={i}
              onClick={() => handleClick(cmd)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${colors.item}`}
            >
              {cmd.verified ? (
                <CheckCircle2 size={11} className={`shrink-0 ${colors.verified}`} />
              ) : (
                <Sparkles size={11} className={`shrink-0 ${colors.suggested}`} />
              )}
              <span className="flex-1 line-clamp-1">{cmd.text}</span>
              {usage > 0 && (
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono ${colors.badge}`}>
                  {usage}×
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CommandSuggestionList;
