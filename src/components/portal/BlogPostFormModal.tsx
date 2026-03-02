import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tag, Clock, Globe, X, Eye, Pencil } from "lucide-react";
import { BlogPostRow } from "@/lib/api/content";
import ImageCropUploader from "./ImageCropUploader";

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
  const [titleNl, setTitleNl] = useState("");
  const [excerptNl, setExcerptNl] = useState("");
  const [contentNl, setContentNl] = useState("");
  const [previewingNl, setPreviewingNl] = useState(false);
  const [category, setCategory] = useState("professional");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  const [published, setPublished] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const renderedMarkdown = useMemo(() => {
    if (!previewing || !content) return "";
    return content
      // code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rounded-md bg-secondary/60 border border-border p-3 overflow-x-auto text-xs font-mono my-3"><code>$2</code></pre>')
      // inline code
      .replace(/`([^`]+)`/g, '<code class="rounded bg-secondary/60 px-1.5 py-0.5 text-xs font-mono">$1</code>')
      // images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-md max-w-full my-2" />')
      // links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // headings
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-1.5">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2">$1</h1>')
      // bold & italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-primary/30 pl-3 italic text-muted-foreground my-2">$1</blockquote>')
      // unordered lists
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
      // ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
      // horizontal rule
      .replace(/^---$/gm, '<hr class="border-border my-4" />')
      // paragraphs (double newline)
      .replace(/\n\n/g, '</p><p class="my-2 text-sm leading-relaxed">')
      // single newlines
      .replace(/\n/g, '<br />');
  }, [content, previewing]);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setTitleNl(post.title_nl || "");
      setExcerptNl(post.excerpt_nl || "");
      setContentNl(post.content_nl || "");
      setCategory(post.category);
      setTags(post.tags.join(", "));
      setReadTime(post.read_time);
      setPublished(post.published);
      setImageUrl(post.image_url || "");
    } else {
      setTitle(""); setSlug(""); setExcerpt(""); setContent("");
      setTitleNl(""); setExcerptNl(""); setContentNl("");
      setCategory("professional"); setTags(""); setReadTime("5 min read");
      setPublished(false); setImageUrl("");
    }
    setTagInput("");
  }, [post, open]);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  const addTag = (tag: string) => {
    const clean = tag.trim().toUpperCase();
    if (!clean || tagList.includes(clean)) return;
    setTags(tagList.length > 0 ? `${tags}, ${clean}` : clean);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tagList.filter((t) => t !== tag).join(", "));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1]);
    }
  };

  // Auto-calculate read time from content
  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/).length;
      const mins = Math.max(1, Math.ceil(words / 200));
      setReadTime(`${mins} min read`);
    }
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        slug,
        excerpt,
        content,
        title_nl: titleNl,
        excerpt_nl: excerptNl,
        content_nl: contentNl,
        category,
        tags: tagList,
        read_time: readTime,
        published,
        image_url: imageUrl,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">{post ? "Edit Blog Post" : "New Blog Post"}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {post ? "Update your article content and settings" : "Create a new article for your blog"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cover Image with Crop */}
          <ImageCropUploader
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            storagePath="blog-images"
            filePrefix={slug || autoSlug(title) || "untitled"}
            aspectRatio={4 / 3}
            label="Cover Image"
            hint="Recommended: 1200×900px (4:3 ratio). You'll be able to crop after selecting."
          />

          {/* Title & Slug */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Title</Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (!post) setSlug(autoSlug(e.target.value)); }}
                placeholder="Enter a compelling title..."
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-muted-foreground/50" />
                <Label className="text-xs text-muted-foreground">URL Slug</Label>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/30 px-3">
                <span className="text-xs text-muted-foreground/50 select-none">/writing/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                  placeholder="auto-generated-slug"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Excerpt</Label>
              <span className="text-[11px] text-muted-foreground/50">{excerpt.length}/200</span>
            </div>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="A short summary that appears on the blog card and in search results..."
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Content (Markdown)</Label>
                <div className="flex rounded-md border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewing(false)}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      !previewing ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Pencil size={10} /> Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewing(true)}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      previewing ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye size={10} /> Preview
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {readTime}
                </span>
              </div>
            </div>
            {previewing ? (
              <div
                className="min-h-[336px] max-h-[336px] overflow-y-auto rounded-md border border-border bg-card p-4 text-sm leading-relaxed prose-sm"
                dangerouslySetInnerHTML={{ __html: content ? `<p class="my-2 text-sm leading-relaxed">${renderedMarkdown}</p>` : '<p class="text-muted-foreground/40 italic">Nothing to preview yet…</p>' }}
              />
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="font-mono text-xs leading-relaxed"
                placeholder="Write your article in Markdown..."
              />
            )}
          </div>

          {/* ── Dutch Translations ── */}
          <div className="space-y-4 rounded-lg border border-border bg-secondary/10 p-4">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              🇳🇱 Dutch Translations <span className="text-[11px] font-normal text-muted-foreground">(optional – falls back to English)</span>
            </p>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Title (NL)</Label>
              <Input
                value={titleNl}
                onChange={(e) => setTitleNl(e.target.value)}
                placeholder="Nederlandse titel…"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Excerpt (NL)</Label>
                <span className="text-[11px] text-muted-foreground/50">{excerptNl.length}/200</span>
              </div>
              <Textarea
                value={excerptNl}
                onChange={(e) => setExcerptNl(e.target.value)}
                rows={2}
                placeholder="Korte samenvatting in het Nederlands…"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Content (NL) (Markdown)</Label>
                <div className="flex rounded-md border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewingNl(false)}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      !previewingNl ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Pencil size={10} /> Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewingNl(true)}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      previewingNl ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye size={10} /> Preview
                  </button>
                </div>
              </div>
              {previewingNl ? (
                <div
                  className="min-h-[200px] max-h-[200px] overflow-y-auto rounded-md border border-border bg-card p-4 text-sm leading-relaxed prose-sm"
                  dangerouslySetInnerHTML={{ __html: contentNl ? `<p class="my-2 text-sm leading-relaxed">${contentNl}</p>` : '<p class="text-muted-foreground/40 italic">Nog niets om te laten zien…</p>' }}
                />
              ) : (
                <Textarea
                  value={contentNl}
                  onChange={(e) => setContentNl(e.target.value)}
                  rows={8}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Schrijf je artikel in Markdown…"
                />
              )}
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <div className="flex gap-2">
                {["professional", "personal"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-all ${
                      category === cat
                        ? cat === "professional"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Tag size={12} className="text-muted-foreground/50" />
                Tags
              </Label>
              <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                {tagList.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-[11px] uppercase tracking-wide">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X size={10} />
                    </button>
                  </Badge>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput) addTag(tagInput); }}
                  placeholder={tagList.length === 0 ? "Type and press Enter..." : ""}
                  className="h-6 min-w-[80px] flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40">Press Enter or comma to add a tag</p>
            </div>
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Published</p>
              <p className="text-xs text-muted-foreground">
                {published ? "This post is visible to everyone" : "This post is saved as a draft"}
              </p>
            </div>
            <Switch checked={published} onCheckedChange={setPublished} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title || !slug}>
            {saving ? "Saving…" : post ? "Update Post" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostFormModal;
