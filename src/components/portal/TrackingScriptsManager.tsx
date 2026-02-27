import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Code, Plus, Pencil, Trash2, Check, X, Shield, ShieldCheck, ShieldAlert,
  ToggleLeft, ToggleRight, RefreshCw, ExternalLink, Copy, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import InfoTooltip from "./InfoTooltip";
import {
  TrackingScript,
  getTrackingScripts,
  createTrackingScript,
  updateTrackingScript,
  deleteTrackingScript,
  TRACKING_PRESETS,
} from "@/lib/api/trackingScripts";

const SCRIPT_TYPE_LABELS: Record<string, string> = {
  gtm: "Google Tag Manager",
  ga4: "Google Analytics 4",
  google_ads: "Google Ads",
  meta_pixel: "Meta Pixel",
  linkedin: "LinkedIn",
  hotjar: "Hotjar",
  custom: "Custom",
};

const POSITION_LABELS: Record<string, string> = { head: "Head", body: "Body" };

const TrackingScriptsManager = () => {
  const [scripts, setScripts] = useState<TrackingScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TrackingScript | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("custom");
  const [formPosition, setFormPosition] = useState("head");
  const [formCode, setFormCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setScripts(await getTrackingScripts());
    } catch (e: any) {
      toast({ title: "Error loading scripts", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = (presetType?: string) => {
    setEditing(null);
    if (presetType) {
      const preset = TRACKING_PRESETS.find((p) => p.script_type === presetType);
      if (preset) {
        setFormName(preset.name);
        setFormDescription(preset.description);
        setFormType(preset.script_type);
        setFormPosition(preset.position);
        setFormCode(preset.template);
        setModalOpen(true);
        return;
      }
    }
    setFormName("");
    setFormDescription("");
    setFormType("custom");
    setFormPosition("head");
    setFormCode("");
    setModalOpen(true);
  };

  const openEdit = (script: TrackingScript) => {
    setEditing(script);
    setFormName(script.name);
    setFormDescription(script.description);
    setFormType(script.script_type);
    setFormPosition(script.position);
    setFormCode(script.code);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast({ title: "Name and code are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: formName.trim(),
        description: formDescription.trim(),
        script_type: formType,
        position: formPosition,
        code: formCode.trim(),
      };
      if (editing) {
        await updateTrackingScript(editing.id, data);
        toast({ title: "Script updated" });
      } else {
        await createTrackingScript(data);
        toast({ title: "Script added" });
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tracking script?")) return;
    try {
      await deleteTrackingScript(id);
      toast({ title: "Script deleted" });
      load();
    } catch (e: any) {
      toast({ title: "Error deleting", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (script: TrackingScript) => {
    try {
      await updateTrackingScript(script.id, { is_active: !script.is_active });
      setScripts((prev) => prev.map((s) => s.id === script.id ? { ...s, is_active: !s.is_active } : s));
      toast({ title: script.is_active ? "Script deactivated" : "Script activated" });
    } catch (e: any) {
      toast({ title: "Error toggling", description: e.message, variant: "destructive" });
    }
  };

  const verifyScript = async (script: TrackingScript) => {
    setVerifyingId(script.id);
    try {
      // Basic verification: check if the code contains valid script/noscript tags or identifiable patterns
      const code = script.code.trim();
      const checks: { label: string; pass: boolean }[] = [];

      // Check 1: Non-empty code
      checks.push({ label: "Code is not empty", pass: code.length > 0 });

      // Check 2: Contains script tag or noscript
      const hasScriptTag = /<script[\s>]/i.test(code) || /<noscript[\s>]/i.test(code);
      checks.push({ label: "Contains script/noscript tag", pass: hasScriptTag });

      // Check 3: Script-type specific checks
      if (script.script_type === "gtm") {
        const hasGtmId = /GTM-[A-Z0-9]+/i.test(code);
        checks.push({ label: "Contains GTM container ID (GTM-XXXXX)", pass: hasGtmId && !code.includes("GTM-XXXXXXX") });
      } else if (script.script_type === "ga4") {
        const hasGaId = /G-[A-Z0-9]+/i.test(code);
        checks.push({ label: "Contains GA4 measurement ID (G-XXXXX)", pass: hasGaId && !code.includes("G-XXXXXXXXXX") });
      } else if (script.script_type === "google_ads") {
        const hasAwId = /AW-[0-9]+/i.test(code);
        checks.push({ label: "Contains Google Ads ID (AW-XXXXX)", pass: hasAwId && !code.includes("AW-XXXXXXXXXX") });
      } else if (script.script_type === "meta_pixel") {
        const hasPixelId = /fbq\('init',\s*'[0-9]+'\)/i.test(code);
        checks.push({ label: "Contains Meta Pixel ID", pass: hasPixelId && !code.includes("YOUR_PIXEL_ID") });
      } else if (script.script_type === "hotjar") {
        const hasHjId = /hjid:\s*[0-9]+/i.test(code);
        checks.push({ label: "Contains Hotjar ID", pass: hasHjId && !code.includes("YOUR_HJID") });
      } else if (script.script_type === "linkedin") {
        const hasPartnerId = /_linkedin_partner_id\s*=\s*"[0-9]+"/i.test(code);
        checks.push({ label: "Contains LinkedIn Partner ID", pass: hasPartnerId && !code.includes("YOUR_PARTNER_ID") });
      }

      // Check 4: Balanced tags
      const openTags = (code.match(/<script[\s>]/gi) || []).length;
      const closeTags = (code.match(/<\/script>/gi) || []).length;
      checks.push({ label: "Balanced script tags", pass: openTags === closeTags });

      // Check 5: No dangerous patterns
      const hasDangerous = /document\.write\s*\(/i.test(code) || /eval\s*\(/i.test(code);
      checks.push({ label: "No dangerous patterns (eval, document.write)", pass: !hasDangerous });

      const allPassed = checks.every((c) => c.pass);
      const failedChecks = checks.filter((c) => !c.pass);

      await updateTrackingScript(script.id, {
        is_verified: allPassed,
        last_verified_at: new Date().toISOString(),
      });

      setScripts((prev) => prev.map((s) => s.id === script.id ? { ...s, is_verified: allPassed, last_verified_at: new Date().toISOString() } : s));

      if (allPassed) {
        toast({ title: "✅ Verification passed", description: `All ${checks.length} checks passed for "${script.name}".` });
      } else {
        toast({
          title: "⚠️ Verification issues found",
          description: failedChecks.map((c) => `• ${c.label}`).join("\n"),
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  };

  const activeCount = scripts.filter((s) => s.is_active).length;
  const verifiedCount = scripts.filter((s) => s.is_verified).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={15} className="text-primary" />
            <h2 className="font-display text-sm font-medium text-foreground">Tracking & Code Injection</h2>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{scripts.length}</span>
            <InfoTooltip text="Manage Google Analytics, Tag Manager, Ads pixels, and custom code injections with verification" />
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(val) => openNew(val)}>
              <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
                <Plus size={13} />
                <SelectValue placeholder="Add Script" />
              </SelectTrigger>
              <SelectContent>
                {TRACKING_PRESETS.map((p) => (
                  <SelectItem key={p.script_type} value={p.script_type}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-secondary/20 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${activeCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
            <span className="text-[11px] text-muted-foreground">{activeCount} active</span>
          </div>
          <div className="h-3 w-px bg-border/50" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-primary/60" />
            <span className="text-[11px] text-muted-foreground">{verifiedCount} verified</span>
          </div>
          <div className="h-3 w-px bg-border/50" />
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-amber-500/60" />
            <span className="text-[11px] text-muted-foreground">{scripts.length - verifiedCount} unverified</span>
          </div>
        </div>

        {/* Script list */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : scripts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center"
          >
            <Code size={24} className="mb-3 text-muted-foreground/30" />
            <h3 className="mb-1 font-display text-sm font-medium text-foreground">No tracking scripts</h3>
            <p className="mb-4 max-w-xs text-xs text-muted-foreground">
              Add Google Analytics, Tag Manager, Meta Pixel, or any custom tracking code.
            </p>
            <Button size="sm" onClick={() => openNew()}>
              <Plus size={14} /> Add First Script
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`group flex items-center gap-3 rounded-lg border p-3.5 transition-all ${
                  script.is_active
                    ? "border-primary/20 bg-primary/[0.02]"
                    : "border-border bg-card"
                }`}
              >
                {/* Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => toggleActive(script)} className="shrink-0">
                      {script.is_active ? (
                        <ToggleRight size={22} className="text-primary" />
                      ) : (
                        <ToggleLeft size={22} className="text-muted-foreground/40" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{script.is_active ? "Deactivate" : "Activate"}</TooltipContent>
                </Tooltip>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-foreground">{script.name}</h3>
                    <Badge variant="outline" className="h-4 border-border/60 px-1.5 text-[10px] text-muted-foreground/60">
                      {SCRIPT_TYPE_LABELS[script.script_type] || script.script_type}
                    </Badge>
                    <Badge variant="outline" className="h-4 border-border/60 px-1.5 text-[10px] text-muted-foreground/60 font-mono">
                      {`<${script.position}>`}
                    </Badge>
                    {script.is_verified ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <ShieldCheck size={13} className="text-emerald-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Verified {script.last_verified_at ? new Date(script.last_verified_at).toLocaleDateString() : ""}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <ShieldAlert size={13} className="text-amber-500/60" />
                        </TooltipTrigger>
                        <TooltipContent>Not verified — click verify to check</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {script.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{script.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-2 flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={verifyingId === script.id}
                        onClick={() => verifyScript(script)}
                      >
                        {verifyingId === script.id ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Verify script</TooltipContent>
                  </Tooltip>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(script)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(script.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Script" : "Add Tracking Script"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update script configuration and code" : "Add external tracking code to your site"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Google Analytics" className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={formType} onValueChange={(val) => {
                    setFormType(val);
                    // If switching type and not editing, load template
                    if (!editing) {
                      const preset = TRACKING_PRESETS.find((p) => p.script_type === val);
                      if (preset) {
                        setFormName(preset.name);
                        setFormDescription(preset.description);
                        setFormPosition(preset.position);
                        setFormCode(preset.template);
                      }
                    }
                  }}>
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCRIPT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="What does this script do?" className="mt-1 text-sm" />
              </div>

              <div>
                <Label className="text-xs">Injection Position</Label>
                <Select value={formPosition} onValueChange={setFormPosition}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head (recommended for tracking)</SelectItem>
                    <SelectItem value="body">Body (end of page)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">Code</Label>
                  <span className="text-[10px] tabular-nums text-muted-foreground/50">{formCode.length} chars</span>
                </div>
                <Textarea
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  rows={12}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Paste your tracking code here (HTML, script tags, etc.)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />}
                  {editing ? "Update" : "Add Script"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default TrackingScriptsManager;
