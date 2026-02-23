import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalTool, ToolAttribute, portalApi } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import AttributeEditor, { AttributeEntry } from "./AttributeEditor";

interface ToolSettingsModalProps {
  open: boolean;
  onClose: () => void;
  tool: PortalTool | null;
  totalTools: number;
  onUpdated: () => void;
}

const iconOptions = [
  { value: "Wrench", label: "Wrench" },
  { value: "Workflow", label: "Workflow" },
  { value: "Globe", label: "Globe" },
];

const colorOptions = [
  { value: "text-blue-500", label: "Blue" },
  { value: "text-green-500", label: "Green" },
  { value: "text-orange-500", label: "Orange" },
  { value: "text-red-500", label: "Red" },
  { value: "text-purple-500", label: "Purple" },
  { value: "text-primary", label: "Primary" },
];

// Inline webhook config section with test button
const WebhookConfigSection = ({ webhookUrl, onUrlChange }: { webhookUrl: string; onUrlChange: (v: string) => void }) => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      toast({ title: "No URL", description: "Enter a webhook URL first.", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await portalApi.triggerWebhook(webhookUrl, { test: true });
      setTestResult(res.success && res.data ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Info size={12} />
        Webhook Configuration
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          value={webhookUrl}
          onChange={(e) => { onUrlChange(e.target.value); setTestResult(null); }}
          placeholder="https://your-n8n-instance.com/webhook/..."
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleTest} disabled={testing} className="gap-1.5 text-xs">
          {testing ? <Loader2 size={12} className="animate-spin" /> : null}
          Test Webhook
        </Button>
        {testResult === "success" && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle size={12} /> OK
          </span>
        )}
        {testResult === "error" && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircle size={12} /> Failed
          </span>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Use a Webhook node in n8n with HTTP Method: POST, Response Mode: "When Last Node Finishes".
      </p>
    </div>
  );
};

const ToolSettingsModal = ({ open, onClose, tool, totalTools, onUpdated }: ToolSettingsModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Wrench");
  const [color, setColor] = useState("text-primary");
  const [sortOrder, setSortOrder] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [attributes, setAttributes] = useState<AttributeEntry[]>([]);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setDescription(tool.description || "");
      setIcon(tool.icon || "Wrench");
      setColor(tool.color || "text-primary");
      setSortOrder(tool.sort_order ?? 0);
      const config = (tool.config || {}) as Record<string, unknown>;
      setWebhookUrl((config.webhook_url as string) || "");
      setEnabled(config.enabled !== false);
      setAttributes((tool.attributes || []).map((a) => ({ id: a.id, key: a.key, value: a.value })));
    }
  }, [tool]);

  const handleSave = async () => {
    if (!tool) return;
    setSaving(true);
    try {
      const config: Record<string, unknown> = { ...(tool.config as Record<string, unknown> || {}), enabled };
      if (tool.tool_type === "webhook") {
        config.webhook_url = webhookUrl;
      }
      await portalApi.updateTool(tool.id, {
        name,
        description,
        icon,
        color,
        sort_order: sortOrder,
        config,
      });
      toast({ title: "Saved", description: "Tool settings updated." });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tool) return;
    setDeleting(true);
    try {
      await portalApi.deleteTool(tool.id);
      toast({ title: "Deleted", description: `"${tool.name}" has been removed.` });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete tool.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tool Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tool-name">Name</Label>
            <Input id="tool-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tool-desc">Description</Label>
            <Textarea id="tool-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2} />
          </div>

          {tool?.tool_type === "webhook" && (
            <WebhookConfigSection webhookUrl={webhookUrl} onUrlChange={setWebhookUrl} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {colorOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Display Order</Label>
            <Select value={String(sortOrder)} onValueChange={(v) => setSortOrder(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalTools }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>Position {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AttributeEditor
            attributes={attributes}
            onChange={setAttributes}
            onAdd={async (key, value) => {
              if (!tool) return;
              const attr = await portalApi.addAttribute(tool.id, key, value);
              setAttributes((prev) => [...prev, { id: attr.id, key: attr.key, value: attr.value }]);
              onUpdated();
            }}
            onDelete={async (id) => {
              await portalApi.deleteAttribute(id);
              setAttributes((prev) => prev.filter((a) => a.id !== id));
              onUpdated();
            }}
            onUpdate={async (id, value) => {
              await portalApi.updateAttribute(id, value);
              onUpdated();
            }}
          />

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="tool-enabled" className="cursor-pointer">Visible on dashboard</Label>
            <Switch id="tool-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
            <Trash2 size={14} />
            {deleting ? "Deleting..." : "Delete Tool"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolSettingsModal;
