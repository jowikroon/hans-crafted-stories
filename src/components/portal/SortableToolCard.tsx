import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Settings, Sparkles, GripVertical, Maximize2, Minimize2, Clock, X } from "lucide-react";
import { PortalTool } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import InfoTooltip from "./InfoTooltip";

/* ─── Category config ─── */
const categoryConfig: Record<string, { label: string; color: string; accent: string; dot: string }> = {
  seo:        { label: "SEO",          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", accent: "border-l-emerald-500", dot: "bg-emerald-500" },
  automation: { label: "Automation",   color: "bg-orange-500/10 text-orange-600 border-orange-500/20",   accent: "border-l-orange-500",  dot: "bg-orange-500" },
  data:       { label: "Data & Feeds", color: "bg-blue-500/10 text-blue-600 border-blue-500/20",         accent: "border-l-blue-500",    dot: "bg-blue-500" },
  ai:         { label: "AI",           color: "bg-violet-500/10 text-violet-600 border-violet-500/20",   accent: "border-l-violet-500",  dot: "bg-violet-500" },
  infra:      { label: "Infra",        color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",   accent: "border-l-indigo-500",  dot: "bg-indigo-500" },
  general:    { label: "General",      color: "bg-muted text-muted-foreground border-border",             accent: "border-l-border",      dot: "bg-muted-foreground" },
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
    external: "🌐 External App", "chrome-extension": "🧩 Chrome Extension",
  };
  return map[type] || "🔧 Tool";
};

const punchyDescriptions: Record<string, string> = {
  keyword: "Uncover hidden gems. AI digs through search intent so you don't have to.",
  webhook: "Fire & forget. Trigger any n8n workflow with one click — no tab-switching.",
  "site-audit": "X-ray any URL. Get a brutally honest SEO health check in seconds.",
  iframe: "Your workflow, embedded. Submit data without ever leaving the portal.",
  workflow: "Visualize the machine. See every node, every connection, every decision.",
  "ai-agent": "Your copilot awaits. Natural language in → structured actions out.",
  external: "Opens in a new tab. Click to launch this app.",
  "chrome-extension": "Install once, analyze everywhere. Right-click any page for instant insights.",
};

/* ─── Mock run history ─── */
const generateMockRuns = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i,
    status: Math.random() > 0.15 ? "success" : "error",
    timestamp: new Date(Date.now() - i * 3600000 * (2 + Math.random() * 6)).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    duration: `${(Math.random() * 4 + 0.2).toFixed(1)}s`,
  }));

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
  const [showHistory, setShowHistory] = useState(false);
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
  const successCount = runs.filter(r => r.status === "success").length;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isEditMode) return;
    if ((e.target as HTMLElement).closest("button")) return;
    onToolClick(tool);
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
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border border-l-[3px] ${cat.accent} bg-card text-left transition-all duration-300 ${
          !isEditMode ? "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20" : ""
        } ${isDragging ? "shadow-2xl" : ""}`}
        onClick={handleCardClick}
      >
        {/* ─── Edit mode controls ─── */}
        {isEditMode && (
          <div className="absolute left-1 top-1 z-10 flex items-center gap-0.5 sm:left-1.5 sm:top-1.5 sm:gap-1">
            <button {...attributes} {...listeners} className="cursor-grab rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing sm:p-1" aria-label="Drag to reorder">
              <GripVertical size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onCycleSize(tool.id); }} className="rounded p-0.5 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground sm:p-1" aria-label="Resize card">
              {cardSize === "1x1" ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
            <span className="hidden rounded bg-muted px-1 py-0.5 text-[8px] font-mono text-muted-foreground/50 sm:inline">{cardSize}</span>
          </div>
        )}

        {/* ─── Settings (admin) ─── */}
        {isAdmin && !isEditMode && (
          <button onClick={(e) => { e.stopPropagation(); onSettings(tool); }} className="absolute right-2 top-2 z-10 rounded-md p-1 text-muted-foreground/40 opacity-100 transition-all hover:bg-secondary hover:text-foreground md:opacity-0 md:group-hover:opacity-100" aria-label="Tool settings">
            <Settings size={13} />
          </button>
        )}

        {/* ═══ CARD FACE ═══ */}
        <div className={`flex flex-1 flex-col p-4 sm:p-4 ${isEditMode ? "mt-5" : ""}`}>

          {/* MOBILE: icon + title + category */}
          <div className="flex items-center gap-2.5 sm:hidden">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
              <IconComponent size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">{tool.name}</h3>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">{toolTypeLabel(tool.tool_type)}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
          </div>

          {/* SM+: Full header */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary ${tool.color}`}>
              <IconComponent size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="truncate font-display text-sm font-semibold text-foreground">{tool.name}</h3>
                <InfoTooltip text={tool.description || "Open this tool"} />
                <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">{toolTypeLabel(tool.tool_type)}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
          </div>

          {/* Description */}
          <p className={`mt-2 text-[11px] italic leading-relaxed text-muted-foreground/60 sm:text-muted-foreground/70 ${isLarge ? "line-clamp-3 not-italic text-xs" : "line-clamp-2"}`}>
            {punchyDescriptions[tool.tool_type] || tool.description}
          </p>

          {/* Features on large cards */}
          {isLarge && tool.features && tool.features.length > 0 && (
            <ul className="mt-2 hidden space-y-1 md:block">
              {tool.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                  <span className={`h-1 w-1 shrink-0 rounded-full ${cat.dot} opacity-50`} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* AI Agent CTA */}
          {tool.tool_type === "ai-agent" && !isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenTool(tool); }}
              className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-violet-500 bg-violet-500/10 px-2 py-1 text-[10px] font-medium text-violet-600 transition-all hover:bg-violet-500/20 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Sparkles size={11} />
              <span className="hidden sm:inline">Connect AI Agent</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          {/* Attributes */}
          {tool.attributes && tool.attributes.length > 0 && (
            <div className="mt-auto hidden flex-wrap gap-1.5 pt-2 sm:flex">
              {tool.attributes.slice(0, isLarge ? 6 : 3).map((attr) => (
                <Badge key={attr.id} variant="secondary" className="text-[10px] font-normal">{attr.key}: {attr.value}</Badge>
              ))}
              {tool.attributes.length > (isLarge ? 6 : 3) && (
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">+{tool.attributes.length - (isLarge ? 6 : 3)}</Badge>
              )}
            </div>
          )}

          {/* ─── History trigger button ─── */}
          {!isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              className="mt-auto flex min-h-[36px] items-center gap-1.5 self-start rounded-md px-2 py-1.5 text-[10px] font-medium text-muted-foreground/50 transition-all hover:bg-secondary hover:text-muted-foreground active:scale-[0.97] sm:min-h-0 sm:py-1 sm:text-[11px]"
            >
              <div className="flex items-center gap-0.5">
                {runs.slice(0, 5).map((r) => (
                  <span key={r.id} className={`h-1.5 w-1.5 rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                ))}
              </div>
              <span>{successCount}/10</span>
              <Clock size={9} />
            </button>
          )}
        </div>

        {/* ═══ HISTORY OVERLAY ═══ */}
        <AnimatePresence>
          {showHistory && !isEditMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20 flex flex-col rounded-xl bg-card/95 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Overlay header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2 sm:px-4">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-muted-foreground/60" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Run History</span>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status dots row */}
              <div className="flex items-center gap-1 px-3 pt-2 sm:px-4">
                {runs.map((r) => (
                  <div
                    key={r.id}
                    title={`${r.status} — ${r.timestamp}`}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                ))}
                <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">{successCount}/10 ok</span>
              </div>

              {/* Run list */}
              <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 sm:px-4">
                {runs.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary/60 sm:text-[11px]">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="flex-1 truncate">{r.timestamp}</span>
                    <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-medium ${r.status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                      {r.status === "success" ? "OK" : "ERR"}
                    </span>
                    <span className="shrink-0 font-mono text-muted-foreground/40">{r.duration}</span>
                  </div>
                ))}
              </div>

              {/* Open tool CTA */}
              <div className="border-t border-border px-3 py-2 sm:px-4">
                <button
                  onClick={() => { setShowHistory(false); onToolClick(tool); }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-[10px] font-semibold text-foreground transition-all hover:bg-secondary sm:text-xs"
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
