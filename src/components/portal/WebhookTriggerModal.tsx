import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Workflow, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { portalApi } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";

interface WebhookTriggerModalProps {
  open: boolean;
  onClose: () => void;
  defaultWebhookUrl?: string;
  toolId?: string;
  toolConfig?: Record<string, unknown>;
  onWebhookSaved?: () => void;
}

const WebhookTriggerModal = ({ open, onClose, defaultWebhookUrl = "", toolId, toolConfig, onWebhookSaved }: WebhookTriggerModalProps) => {
  const [webhookUrl, setWebhookUrl] = useState(defaultWebhookUrl);
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; status: number; data: unknown } | null>(null);
  const { toast } = useToast();

  // Sync when defaultWebhookUrl changes
  useEffect(() => {
    if (open) {
      setWebhookUrl(defaultWebhookUrl);
      setResult(null);
    }
  }, [open, defaultWebhookUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      toast({ title: "Invalid JSON", description: "Payload must be valid JSON", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await portalApi.triggerWebhook(webhookUrl, parsedPayload as Record<string, unknown>);
      if (res.success && res.data) {
        setResult(res.data);

        // Save webhook URL back to tool config if changed
        if (toolId && webhookUrl !== defaultWebhookUrl) {
          try {
            await portalApi.updateTool(toolId, {
              config: { ...(toolConfig || {}), webhook_url: webhookUrl },
            });
            onWebhookSaved?.();
          } catch {
            // silent – non-critical
          }
        }
      } else {
        toast({ title: "Failed", description: res.error || "Webhook failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to trigger webhook", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="mb-1 flex items-center gap-2">
                <Workflow size={20} className="text-orange-500" />
                <h2 className="font-display text-xl font-medium">Trigger Webhook</h2>
              </div>
              <p className="text-sm text-muted-foreground">Send a POST request to an n8n webhook or any URL</p>
              <p className="mt-1 text-[11px] text-muted-foreground/50">
                For intent-based runs, use <span className="font-medium text-orange-400/70">Command Center</span> — it classifies your goal and picks the right workflow automatically.
              </p>
            </div>

            {/* n8n setup guidance */}
            <div className="mb-5 rounded-lg border border-border bg-secondary/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Info size={12} />
                n8n Setup Guide
              </div>
              <ol className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                <li>1. Add a <strong>Webhook</strong> node as your first node in n8n</li>
                <li>2. Set HTTP Method to <strong>POST</strong></li>
                <li>3. Set Response Mode to <strong>"When Last Node Finishes"</strong></li>
                <li>4. Copy the <strong>Production URL</strong> and paste it below</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Webhook URL</label>
                <Input
                  type="url"
                  placeholder="https://your-n8n.app/webhook/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Payload (JSON)</label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Trigger"}
              </Button>
            </form>

            {result && (
              <div className="mt-6 rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-destructive" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    Status: {result.status}
                  </span>
                </div>
                <pre className="max-h-40 overflow-auto rounded bg-secondary p-3 text-xs text-secondary-foreground">
                  {typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WebhookTriggerModal;
