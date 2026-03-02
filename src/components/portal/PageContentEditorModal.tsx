import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PageContentRow, updatePageContentBatch } from "@/lib/api/pageContent";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, ExternalLink, RotateCcw, Sparkles, Home, Briefcase, PenLine, User, History } from "lucide-react";
import VersionHistoryPanel from "./VersionHistoryPanel";
import PortalLangToggle from "./PortalLangToggle";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: string;
  rows: PageContentRow[];
  onSaved: () => void;
}

const PAGE_ICONS: Record<string, typeof Home> = { home: Home, work: Briefcase, writing: PenLine, about: User };
const PAGE_ROUTES: Record<string, string> = { home: "/", work: "/work", writing: "/writing", about: "/about" };

const PageContentEditorModal = ({ open, onOpenChange, page, rows, onSaved }: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generatingGroup, setGeneratingGroup] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleRestoreVersion = (contentId: string, value: string) => {
    setValues((prev) => ({ ...prev, [contentId]: value }));
  };

  const handleAiSuggest = async (group: string, items: PageContentRow[]) => {
    setGeneratingGroup(group);
    try {
      const fields = items.map((i) => ({
        content_label: i.content_label,
        content_key: i.content_key,
        content_type: i.content_type,
        content_value: values[i.id] ?? i.content_value,
      }));

      const { data, error } = await supabase.functions.invoke("ai-content-suggest", {
        body: { page, group, fields },
      });

      if (error) throw new Error(String(error.message || error));
      if (data?.error) throw new Error(data.error);

      const suggestions: Record<string, string> = data?.suggestions || {};
      const keyToId: Record<string, string> = {};
      items.forEach((i) => (keyToId[i.content_key] = i.id));

      let applied = 0;
      setValues((prev) => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(suggestions)) {
          const id = keyToId[key];
          if (id && typeof val === "string" && val.trim()) {
            next[id] = val;
            applied++;
          }
        }
        return next;
      });

      toast({
        title: `AI suggestions applied`,
        description: `${applied} field${applied !== 1 ? "s" : ""} updated in "${group}". Review and save when ready.`,
      });
    } catch (e: any) {
      console.error("AI suggest error:", e);
      toast({ title: "AI generation failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setGeneratingGroup(null);
    }
  };

  // Original values for change tracking
  const originals = useMemo(() => {
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.id] = r.content_value));
    return map;
  }, [rows]);

  useEffect(() => {
    setValues({ ...originals });
  }, [originals]);

  const grouped = useMemo(() => {
    const groups: Record<string, PageContentRow[]> = {};
    rows.forEach((r) => {
      const g = r.content_group || "General";
      if (!groups[g]) groups[g] = [];
      groups[g].push(r);
    });
    return Object.entries(groups);
  }, [rows]);

  const changedIds = useMemo(
    () => new Set(rows.filter((r) => values[r.id] !== originals[r.id]).map((r) => r.id)),
    [rows, values, originals]
  );

  const changeCount = changedIds.size;

  const resetField = useCallback((id: string) => {
    setValues((v) => ({ ...v, [id]: originals[id] }));
  }, [originals]);

  const resetAll = useCallback(() => {
    setValues({ ...originals });
  }, [originals]);

  const handleSave = async (preview = false) => {
    const changed = rows
      .filter((r) => values[r.id] !== originals[r.id])
      .map((r) => ({ id: r.id, content_value: values[r.id] ?? r.content_value }));

    if (changed.length === 0) {
      if (preview) window.open(PAGE_ROUTES[page] || "/", "_blank");
      return;
    }

    setSaving(true);
    try {
      await updatePageContentBatch(changed);
      toast({ title: `${page.charAt(0).toUpperCase() + page.slice(1)} content updated` });
      onSaved();
      if (preview) {
        window.open(PAGE_ROUTES[page] || "/", "_blank");
      } else {
        onOpenChange(false);
      }
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getFieldType = (item: PageContentRow): "short" | "medium" | "long" => {
    const val = values[item.id] ?? item.content_value;
    if (val.length > 150 || item.content_type === "body") return "long";
    if (val.length > 60) return "medium";
    return "short";
  };

  const PageIcon = PAGE_ICONS[page] || Home;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PageIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="capitalize">{page} — Edit Content</DialogTitle>
              <DialogDescription className="mt-0.5">
                Edit on-page text content · {rows.length} fields
              </DialogDescription>
            </div>
            <PortalLangToggle />
            {changeCount > 0 && (
              <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary">
                {changeCount} unsaved
              </Badge>
            )}
            {changeCount > 0 && (
              <Button size="sm" variant="ghost" onClick={resetAll} className="shrink-0 text-muted-foreground">
                <RotateCcw size={13} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={grouped.map(([g]) => g)} className="pt-2">
          {grouped.map(([group, items]) => {
            const groupChangedCount = items.filter((i) => changedIds.has(i.id)).length;
            return (
              <AccordionItem key={group} value={group} className="border-border/50">
                <AccordionTrigger className="py-3 text-sm hover:no-underline">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-semibold text-foreground">{group}</span>
                    <span className="text-[10px] text-muted-foreground">{items.length} fields</span>
                    {groupChangedCount > 0 && (
                      <Badge variant="outline" className="h-4 border-primary/30 px-1.5 text-[10px] text-primary">
                        {groupChangedCount} changed
                      </Badge>
                    )}
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={generatingGroup !== null}
                      className="mr-2 h-6 gap-1 px-2 text-[11px] text-muted-foreground/60 hover:text-primary disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiSuggest(group, items);
                      }}
                    >
                      {generatingGroup === group ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      {generatingGroup === group ? "Generating…" : "AI"}
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    {items.map((item) => {
                      const fieldType = getFieldType(item);
                      const val = values[item.id] ?? item.content_value;
                      const isChanged = changedIds.has(item.id);
                      const showCounter = fieldType !== "short";

                      return (
                        <div key={item.id} className="relative">
                          <div className="mb-1.5 flex items-center gap-2">
                            {isChanged && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            )}
                            <Label className="text-xs font-medium">{item.content_label}</Label>
                            <code className="text-[10px] text-muted-foreground/50 font-mono">{item.content_key}</code>
                            <div className="flex-1" />
                            {showCounter && (
                              <span className="text-[10px] tabular-nums text-muted-foreground/50">{val.length} chars</span>
                            )}
                            {isChanged && (
                              <button
                                onClick={() => resetField(item.id)}
                                className="text-muted-foreground/40 transition-colors hover:text-primary"
                                title="Reset to original"
                              >
                                <RotateCcw size={11} />
                              </button>
                            )}
                          </div>
                          {fieldType === "long" ? (
                            <Textarea
                              value={val}
                              onChange={(e) => setValues((v) => ({ ...v, [item.id]: e.target.value }))}
                              rows={Math.max(3, Math.ceil(val.length / 80))}
                              className={`text-sm transition-colors ${isChanged ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            />
                          ) : (
                            <Input
                              value={val}
                              onChange={(e) => setValues((v) => ({ ...v, [item.id]: e.target.value }))}
                              className={`text-sm transition-colors ${isChanged ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <VersionHistoryPanel
          page={page}
          open={historyOpen}
          onRestore={handleRestoreVersion}
        />

        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={resetAll}
              disabled={changeCount === 0}
              className="text-muted-foreground"
            >
              Discard Changes
            </Button>
            <Button
              size="sm"
              variant={historyOpen ? "secondary" : "ghost"}
              onClick={() => setHistoryOpen((h) => !h)}
              className="text-muted-foreground"
            >
              <History size={13} className="mr-1" />
              History
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleSave(true)} disabled={saving} size="sm" variant="outline">
              <ExternalLink size={14} className="mr-1.5" />
              Save &amp; Preview
            </Button>
            <Button onClick={() => handleSave(false)} disabled={saving || changeCount === 0} size="sm">
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              Save{changeCount > 0 ? ` (${changeCount})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageContentEditorModal;
