import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Wrench, Workflow, Globe, Plus, Settings, AppWindow, FileJson, Sparkles } from "lucide-react";
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

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe, AppWindow, FileJson, Sparkles };
const getIcon = (name: string) => iconMap[name] || Wrench;

const categoryConfig: Record<string, { label: string; color: string }> = {
  seo: { label: "SEO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  automation: { label: "Automation", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  data: { label: "Data & Feeds", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  ai: { label: "AI", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  general: { label: "General", color: "bg-muted text-muted-foreground border-border" },
};

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
  const seedingRef = useRef(false);

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

        // Load access rights for non-admin users
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

  // Derive available categories from all tools
  const availableCategories = [...new Set(tools.map(t => t.category || "general"))].sort();

  const handleToolClick = (tool: PortalTool) => setPreviewTool(tool);

  const [iframeTool, setIframeTool] = useState<PortalTool | null>(null);
  const [workflowTool, setWorkflowTool] = useState<PortalTool | null>(null);
  const [showAgent, setShowAgent] = useState(false);

  const handleOpenTool = (tool: PortalTool) => {
    setPreviewTool(null);
    if (tool.tool_type === "iframe") {
      setIframeTool(tool);
      return;
    }
    if (tool.tool_type === "workflow") {
      setWorkflowTool(tool);
      return;
    }
    if (tool.tool_type === "ai-agent") {
      setShowAgent(true);
      return;
    }
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
      {/* Category Filter Bar */}
      {availableCategories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
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
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTools.map((tool, i) => {
          const Icon = getIcon(tool.icon);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group relative cursor-pointer rounded-xl border border-border bg-card p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5"
              onClick={() => handleToolClick(tool)}
            >
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSettingsTool(tool); }}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground/40 opacity-100 transition-all hover:bg-secondary hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Tool settings"
                >
                  <Settings size={14} />
                </button>
              )}
              <div className="mb-3 flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
                  <Icon size={20} />
                </div>
                {tool.category && categoryConfig[tool.category] && (
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${categoryConfig[tool.category].color}`}>
                    {categoryConfig[tool.category].label}
                  </span>
                )}
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                {tool.tool_type === "webhook" ? "Automation" : tool.tool_type === "keyword" ? "Research" : tool.tool_type === "site-audit" ? "Audit" : tool.tool_type === "iframe" ? "Embedded" : tool.tool_type === "workflow" ? "Workflow" : tool.tool_type === "ai-agent" ? "AI Agent" : "Tool"}
              </p>
              <h3 className="mb-1.5 font-display text-lg font-medium text-foreground">
                {tool.name}
                <ExternalLink size={11} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-60" />
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</p>
              {tool.attributes && tool.attributes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tool.attributes.slice(0, 3).map((attr) => (
                    <Badge key={attr.id} variant="secondary" className="text-[10px] font-normal">
                      {attr.key}: {attr.value}
                    </Badge>
                  ))}
                  {tool.attributes.length > 3 && (
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      +{tool.attributes.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {isAdmin && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: visibleTools.length * 0.1 }}
            onClick={() => setShowAddTool(true)}
            className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border p-6 text-muted-foreground/50 transition-all hover:border-primary/30 hover:text-muted-foreground"
          >
            <div className="text-center">
              <Plus size={24} className="mx-auto mb-2" />
              <p className="text-sm">Add more tools</p>
            </div>
          </motion.button>
        )}
      </div>

      <ToolPreviewModal
        tool={previewTool}
        onClose={() => setPreviewTool(null)}
        onEdit={handleEditFromPreview}
        onOpen={handleOpenTool}
        onToolUpdated={reloadTools}
      />
      <SiteAuditModal open={activeModal === "site-audit"} onClose={() => setActiveModal(null)} />
      <WebhookTriggerModal
        open={activeModal === "webhook"}
        onClose={() => setActiveModal(null)}
        defaultWebhookUrl={webhookUrl}
        toolId={tools.find(t => t.tool_type === "webhook")?.id}
        toolConfig={(tools.find(t => t.tool_type === "webhook")?.config || {}) as Record<string, unknown>}
        onWebhookSaved={reloadTools}
      />
      <KeywordResearchModal open={activeModal === "keyword"} onClose={() => setActiveModal(null)} />
      <ToolSettingsModal open={!!settingsTool} onClose={() => setSettingsTool(null)} tool={settingsTool} totalTools={tools.length} onUpdated={reloadTools} />
      <AddToolModal open={showAddTool} onClose={() => setShowAddTool(false)} userId={userId} nextSortOrder={tools.length} onAdded={reloadTools} />
      <IframeToolModal
        open={!!iframeTool}
        onClose={() => setIframeTool(null)}
        url={(iframeTool?.config as Record<string, string>)?.iframe_url || ""}
        title={iframeTool?.name || "Embedded Tool"}
      />
      <WorkflowViewerModal
        open={!!workflowTool}
        onClose={() => setWorkflowTool(null)}
        name={workflowTool?.name || ""}
        description={workflowTool?.description || ""}
        workflowFile={(workflowTool?.config as Record<string, string>)?.workflow_file || ""}
        workflowName={(workflowTool?.config as Record<string, string>)?.workflow_name || ""}
      />
      <N8nAgentModal open={showAgent} onClose={() => setShowAgent(false)} />
    </>
  );
};

export default PortalToolsTab;
