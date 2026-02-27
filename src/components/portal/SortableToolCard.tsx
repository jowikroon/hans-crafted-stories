import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { ExternalLink, Settings, Sparkles, GripVertical, Maximize2, Minimize2, Search, Zap, Globe, Cpu, Bot, Code, BarChart3, Rss, Puzzle, Workflow } from "lucide-react";
import { PortalTool } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";


/* ─── Category config ─── */
const categoryConfig: Record<string, { label: string; color: string; accent: string; dot: string; gradient: string }> = {
  seo:        { label: "SEO",          color: "text-emerald-500 border-emerald-500/25",  accent: "border-l-emerald-500", dot: "bg-emerald-500", gradient: "from-emerald-500/8 via-emerald-500/4 to-transparent" },
  automation: { label: "Automation",   color: "text-orange-500 border-orange-500/25",    accent: "border-l-orange-500",  dot: "bg-orange-500",  gradient: "from-orange-500/8 via-orange-500/4 to-transparent" },
  data:       { label: "Data & Feeds", color: "text-sky-500 border-sky-500/25",          accent: "border-l-sky-500",     dot: "bg-sky-500",     gradient: "from-sky-500/8 via-sky-500/4 to-transparent" },
  ai:         { label: "AI",           color: "text-violet-500 border-violet-500/25",    accent: "border-l-violet-500",  dot: "bg-violet-500",  gradient: "from-violet-500/8 via-violet-500/4 to-transparent" },
  infra:      { label: "Infra",        color: "text-indigo-500 border-indigo-500/25",    accent: "border-l-indigo-500",  dot: "bg-indigo-500",  gradient: "from-indigo-500/8 via-indigo-500/4 to-transparent" },
  general:    { label: "General",      color: "text-muted-foreground border-border",     accent: "border-l-border",      dot: "bg-muted-foreground", gradient: "from-muted/20 via-muted/10 to-transparent" },
};

type CardSize = "1x1" | "2x1" | "2x2" | "1x2";

const sizeClasses: Record<CardSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
};

const sizeCycle: CardSize[] = ["1x1", "2x1", "2x2", "1x2"];

/* ─── Modern tool type icons & labels ─── */
const toolTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  webhook:            { icon: Zap,      label: "Automation" },
  keyword:            { icon: Search,   label: "Research" },
  "site-audit":       { icon: BarChart3, label: "Audit" },
  iframe:             { icon: Code,     label: "Embedded" },
  workflow:           { icon: Workflow,  label: "Workflow" },
  "ai-agent":         { icon: Bot,      label: "AI Agent" },
  external:           { icon: Globe,    label: "External" },
  "chrome-extension": { icon: Puzzle,   label: "Extension" },
};

const getToolTypeConfig = (type: string) => toolTypeConfig[type] || { icon: Cpu, label: "Tool" };

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
  const typeConfig = getToolTypeConfig(tool.tool_type);
  const TypeIcon = typeConfig.icon;

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
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm text-left transition-all duration-300 ${
          !isEditMode ? "hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/[0.03] hover:border-primary/25" : ""
        } ${isDragging ? "shadow-2xl" : ""}`}
        onClick={handleCardClick}
      >
        {/* Gradient glass overlay */}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-80 transition-opacity group-hover:opacity-100`} />
        
        {/* Subtle top accent line */}
        <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r ${cat.gradient.replace('to-transparent', 'to-transparent')} opacity-60`} />

        {/* ─── Edit mode controls ─── */}
        {isEditMode && (
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1">
            <button {...attributes} {...listeners} className="cursor-grab rounded-lg p-1 text-muted-foreground/40 backdrop-blur-sm transition-colors hover:bg-secondary/80 hover:text-foreground active:cursor-grabbing" aria-label="Drag to reorder">
              <GripVertical size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onCycleSize(tool.id); }} className="rounded-lg p-1 text-muted-foreground/40 backdrop-blur-sm transition-colors hover:bg-secondary/80 hover:text-foreground" aria-label="Resize card">
              {cardSize === "1x1" ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            </button>
            <span className="hidden rounded-md bg-muted/80 px-1.5 py-0.5 text-[8px] font-mono text-muted-foreground/50 sm:inline">{cardSize}</span>
          </div>
        )}

        {/* ─── Settings (admin) ─── */}
        {isAdmin && !isEditMode && (
          <button onClick={(e) => { e.stopPropagation(); onSettings(tool); }} className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground/30 opacity-100 transition-all hover:bg-secondary/80 hover:text-foreground md:opacity-0 md:group-hover:opacity-100" aria-label="Tool settings">
            <Settings size={14} />
          </button>
        )}

        {/* ═══ CARD FACE ═══ */}
        <div className={`relative flex flex-1 flex-col p-4 sm:p-5 ${isEditMode ? "mt-5" : ""}`}>

          {/* MOBILE: icon + title + category */}
          <div className="flex items-center gap-3 sm:hidden">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} border border-border/40 ${cat.color.split(' ')[0]}`}>
              <IconComponent size={16} />
            </div>
          <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold leading-snug text-foreground line-clamp-2">{tool.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TypeIcon size={10} className="text-muted-foreground/50" />
                <p className="text-[10px] font-medium text-muted-foreground/60">{typeConfig.label}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
          </div>

          {/* SM+: Full header */}
          <div className="hidden items-start gap-3 sm:flex">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} border border-border/40 shadow-sm ${cat.color.split(' ')[0]}`}>
              <IconComponent size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-[14px] sm:text-[15px] font-semibold leading-snug text-foreground line-clamp-2 break-words">{tool.name}</h3>
                <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1">
                  <TypeIcon size={10} className="text-muted-foreground/50" />
                  <p className="text-[10px] font-medium text-muted-foreground/50">{typeConfig.label}</p>
                </div>
                <span className="text-muted-foreground/20">·</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${cat.color.split(' ')[0]}`}>{cat.label}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className={`mt-3 text-[11px] leading-relaxed text-muted-foreground/60 sm:text-[12px] sm:text-muted-foreground/65 ${isLarge ? "line-clamp-3 text-xs" : "line-clamp-2"}`}>
            {punchyDescriptions[tool.tool_type] || tool.description}
          </p>

          {/* Features on large cards */}
          {isLarge && tool.features && tool.features.length > 0 && (
            <ul className="mt-3 hidden space-y-1.5 md:block">
              {tool.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground/65">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cat.dot} opacity-40`} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* AI Agent CTA */}
          {tool.tool_type === "ai-agent" && !isEditMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenTool(tool); }}
              className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[11px] font-semibold text-violet-500 transition-all hover:bg-violet-500/20 hover:border-violet-500/50"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Connect AI Agent</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          {/* Attributes */}
          {tool.attributes && tool.attributes.length > 0 && (
            <div className="mt-auto hidden flex-wrap gap-1.5 pt-3 sm:flex">
              {tool.attributes.slice(0, isLarge ? 6 : 3).map((attr) => (
                <Badge key={attr.id} variant="secondary" className="rounded-lg border-border/50 bg-secondary/60 text-[10px] font-normal backdrop-blur-sm">{attr.key}: {attr.value}</Badge>
              ))}
              {tool.attributes.length > (isLarge ? 6 : 3) && (
                <Badge variant="outline" className="rounded-lg text-[10px] font-normal text-muted-foreground">+{tool.attributes.length - (isLarge ? 6 : 3)}</Badge>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export { type CardSize, sizeCycle, sizeClasses, categoryConfig };
export default SortableToolCard;
