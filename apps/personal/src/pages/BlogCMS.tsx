// apps/personal/src/pages/BlogCMS.tsx
// Warm editorial CMS — matches /mnt/user-data/uploads/hansvanleeuwen_com.zip design.
// Reuses existing .dark palette from index.css (terracotta primary, warm bg).
// No hardcoded cool-grey constants. All color comes from HSL tokens.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Search, Plus, Save, Eye, Edit3, Columns, Trash2, ChevronRight,
  Sparkles, Youtube, Brain, Bold, Italic, Heading, Quote, List, Link2,
  Code, Image as ImageIcon, Filter, ArrowUpDown, MoreHorizontal, Play,
} from "lucide-react";
import {
  Radar, Meter, Stat, SecLabel, Chip, Kbd, Eyebrow,
} from "@/components/portal/blog/primitives";
import {
  analyzeVoice, computeCompleteness, extractOutline,
  type VoiceTemplate as VT, type VoiceAnalysis,
} from "@/lib/blog/voice-analysis";

// ─── Types ────────────────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  image_url: string;
  published: boolean;
  scheduled_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  og_title: string | null;
  og_description: string | null;
  primary_keyword: string | null;
  content_nl: string | null;
  title_nl: string | null;
  excerpt_nl: string | null;
  status: string;
  voice_template_id: string | null;
  voice_match_score: number;
  completeness_score: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

type CmsView = "articles" | "editor" | "voice";
type EditorMode = "write" | "split" | "preview";

const TABS: { id: CmsView; label: string }[] = [
  { id: "articles", label: "Articles" },
  { id: "editor", label: "Editor" },
  { id: "voice", label: "Voice Templates" },
];

const PAGE_META: Record<CmsView, { eyebrow: string; titleA: string; titleEm: string; subtitle: string }> = {
  editor: {
    eyebrow: "Editorial Desk",
    titleA: "Draft",
    titleEm: "in progress",
    subtitle: "Write, analyze voice, and get editorial feedback before publishing to hansvanleeuwen.com/writing.",
  },
  voice: {
    eyebrow: "Voice Studio",
    titleA: "Voice",
    titleEm: "templates",
    subtitle: "Define how each article should sound — tone axes, readability targets, terminology, and rules.",
  },
  articles: {
    eyebrow: "Library",
    titleA: "All",
    titleEm: "articles",
    subtitle: "Drafts, scheduled and published posts across NL and EN.",
  },
};

const EMPTY_POST = (): Omit<BlogPost, "id" | "created_at" | "updated_at"> => ({
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  category: "e-commerce",
  tags: [],
  image_url: "",
  published: false,
  scheduled_at: null,
  meta_title: null,
  meta_description: null,
  og_image: null,
  og_title: null,
  og_description: null,
  primary_keyword: null,
  content_nl: null,
  title_nl: null,
  excerpt_nl: null,
  status: "draft",
  voice_template_id: null,
  voice_match_score: 0,
  completeness_score: 0,
  word_count: 0,
});

const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ─── Root ─────────────────────────────────────────────────────────────────
export default function BlogCMS() {
  const [tab, setTab] = useState<CmsView>(() => {
    const saved = localStorage.getItem("cms_tab") as CmsView | null;
    return saved && TABS.some((t) => t.id === saved) ? saved : "editor";
  });
  useEffect(() => {
    localStorage.setItem("cms_tab", tab);
  }, [tab]);

  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans antialiased">
      <PortalHeader tab={tab} setTab={setTab} />
      <StatusRibbon />
      <TabBar tab={tab} setTab={setTab} />
      {tab === "articles" && <ArticlesScreen onEdit={() => setTab("editor")} />}
      {tab === "editor" && <EditorScreen />}
      {tab === "voice" && <VoiceTemplatesScreen />}
    </div>
  );
}

// ─── Portal header (breadcrumb + eyebrow + title + subtitle + actions) ───
function PortalHeader({ tab, setTab }: { tab: CmsView; setTab: (t: CmsView) => void }) {
  const meta = PAGE_META[tab];
  const actions: Record<CmsView, React.ReactNode> = {
    editor: (
      <>
        <Button variant="ghost" size="sm">Preview</Button>
        <Button variant="outline" size="sm">Save draft</Button>
        <Button size="sm">Publish</Button>
      </>
    ),
    voice: (
      <>
        <Button variant="ghost" size="sm" onClick={() => setTab("editor")}>Test on draft</Button>
        <Button size="sm" asChild><a href="/blog-cms/voice/new">+ New template</a></Button>
      </>
    ),
    articles: (
      <>
        <Button variant="ghost" size="sm">Import CSV</Button>
        <Button size="sm" onClick={() => setTab("editor")}>+ New article</Button>
      </>
    ),
  };
  return (
    <header className="px-8 pt-7 pb-4 border-b border-border/40 bg-background">
      <nav className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground mb-4">
        <span className="hover:text-foreground cursor-pointer">PORTAL</span>
        <span className="opacity-50">›</span>
        <span className="hover:text-foreground cursor-pointer">CONTENT</span>
        <span className="opacity-50">›</span>
        <span className="text-foreground">BLOG CMS</span>
      </nav>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-2">{meta.eyebrow}</Eyebrow>
          <h1 className="font-display text-[40px] leading-[1.05] font-medium tracking-tight text-foreground">
            {meta.titleA} <em className="italic text-primary font-normal">{meta.titleEm}</em>
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground leading-relaxed">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pb-1">{actions[tab]}</div>
      </div>
    </header>
  );
}

// ─── Status ribbon (instrument-style context bar) ────────────────────────
function StatusRibbon() {
  return (
    <div className="px-8 py-2.5 flex items-center gap-2.5 border-b border-border/40 bg-background">
      <RibbonPill tone="ok">Supabase synced · 2m ago</RibbonPill>
      <RibbonPill tone="warn">1 agent note on draft</RibbonPill>
      <RibbonPill tone="info">Samantha standing by</RibbonPill>
      <span className="flex-1" />
      <Kbd>⌘K</Kbd>
      <span className="font-mono text-[10.5px] tracking-[0.05em] text-muted-foreground">
        search · navigate · trigger
      </span>
    </div>
  );
}

function RibbonPill({ tone, children }: { tone: "ok" | "warn" | "info"; children: React.ReactNode }) {
  const colorVar = tone === "ok" ? "--ok" : tone === "warn" ? "--warn" : "--info";
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border font-mono text-[10px] tracking-[0.04em]"
      style={{
        color: `hsl(var(${colorVar}))`,
        borderColor: `hsl(var(${colorVar}) / 0.35)`,
        background: `hsl(var(${colorVar}) / 0.08)`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{
        background: `hsl(var(${colorVar}))`,
        boxShadow: `0 0 0 3px hsl(var(${colorVar}) / 0.18)`,
      }} />
      {children}
    </span>
  );
}

// ─── Section tabs ────────────────────────────────────────────────────────
function TabBar({ tab, setTab }: { tab: CmsView; setTab: (t: CmsView) => void }) {
  return (
    <nav className="h-11 border-b border-border/60 px-8 flex items-end gap-0.5 bg-background">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 pb-2.5 pt-2 text-[13px] font-medium flex items-center gap-2 border-b-2 -mb-px transition-colors ${
              active
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  EDITOR SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function EditorScreen() {
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [voiceTemplates, setVoiceTemplates] = useState<VT[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState(EMPTY_POST());
  const [mode, setMode] = useState<EditorMode>("split");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autosaveTimer, setAutosaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch posts + templates
  const fetchData = useCallback(async () => {
    const [postsRes, tplRes] = await Promise.all([
      supabase.from("blog_posts").select("*").order("updated_at", { ascending: false }),
      supabase.from("hvl_voice_templates").select("*").order("is_default", { ascending: false }),
    ]);
    if (postsRes.error) {
      toast({ title: "Error", description: postsRes.error.message, variant: "destructive" });
    } else {
      const rows = (postsRes.data ?? []) as unknown as BlogPost[];
      setPosts(rows);
      // Load the most-recently-updated draft into the editor on first load
      if (!editingPost && rows.length > 0) {
        const target = rows.find((r) => r.status === "draft") ?? rows[0];
        hydrateDraft(target);
      }
    }
    if (!tplRes.error) setVoiceTemplates((tplRes.data ?? []) as unknown as VT[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hydrateDraft = (post: BlogPost) => {
    setEditingPost(post);
    setDraft({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags ?? [],
      image_url: post.image_url,
      published: post.published,
      scheduled_at: post.scheduled_at,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      og_image: post.og_image,
      og_title: post.og_title,
      og_description: post.og_description,
      primary_keyword: post.primary_keyword,
      content_nl: post.content_nl,
      title_nl: post.title_nl,
      excerpt_nl: post.excerpt_nl,
      status: post.status,
      voice_template_id: post.voice_template_id,
      voice_match_score: post.voice_match_score,
      completeness_score: post.completeness_score,
      word_count: post.word_count,
    });
  };

  // ── Active voice template
  const activeTemplate: VT | null = useMemo(() => {
    if (!voiceTemplates.length) return null;
    const byId = voiceTemplates.find((t) => t.id === draft.voice_template_id);
    if (byId) return byId;
    return voiceTemplates[0]; // Default is first (is_default=true ordered first)
  }, [voiceTemplates, draft.voice_template_id]);

  // ── Live analysis (recomputed on content change, debounced naturally by React)
  const analysis: VoiceAnalysis | null = useMemo(() => {
    if (!activeTemplate) return null;
    if (!draft.content || draft.content.length < 50) return null;
    return analyzeVoice(draft.content, activeTemplate);
  }, [draft.content, activeTemplate]);

  const outline = useMemo(() => extractOutline(draft.content), [draft.content]);
  const completeness = useMemo(() => computeCompleteness(draft), [draft]);

  // ── Save
  const save = useCallback(async () => {
    if (!draft.title.trim()) {
      toast({ title: "Title required", description: "Add a title before saving." });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<BlogPost> = {
        ...draft,
        published: draft.status === "published",
        voice_match_score: analysis?.match_score ?? 0,
        completeness_score: completeness,
        word_count: analysis?.readability.words ?? 0,
      };
      if (editingPost) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) setEditingPost(data as unknown as BlogPost);
      }
      setLastSaved(new Date());
      await fetchData();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [draft, editingPost, analysis, completeness, toast, fetchData]);

  // ── Autosave 3s after last change
  useEffect(() => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    if (!editingPost || !draft.title) return;
    const t = setTimeout(() => save(), 3000);
    setAutosaveTimer(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.content, draft.title, draft.slug, draft.excerpt]);

  // ── New post
  const newPost = () => {
    setEditingPost(null);
    const defaultTpl = voiceTemplates.find((t) => (t as VT & { is_default?: boolean }).is_default);
    setDraft({
      ...EMPTY_POST(),
      voice_template_id: defaultTpl?.id ?? null,
    });
  };

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 104px)" }}>
      {/* LEFT RAIL */}
      <EditorLeftRail
        draft={draft}
        editingPost={editingPost}
        completeness={completeness}
        activeTemplate={activeTemplate}
        voiceTemplates={voiceTemplates}
        outline={outline}
        lastSaved={lastSaved}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        onSelectTemplate={(id) => setDraft((d) => ({ ...d, voice_template_id: id }))}
        onNew={newPost}
        posts={posts}
        onOpenPost={hydrateDraft}
      />

      {/* CENTER */}
      <main className="flex-1 min-w-0 flex flex-col">
        <SourceBar
          category={draft.category}
          onApplyDraft={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        />
        <EditorToolbar
          mode={mode}
          setMode={setMode}
          onSave={save}
          saving={saving}
          draft={draft}
          setDraft={setDraft}
        />
        <div className="flex flex-1">
          {(mode === "write" || mode === "split") && (
            <div className="flex-1 min-w-0 relative" style={{ padding: "40px 64px 40px 80px" }}>
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="font-mono text-[9.5px] tracking-[0.2em] text-muted-foreground">
                  MARKDOWN
                </span>
              </div>
              <MarkdownEditor
                value={draft.content}
                onChange={(content) => setDraft((d) => ({ ...d, content }))}
                title={draft.title}
                onTitleChange={(title) => {
                  setDraft((d) => ({
                    ...d,
                    title,
                    slug: d.slug || slugify(title),
                  }));
                }}
              />
            </div>
          )}
          {mode === "split" && <div className="w-px bg-border/60" />}
          {(mode === "preview" || mode === "split") && (
            <div
              className="flex-1 min-w-0 relative"
              style={{ padding: "40px 80px 40px 64px", background: "hsl(var(--card) / 0.25)" }}
            >
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <span className="font-mono text-[9.5px] tracking-[0.2em] text-muted-foreground">
                  RENDERED PREVIEW
                </span>
              </div>
              <RenderedPreview title={draft.title} content={draft.content} />
            </div>
          )}
        </div>

        {/* VOICE ANALYSIS BAR */}
        {activeTemplate && (
          <VoiceAnalysisBar
            analysis={analysis}
            template={activeTemplate}
          />
        )}
      </main>

      {/* RIGHT RAIL */}
      <EditorRightRail draftId={editingPost?.id ?? null} />
    </div>
  );
}

// ─── LEFT RAIL ────────────────────────────────────────────────────────────
function EditorLeftRail({
  draft,
  editingPost,
  completeness,
  activeTemplate,
  voiceTemplates,
  outline,
  lastSaved,
  onChange,
  onSelectTemplate,
  onNew,
  posts,
  onOpenPost,
}: {
  draft: ReturnType<typeof EMPTY_POST>;
  editingPost: BlogPost | null;
  completeness: number;
  activeTemplate: VT | null;
  voiceTemplates: VT[];
  outline: ReturnType<typeof extractOutline>;
  lastSaved: Date | null;
  onChange: (patch: Partial<ReturnType<typeof EMPTY_POST>>) => void;
  onSelectTemplate: (id: string) => void;
  onNew: () => void;
  posts: BlogPost[];
  onOpenPost: (p: BlogPost) => void;
}) {
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPostPicker, setShowPostPicker] = useState(false);

  return (
    <aside
      className="w-[280px] border-r border-border/60 flex flex-col gap-7 overflow-y-auto"
      style={{ padding: "28px 24px", maxHeight: "calc(100vh - 104px)" }}
    >
      {/* Active draft header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Eyebrow>
            {editingPost ? "Now editing · " + draft.status : "New draft"}
          </Eyebrow>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px]"
              onClick={() => setShowPostPicker((s) => !s)}
            >
              Open
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={onNew}>
              <Plus size={12} className="mr-0.5" />
              New
            </Button>
          </div>
        </div>
        <input
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Untitled draft"
          className="font-display text-[22px] font-medium leading-tight tracking-tight bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground placeholder:text-foreground/30"
        />
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Chip
            tone={
              draft.status === "published"
                ? "green"
                : draft.status === "review"
                ? "primary"
                : draft.status === "scheduled"
                ? "amber"
                : "amber"
            }
            dot
          >
            {(draft.status || "draft").toUpperCase()}
          </Chip>
          <Chip>
            <span className="font-mono">{completeness}%</span> COMPLETE
          </Chip>
        </div>
      </div>

      {/* Post picker popover */}
      {showPostPicker && (
        <div className="flex flex-col gap-1 rounded border border-border bg-card p-2 max-h-[260px] overflow-y-auto">
          {posts.slice(0, 25).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onOpenPost(p);
                setShowPostPicker(false);
              }}
              className="text-left text-[12px] p-2 rounded hover:bg-muted/40 flex items-center gap-2"
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{
                  background:
                    p.status === "published"
                      ? "hsl(140 35% 55%)"
                      : p.status === "scheduled"
                      ? "hsl(38 70% 58%)"
                      : "hsl(var(--muted-foreground))",
                }}
              />
              <span className="flex-1 truncate">{p.title || "Untitled"}</span>
              <span className="font-mono text-[9.5px] text-muted-foreground">
                {p.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Slug */}
      <div className="flex flex-col gap-3">
        <SecLabel>Slug</SecLabel>
        <input
          value={draft.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="/auto-generated"
          className="font-mono text-xs text-muted-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
        />
      </div>

      {/* Voice template */}
      <div className="flex flex-col gap-3">
        <SecLabel>Voice template</SecLabel>
        {activeTemplate && (
          <div
            className="rounded border border-border/60 p-3"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="font-display text-sm font-medium">{activeTemplate.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider">
                  {(activeTemplate as VT & { is_default?: boolean }).is_default
                    ? "DEFAULT"
                    : "TEMPLATE"}{" "}
                  · GRADE {activeTemplate.target_reading_level}
                </div>
              </div>
              <Radar
                values={[
                  activeTemplate.formality,
                  activeTemplate.humor,
                  activeTemplate.respectfulness,
                  activeTemplate.enthusiasm,
                ]}
                size={44}
                rings={3}
                showLabels={false}
                fillOpacity={0.22}
              />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 self-start text-muted-foreground hover:text-foreground text-[11.5px]"
          onClick={() => setShowTemplatePicker((s) => !s)}
        >
          Change template
          <ChevronRight size={12} className="ml-1" />
        </Button>
        {showTemplatePicker && (
          <div className="flex flex-col gap-1">
            {voiceTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTemplate(t.id);
                  setShowTemplatePicker(false);
                }}
                className={`text-left text-[12px] p-2 rounded border transition-colors ${
                  t.id === activeTemplate?.id
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 hover:border-border"
                }`}
              >
                <div className="font-display">{t.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  F{t.formality} · H{t.humor} · R{t.respectfulness} · E{t.enthusiasm}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Outline */}
      <div className="flex flex-col gap-3">
        <SecLabel>Outline</SecLabel>
        <div className="flex flex-col gap-0.5">
          {outline.length === 0 && (
            <div className="font-mono text-[11px] text-muted-foreground/60">
              Add headings (##, ###) to see outline
            </div>
          )}
          {outline.slice(0, 12).map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1 rounded"
              style={{
                borderLeft: `2px solid ${i === 0 ? "hsl(var(--primary))" : "transparent"}`,
                background: i === 0 ? "hsl(var(--primary) / 0.08)" : "transparent",
                paddingLeft: item.level === "H3" ? 20 : 8,
              }}
            >
              <span className="font-mono text-[9.5px] text-muted-foreground w-5">{item.level}</span>
              <span
                className="text-[12.5px] truncate"
                style={{
                  color: i === 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  fontWeight: i === 0 ? 500 : 400,
                }}
              >
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-3">
        <SecLabel>Tags</SecLabel>
        <div className="flex flex-wrap gap-2">
          {draft.tags.map((t, i) => (
            <Chip
              key={t + i}
              onClick={() => onChange({ tags: draft.tags.filter((x) => x !== t) })}
            >
              {t}
            </Chip>
          ))}
          <AddTagInput onAdd={(t) => onChange({ tags: [...draft.tags, t] })} />
        </div>
      </div>

      {/* Last saved */}
      <div className="flex flex-col gap-3">
        <SecLabel>Last saved</SecLabel>
        <div className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          {lastSaved ? `${timeAgo(lastSaved)} · autosaved` : "Unsaved"}
          <br />
          <span style={{ color: "hsl(140 35% 55%)" }}>●</span> synced to Supabase
        </div>
      </div>
    </aside>
  );
}

function AddTagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 h-[22px] px-2 rounded border border-border font-mono text-[10.5px] text-muted-foreground hover:text-foreground"
      >
        + add
      </button>
    );
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && val.trim()) {
          onAdd(val.trim());
          setVal("");
          setOpen(false);
        }
      }}
      className="h-[22px] px-2 rounded border border-border bg-transparent font-mono text-[10.5px] w-24 outline-none focus:border-primary/60"
      placeholder="tag"
    />
  );
}

// ─── SOURCE BAR — Ghost Writer engine entry point ─────────────────────────
// Wires to the two-phase hans-blog-init pipeline defined in repo CLAUDE.md.
// Phase 1: POST to hans-blog-init → returns brand_voice, recent_posts, resume_url.
// Phase 2: Hans confirms the angle, we POST to resume_url with the final prompt.
// The n8n orchestrator then writes the generated post into blog_posts directly.
const BLOG_INIT_URL = "https://n8n.srv1402218.hstgr.cloud/webhook/hans-blog-init";

interface InitResponse {
  status: string;
  brand_voice: string;
  recent_posts: string;
  resume_url: string;
}

function SourceBar({
  category,
  onApplyDraft,
}: {
  category: string;
  onApplyDraft: (patch: Partial<ReturnType<typeof EMPTY_POST>>) => void;
}) {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [youtube, setYoutube] = useState("");
  const [angle, setAngle] = useState("");
  const [phase, setPhase] = useState<"idle" | "verifying" | "resuming">("idle");
  const [init, setInit] = useState<InitResponse | null>(null);

  async function startPhase1() {
    if (!topic.trim() && !youtube.trim()) {
      toast({ title: "Need a topic or YouTube URL to start." });
      return;
    }
    setPhase("verifying");
    try {
      const res = await fetch(BLOG_INIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category || "general",
          raw_idea_or_data: youtube.trim() || topic.trim(),
          proposed_angle: angle.trim() || topic.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Phase 1 failed: ${res.status}`);
      const data = (await res.json()) as InitResponse;
      setInit(data);
    } catch (err) {
      toast({
        title: "Ghost Writer offline",
        description: err instanceof Error ? err.message : "Could not reach hans-blog-init",
        variant: "destructive",
      });
      setPhase("idle");
    }
  }

  async function confirmPhase2(updatedBrandVoice: string) {
    if (!init) return;
    setPhase("resuming");
    try {
      const finalPrompt = [
        `Category: ${category || "general"}`,
        `Angle: ${angle.trim() || topic.trim()}`,
        `Source: ${youtube.trim() || "topic only"}`,
        "",
        "Brand voice:",
        updatedBrandVoice,
        "",
        "Recent coverage (avoid repetition):",
        init.recent_posts,
      ].join("\n");
      const res = await fetch(init.resume_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          updated_brand_voice: updatedBrandVoice,
          final_article_prompt: finalPrompt,
        }),
      });
      if (!res.ok) throw new Error(`Phase 2 failed: ${res.status}`);
      toast({
        title: "Ghost Writer dispatched",
        description: "n8n is drafting — the post will appear in Articles when ready.",
      });
      onApplyDraft({ category: category || "general" });
      setInit(null);
      setTopic("");
      setYoutube("");
      setAngle("");
    } catch (err) {
      toast({
        title: "Phase 2 failed",
        description: err instanceof Error ? err.message : "Could not resume orchestrator",
        variant: "destructive",
      });
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="border-b border-border/60 px-5 py-2.5 flex flex-col gap-2 bg-background">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9.5px] tracking-[0.2em] text-muted-foreground w-16">SOURCE</span>
        <div className="flex items-center flex-1 gap-2 rounded border border-border px-2.5 h-8" style={{ background: "hsl(var(--card))" }}>
          <Youtube size={12} className="text-muted-foreground" />
          <input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="YouTube URL (optional)"
            className="flex-1 bg-transparent border-none outline-none text-[12px] font-mono"
          />
        </div>
        <div className="flex items-center flex-1 gap-2 rounded border border-border px-2.5 h-8" style={{ background: "hsl(var(--card))" }}>
          <Sparkles size={12} className="text-muted-foreground" />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic or raw idea"
            className="flex-1 bg-transparent border-none outline-none text-[12px]"
          />
        </div>
        <div className="flex items-center flex-1 gap-2 rounded border border-border px-2.5 h-8" style={{ background: "hsl(var(--card))" }}>
          <input
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="Proposed angle (optional)"
            className="flex-1 bg-transparent border-none outline-none text-[12px]"
          />
        </div>
        <Button
          size="sm"
          className="h-8 text-[12px]"
          onClick={startPhase1}
          disabled={phase !== "idle"}
        >
          <Play size={11} className="mr-1" />
          {phase === "verifying" ? "Consulting memory…" : phase === "resuming" ? "Dispatching…" : "Ghost-write"}
        </Button>
      </div>
      {init && <PhaseTwoConfirm init={init} onCancel={() => { setInit(null); setPhase("idle"); }} onConfirm={confirmPhase2} />}
    </div>
  );
}

function PhaseTwoConfirm({
  init,
  onCancel,
  onConfirm,
}: {
  init: InitResponse;
  onCancel: () => void;
  onConfirm: (updatedBrandVoice: string) => void;
}) {
  const [voice, setVoice] = useState(init.brand_voice);
  return (
    <div
      className="rounded border border-primary/40 p-3 flex flex-col gap-2"
      style={{ background: "hsl(var(--primary) / 0.05)" }}
    >
      <div className="flex items-center gap-2">
        <Chip tone="primary" dot>PHASE 2 · VERIFY</Chip>
        <span className="font-mono text-[10.5px] text-muted-foreground">Edit brand voice if needed, then confirm to dispatch the ghost writer.</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Eyebrow>Brand voice</Eyebrow>
          <textarea
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="min-h-[80px] text-[12px] font-mono bg-card border border-border rounded p-2 outline-none focus:border-primary/60 resize-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Eyebrow>Recent coverage (last 5)</Eyebrow>
          <div className="min-h-[80px] text-[12px] bg-card border border-border/60 rounded p-2 text-muted-foreground whitespace-pre-wrap overflow-y-auto">
            {init.recent_posts || "— no prior posts in this category —"}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onConfirm(voice)}>
          <Sparkles size={11} className="mr-1" />
          Confirm & dispatch
        </Button>
      </div>
    </div>
  );
}

// ─── EDITOR TOOLBAR ───────────────────────────────────────────────────────
function EditorToolbar({
  mode,
  setMode,
  onSave,
  saving,
  draft,
  setDraft,
}: {
  mode: EditorMode;
  setMode: (m: EditorMode) => void;
  onSave: () => void;
  saving: boolean;
  draft: ReturnType<typeof EMPTY_POST>;
  setDraft: (fn: (d: ReturnType<typeof EMPTY_POST>) => ReturnType<typeof EMPTY_POST>) => void;
}) {
  const tools = [
    { icon: <Bold size={14} />, label: "Bold" },
    { icon: <Italic size={14} />, label: "Italic" },
    { icon: <Heading size={14} />, label: "Heading" },
    { icon: <Quote size={14} />, label: "Quote" },
    { icon: <List size={14} />, label: "List" },
    { icon: <Link2 size={14} />, label: "Link" },
    { icon: <Code size={14} />, label: "Code" },
    { icon: <ImageIcon size={14} />, label: "Image" },
  ];

  return (
    <div className="h-11 px-5 border-b border-border/60 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            title={t.label}
            className="w-7 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            {t.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-border/60 mx-1.5" />
        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">
          <Brain size={12} className="mr-1" />
          Insert concept
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">
          <Youtube size={12} className="mr-1" />
          Embed video
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">
          <Sparkles size={12} className="mr-1" />
          AI rewrite
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
          className="h-6 px-2 rounded border border-border bg-transparent font-mono text-[10.5px] text-muted-foreground outline-none focus:border-primary/60"
        >
          <option value="draft">DRAFT</option>
          <option value="review">IN REVIEW</option>
          <option value="scheduled">SCHEDULED</option>
          <option value="published">LIVE</option>
        </select>
        <div className="flex items-center gap-0 p-0.5 rounded border border-border">
          <ModeButton active={mode === "write"} onClick={() => setMode("write")}>
            <Edit3 size={11} className="mr-1" />
            Write
          </ModeButton>
          <ModeButton active={mode === "split"} onClick={() => setMode("split")}>
            <Columns size={11} className="mr-1" />
            Split
          </ModeButton>
          <ModeButton active={mode === "preview"} onClick={() => setMode("preview")}>
            <Eye size={11} className="mr-1" />
            Preview
          </ModeButton>
        </div>
        <Button size="sm" className="h-7 text-[12px]" onClick={onSave} disabled={saving}>
          <Save size={12} className="mr-1" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Kbd>⌘S</Kbd>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-5 px-2 rounded text-[10.5px] font-medium flex items-center transition-colors ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── MARKDOWN EDITOR ──────────────────────────────────────────────────────
function MarkdownEditor({
  value,
  onChange,
  title,
  onTitleChange,
}: {
  value: string;
  onChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="# Your title here"
        className="font-mono text-[18px] leading-relaxed bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-foreground/20"
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write in markdown. Use [[Concept Links]] for wiki entries. ## for H2, ### for H3."
        className="flex-1 min-h-[400px] bg-transparent border-none outline-none focus:ring-0 resize-none p-0 font-mono text-[13.5px] leading-[1.75] placeholder:text-foreground/20"
        spellCheck={true}
      />
    </div>
  );
}

// ─── RENDERED PREVIEW ─────────────────────────────────────────────────────
function RenderedPreview({ title, content }: { title: string; content: string }) {
  const html = useMemo(() => renderMarkdownToHTML(content), [content]);
  return (
    <article className="font-sans leading-[1.7]">
      <h1 className="font-display text-[34px] font-medium leading-tight tracking-tight mb-5">
        {title || "Untitled"}
      </h1>
      <div
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ fontSize: 15.5, color: "hsl(var(--foreground) / 0.88)" }}
      />
    </article>
  );
}

// Tiny, safe markdown renderer — headers, lists, paragraphs, bold, italic,
// inline code, links, blockquotes, [[wiki links]]. No HTML pass-through.
function renderMarkdownToHTML(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = md.split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inQuote = false;
  let inCode = false;
  let codeBuf: string[] = [];
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(
        `<p style="font-size:15.5px;margin-bottom:16px">${inlineFmt(paraBuf.join(" "))}</p>`
      );
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };
  const flushQuote = () => {
    if (inQuote) {
      out.push("</blockquote>");
      inQuote = false;
    }
  };

  const inlineFmt = (s: string): string => {
    let t = escape(s);
    t = t.replace(/\[\[([^\]]+)\]\]/g, '<a style="color:hsl(var(--primary));border-bottom:1px dotted hsl(var(--primary) / 0.5);text-decoration:none">$1</a>');
    t = t.replace(/`([^`]+)`/g, '<code style="font-family:\'JetBrains Mono\',monospace;font-size:0.9em;background:hsl(var(--card));padding:1px 5px;border-radius:3px">$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:hsl(var(--primary));text-decoration:none;border-bottom:1px dotted hsl(var(--primary) / 0.5)">$1</a>'
    );
    return t;
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      flushQuote();
      if (inCode) {
        out.push(
          `<pre style="font-family:'JetBrains Mono',monospace;background:hsl(var(--card));padding:12px;border-radius:4px;overflow-x:auto;font-size:13px;margin:16px 0">${escape(codeBuf.join("\n"))}</pre>`
        );
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      flushPara();
      flushList();
      flushQuote();
      const level = h[1].length;
      const size = level === 1 ? 34 : level === 2 ? 22 : 17;
      const top = level === 1 ? 0 : 28;
      out.push(
        `<h${level} style="font-family:'Playfair Display',Georgia,serif;font-weight:500;font-size:${size}px;margin-top:${top}px;margin-bottom:14px;letter-spacing:-0.01em">${inlineFmt(h[2])}</h${level}>`
      );
      continue;
    }
    if (/^>\s+/.test(line)) {
      flushPara();
      flushList();
      if (!inQuote) {
        out.push(
          '<blockquote style="border-left:2px solid hsl(var(--primary));padding:8px 18px;margin:20px 0;font-style:italic;font-family:\'Playfair Display\',Georgia,serif;font-size:17px;color:hsl(var(--foreground) / 0.9)">'
        );
        inQuote = true;
      }
      out.push(inlineFmt(line.replace(/^>\s+/, "")));
      continue;
    } else {
      flushQuote();
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      if (inList !== "ul") {
        flushList();
        out.push('<ul style="padding-left:22px;font-size:15px;margin-bottom:12px">');
        inList = "ul";
      }
      out.push(`<li style="margin-bottom:4px">${inlineFmt(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      if (inList !== "ol") {
        flushList();
        out.push('<ol style="padding-left:22px;font-size:15px;margin-bottom:12px">');
        inList = "ol";
      }
      out.push(`<li style="margin-bottom:4px">${inlineFmt(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    paraBuf.push(line);
  }
  flushPara();
  flushList();
  flushQuote();
  return out.join("\n");
}

// ─── VOICE ANALYSIS BAR ───────────────────────────────────────────────────
function VoiceAnalysisBar({
  analysis,
  template,
}: {
  analysis: VoiceAnalysis | null;
  template: VT;
}) {
  const target: [number, number, number, number] = [
    template.formality,
    template.humor,
    template.respectfulness,
    template.enthusiasm,
  ];
  const actual: [number, number, number, number] = analysis
    ? [analysis.formality, analysis.humor, analysis.respectfulness, analysis.enthusiasm]
    : target;
  const score = analysis?.match_score ?? 0;
  const scoreTone: "green" | "amber" | "red" =
    score >= 85 ? "green" : score >= 65 ? "amber" : "red";

  return (
    <div
      className="border-t border-border/60 px-6 py-[18px]"
      style={{ background: "hsl(var(--card) / 0.6)" }}
    >
      <div className="flex justify-between items-center gap-8">
        {/* Radar + score */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Radar values={actual} target={target} size={108} rings={4} />
          <div className="flex flex-col gap-1">
            <Eyebrow>Realtime voice match</Eyebrow>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[28px] font-medium tracking-tight"
                style={{ color: "hsl(var(--primary))" }}
              >
                {score}
                <span className="text-[14px] text-muted-foreground">%</span>
              </span>
              <Chip tone={scoreTone} dot>
                {score >= 85 ? "ON TEMPLATE" : score >= 65 ? "CLOSE" : "DRIFT"}
              </Chip>
            </div>
            <div className="font-mono text-[10.5px] text-muted-foreground tracking-wider uppercase">
              vs. {template.name}
            </div>
          </div>
        </div>

        {/* 4-axis bars */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 max-w-[520px] px-6">
          {(
            [
              ["Formality", actual[0], target[0], "Casual", "Formal"],
              ["Humor", actual[1], target[1], "Serious", "Playful"],
              ["Respectfulness", actual[2], target[2], "Irreverent", "Respectful"],
              ["Enthusiasm", actual[3], target[3], "Matter-of-fact", "Enthusiastic"],
            ] as const
          ).map(([name, v, t, l, r]) => (
            <div key={name} className="flex items-center gap-3">
              <div className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase w-24 text-right">
                {name}
              </div>
              <div className="flex-1">
                <div className="flex justify-between font-mono text-[9px] tracking-wider text-muted-foreground uppercase mb-1">
                  <span>{l}</span>
                  <span
                    style={{
                      color:
                        Math.abs(v - t) < 1
                          ? "hsl(140 35% 55%)"
                          : "hsl(38 70% 58%)",
                    }}
                  >
                    {v.toFixed(1)} / target {t}
                  </span>
                  <span>{r}</span>
                </div>
                <Meter value={v} target={t} max={10} />
              </div>
            </div>
          ))}
        </div>

        {/* Readability readout */}
        <div
          className="flex gap-6 flex-shrink-0 pl-6"
          style={{ borderLeft: "1px solid hsl(var(--border) / 0.6)" }}
        >
          <Stat
            label="Grade"
            value={analysis?.readability.grade.toFixed(1) ?? "—"}
            unit={`/ ${template.target_reading_level}`}
            tone="primary"
          />
          <Stat
            label="Words"
            value={(analysis?.readability.words ?? 0).toLocaleString()}
          />
          <Stat label="Read" value={analysis?.readability.read_minutes ?? 0} unit="min" />
          <Stat
            label="Avg len"
            value={analysis?.readability.avg_sentence_length.toFixed(1) ?? "—"}
            unit="words"
            tone={
              analysis && analysis.readability.avg_sentence_length > template.max_sentence_words
                ? "warn"
                : "default"
            }
          />
        </div>
      </div>
    </div>
  );
}

// ─── RIGHT RAIL ───────────────────────────────────────────────────────────
function EditorRightRail({ draftId: _draftId }: { draftId: string | null }) {
  // Placeholder data — hooks will wire these up later:
  //   - Knowledge: query wiki_entries table w/ content similarity
  //   - YouTube: query youtube_sources attached to draft
  //   - Agent reviews: query agent_review_logs for this draft
  const knowledge = [
    { c: "FIFO Cost Tracking", d: "First-in-first-out inventory accounting", tag: "FINANCE", used: true },
    { c: "BJ Fogg Behavior Model", d: "Motivation × Ability × Prompt", tag: "PSYCH", used: false },
    { c: "Bol.com Buy Box Algorithm", d: "Ranking inputs & seller heuristics", tag: "MARKETPLACE", used: false },
    { c: "NNg 4-Axis Tone Model", d: "Formal/Humor/Respect/Enthusiasm", tag: "VOICE", used: false },
  ];

  const agentReviews = [
    { name: "Editor · Samantha", status: "ok" as const, msg: "2 sentences over 30 words in §3.", time: "3m" },
    { name: "Fact-checker", status: "ok" as const, msg: "Cross-checked marketplace claims.", time: "3m" },
    { name: "SEO · Claude Haiku", status: "warn" as const, msg: "Primary keyword density 0.4% — raise to 0.8–1.2%.", time: "3m" },
  ];

  return (
    <aside
      className="w-[300px] border-l border-border/60 flex flex-col gap-7 overflow-y-auto"
      style={{ padding: "28px 24px", maxHeight: "calc(100vh - 104px)" }}
    >
      {/* Knowledge */}
      <div className="flex flex-col gap-3">
        <SecLabel idx={1}>Knowledge</SecLabel>
        <div
          className="rounded border border-border/60 p-2.5 flex items-center gap-2"
          style={{ background: "hsl(var(--card))" }}
        >
          <Search size={13} className="text-muted-foreground flex-shrink-0" />
          <input
            placeholder="Search concepts…"
            className="flex-1 bg-transparent border-none outline-none text-[12.5px]"
          />
          <Kbd>⌘K</Kbd>
        </div>
        <div className="flex flex-col">
          {knowledge.map((k, i) => (
            <div
              key={i}
              className={`flex justify-between gap-3 py-2.5 ${
                i < knowledge.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div
                  className="text-[13px] font-medium"
                  style={{ color: k.used ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                >
                  [[{k.c}]]
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">{k.d}</div>
                <div className="font-mono text-[9px] tracking-wider text-muted-foreground mt-0.5">
                  {k.tag}
                  {k.used && " · IN USE"}
                </div>
              </div>
              <button className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/40">
                <Plus size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Agent reviews */}
      <div className="flex flex-col gap-3">
        <SecLabel idx={3}>Agent reviews</SecLabel>
        <div className="flex flex-col gap-2.5">
          {agentReviews.map((a, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 py-2 ${
                i < agentReviews.length - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip tone={a.status === "ok" ? "green" : "amber"}>
                    {a.status === "ok" ? "PASS" : "NOTE"}
                  </Chip>
                  <span className="text-[12px] font-medium">{a.name}</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{a.time}</span>
              </div>
              <div className="text-[11.5px] text-muted-foreground leading-snug">{a.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ARTICLES SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function ArticlesScreen({ onEdit }: { onEdit: () => void }) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [templates, setTemplates] = useState<VT[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [p, t] = await Promise.all([
        supabase.from("blog_posts").select("*").order("updated_at", { ascending: false }),
        supabase.from("hvl_voice_templates").select("*"),
      ]);
      if (p.error) {
        toast({ title: "Error", description: p.error.message, variant: "destructive" });
      } else {
        setPosts((p.data ?? []) as unknown as BlogPost[]);
      }
      if (!t.error) setTemplates((t.data ?? []) as unknown as VT[]);
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { draft: 0, review: 0, scheduled: 0, published: 0, words: 0 };
    for (const p of posts) {
      if (p.status === "published" || p.published) c.published++;
      else if (p.status === "review") c.review++;
      else if (p.status === "scheduled") c.scheduled++;
      else c.draft++;
      c.words += p.word_count ?? 0;
    }
    return c;
  }, [posts]);

  const avgMatch = useMemo(() => {
    const scored = posts.filter((p) => p.voice_match_score > 0);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((a, p) => a + p.voice_match_score, 0) / scored.length);
  }, [posts]);

  const statusTone = (s: string): "amber" | "primary" | "green" => {
    if (s === "published") return "green";
    if (s === "review") return "primary";
    return "amber";
  };
  const statusLabel = (s: string) =>
    s === "published" ? "LIVE" : (s || "DRAFT").toUpperCase();

  const templateName = (id: string | null): string => {
    if (!id) return "Untemplated";
    const t = templates.find((x) => x.id === id);
    return t?.name.replace("Hans — ", "") ?? "Untemplated";
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-4" style={{ padding: "32px 32px 20px" }}>
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <Eyebrow>
              Library · {posts.length} total, {counts.draft + counts.review + counts.scheduled} in
              flight
            </Eyebrow>
            <h1 className="font-display text-[32px] font-medium tracking-tight">Articles</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter size={12} className="mr-1" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown size={12} className="mr-1" />
              Updated
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Plus size={12} className="mr-1" />
              New article
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div
          className="flex gap-8 py-4"
          style={{
            borderTop: "1px solid hsl(var(--border) / 0.6)",
            borderBottom: "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <Stat label="Drafts" value={counts.draft} />
          <div className="w-px h-9 bg-border/60" />
          <Stat label="In review" value={counts.review} tone="primary" />
          <div className="w-px h-9 bg-border/60" />
          <Stat label="Scheduled" value={counts.scheduled} tone="warn" />
          <div className="w-px h-9 bg-border/60" />
          <Stat label="Live" value={counts.published} tone="ok" />
          <div className="w-px h-9 bg-border/60" />
          <Stat label="Words" value={counts.words.toLocaleString()} unit="words" />
          <div className="w-px h-9 bg-border/60" />
          <Stat label="Avg voice match" value={avgMatch} unit="%" tone="primary" />
        </div>

        {/* Search + filter pills */}
        <div className="flex gap-3 items-center">
          <div
            className="flex items-center flex-1 h-10 px-3.5 rounded border border-border"
            style={{ background: "hsl(var(--card))" }}
          >
            <Search size={14} className="text-muted-foreground mr-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${posts.length} articles by title, slug, or tag…`}
              className="flex-1 bg-transparent border-none outline-none text-[13px]"
            />
            <Kbd>/</Kbd>
          </div>
          <div className="flex items-center gap-1 p-1 rounded border border-border">
            {[
              { id: "all", label: "All" },
              { id: "draft", label: `Draft · ${counts.draft}` },
              { id: "review", label: `In review · ${counts.review}` },
              { id: "scheduled", label: `Scheduled · ${counts.scheduled}` },
              { id: "published", label: `Live · ${counts.published}` },
            ].map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`h-[22px] px-2 rounded text-[10.5px] font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid items-center gap-4 text-[9.5px]"
        style={{
          padding: "10px 32px",
          borderBottom: "1px solid hsl(var(--border))",
          gridTemplateColumns: "56px 1fr 140px 110px 90px 80px",
        }}
      >
        <Eyebrow>№</Eyebrow>
        <Eyebrow>Title · Excerpt</Eyebrow>
        <Eyebrow>Voice template</Eyebrow>
        <Eyebrow>Status</Eyebrow>
        <Eyebrow>Completeness</Eyebrow>
        <Eyebrow style={{ textAlign: "right" }}>Updated</Eyebrow>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="grid items-center gap-4 transition-colors hover:bg-card/40"
            style={{
              padding: "18px 32px",
              borderBottom: "1px solid hsl(var(--border) / 0.6)",
              gridTemplateColumns: "56px 1fr 140px 110px 90px 80px",
            }}
          >
            <span className="font-mono text-[11px] text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="font-display text-[17px] font-medium tracking-tight">
                {p.title || <span className="text-muted-foreground italic">Untitled</span>}
              </div>
              <div className="text-[12.5px] text-muted-foreground leading-snug max-w-[640px] line-clamp-2">
                {p.excerpt || "—"}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {p.tags.slice(0, 4).map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
                <span className="font-mono text-[10.5px] text-muted-foreground ml-1">
                  {(p.word_count ?? 0).toLocaleString()} words
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-display text-[13px] italic">
                Hans — {templateName(p.voice_template_id)}
              </div>
              <div className="font-mono text-[9.5px] text-muted-foreground tracking-wider">
                {p.voice_template_id ? "ASSIGNED" : "NONE"}
              </div>
            </div>
            <div>
              <Chip tone={statusTone(p.status)} dot>
                {statusLabel(p.status)}
              </Chip>
            </div>
            <div className="flex flex-col gap-1.5 w-20">
              <span
                className="font-mono text-[10.5px]"
                style={{
                  color:
                    p.completeness_score === 100
                      ? "hsl(140 35% 55%)"
                      : p.completeness_score >= 80
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))",
                }}
              >
                {p.completeness_score ?? 0}%
              </span>
              <Meter
                value={p.completeness_score ?? 0}
                color={
                  p.completeness_score === 100
                    ? "hsl(140 35% 55%)"
                    : p.completeness_score >= 80
                    ? "hsl(var(--primary))"
                    : "hsl(38 70% 58%)"
                }
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {timeAgo(new Date(p.updated_at))}
              </span>
              <button className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground text-sm">No articles match.</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VOICE TEMPLATES SCREEN
//  Cards open the 9-section editor at /blog-cms/voice/:id.
//  Archive sets archived_at (soft-delete per product rule — no hard deletes).
//  Archived templates are hidden by default; toggle to review them.
// ═══════════════════════════════════════════════════════════════════════════
type VTRow = VT & { is_default?: boolean; archived_at?: string | null };

function VoiceTemplatesScreen() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<VTRow[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("hvl_voice_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
      return;
    }
    setTemplates((data ?? []) as unknown as VTRow[]);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const archive = async (id: string) => {
    const { error } = await supabase
      .from("hvl_voice_templates")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Archive failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template archived", description: "Hidden from pickers, history preserved." });
    await load();
  };

  const unarchive = async (id: string) => {
    const { error } = await supabase
      .from("hvl_voice_templates")
      .update({ archived_at: null })
      .eq("id", id);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const active = templates.filter((t) => !t.archived_at);
  const archived = templates.filter((t) => !!t.archived_at);
  const visible = showArchived ? archived : active;

  return (
    <div style={{ padding: "32px" }}>
      <div className="flex items-end justify-between mb-6">
        <Eyebrow>
          Voice library · {active.length} active
          {archived.length > 0 && ` · ${archived.length} archived`}
        </Eyebrow>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[11.5px]"
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? `Show active (${active.length})` : `Show archived (${archived.length})`}
            </Button>
          )}
          <Button size="sm" asChild>
            <a href="/blog-cms/voice/new">
              <Plus size={12} className="mr-1" />
              New template
            </a>
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          {showArchived ? "No archived templates." : "No active templates. Create one to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {visible.map((t) => (
            <VoiceTemplateCard
              key={t.id}
              template={t}
              onArchive={showArchived ? undefined : () => archive(t.id)}
              onRestore={showArchived ? () => unarchive(t.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceTemplateCard({
  template,
  onArchive,
  onRestore,
}: {
  template: VTRow;
  onArchive?: () => void;
  onRestore?: () => void;
}) {
  const isDefault = template.is_default;
  const dimmed = !!template.archived_at;
  return (
    <div
      className="rounded border p-5 relative group transition-all"
      style={{
        background: isDefault ? "hsl(var(--primary) / 0.05)" : "hsl(var(--card))",
        borderColor: isDefault ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.6)",
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {isDefault && (
        <div
          className="absolute top-3.5 bottom-3.5 w-0.5 rounded"
          style={{ left: 0, background: "hsl(var(--primary))" }}
        />
      )}
      <a href={`/blog-cms/voice/${template.id}`} className="block hover:underline">
        <div className="font-display text-[15px] font-medium mb-2">{template.name}</div>
      </a>
      <div className="font-mono text-[9.5px] tracking-wider text-muted-foreground mb-3">
        {isDefault ? "DEFAULT · " : ""}GRADE {template.target_reading_level}
        {dimmed && " · ARCHIVED"}
      </div>
      <div className="flex items-center justify-between">
        <Radar
          values={[template.formality, template.humor, template.respectfulness, template.enthusiasm]}
          size={80}
          rings={3}
          showLabels={false}
          fillOpacity={isDefault ? 0.25 : 0.15}
          stroke={isDefault ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
        />
        <div className="flex flex-col gap-1 font-mono text-[10px] text-muted-foreground">
          <div>FORM <span className="text-foreground">{template.formality}</span></div>
          <div>HUMR <span className="text-foreground">{template.humor}</span></div>
          <div>RESP <span className="text-foreground">{template.respectfulness}</span></div>
          <div>ENTH <span className="text-foreground">{template.enthusiasm}</span></div>
        </div>
      </div>
      {template.description && (
        <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed line-clamp-3">
          {template.description}
        </p>
      )}
      <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild>
          <a href={`/blog-cms/voice/${template.id}`}>Edit</a>
        </Button>
        {onArchive && !isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onArchive}
          >
            <Trash2 size={11} className="mr-1" />
            Archive
          </Button>
        )}
        {onRestore && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px]"
            onClick={onRestore}
          >
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── UTILITIES ────────────────────────────────────────────────────────────
function timeAgo(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}
