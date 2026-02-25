import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Wrench, Workflow, Globe, Plus, Settings, AppWindow, FileJson, Sparkles, Pencil, Check, X } from "lucide-react";
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
import InfoTooltip from "./InfoTooltip";
import SortableToolCard, { type CardSize, sizeCycle, categoryConfig } from "./SortableToolCard";

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe, AppWindow, FileJson, Sparkles };
const getIcon = (name: string) => iconMap[name] || Wrench;

const defaultTools = [
  { tool_type: "keyword", name: "Keyword Research", description: "AI-powered keyword analysis and content suggestions.", icon: "Globe", color: "text-blue-500", sort_order: 0, category: "seo", features: ["AI-powered keyword analysis", "Search intent classification", "Content topic suggestions"] },
  { tool_type: "webhook", name: "N8N Workflows", description: "Trigger and manage your automation workflows.", icon: "Workflow", color: "text-orange-500", sort_order: 1, category: "automation", features: ["Trigger n8n workflows", "Send custom payloads", "Monitor execution status"] },
  { tool_type: "site-audit", name: "Site Audit", description: "Run a quick SEO audit on any website.", icon: "Wrench", color: "text-green-500", sort_order: 2, category: "seo", features: ["Analyze on-page SEO", "Check meta tags & headings", "Get actionable suggestions"] },
  { tool_type: "iframe", name: "N8N Form", description: "Embedded automation form — submit data directly to your workflow.", icon: "AppWindow", color: "text-purple-500", sort_order: 3, category: "automation", features: ["Submit data via embedded form", "Direct workflow integration"], config: { iframe_url: "https://hansvanleeuwen.app.n8n.cloud/form/afe067a5-4878-4c9d-b746-691f77190f54" } },
];

interface PortalToolsTabProps {
  userId: string;
  isAdmin?: boolean;
}

const PortalToolsTab = ({ userId, isAdmin = false }: PortalToolsTabProps) => {
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
        let dbTools = await portalApi.getTools();
        if (dbTools.length === 0) {
          for (const t of defaultTools) {
            await portalApi.addTool({ ...t, user_id: userId, config: {}, description: t.description, category: t.category, features: t.features });
          }
          dbTools = await portalApi.getTools();
        }
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

  const handleToolClick = (tool: PortalTool) => setPreviewTool(tool);

  const [iframeTool, setIframeTool] = useState<PortalTool | null>(null);
  const [workflowTool, setWorkflowTool] = useState<PortalTool | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  const handleOpenTool = (tool: PortalTool) => {
    setPreviewTool(null);
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
      {/* Top Bar: Filters + Edit Mode Toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {availableCategories.length > 1 && (
          <>
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                !activeFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              All
            </button>
            {availableCategories.map((cat) => {
              const cfg = categoryConfig[cat] || categoryConfig.general;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    activeFilter === cat ? cfg.color + " border-current" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Edit Mode Toggle */}
        {isAdmin && (
          isEditMode ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveLayout}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
              >
                <Check size={12} />
                Save Layout
              </button>
              <button
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
            >
              <Pencil size={12} />
              Edit Layout
              <InfoTooltip text="Drag to reorder, click resize to change card size" />
            </button>
          )
        )}
      </div>

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleTools.map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className={`grid gap-3 sm:gap-4 ${
            isEditMode
              ? "grid-cols-2 sm:grid-cols-3 auto-rows-[110px] sm:auto-rows-[130px] md:auto-rows-[150px]"
              : "grid-cols-2 sm:grid-cols-3 auto-rows-auto"
          }`}>
            {visibleTools.map((tool, i) => (
              <SortableToolCard
                key={tool.id}
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
            ))}

            {isAdmin && !isEditMode && (
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: visibleTools.length * 0.05 }}
                onClick={() => setShowAddTool(true)}
                className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border p-4 text-muted-foreground/50 transition-all hover:border-primary/30 hover:text-muted-foreground"
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
