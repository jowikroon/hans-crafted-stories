import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FolderOpen } from "lucide-react";
import { CaseStudyRow } from "@/lib/api/content";
import ImageCropUploader from "./ImageCropUploader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  study?: CaseStudyRow | null;
  onSave: (data: Partial<CaseStudyRow>) => Promise<void>;
}

const CaseStudyFormModal = ({ open, onOpenChange, study, onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [titleNl, setTitleNl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionNl, setDescriptionNl] = useState("");
  const [content, setContent] = useState("");
  const [contentNl, setContentNl] = useState("");
  const [image, setImage] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [externalUrl, setExternalUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (study) {
      setTitle(study.title); setTitleNl(study.title_nl || ""); setCategory(study.category);
      setDescription(study.description); setDescriptionNl(study.description_nl || "");
      setContent(study.content); setContentNl(study.content_nl || ""); setImage(study.image); setYear(study.year);
      setExternalUrl(study.external_url || ""); setSortOrder(study.sort_order); setPublished(study.published);
    } else {
      setTitle(""); setTitleNl(""); setCategory(""); setDescription(""); setDescriptionNl("");
      setContent(""); setContentNl(""); setImage("");
      setYear(new Date().getFullYear().toString()); setExternalUrl(""); setSortOrder(0); setPublished(false);
    }
  }, [study, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title, title_nl: titleNl, category, description, description_nl: descriptionNl,
        content, content_nl: contentNl, image, year,
        external_url: externalUrl || null, sort_order: sortOrder, published,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const filePrefix = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">{study ? "Edit Case Study" : "New Case Study"}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {study ? "Update your case study details" : "Add a new portfolio case study"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <ImageCropUploader
            imageUrl={image}
            onImageChange={setImage}
            storagePath="case-study-images"
            filePrefix={filePrefix}
            aspectRatio={16 / 9}
            label="Cover Image"
            hint="Recommended: 1600×900px (16:9 ratio). You'll be able to crop after selecting."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name..." />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="E-commerce / UX" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief project summary..." />
          </div>

          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" placeholder="Full case study content..." />
          </div>

          {/* Dutch Translations */}
          <div className="space-y-4 rounded-lg border border-border bg-secondary/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🇳🇱 Dutch Translations</p>
            <div className="space-y-1.5">
              <Label>Title (NL)</Label>
              <Input value={titleNl} onChange={(e) => setTitleNl(e.target.value)} placeholder="Nederlandse titel..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description (NL)</Label>
              <Textarea value={descriptionNl} onChange={(e) => setDescriptionNl(e.target.value)} rows={2} placeholder="Korte samenvatting..." />
            </div>
            <div className="space-y-1.5">
              <Label>Content (NL — Markdown)</Label>
              <Textarea value={contentNl} onChange={(e) => setContentNl(e.target.value)} rows={6} className="font-mono text-xs" placeholder="Volledige case study inhoud..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>External URL</Label>
            <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
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
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Published</p>
              <p className="text-xs text-muted-foreground">
                {published ? "This case study is visible to everyone" : "Saved as draft"}
              </p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title}>
            {saving ? "Saving…" : study ? "Update Study" : "Create Study"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaseStudyFormModal;
