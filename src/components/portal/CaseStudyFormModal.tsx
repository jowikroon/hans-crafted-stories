import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Image as ImageIcon } from "lucide-react";
import { CaseStudyRow } from "@/lib/api/content";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadImage = async (file: File) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "untitled";
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `case-study-images/${slug}-${Date.now()}.${ext}`;

    setUploading(true);
    try {
      const { error } = await supabase.storage.from("bucket").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
      setImage(urlData.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadImage(file);
  };

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

          {/* Cover Image Upload */}
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            {image ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={image} alt="Cover" className="h-40 w-full object-cover" />
                <button
                  onClick={() => setImage("")}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-destructive"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {uploading ? (
                  <p className="text-sm text-muted-foreground">Uploading…</p>
                ) : (
                  <>
                    <ImageIcon size={24} className="text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or <span className="font-medium text-primary">click to browse</span>
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label>External URL</Label>
            <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
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
