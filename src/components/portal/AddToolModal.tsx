import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portalApi } from "@/lib/api/portal";
import { useToast } from "@/hooks/use-toast";
import AttributeEditor, { AttributeEntry } from "./AttributeEditor";

interface AddToolModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  nextSortOrder: number;
  onAdded: () => void;
}

const toolTypes = [
  { value: "external", label: "External App (opens in new tab)", category: "general" },
  { value: "chrome-extension", label: "Chrome Extension (downloadable)", category: "general" },
  { value: "webhook", label: "Webhook / Automation", category: "automation" },
  { value: "site-audit", label: "Site Audit", category: "seo" },
  { value: "keyword", label: "Keyword Research", category: "seo" },
  { value: "iframe", label: "Embedded Form / Page", category: "general" },
  { value: "workflow", label: "n8n Workflow (JSON)", category: "automation" },
  { value: "ai-agent", label: "AI Agent", category: "ai" },
  { value: "custom", label: "Custom (link only)", category: "general" },
];

const categoryOptions = [
  { value: "seo", label: "SEO" },
  { value: "automation", label: "Automation" },
  { value: "data", label: "Data & Feeds" },
  { value: "ai", label: "AI" },
  { value: "general", label: "General" },
];

const iconOptions = [
  { value: "Wrench", label: "Wrench" },
  { value: "Workflow", label: "Workflow" },
  { value: "Globe", label: "Globe" },
  { value: "AppWindow", label: "App Window" },
];

const colorOptions = [
  { value: "text-blue-500", label: "Blue" },
  { value: "text-green-500", label: "Green" },
  { value: "text-orange-500", label: "Orange" },
  { value: "text-red-500", label: "Red" },
  { value: "text-purple-500", label: "Purple" },
  { value: "text-primary", label: "Primary" },
];

const AddToolModal = ({ open, onClose, userId, nextSortOrder, onAdded }: AddToolModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toolType, setToolType] = useState("external");
  const [icon, setIcon] = useState("Wrench");
  const [color, setColor] = useState("text-primary");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [newAttributes, setNewAttributes] = useState<AttributeEntry[]>([]);

  const reset = () => {
    setName("");
    setDescription("");
    setToolType("external");
    setIcon("Wrench");
    setColor("text-primary");
    setWebhookUrl("");
    setIframeUrl("");
    setExternalUrl("");
    setDownloadUrl("");
    setNewAttributes([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Validation", description: "Name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const config: Record<string, unknown> = { enabled: true };
      if (toolType === "webhook") config.webhook_url = webhookUrl;
      if (toolType === "iframe") config.iframe_url = iframeUrl;
      if (toolType === "external") config.external_url = externalUrl;
      if (toolType === "chrome-extension") config.download_url = downloadUrl;
      const autoCategory = toolTypes.find(t => t.value === toolType)?.category || "general";
      const created = await portalApi.addTool({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || null,
        tool_type: toolType,
        icon,
        color,
        sort_order: nextSortOrder,
        config,
        category: autoCategory,
        features: [],
      });
      // Add attributes
      for (const attr of newAttributes) {
        if (attr.key.trim() && attr.value.trim()) {
          await portalApi.addAttribute(created.id, attr.key.trim(), attr.value.trim());
        }
      }
      toast({ title: "Created", description: `"${name.trim()}" added to your portal.` });
      reset();
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create tool.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-tool-name">Name</Label>
            <Input id="new-tool-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="My Workflow" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-tool-desc">Description</Label>
            <Textarea id="new-tool-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2} placeholder="What does this tool do?" />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={toolType} onValueChange={setToolType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {toolTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {toolType === "webhook" && (
            <div className="space-y-1.5">
              <Label htmlFor="new-webhook-url">Webhook URL</Label>
              <Input id="new-webhook-url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}

          {toolType === "iframe" && (
            <div className="space-y-1.5">
              <Label htmlFor="new-iframe-url">Page / Form URL</Label>
              <Input id="new-iframe-url" value={iframeUrl} onChange={(e) => setIframeUrl(e.target.value)} placeholder="https://your-app.com/form/..." />
            </div>
          )}

          {toolType === "external" && (
            <div className="space-y-1.5">
              <Label htmlFor="new-external-url">External App URL</Label>
              <Input id="new-external-url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://your-app.manus.space" />
            </div>
          )}

          {toolType === "chrome-extension" && (
            <div className="space-y-1.5">
              <Label htmlFor="new-download-url">Download URL (ZIP path)</Label>
              <Input id="new-download-url" value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="/extensions/my-extension.zip" />
            </div>
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

          <AttributeEditor attributes={newAttributes} onChange={setNewAttributes} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Tool"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToolModal;
