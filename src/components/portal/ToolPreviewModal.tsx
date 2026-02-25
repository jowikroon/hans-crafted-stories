import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, ExternalLink, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, Check } from "lucide-react";
import { PortalTool, portalApi } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import { Wrench, Workflow, Globe, AppWindow, FileJson, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, typeof Wrench> = { Wrench, Workflow, Globe, AppWindow, FileJson, Sparkles };
const getIcon = (name: string) => iconMap[name] || Wrench;

const categoryConfig: Record<string, { label: string; color: string }> = {
  seo: { label: "SEO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  automation: { label: "Automation", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  data: { label: "Data & Feeds", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  ai: { label: "AI", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  infra: { label: "Infra", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  general: { label: "General", color: "bg-muted text-muted-foreground border-border" },
};

interface ToolPreviewModalProps {
  tool: PortalTool | null;
  onClose: () => void;
  onEdit: (tool: PortalTool) => void;
  onOpen: (tool: PortalTool) => void;
  onToolUpdated?: () => void;
}

const ToolPreviewModal = ({ tool, onClose, onEdit, onOpen, onToolUpdated }: ToolPreviewModalProps) => {
  const { toast } = useToast();
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  if (!tool) return null;

  const Icon = getIcon(tool.icon || "Wrench");
  const config = (tool.config || {}) as Record<string, unknown>;
  const webhookUrl = (config.webhook_url as string) || "";
  const isWebhook = tool.tool_type === "webhook";
  const isChromeExt = tool.tool_type === "chrome-extension";
  const isConfigured = isWebhook && !!webhookUrl;
  const isWorkflow = tool.tool_type === "workflow";
  const catCfg = categoryConfig[tool.category] || categoryConfig.general;

  const handleStartEdit = () => {
    setUrlValue(webhookUrl);
    setEditingUrl(true);
  };

  const handleSaveUrl = async () => {
    if (!urlValue.trim()) return;
    setSaving(true);
    try {
      await portalApi.updateTool(tool.id, {
        config: { ...config, webhook_url: urlValue.trim() },
      });
      toast({ title: "Saved", description: "Webhook URL updated." });
      setEditingUrl(false);
      onToolUpdated?.();
    } catch {
      toast({ title: "Error", description: "Failed to save URL.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickTrigger = async () => {
    if (!webhookUrl) return;
    setTriggering(true);
    try {
      const res = await portalApi.triggerWebhook(webhookUrl, {});
      if (res.success) {
        toast({ title: "Triggered", description: `Status: ${res.data?.status ?? "OK"}` });
      } else {
        toast({ title: "Failed", description: res.error || "Webhook failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to trigger webhook.", variant: "destructive" });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <AnimatePresence>
      {tool && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 z-50 m-auto h-fit max-h-[85vh] max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>

            <button
              onClick={() => onEdit(tool)}
              className="absolute right-12 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Edit tool"
            >
              <Pencil size={14} />
            </button>

            <div className="flex flex-col items-start gap-5">
              <div className="flex w-full items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-secondary ${tool.color}`}>
                  <Icon size={24} />
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${catCfg.color}`}>
                  {catCfg.label}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {tool.tool_type === "chrome-extension" ? "Chrome Extension" : tool.tool_type === "external" ? "External App" : tool.tool_type === "webhook" ? "Automation" : tool.tool_type === "keyword" ? "Research" : tool.tool_type === "site-audit" ? "Audit" : tool.tool_type === "iframe" ? "Embedded" : tool.tool_type === "workflow" ? "Workflow" : tool.tool_type === "ai-agent" ? "AI Agent" : "Tool"}
                </p>
                <h2 className="font-display text-2xl font-medium text-foreground">
                  {tool.name}
                </h2>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {tool.description || "No description provided."}
              </p>

              {/* Features list — skip for workflow type */}
              {!isWorkflow && tool.features && tool.features.length > 0 && (
                <div className="w-full space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What it does</p>
                  <ul className="space-y-1.5">
                    {tool.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attributes */}
              {tool.attributes && tool.attributes.length > 0 && (
                <div className="w-full rounded-lg border border-border bg-secondary/20 p-4">
                  <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Attributes</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {tool.attributes.map((attr) => (
                      <div key={attr.id} className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{attr.key}</span>
                        <span className="text-xs font-medium text-foreground">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Webhook section */}
              {isWebhook && (
                <div className="w-full space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Webhook</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isConfigured ? (
                        <>
                          <CheckCircle size={12} className="text-green-500" />
                          <span className="text-xs text-green-600">Configured</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-orange-500" />
                          <span className="text-xs text-orange-600">Not configured</span>
                        </>
                      )}
                    </div>
                  </div>

                  {editingUrl ? (
                    <div className="space-y-2">
                      <Input type="url" placeholder="https://your-n8n.app/webhook/..." value={urlValue} onChange={(e) => setUrlValue(e.target.value)} className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveUrl} disabled={saving} className="flex-1">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingUrl(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isConfigured ? (
                        <p className="truncate rounded bg-secondary px-2 py-1.5 font-mono text-xs text-muted-foreground">{webhookUrl}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Paste your n8n webhook URL to get started.</p>
                      )}
                      <Button size="sm" variant="outline" onClick={handleStartEdit} className="w-full text-xs">
                        {isConfigured ? "Change URL" : "Configure Webhook"}
                      </Button>
                    </div>
                  )}

                  {isConfigured && !editingUrl && (
                    <Button size="sm" variant="secondary" onClick={handleQuickTrigger} disabled={triggering} className="w-full text-xs">
                      {triggering ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                      Quick Trigger
                    </Button>
                  )}
                </div>
              )}

              {/* Chrome Extension install instructions */}
              {isChromeExt && (
                <div className="w-full space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">How to install</p>
                  <ol className="space-y-1.5 text-sm text-foreground/80">
                    <li className="flex items-start gap-2"><span className="shrink-0 font-bold text-primary">1.</span> Download the ZIP file below</li>
                    <li className="flex items-start gap-2"><span className="shrink-0 font-bold text-primary">2.</span> Unzip the folder on your computer</li>
                    <li className="flex items-start gap-2"><span className="shrink-0 font-bold text-primary">3.</span> Open <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono">chrome://extensions</code></li>
                    <li className="flex items-start gap-2"><span className="shrink-0 font-bold text-primary">4.</span> Enable "Developer mode" (top right)</li>
                    <li className="flex items-start gap-2"><span className="shrink-0 font-bold text-primary">5.</span> Click "Load unpacked" → select the unzipped folder</li>
                  </ol>
                </div>
              )}

              <button
                onClick={() => onOpen(tool)}
                className={`mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  tool.tool_type === "ai-agent"
                    ? "border-2 border-violet-500 bg-violet-500/10 text-violet-600 shadow-[0_0_12px_hsl(270_80%_55%/0.2)] hover:bg-violet-500/20 hover:shadow-[0_0_16px_hsl(270_80%_55%/0.3)]"
                    : "bg-foreground text-background hover:opacity-80"
                }`}
              >
                {tool.tool_type === "ai-agent" && <Sparkles size={14} />}
                {tool.tool_type === "ai-agent" ? "Connect AI Agent" : isChromeExt ? "Download Extension" : tool.tool_type === "external" ? "Launch App" : "Open Tool"}
                <ExternalLink size={14} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ToolPreviewModal;
