import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Tag, Clock, Globe, X, Copy, Check,
  ChevronDown, ChevronRight, AlertCircle, Languages,
  Send, Save, Search, CalendarClock,
} from "lucide-react";
import { BlogPostRow } from "@/lib/api/content";
import ImageCropUploader from "./ImageCropUploader";
import RichTextEditor from "./RichTextEditor";

// ═══════════════════════════════════════════════════════════
//  BlogPostFormModal — Premium Editorial Blog Builder
//  Redesigned interior: content editor, translation workflow,
//  classification, publish confidence, footer actions.
//  Surrounding portal/modal chrome remains unchanged.
// ═══════════════════════════════════════════════════════════

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: BlogPostRow | null;
  onSave: (data: Partial<BlogPostRow>) => Promise<void>;
}

// ─── Completeness logic ──────────────────────────────────

interface ReadinessCheck {
  label: string;
  met: boolean;
}

function computeReadiness(
  title: string, slug: string, excerpt: string, content: string,
  imageUrl: string, tagList: string[], category: string,
): ReadinessCheck[] {
  return [
    { label: "Title", met: title.trim().length >= 3 },
    { label: "URL slug", met: slug.trim().length >= 3 },
    { label: "Excerpt", met: excerpt.trim().length >= 20 },
    { label: "Content", met: content.trim().split(/\s+/).length >= 50 },
    { label: "Cover image", met: !!imageUrl },
    { label: "At least 1 tag", met: tagList.length >= 1 },
    { label: "Category set", met: !!category },
  ];
}

function nlCompleteness(titleNl: string, excerptNl: string, contentNl: string): { filled: number; total: number; pct: number } {
  const total = 3;
  let filled = 0;
  if (titleNl.trim()) filled++;
  if (excerptNl.trim()) filled++;
  if (contentNl.trim()) filled++;
  return { filled, total, pct: Math.round((filled / total) * 100) };
}

// ─── Section header (collapsible) ────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, badge, open, onToggle, children }: {
  icon: typeof BookOpen; title: string; subtitle?: string;
  badge?: React.ReactNode; open?: boolean; onToggle?: () => void;
  children?: React.ReactNode;
}) {
  const isCollapsible = onToggle !== undefined;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        disabled={!isCollapsible}
        className={`w-full flex items-center gap-2.5 py-2 text-left group ${isCollapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/8 shrink-0">
          <Icon size={13} className="text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        {isCollapsible && (
          <div className="text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors shrink-0">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>
      {(!isCollapsible || open) && children && (
        <div className="mt-2">{children}</div>
      )}
    </div>
  );
}

// ─── Content metrics bar ─────────────────────────────────

function ContentMetrics({ wordCount, charCount, readTime }: { wordCount: number; charCount: number; readTime: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40 font-mono tabular-nums">
      <span>{wordCount.toLocaleString()} words</span>
      <span className="h-2 w-px bg-border" />
      <span>{charCount.toLocaleString()} chars</span>
      <span className="h-2 w-px bg-border" />
      <span className="flex items-center gap-1"><Clock size={9} />{readTime}</span>
    </div>
  );
}

// ─── Excerpt field with counter ──────────────────────────

function ExcerptField({ value, onChange, placeholder, maxLength = 200 }: {
  value: string; onChange: (v: string) => void; placeholder: string; maxLength?: number;
}) {
  const remaining = maxLength - value.length;
  const nearLimit = remaining < 30;
  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        maxLength={maxLength}
        className="text-sm leading-relaxed resize-none"
      />
      <div className="flex justify-end">
        <span className={`text-[10px] font-mono tabular-nums ${nearLimit ? "text-amber-500/70" : "text-muted-foreground/30"}`}>
          {remaining} remaining
        </span>
      </div>
    </div>
  );
}

// ─── Missing fields indicator (lightweight) ─────────────

function MissingFields({ checks }: { checks: ReadinessCheck[] }) {
  const missing = checks.filter(c => !c.met);
  if (missing.length === 0) return (
    <p className="text-[11px] text-emerald-500/70 flex items-center gap-1.5">
      <Check size={11} /> All fields complete
    </p>
  );
  return (
    <p className="text-[11px] text-muted-foreground/50">
      Missing: {missing.map(m => m.label.toLowerCase()).join(", ")}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

const BlogPostFormModal = ({ open, onOpenChange, post, onSave }: Props) => {
  // ─── State ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [titleNl, setTitleNl] = useState("");
  const [excerptNl, setExcerptNl] = useState("");
  const [contentNl, setContentNl] = useState("");
  const [category, setCategory] = useState("professional");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  const [published, setPublished] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [nlExpanded, setNlExpanded] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const isEdit = !!post;

  // ─── Init from post ────────────────────────────────────
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
      setMetaTitle(post.meta_title || "");
      setMetaDescription(post.meta_description || "");
      setOgImage(post.og_image || "");
      setCanonicalUrl(post.canonical_url || "");
      setScheduledAt(post.scheduled_at || "");
      // Auto-expand NL if any translations exist
      setNlExpanded(!!(post.title_nl || post.excerpt_nl || post.content_nl));
      setSeoExpanded(!!(post.meta_title || post.meta_description));
    } else {
      setTitle(""); setSlug(""); setExcerpt(""); setContent("");
      setTitleNl(""); setExcerptNl(""); setContentNl("");
      setCategory("professional"); setTags(""); setReadTime("5 min read");
      setPublished(false); setImageUrl("");
      setMetaTitle(""); setMetaDescription(""); setOgImage(""); setCanonicalUrl(""); setScheduledAt("");
      setNlExpanded(false); setSeoExpanded(false);
    }
    setTagInput("");
  }, [post, open]);

  // ─── Derived ───────────────────────────────────────────
  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const readiness = useMemo(
    () => computeReadiness(title, slug, excerpt, content, imageUrl, tagList, category),
    [title, slug, excerpt, content, imageUrl, tagList, category],
  );
  const readyCount = readiness.filter(c => c.met).length;
  const isReady = readyCount === readiness.length;

  const nlStatus = useMemo(() => nlCompleteness(titleNl, excerptNl, contentNl), [titleNl, excerptNl, contentNl]);

  // ─── Auto read time ────────────────────────────────────
  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/).length;
      const mins = Math.max(1, Math.ceil(words / 200));
      setReadTime(`${mins} min read`);
    }
  }, [content]);

  // ─── Tag helpers ───────────────────────────────────────
  const addTag = useCallback((tag: string) => {
    const clean = tag.trim().toUpperCase();
    if (!clean || tagList.includes(clean)) return;
    setTags(tagList.length > 0 ? `${tags}, ${clean}` : clean);
    setTagInput("");
  }, [tagList, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(tagList.filter((t) => t !== tag).join(", "));
  }, [tagList]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1]);
    }
  };

  // ─── Copy from English helper ──────────────────────────
  const copyFromEnglish = useCallback((field: "title" | "excerpt" | "content") => {
    if (field === "title") setTitleNl(title);
    if (field === "excerpt") setExcerptNl(excerpt);
    if (field === "content") setContentNl(content);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, [title, excerpt, content]);

  // ─── Save ──────────────────────────────────────────────
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
        meta_title: metaTitle,
        meta_description: metaDescription,
        og_image: ogImage,
        canonical_url: canonicalUrl,
        scheduled_at: scheduledAt || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const canSave = title.trim().length >= 1 && slug.trim().length >= 1;

  // ─── Render ────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* ─── Header ─────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-b from-secondary/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
              <BookOpen size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-display">
                {isEdit ? "Edit Article" : "New Article"}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {isEdit ? "Refine your content, translations, and settings" : "Write, translate, and publish"}
              </p>
            </div>
            {/* Readiness badge — only shown when editing or user has started filling fields */}
            {(isEdit || readyCount > 0) && (
              <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                isReady
                  ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-secondary/30 text-muted-foreground/50"
              }`}>
                {isReady ? <Check size={10} /> : null}
                {isReady ? "Ready" : `${readyCount}/${readiness.length}`}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* ─── Body ───────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-7">

          {/* ═══ 1. COVER IMAGE ═══ */}
          <ImageCropUploader
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            storagePath="blog-images"
            filePrefix={slug || autoSlug(title) || "untitled"}
            aspectRatio={4 / 3}
            label="Cover Image"
            hint="Recommended: 1200×900px (4:3). Crop after selecting."
          />

          {/* ═══ 2. TITLE & SLUG ═══ */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (!post) setSlug(autoSlug(e.target.value)); }}
                placeholder="Article title…"
                className="text-lg font-semibold border-0 border-b border-border/40 rounded-none px-0 py-2 bg-transparent placeholder:text-muted-foreground/25 focus-visible:ring-0 focus-visible:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
              <Globe size={11} className="shrink-0" />
              <span className="select-none">/writing/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 bg-transparent text-xs text-muted-foreground/60 outline-none placeholder:text-muted-foreground/25 font-mono focus-visible:text-foreground/80 rounded-sm focus-visible:ring-1 focus-visible:ring-primary/30 px-1 -mx-1"
                placeholder="auto-generated-slug"
                aria-label="URL slug"
              />
            </div>
          </div>

          {/* ═══ 3. EXCERPT ═══ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              Excerpt
            </Label>
            <ExcerptField
              value={excerpt}
              onChange={setExcerpt}
              placeholder="A compelling summary for blog cards and search results…"
            />
          </div>

          {/* ═══ 4. CONTENT ═══ */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              Content
            </Label>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your article…"
              minHeight="320px"
            />

            <ContentMetrics wordCount={wordCount} charCount={charCount} readTime={readTime} />
          </div>

          {/* ═══ 5. DUTCH TRANSLATION ═══ */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-b from-secondary/10 to-transparent px-4 pt-3 pb-1">
            <SectionHeader
              icon={Languages}
              title="Dutch Translation"
              subtitle="Optional — English is used when Dutch is empty"
              badge={
                nlStatus.filled > 0 ? (
                  <span className={`text-[10px] font-mono tabular-nums rounded-full px-1.5 py-0.5 ${
                    nlStatus.pct === 100
                      ? "bg-emerald-500/10 text-emerald-500/70"
                      : "bg-amber-500/10 text-amber-500/60"
                  }`}>
                    {nlStatus.filled}/{nlStatus.total}
                  </span>
                ) : undefined
              }
              open={nlExpanded}
              onToggle={() => setNlExpanded(!nlExpanded)}
            >
              <div className="space-y-4 pb-3">
                  {/* NL Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground/60">Titel (NL)</Label>
                      {title && (
                        <button
                          type="button"
                          onClick={() => copyFromEnglish("title")}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        >
                          {copiedField === "title" ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy EN</>}
                        </button>
                      )}
                    </div>
                    <Input
                      value={titleNl}
                      onChange={(e) => setTitleNl(e.target.value)}
                      placeholder="Nederlandse titel…"
                      className="text-sm"
                    />
                  </div>

                  {/* NL Excerpt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground/60">Samenvatting (NL)</Label>
                      {excerpt && (
                        <button
                          type="button"
                          onClick={() => copyFromEnglish("excerpt")}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        >
                          {copiedField === "excerpt" ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy EN</>}
                        </button>
                      )}
                    </div>
                    <ExcerptField
                      value={excerptNl}
                      onChange={setExcerptNl}
                      placeholder="Korte samenvatting in het Nederlands…"
                    />
                  </div>

                  {/* NL Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-medium text-muted-foreground/60">Inhoud (NL)</Label>
                      {content && (
                        <button
                          type="button"
                          onClick={() => copyFromEnglish("content")}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        >
                          {copiedField === "content" ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy EN</>}
                        </button>
                      )}
                    </div>

                    <RichTextEditor
                      value={contentNl}
                      onChange={setContentNl}
                      placeholder="Schrijf je artikel…"
                      minHeight="180px"
                      compact
                    />
                  </div>
                </div>
              </SectionHeader>
          </div>

          {/* ═══ 6. CATEGORY & TAGS ═══ */}
          <div className="space-y-4 pt-1 border-t border-border/30">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "professional", label: "Professional", desc: "Industry & expertise", color: "emerald" as const },
                    { id: "personal", label: "Personal", desc: "Thoughts & stories", color: "amber" as const },
                  ].map((cat) => {
                    const selected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all ${
                          selected
                            ? cat.color === "emerald"
                              ? "border-emerald-500/40 bg-emerald-500/8 ring-1 ring-emerald-500/20"
                              : "border-amber-500/40 bg-amber-500/8 ring-1 ring-amber-500/20"
                            : "border-border/60 bg-card/30 hover:border-muted-foreground/30 hover:bg-card/60"
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          selected
                            ? cat.color === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                            : "text-foreground/70"
                        }`}>
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 mt-0.5">{cat.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={10} />
                  Tags
                </Label>
                <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card/30 px-3 py-2 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/15 transition-all">
                  {tagList.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 rounded-md text-[10px] uppercase tracking-wider font-medium border border-border/50">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 p-0.5 -mr-0.5 rounded hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label={`Remove tag ${tag}`}>
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => { if (tagInput) addTag(tagInput); }}
                    placeholder={tagList.length === 0 ? "Add tags (Enter to add)…" : "+"}
                    className="h-5 min-w-[60px] flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/30"
                  />
                </div>
                {tagList.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/30">Press Enter or comma to add tags. Helps with SEO and discovery.</p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ 6b. SEO SETTINGS ═══ */}
          <div className="rounded-xl border border-border/50 bg-gradient-to-b from-secondary/10 to-transparent px-4 pt-3 pb-1">
            <SectionHeader
              icon={Search}
              title="SEO Settings"
              subtitle="Meta tags for search engines and social sharing"
              badge={
                (metaTitle || metaDescription) ? (
                  <span className="text-[10px] font-mono tabular-nums rounded-full px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500/70">
                    configured
                  </span>
                ) : undefined
              }
              open={seoExpanded}
              onToggle={() => setSeoExpanded(!seoExpanded)}
            >
              <div className="space-y-3 pb-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground/60">Meta Title</Label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || "Defaults to article title"}
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground/40">
                    {(metaTitle || title).length}/60 characters — {(metaTitle || title).length <= 60 ? "good length" : "consider shortening"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground/60">Meta Description</Label>
                  <ExcerptField
                    value={metaDescription}
                    onChange={setMetaDescription}
                    placeholder={excerpt || "Defaults to excerpt"}
                    maxLength={160}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground/60">OG Image URL</Label>
                    <Input
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder={imageUrl ? "Defaults to cover image" : "https://..."}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground/60">Canonical URL</Label>
                    <Input
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="Leave empty for default"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </SectionHeader>
          </div>

          {/* ═══ 6c. SCHEDULED PUBLISHING ═══ */}
          {!published && (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/10 px-4 py-3">
              <CalendarClock size={15} className="text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/70">Schedule Publishing</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                  {scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : "Set a future date to auto-publish"}
                </p>
              </div>
              <input
                type="datetime-local"
                value={scheduledAt ? scheduledAt.slice(0, 16) : ""}
                onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="rounded-lg border border-border/50 bg-card/50 px-2 py-1 text-xs text-foreground/70 outline-none focus:border-primary/40"
              />
              {scheduledAt && (
                <button
                  type="button"
                  onClick={() => setScheduledAt("")}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* ═══ 7. PUBLISH STATUS ═══ */}
          <div className={`rounded-xl border p-4 transition-all ${
            published
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-border/50 bg-secondary/10"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    published
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/50 text-muted-foreground/60"
                  }`}>
                    {published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                  {published
                    ? "Live on your blog. Visible to everyone and indexed by search engines."
                    : "Saved privately. Only you can see this in the portal."
                  }
                </p>
                {published && !isReady && (
                  <p className="text-[10px] text-amber-500/70 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> Some fields are incomplete — consider adding them before publishing.
                  </p>
                )}
              </div>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>

            {/* Readiness — only visible when published */}
            {published && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <MissingFields checks={readiness} />
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─────────────────────────────────────── */}
        <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: cancel */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground/60 hover:text-foreground"
            >
              Cancel
            </Button>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {published ? (
                /* Publishing mode: single publish button */
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  className="gap-1.5"
                >
                  <Send size={13} />
                  {saving ? "Publishing…" : isEdit ? "Update & Publish" : "Publish"}
                </Button>
              ) : (
                /* Draft mode: single save button */
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  className="gap-1.5"
                >
                  <Save size={13} />
                  {saving ? "Saving…" : isEdit ? "Update Draft" : "Save Draft"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostFormModal;
