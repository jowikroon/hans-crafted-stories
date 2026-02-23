import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Wrench, Workflow, Globe, Plus, Settings } from "lucide-react";
import { portalApi, PortalTool } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";
import SiteAuditModal from "./SiteAuditModal";
import WebhookTriggerModal from "./WebhookTriggerModal";
import KeywordResearchModal from "./KeywordResearchModal";
import ToolSettingsModal from "./ToolSettingsModal";
import AddToolModal from "./AddToolModal";
import ToolPreviewModal from "./ToolPreviewModal";

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe };
const getIcon = (name: string) => iconMap[name] || Wrench;

const defaultTools = [
  { tool_type: "keyword", name: "Keyword Research", description: "AI-powered keyword analysis and content suggestions.", icon: "Globe", color: "text-blue-500", sort_order: 0 },
  { tool_type: "webhook", name: "N8N Workflows", description: "Trigger and manage your automation workflows.", icon: "Workflow", color: "text-orange-500", sort_order: 1 },
  { tool_type: "site-audit", name: "Site Audit", description: "Run a quick SEO audit on any website.", icon: "Wrench", color: "text-green-500", sort_order: 2 },
];

interface PortalToolsTabProps {
  userId: string;
}

const PortalToolsTab = ({ userId }: PortalToolsTabProps) => {
  const { toast } = useToast();
  const [tools, setTools] = useState<PortalTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [settingsTool, setSettingsTool] = useState<PortalTool | null>(null);
  const [showAddTool, setShowAddTool] = useState(false);
  const [previewTool, setPreviewTool] = useState<PortalTool | null>(null);
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
            await portalApi.addTool({ ...t, user_id: userId, config: {}, description: t.description });
          }
          dbTools = await portalApi.getTools();
        }
        setTools(dbTools);
      } catch (err) {
        console.error("Failed to load tools:", err);
        toast({ title: "Error", description: "Failed to load tools", variant: "destructive" });
        seedingRef.current = false;
      } finally {
        setToolsLoading(false);
      }
    };
    loadTools();
  }, [userId]);

  const reloadTools = async () => {
    const dbTools = await portalApi.getTools();
    setTools(dbTools);
  };

  const visibleTools = tools.filter((t) => {
    const config = (t.config || {}) as Record<string, unknown>;
    return config.enabled !== false;
  });

  const handleToolClick = (tool: PortalTool) => setPreviewTool(tool);

  const handleOpenTool = (tool: PortalTool) => {
    setPreviewTool(null);
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

  return (
    <>
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
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsTool(tool); }}
                className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground/40 opacity-100 transition-all hover:bg-secondary hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                aria-label="Tool settings"
              >
                <Settings size={14} />
              </button>
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
                <Icon size={20} />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                {tool.tool_type === "webhook" ? "Automation" : tool.tool_type === "keyword" ? "Research" : tool.tool_type === "site-audit" ? "Audit" : "Tool"}
              </p>
              <h3 className="mb-1.5 font-display text-lg font-medium text-foreground">
                {tool.name}
                <ExternalLink size={11} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-60" />
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</p>
            </motion.div>
          );
        })}

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
    </>
  );
};

export default PortalToolsTab;
