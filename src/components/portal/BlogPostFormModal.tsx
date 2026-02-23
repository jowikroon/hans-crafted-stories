import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BlogPostRow } from "@/lib/api/content";

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
  const [saving, setSaving] = useState(false);

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
    } else {
      setTitle(""); setSlug(""); setExcerpt(""); setContent("");
      setCategory("professional"); setTags(""); setReadTime("5 min read"); setPublished(false);
    }
  }, [post, open]);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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