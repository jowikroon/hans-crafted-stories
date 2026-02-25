import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { ExternalLink, Settings, Sparkles, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { PortalTool } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import InfoTooltip from "./InfoTooltip";

const iconMap: Record<string, any> = {};

const categoryConfig: Record<string, { label: string; color: string }> = {
  seo: { label: "SEO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  automation: { label: "Automation", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  data: { label: "Data & Feeds", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  ai: { label: "AI", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  general: { label: "General", color: "bg-muted text-muted-foreground border-border" },
};

type CardSize = "1x1" | "2x1" | "2x2" | "1x2";

const sizeClasses: Record<CardSize, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
};

const sizeCycle: CardSize[] = ["1x1", "2x1", "2x2", "1x2"];

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
  tool,
  index,
  isAdmin,
  isEditMode,
  cardSize,
  IconComponent,
  onToolClick,
  onOpenTool,
  onSettings,
  onCycleSize,
}: SortableToolCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  const isLarge = cardSize === "2x2" || cardSize === "1x2";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClasses[cardSize]} ${isEditMode ? "ring-2 ring-primary/10 ring-dashed" : ""}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`group relative flex h-full cursor-pointer flex-col rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg ${
          !isEditMode ? "hover:-translate-y-0.5" : ""
        } ${isDragging ? "shadow-2xl" : ""}`}
        onClick={() => !isEditMode && onToolClick(tool)}
      >
        {/* Edit mode controls */}
        {isEditMode && (
          <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab rounded p-1 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCycleSize(tool.id); }}
              className="rounded p-1 text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Resize card"
            >
              {cardSize === "1x1" ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <span className="rounded bg-muted px-1 py-0.5 text-[8px] font-mono text-muted-foreground/50">
              {cardSize}
            </span>
          </div>
        )}

        {/* Settings button (admin) */}
        {isAdmin && !isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onSettings(tool); }}
            className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground/40 opacity-100 transition-all hover:bg-secondary hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
            aria-label="Tool settings"
          >
            <Settings size={13} />
          </button>
        )}

        {/* Card content */}
        <div className={`flex items-center gap-2.5 ${isEditMode ? "mt-5" : ""}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
            <IconComponent size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="truncate font-display text-sm font-medium text-foreground">
                {tool.name}
              </h3>
              <InfoTooltip text={tool.description || "Open this tool"} />
              <ExternalLink size={10} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
              {tool.tool_type === "webhook" ? "Automation" : tool.tool_type === "keyword" ? "Research" : tool.tool_type === "site-audit" ? "Audit" : tool.tool_type === "iframe" ? "Embedded" : tool.tool_type === "workflow" ? "Workflow" : tool.tool_type === "ai-agent" ? "AI Agent" : "Tool"}
            </p>
          </div>
          {tool.category && categoryConfig[tool.category] && (
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${categoryConfig[tool.category].color}`}>
              {categoryConfig[tool.category].label}
            </span>
          )}
        </div>

        {/* Description — expands on larger cards */}
        <p className={`mt-2 text-xs leading-relaxed text-muted-foreground ${isLarge ? "line-clamp-4" : "line-clamp-1"}`}>
          {tool.description}
        </p>

        {/* Features list for large cards */}
        {isLarge && tool.features && tool.features.length > 0 && (
          <ul className="mt-2 space-y-1">
            {tool.features.slice(0, 4).map((f, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <span className="h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* AI Agent button */}
        {tool.tool_type === "ai-agent" && !isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenTool(tool); }}
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-violet-500 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 shadow-[0_0_12px_hsl(270_80%_55%/0.15)] transition-all hover:bg-violet-500/20 hover:shadow-[0_0_16px_hsl(270_80%_55%/0.25)]"
          >
            <Sparkles size={12} />
            Connect AI Agent
          </button>
        )}

        {/* Attributes */}
        {tool.attributes && tool.attributes.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
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
      </motion.div>
    </div>
  );
};

export { type CardSize, sizeCycle, sizeClasses, categoryConfig };
export default SortableToolCard;
