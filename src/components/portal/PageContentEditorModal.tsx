import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PageContentRow, updatePageContentBatch } from "@/lib/api/pageContent";
import { Save, Loader2, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: string;
  rows: PageContentRow[];
  onSaved: () => void;
}

const PageContentEditorModal = ({ open, onOpenChange, page, rows, onSaved }: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.id] = r.content_value));
    setValues(map);
  }, [rows]);

  const grouped = useMemo(() => {
    const groups: Record<string, PageContentRow[]> = {};
    rows.forEach((r) => {
      const g = r.content_group || "General";
      if (!groups[g]) groups[g] = [];
      groups[g].push(r);
    });
    return Object.entries(groups);
  }, [rows]);

  const hasChanges = useMemo(() => {
    return rows.some((r) => values[r.id] !== r.content_value);
  }, [rows, values]);

  const pageRoutes: Record<string, string> = { home: "/", work: "/work", writing: "/writing", about: "/about" };

  const handleSave = async (preview = false) => {
    const changed = rows
      .filter((r) => values[r.id] !== r.content_value)
      .map((r) => ({ id: r.id, content_value: values[r.id] ?? r.content_value }));
    if (changed.length === 0) {
      if (preview) window.open(pageRoutes[page] || "/", "_blank");
      return;
    }

    setSaving(true);
    try {
      await updatePageContentBatch(changed);
      toast({ title: `${page.charAt(0).toUpperCase() + page.slice(1)} content updated` });
      onSaved();
      if (preview) {
        window.open(pageRoutes[page] || "/", "_blank");
      } else {
        onOpenChange(false);
      }
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isLong = (value: string) => value.length > 80;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">{page} — Edit Content</DialogTitle>
          <DialogDescription>Edit the on-page text content for the {page} page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {grouped.map(([group, items]) => (
            <div key={group}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id}>
                    <Label className="mb-1 text-xs">{item.content_label}</Label>
                    {isLong(values[item.id] ?? item.content_value) ? (
                      <Textarea
                        value={values[item.id] ?? item.content_value}
                        onChange={(e) => setValues((v) => ({ ...v, [item.id]: e.target.value }))}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        value={values[item.id] ?? item.content_value}
                        onChange={(e) => setValues((v) => ({ ...v, [item.id]: e.target.value }))}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => handleSave(true)} disabled={saving} size="sm" variant="outline">
            <ExternalLink size={14} className="mr-1.5" />
            Save &amp; Preview
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving || !hasChanges} size="sm">
            {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageContentEditorModal;
