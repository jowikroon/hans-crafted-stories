import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Settings, Sparkles, GripVertical, Maximize2, Minimize2, ChevronDown, Clock } from "lucide-react";
import { PortalTool } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import InfoTooltip from "./InfoTooltip";

/* ─── Category visual config ─── */
const categoryConfig: Record<string, { label: string; color: string; bg: string; border: string; text: string; gradient: string }> = {
  seo:        { label: "SEO",          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", bg: "bg-emerald-500/[0.08]",  border: "border-emerald-500/25", text: "text-emerald-700 dark:text-emerald-400", gradient: "from-emerald-50/80 via-emerald-100/40 to-emerald-900/[0.12] dark:from-emerald-950/30 dark:via-emerald-900/20 dark:to-emerald-950/60" },
  automation: { label: "Automation",   color: "bg-orange-500/10 text-orange-600 border-orange-500/20",   bg: "bg-orange-500/[0.08]",   border: "border-orange-500/25",  text: "text-orange-700 dark:text-orange-400",  gradient: "from-orange-50/80 via-orange-100/40 to-orange-900/[0.12] dark:from-orange-950/30 dark:via-orange-900/20 dark:to-orange-950/60" },
  data:       { label: "Data & Feeds", color: "bg-blue-500/10 text-blue-600 border-blue-500/20",         bg: "bg-blue-500/[0.08]",     border: "border-blue-500/25",    text: "text-blue-700 dark:text-blue-400",      gradient: "from-blue-50/80 via-blue-100/40 to-blue-900/[0.12] dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-950/60" },
  ai:         { label: "AI",           color: "bg-violet-500/10 text-violet-600 border-violet-500/20",    bg: "bg-violet-500/[0.08]",   border: "border-violet-500/25",  text: "text-violet-700 dark:text-violet-400",  gradient: "from-violet-50/80 via-violet-100/40 to-violet-900/[0.12] dark:from-violet-950/30 dark:via-violet-900/20 dark:to-violet-950/60" },
  general:    { label: "General",      color: "bg-muted text-muted-foreground border-border",             bg: "bg-muted/60",            border: "border-border",         text: "text-foreground",                       gradient: "from-muted/60 via-muted/30 to-foreground/[0.06]" },
};

type CardSize = "1x1" | "2x1" | "2x2" | "1x2";

const sizeClasses: Record<CardSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
};

const sizeCycle: CardSize[] = ["1x1", "2x1", "2x2", "1x2"];

const toolTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    webhook: "⚡ Automation", keyword: "🔍 Research", "site-audit": "🩺 Audit",
    iframe: "📦 Embedded", workflow: "🔄 Workflow", "ai-agent": "🧠 AI Agent",
  };
  return map[type] || "🔧 Tool";
};

/* ─── Punchy micro-copy per tool type ─── */
const punchyDescriptions: Record<string, string> = {
  keyword: "Uncover hidden gems. AI digs through search intent so you don't have to.",
  webhook: "Fire & forget. Trigger any n8n workflow with one click — no tab-switching.",
  "site-audit": "X-ray any URL. Get a brutally honest SEO health check in seconds.",
  iframe: "Your workflow, embedded. Submit data without ever leaving the portal.",
  workflow: "Visualize the machine. See every node, every connection, every decision.",
  "ai-agent": "Your copilot awaits. Natural language in → structured actions out.",
};

/* ─── Mock run history (replace with real data later) ─── */
const generateMockRuns = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i,
    status: Math.random() > 0.15 ? "success" : "error",
    timestamp: new Date(Date.now() - i * 3600000 * (2 + Math.random() * 6)).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    duration: `${(Math.random() * 4 + 0.2).toFixed(1)}s`,
  }));

/* ─── Props ─── */
interface SortableToolCardProps {
  tool: PortalTool;
  index: number;
  isAdmin: boolean;
  isEditMode: boolean;
  cardSize: CardSize;
  IconComponent: React.ElementType;
  onToolClick: (tool: PortalTool) => void;
  onOpenTool: (tool: PortalTool) => void;
  onSettings: (tool: PortalTool) => void;
  onCycleSize: (toolId: string) => void;
}

const SortableToolCard = ({
  tool, index, isAdmin, isEditMode, cardSize, IconComponent,
  onToolClick, onOpenTool, onSettings, onCycleSize,
}: SortableToolCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [runs] = useState(generateMockRuns);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tool.id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  const isLarge = cardSize === "2x2" || cardSize === "1x2";
  const cat = tool.category ? categoryConfig[tool.category] || categoryConfig.general : categoryConfig.general;

  const handleCardClick = (e: React.MouseEvent) => {
    // In edit mode, do nothing on card click
    if (isEditMode) return;
    // If the click target is a button or inside one, let it handle itself
    if ((e.target as HTMLElement).closest("button")) return;
    // Toggle expanded run history
    setExpanded((prev) => !prev);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClasses[cardSize]} ${isEditMode ? "ring-2 ring-primary/10 ring-dashed" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        className={`group relative flex h-full cursor-pointer flex-col rounded-xl border-2 text-left transition-all duration-300 bg-gradient-to-b ${cat.gradient} ${cat.border} ${
          !isEditMode ? "hover:-translate-y-1 hover:shadow-xl hover:shadow-current/5" : ""
        } ${isDragging ? "shadow-2xl" : ""} ${expanded ? "!row-span-2" : ""}`}
        onClick={handleCardClick}
      >
        {/* ─── Edit mode controls ─── */}
        {isEditMode && (
          <div className="absolute left-1 top-1 z-10 flex items-center gap-0.5 sm:left-1.5 sm:top-1.5 sm:gap-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing sm:p-1"
              aria-label="Drag to reorder"
            >
              <GripVertical size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCycleSize(tool.id); }}
              className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground sm:p-1"
              aria-label="Resize card"
            >
              {cardSize === "1x1" ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
            <span className="hidden rounded bg-muted px-1 py-0.5 text-[8px] font-mono text-muted-foreground/50 sm:inline">
              {cardSize}
            </span>
          </div>
        )}

        {/* ─── Settings button (admin, non-edit) ─── */}
        {isAdmin && !isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onSettings(tool); }}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground/40 opacity-100 transition-all hover:bg-secondary hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
            aria-label="Tool settings"
          >
            <Settings size={13} />
          </button>
        )}

        {/* ═══ CARD BODY ═══ */}
        <div className={`flex flex-col p-2.5 sm:p-3.5 ${isEditMode ? "mt-5" : ""}`}>

          {/* ── MOBILE: icon + title only ── */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cat.bg} ${cat.text}`}>
              <IconComponent size={14} />
            </div>
            <h3 className={`min-w-0 flex-1 truncate text-xs font-semibold ${cat.text}`}>
              {tool.name}
            </h3>
          </div>

          {/* ── SM+: Full header ── */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.text} ring-1 ring-current/10`}>
              <IconComponent size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className={`truncate font-display text-sm font-semibold ${cat.text}`}>
                  {tool.name}
                </h3>
                <InfoTooltip text={tool.description || "Open this tool"} />
                <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
                {toolTypeLabel(tool.tool_type)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cat.color}`}>
              {cat.label}
            </span>
          </div>

          {/* ── Description: punchy micro-copy ── */}
          <p className={`mt-2 hidden text-[11px] italic leading-relaxed text-muted-foreground/80 sm:block ${isLarge ? "line-clamp-3 not-italic text-xs" : "line-clamp-2"}`}>
            {punchyDescriptions[tool.tool_type] || tool.description}
          </p>

          {/* ── Features: only on large cards at md+ ── */}
          {isLarge && tool.features && tool.features.length > 0 && (
            <ul className="mt-2 hidden space-y-1 md:block">
              {tool.features.slice(0, 4).map((f, i) => (
                <li key={i} className={`flex items-center gap-1.5 text-[11px] ${cat.text} opacity-70`}>
                  <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* ── AI Agent CTA ── */}
          {tool.tool_type === "ai-agent" && !isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenTool(tool); }}
              className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-violet-500 bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-600 shadow-[0_0_12px_hsl(270_80%_55%/0.15)] transition-all hover:bg-violet-500/20 hover:shadow-[0_0_16px_hsl(270_80%_55%/0.25)] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Sparkles size={11} />
              <span className="hidden sm:inline">Connect AI Agent</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          {/* ── Attributes: hidden on mobile ── */}
          {tool.attributes && tool.attributes.length > 0 && (
            <div className="mt-auto hidden flex-wrap gap-1.5 pt-2 sm:flex">
              {tool.attributes.slice(0, isLarge ? 6 : 3).map((attr) => (
                <Badge key={attr.id} variant="secondary" className="text-[10px] font-normal">
                  {attr.key}: {attr.value}
                </Badge>
              ))}
              {tool.attributes.length > (isLarge ? 6 : 3) && (
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  +{tool.attributes.length - (isLarge ? 6 : 3)}
                </Badge>
              )}
            </div>
          )}

          {/* ── Expand hint ── */}
          {!isEditMode && (
            <div className={`mt-auto flex items-center justify-center pt-1.5 transition-all ${expanded ? "opacity-50" : "opacity-0 group-hover:opacity-40"}`}>
              <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </div>
          )}
        </div>

        {/* ═══ RUN HISTORY PANEL ═══ */}
        <AnimatePresence>
          {expanded && !isEditMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-current/10"
            >
              <div className="px-2.5 py-2 sm:px-3.5 sm:py-2.5">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Clock size={10} className="text-muted-foreground/60" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last 10 runs</span>
                </div>

                {/* Run dots — quick glance */}
                <div className="mb-2 flex items-center gap-1">
                  {runs.map((r) => (
                    <div
                      key={r.id}
                      title={`${r.status} — ${r.timestamp}`}
                      className={`h-2 w-2 rounded-full transition-all ${
                        r.status === "success" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                  ))}
                </div>

                {/* Run rows */}
                <div className="space-y-0.5">
                  {runs.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary/50">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="flex-1 truncate">{r.timestamp}</span>
                      <span className="shrink-0 font-mono text-muted-foreground/50">{r.duration}</span>
                    </div>
                  ))}
                </div>

                {/* Open tool button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToolClick(tool); }}
                  className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[10px] font-semibold transition-all sm:text-xs ${cat.border} ${cat.text} hover:bg-secondary/50`}
                >
                  <ExternalLink size={10} />
                  Open Tool
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export { type CardSize, sizeCycle, sizeClasses, categoryConfig };
export default SortableToolCard;
