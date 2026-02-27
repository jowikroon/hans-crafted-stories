import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Wrench, Workflow, Globe, Plus, Settings, AppWindow, FileJson, Sparkles, Pencil, Check, X, Bot, Search, Zap, BarChart3, Code, Puzzle, Cpu } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { portalApi, PortalTool } from "@/lib/api/portal";
import { usersApi, UserToolAccess } from "@/lib/api/users";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import SiteAuditModal from "./SiteAuditModal";
import WebhookTriggerModal from "./WebhookTriggerModal";
import KeywordResearchModal from "./KeywordResearchModal";
import ToolSettingsModal from "./ToolSettingsModal";
import AddToolModal from "./AddToolModal";
import ToolPreviewModal from "./ToolPreviewModal";
import IframeToolModal from "./IframeToolModal";
import WorkflowViewerModal from "./WorkflowViewerModal";
import N8nAgentModal from "./N8nAgentModal";

import SortableToolCard, { type CardSize, sizeCycle, categoryConfig } from "./SortableToolCard";

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe, AppWindow, FileJson, Sparkles, Bot, Search, Zap, BarChart3, Code, Puzzle, Cpu };
const getIcon = (name: string) => iconMap[name] || Wrench;


interface PortalToolsTabProps {
  userId: string;
  isAdmin?: boolean;
  subFilter?: string;
}

const PortalToolsTab = ({ userId, isAdmin = false, subFilter }: PortalToolsTabProps) => {
  const { toast } = useToast();
  const [tools, setTools] = useState<PortalTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [settingsTool, setSettingsTool] = useState<PortalTool | null>(null);
  const [showAddTool, setShowAddTool] = useState(false);
  const [previewTool, setPreviewTool] = useState<PortalTool | null>(null);
  const [accessMap, setAccessMap] = useState<Record<string, UserToolAccess> | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Sync sub-menu filter from parent
  useEffect(() => {
    if (!subFilter || subFilter === "All") {
      setActiveFilter(null);
    } else {
      const map: Record<string, string> = { SEO: "seo", Automation: "automation", Data: "data", AI: "ai", General: "general" };
      setActiveFilter(map[subFilter] || null);
    }
  }, [subFilter]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardSizes, setCardSizes] = useState<Record<string, CardSize>>({});
  const seedingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (seedingRef.current) return;
    seedingRef.current = true;
    const loadTools = async () => {
      setToolsLoading(true);
      try {
        const dbTools = await portalApi.getTools();
        setTools(dbTools);

        // Load saved card sizes from config
        const sizes: Record<string, CardSize> = {};
        for (const t of dbTools) {
          const cfg = (t.config || {}) as Record<string, unknown>;
          if (cfg.grid_size && sizeCycle.includes(cfg.grid_size as CardSize)) {
            sizes[t.id] = cfg.grid_size as CardSize;
          }
        }
        setCardSizes(sizes);

        if (!isAdmin) {
          const access = await usersApi.getToolAccess(userId);
          const map: Record<string, UserToolAccess> = {};
          for (const a of access) map[a.tool_id] = a;
          setAccessMap(map);
        }
      } catch (err) {
        console.error("Failed to load tools:", err);
        toast({ title: "Error", description: "Failed to load tools", variant: "destructive" });
        seedingRef.current = false;
      } finally {
        setToolsLoading(false);
      }
    };
    loadTools();
  }, [userId, isAdmin]);

  const reloadTools = async () => {
    const dbTools = await portalApi.getTools();
    setTools(dbTools);
  };

  const visibleTools = tools.filter((t) => {
    const config = (t.config || {}) as Record<string, unknown>;
    if (config.enabled === false) return false;
    if (!isAdmin && accessMap !== null) {
      const access = accessMap[t.id];
      if (access?.can_view !== true) return false;
    }
    if (activeFilter && t.category !== activeFilter) return false;
    return true;
  });

  const availableCategories = [...new Set(tools.map(t => t.category || "general"))].sort();

  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.filter(t => {
      const config = (t.config || {}) as Record<string, unknown>;
      return config.enabled !== false;
    }).length };
    tools.forEach(t => {
      const config = (t.config || {}) as Record<string, unknown>;
      if (config.enabled === false) return;
      const cat = t.category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [tools]);

  const handleToolClick = (tool: PortalTool) => setPreviewTool(tool);

  const [iframeTool, setIframeTool] = useState<PortalTool | null>(null);
  const [workflowTool, setWorkflowTool] = useState<PortalTool | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  const handleOpenTool = (tool: PortalTool) => {
    setPreviewTool(null);
    if (tool.tool_type === "external") {
      const url = (tool.config as Record<string, string>)?.external_url || "";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (tool.tool_type === "chrome-extension") {
      const downloadUrl = (tool.config as Record<string, string>)?.download_url || "";
      if (downloadUrl) {
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = downloadUrl.split("/").pop() || "extension.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }
    if (tool.tool_type === "iframe") { setIframeTool(tool); return; }
    if (tool.tool_type === "workflow") { setWorkflowTool(tool); return; }
    if (tool.tool_type === "ai-agent") { setShowAgent(true); return; }
    if (tool.tool_type === "webhook") {
      const url = (tool.config as Record<string, string>)?.webhook_url || "";
      setWebhookUrl(url);
    }
    setActiveModal(tool.tool_type);
  };

  const handleEditFromPreview = (tool: PortalTool) => {
    setPreviewTool(null);
    setSettingsTool(tool);
  };

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTools((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // Persist sort order
      newOrder.forEach((tool, i) => {
        portalApi.updateTool(tool.id, { sort_order: i }).catch(console.error);
      });

      return newOrder;
    });
  }, []);

  // Cycle card size
  const handleCycleSize = useCallback((toolId: string) => {
    setCardSizes((prev) => {
      const current = prev[toolId] || "1x1";
      const idx = sizeCycle.indexOf(current);
      const next = sizeCycle[(idx + 1) % sizeCycle.length];
      const newSizes = { ...prev, [toolId]: next };

      // Persist to tool config
      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        const cfg = { ...((tool.config || {}) as Record<string, unknown>), grid_size: next };
        portalApi.updateTool(toolId, { config: cfg }).catch(console.error);
      }

      return newSizes;
    });
  }, [tools]);

  // Save and exit edit mode
  const handleSaveLayout = () => {
    setIsEditMode(false);
    toast({ title: "Layout saved", description: "Grid layout has been updated." });
  };

  if (toolsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading tools...</p>
      </div>
    );
  }

  if (!isAdmin && visibleTools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Wrench size={20} className="text-muted-foreground/50" />
        </div>
        <h3 className="mb-1.5 font-display text-lg font-medium text-foreground">No tools assigned</h3>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          You don't have access to any tools yet. Contact your administrator to get started.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Top bar: filters (mobile) + edit mode */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Mobile horizontal filter chips */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                !activeFilter ? "border-white/20 bg-white/[0.08] text-white shadow-sm" : "border-white/[0.08] text-white/40 hover:text-white/70"
              }`}
            >
              All <span className="ml-1 opacity-50">({toolCounts.all})</span>
            </button>
            {availableCategories.map((cat) => {
              const cfg = categoryConfig[cat] || categoryConfig.general;
              const count = toolCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                    activeFilter === cat ? cfg.color + " border-current shadow-sm" : "border-white/[0.08] text-white/40 hover:text-white/70"
                  }`}
                >
                  {cfg.label} <span className="ml-1 opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="ml-auto flex items-center">
            {isEditMode ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveLayout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
                >
                  <Check size={12} />
                  Save Layout
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/40 transition-all hover:border-white/20 hover:text-white/70"
              >
                <Pencil size={12} />
                Edit Layout
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two-column layout: Grid + Categories sidebar */}
      <div className="flex gap-6">
        {/* Main grid */}
        <div className="min-w-0 flex-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleTools.map((t) => t.id)} strategy={rectSortingStrategy}>
              <div className={`grid gap-4 sm:gap-5 ${
                isEditMode
                  ? "grid-cols-2 sm:grid-cols-3 auto-rows-[110px] sm:auto-rows-[130px] md:auto-rows-[150px]"
                  : "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 auto-rows-auto"
              }`}>
                <AnimatePresence mode="popLayout">
                  {visibleTools.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <SortableToolCard
                        tool={tool}
                        index={i}
                        isAdmin={isAdmin}
                        isEditMode={isEditMode}
                        cardSize={isEditMode ? (cardSizes[tool.id] || "1x1") : "1x1"}
                        IconComponent={getIcon(tool.icon)}
                        onToolClick={handleToolClick}
                        onOpenTool={handleOpenTool}
                        onSettings={(t) => setSettingsTool(t)}
                        onCycleSize={handleCycleSize}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isAdmin && !isEditMode && (
                  <motion.button
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: visibleTools.length * 0.05 }}
                    onClick={() => setShowAddTool(true)}
                    className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/[0.08] p-4 text-white/20 transition-all hover:border-white/20 hover:text-white/40"
                  >
                    <div className="text-center">
                      <Plus size={20} className="mx-auto mb-1" />
                      <p className="text-xs">Add tool</p>
                    </div>
                  </motion.button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right-side categories panel (desktop only) */}
        {availableCategories.length > 1 && (
          <div className="hidden w-44 shrink-0 lg:block">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveFilter(null)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                  !activeFilter
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                }`}
              >
                <span>All</span>
                <span className="tabular-nums opacity-50">{toolCounts.all}</span>
              </button>
              {availableCategories.map((cat) => {
                const cfg = categoryConfig[cat] || categoryConfig.general;
                const count = toolCounts[cat] || 0;
                const isActive = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(isActive ? null : cat)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="tabular-nums opacity-50">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ToolPreviewModal tool={previewTool} onClose={() => setPreviewTool(null)} onEdit={handleEditFromPreview} onOpen={handleOpenTool} onToolUpdated={reloadTools} />
      <SiteAuditModal open={activeModal === "site-audit"} onClose={() => setActiveModal(null)} />
      <WebhookTriggerModal open={activeModal === "webhook"} onClose={() => setActiveModal(null)} defaultWebhookUrl={webhookUrl} toolId={tools.find(t => t.tool_type === "webhook")?.id} toolConfig={(tools.find(t => t.tool_type === "webhook")?.config || {}) as Record<string, unknown>} onWebhookSaved={reloadTools} />
      <KeywordResearchModal open={activeModal === "keyword"} onClose={() => setActiveModal(null)} />
      <ToolSettingsModal open={!!settingsTool} onClose={() => setSettingsTool(null)} tool={settingsTool} totalTools={tools.length} onUpdated={reloadTools} />
      <AddToolModal open={showAddTool} onClose={() => setShowAddTool(false)} userId={userId} nextSortOrder={tools.length} onAdded={reloadTools} />
      <IframeToolModal open={!!iframeTool} onClose={() => setIframeTool(null)} url={(iframeTool?.config as Record<string, string>)?.iframe_url || ""} title={iframeTool?.name || "Embedded Tool"} />
      <WorkflowViewerModal open={!!workflowTool} onClose={() => setWorkflowTool(null)} name={workflowTool?.name || ""} description={workflowTool?.description || ""} workflowFile={(workflowTool?.config as Record<string, string>)?.workflow_file || ""} workflowName={(workflowTool?.config as Record<string, string>)?.workflow_name || ""} />
      <N8nAgentModal open={showAgent} onClose={() => setShowAgent(false)} />
    </>
  );
};

export default PortalToolsTab;
