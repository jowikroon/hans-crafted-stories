import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CaseStudyRow } from "@/lib/api/content";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  study?: CaseStudyRow | null;
  onSave: (data: Partial<CaseStudyRow>) => Promise<void>;
}

const CaseStudyFormModal = ({ open, onOpenChange, study, onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [externalUrl, setExternalUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (study) {
      setTitle(study.title); setCategory(study.category); setDescription(study.description);
      setContent(study.content); setImage(study.image); setYear(study.year);
      setExternalUrl(study.external_url || ""); setSortOrder(study.sort_order); setPublished(study.published);
    } else {
      setTitle(""); setCategory(""); setDescription(""); setContent(""); setImage("");
      setYear(new Date().getFullYear().toString()); setExternalUrl(""); setSortOrder(0); setPublished(false);
    }
  }, [study, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title, category, description, content, image, year,
        external_url: externalUrl || null, sort_order: sortOrder, published,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{study ? "Edit Case Study" : "New Case Study"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="E-commerce / UX" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>External URL</Label>
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label>Published</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaseStudyFormModal;