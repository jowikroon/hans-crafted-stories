import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { BlogPostRow } from "@/lib/api/content";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: BlogPostRow | null;
  onSave: (data: Partial<BlogPostRow>) => Promise<void>;
}

const BlogPostFormModal = ({ open, onOpenChange, post, onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("professional");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  const [published, setPublished] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setCategory(post.category);
      setTags(post.tags.join(", "));
      setReadTime(post.read_time);
      setPublished(post.published);
      setImageUrl(post.image_url || "");
    } else {
      setTitle(""); setSlug(""); setExcerpt(""); setContent("");
      setCategory("professional"); setTags(""); setReadTime("5 min read");
      setPublished(false); setImageUrl("");
    }
  }, [post, open]);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const uploadImage = async (file: File) => {
    const currentSlug = slug || autoSlug(title) || "untitled";
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `blog-images/${currentSlug}-${Date.now()}.${ext}`;

    setUploading(true);
    try {
      const { error } = await supabase.storage.from("bucket").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
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
        title,
        slug,
        excerpt,
        content,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        read_time: readTime,
        published,
        image_url: imageUrl,
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
          <DialogTitle className="font-display">{post ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={imageUrl} alt="Cover" className="h-40 w-full object-cover" />
                <button
                  onClick={() => setImageUrl("")}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!post) setSlug(autoSlug(e.target.value)); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Content (Markdown)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="font-mono text-xs" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="UX, AI" />
            </div>
            <div className="space-y-1.5">
              <Label>Read Time</Label>
              <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label>Published</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title || !slug}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostFormModal;
