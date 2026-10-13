import RepoToolDialog from './RepoToolDialog';
import { mayUseTool, safeToolUrl } from '@/lib/portalToolPolicy';
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
  const [toolsLoading, setToolsLoading] = useState(true);
  const [loadError,setLoadError] = useState(false);
  const [loadAttempt,setLoadAttempt] = useState(0);
  const [query,setQuery] = useState("");
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
  const [cardSizes, setCardSizes] = useState<Record<string, CardSize>>({ /* empty */ });
  const seedingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    let live = true;
    setToolsLoading(true); setLoadError(false); setTools([]); setAccessMap(null);
    Promise.all([portalApi.getTools(), isAdmin ? Promise.resolve([]) : usersApi.getToolAccess(userId)])
      .then(([dbTools, access]) => {
        if (!live) return;
        setTools(dbTools);
        setAccessMap(Object.fromEntries(access.map(a => [a.tool_id,a])));
        setCardSizes(Object.fromEntries(dbTools.filter(t => sizeCycle.includes(t.config.grid_size as CardSize)).map(t => [t.id,t.config.grid_size as CardSize])));
      }).catch(() => { if (live) setLoadError(true); })
      .finally(() => { if (live) setToolsLoading(false); });
    return () => { live = false; };
  }, [userId, isAdmin, loadAttempt]);

  const reloadTools = async () => {
    const dbTools = await portalApi.getTools();
    setTools(dbTools);
  };

  const visibleTools = tools.filter((t) => {
    const config = (t.config || { /* empty */ }) as Record<string, unknown>;
    if (config.enabled === false) return false;
    if (!isAdmin) {
      const access = accessMap?.[t.id];
      if (access?.can_view !== true) return false;
    }
    if (isAdmin && activeFilter && t.category !== activeFilter) return false;
    if (query && !`${t.name} ${t.description || ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const availableCategories = [...new Set(tools.map(t => t.category || "general"))].sort();

  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.filter(t => {
      const config = (t.config || { /* empty */ }) as Record<string, unknown>;
      return config.enabled !== false;
    }).length };
    tools.forEach(t => {
      const config = (t.config || { /* empty */ }) as Record<string, unknown>;
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

  const handleOpenTool = async (tool: PortalTool) => {
    if (!mayUseTool(tool,isAdmin,Object.values(accessMap || {}))) { toast({title:"Geen gebruikstoegang",variant:"destructive"}); return; }
    setPreviewTool(null);
    if (tool.tool_type === "external") {
      const tab = window.open('about:blank', '_blank');
      if (tab) { tab.opener = null; tab.document.title = 'Tool openen…'; }
      try {
        const url = safeToolUrl(await portalApi.launchTool(tool.id));
        if (!url) throw new Error('Geen geldige tool-link');
        if (tab) tab.location.replace(url);
        else toast({title:'Nieuw tabblad geblokkeerd',description:'Sta pop-ups voor deze portal toe en probeer opnieuw.'});
      } catch (e) { tab?.close(); toast({title:'Tool niet geopend',description:e instanceof Error ? e.message : 'Controleer je toegang.',variant:'destructive'}); }
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
    if (!isAdmin) return;
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
        const cfg = { ...((tool.config || { /* empty */ }) as Record<string, unknown>), grid_size: next };
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

  if (loadError) return <div role="alert" className="rounded-xl border border-border p-6"><p>Tools konden niet worden geladen.</p><button className="mt-3 text-sm underline" onClick={()=>setLoadAttempt(n=>n+1)}>Opnieuw proberen</button></div>;

  if (!isAdmin && tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Wrench size={20} className="text-muted-foreground/50" />
        </div>
        <h3 className="mb-1.5 font-display text-lg font-medium text-foreground">Nog geen tools toegewezen</h3>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Hans kan tools voor je klaarzetten. Ze verschijnen daarna in dit overzicht.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <label className="mb-5 flex max-w-md items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"><Search size={17} className="text-muted-foreground"/><span className="sr-only">Zoek een tool</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Zoek een tool…" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
      {/* Top bar: filters (mobile) + edit mode */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Mobile horizontal filter chips */}
        {isAdmin && availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 lg:hidden">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                !activeFilter ? "border-border bg-secondary text-foreground shadow-sm" : "border-border text-muted-foreground hover:text-foreground"
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
                    activeFilter === cat ? cfg.color + " border-current shadow-sm" : "border-border text-muted-foreground hover:text-foreground"
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
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
                        onSettings={(t) => { if (isAdmin) setSettingsTool(t); }}
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
                    className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border p-4 text-muted-foreground transition-all hover:border-border hover:text-muted-foreground"
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
        {isAdmin && availableCategories.length > 1 && (
          <div className="hidden w-44 shrink-0 lg:block">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveFilter(null)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                  !activeFilter
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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

      {previewTool?.config.repo_slug ? <RepoToolDialog key={previewTool.id} tool={previewTool} userId={userId} isAdmin={isAdmin} canUse={mayUseTool(previewTool,isAdmin,Object.values(accessMap || {}))} onClose={() => setPreviewTool(null)} onEdit={handleEditFromPreview} onOpen={handleOpenTool}/> : <ToolPreviewModal tool={previewTool} isAdmin={isAdmin} canUse={!!previewTool && mayUseTool(previewTool,isAdmin,Object.values(accessMap || {}))} onClose={() => setPreviewTool(null)} onEdit={handleEditFromPreview} onOpen={handleOpenTool} onToolUpdated={reloadTools} />}
      <SiteAuditModal open={activeModal === "site-audit"} onClose={() => setActiveModal(null)} />
      <WebhookTriggerModal open={activeModal === "webhook"} onClose={() => setActiveModal(null)} defaultWebhookUrl={webhookUrl} toolId={tools.find(t => t.tool_type === "webhook")?.id} toolConfig={(tools.find(t => t.tool_type === "webhook")?.config || { /* empty */ }) as Record<string, unknown>} onWebhookSaved={reloadTools} />
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
