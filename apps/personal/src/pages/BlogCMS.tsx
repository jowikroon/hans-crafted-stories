import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, FileText, PlusCircle, Image, Search, Mic, Settings,
  Languages, Target, Shield, BookCheck, Crown, ChevronRight, ChevronDown,
  ChevronLeft, X, Save, Eye, Trash2, Clock, Menu, BarChart3, Sparkles,
  ExternalLink, ArrowUpDown, Filter, Grid3X3, List, RefreshCw, Copy, Calendar,
  Pen, MoreHorizontal, DollarSign, Info, Lock, Unlock, CheckCircle2, Circle,
  AlertTriangle, Code2, Link, Heading, ImageIcon, Type,
} from "lucide-react";

// ── Types ──
interface BlogPost {
  id: string; title: string; slug: string; content: string; excerpt: string;
  category: string; tags: string[]; cover_image_url: string | null;
  published: boolean; scheduled_at: string | null; meta_title: string | null;
  meta_description: string | null; og_image: string | null; og_title: string | null;
  og_description: string | null; canonical_url: string | null; primary_keyword: string | null;
  content_nl: string | null; title_nl: string | null; excerpt_nl: string | null;
  meta_title_nl: string | null; meta_description_nl: string | null;
  status: string; author_id: string | null; created_at: string; updated_at: string;
}
interface VoiceTemplate {
  id: string; name: string; category: string; tone: string; perspective: string;
  target_audience: string; banned_words: string[]; required_elements: string[];
  opening_examples: string[]; transition_examples: string[]; closing_examples: string[];
  content_rules: string; seo_guidelines: string; created_at: string;
}
interface BlogMemory { content_category: string; brand_voice_context: string; narrative_history: string; updated_at: string; }
interface MediaItem {
  id: string; file_name: string; storage_path: string; public_url: string;
  mime_type: string; file_size: number; alt_text: string | null; folder: string | null;
  created_at: string; updated_at: string;
}
interface AgentReview {
  agent_id: string; agent_name: string; icon: string; score: number | null;
  verdict: string; feedback: string; suggestions: string[]; loading: boolean;
}
interface SeoSuggestion {
  id: string; title: string; slug: string; primary_keyword: string;
  cluster: string; intent: string; difficulty: string; priority: number;
  related_post_slug: string | null; status: string;
}
interface GhostDraft {
  content: string; title: string; excerpt: string; meta_title: string;
  meta_description: string; primary_keyword: string;
  gaps: { id: string; label: string; placeholder: string; filled: boolean }[];
}
interface SeoCheckItem { label: string; passed: boolean; detail: string }
interface SeoReport { score: number; checks: SeoCheckItem[]; jsonLd: string }
type GhostPhase = "idle" | "researching" | "drafting" | "seo" | "done";
type NavSection = "dashboard" | "posts" | "new-post" | "media" | "seo" | "voice" | "settings";
type SortField = "created_at" | "title" | "status" | "updated_at";
type PostLanguage = "en" | "nl";

// ── Design Tokens ──
const CMS_BG_0 = "hsl(225, 20%, 4%)";
const CMS_BG_1 = "hsl(225, 18%, 7%)";
const CMS_BG_2 = "hsl(225, 16%, 10%)";
const CMS_BG_3 = "hsl(225, 14%, 13%)";

// ── Helpers ──
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const rt = (w: number) => `${Math.ceil(w / 230)} min read`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const charColor = (len: number, min: number, max: number) => len >= min && len <= max ? "text-emerald-400" : len > 0 ? "text-amber-400" : "text-red-400";
const charBarColor = (len: number, min: number, max: number) => len >= min && len <= max ? "bg-emerald-500" : len > 0 ? "bg-amber-500" : "bg-red-500";
const scoreClr = (s: number) => s >= 80 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";
const scoreRingColor = (s: number) => s >= 80 ? "stroke-emerald-500" : s >= 50 ? "stroke-amber-500" : "stroke-red-500";
const scoreRingBg = (s: number) => s >= 80 ? "bg-emerald-500/5" : s >= 50 ? "bg-amber-500/5" : "bg-red-500/5";
const scoreBg = (s: number) => s >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 50 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const STATUS_DOT: Record<string, string> = {
  draft: "bg-zinc-400", published: "bg-emerald-400", scheduled: "bg-blue-400",
};
const STAT_BORDERS: Record<string, string> = {
  Total: "from-white/20 to-transparent", Published: "from-emerald-500 to-emerald-500/0",
  Drafts: "from-zinc-500 to-zinc-500/0", Scheduled: "from-blue-500 to-blue-500/0",
};
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

const CLUSTER_BORDER: Record<string, string> = {
  "marketplace-strategie": "border-blue-500/40 hover:border-blue-400/60",
  "conversie-optimalisatie": "border-emerald-500/40 hover:border-emerald-400/60",
  "autoriteit": "border-purple-500/40 hover:border-purple-400/60",
  "tech-innovatie": "border-amber-500/40 hover:border-amber-400/60",
  "regelgeving": "border-zinc-400/40 hover:border-zinc-300/60",
};
const CLUSTER_BADGE_BG: Record<string, string> = {
  "marketplace-strategie": "bg-blue-500/10 text-blue-400",
  "conversie-optimalisatie": "bg-emerald-500/10 text-emerald-400",
  "autoriteit": "bg-purple-500/10 text-purple-400",
  "tech-innovatie": "bg-amber-500/10 text-amber-400",
  "regelgeving": "bg-zinc-500/10 text-zinc-400",
};
const DIFFICULTY_DOT: Record<string, string> = {
  low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-red-400",
};
const clusterBorder = (cluster: string) => CLUSTER_BORDER[cluster] ?? "border-white/10 hover:border-white/20";
const clusterBadgeBg = (cluster: string) => CLUSTER_BADGE_BG[cluster] ?? "bg-white/[0.06] text-white/50";
const difficultyDot = (difficulty: string) => DIFFICULTY_DOT[difficulty] ?? "bg-zinc-400";
const clusterToCategory = (cluster: string): string => {
  const map: Record<string, string> = {
    "marketplace-strategie": "e-commerce",
    "conversie-optimalisatie": "conversion",
    "autoriteit": "authority",
    "tech-innovatie": "technology",
    "regelgeving": "regulation",
  };
  return map[cluster] ?? "e-commerce";
};

const NAV_GROUPS = [
  { label: "Content", items: [
    { key: "dashboard" as NavSection, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "posts" as NavSection, label: "Posts", icon: <FileText className="w-4 h-4" /> },
    { key: "new-post" as NavSection, label: "New Post", icon: <PlusCircle className="w-4 h-4" /> },
  ]},
  { label: "Tools", items: [
    { key: "media" as NavSection, label: "Media", icon: <Image className="w-4 h-4" /> },
    { key: "seo" as NavSection, label: "SEO Tools", icon: <Target className="w-4 h-4" /> },
    { key: "voice" as NavSection, label: "Voice & Style", icon: <Mic className="w-4 h-4" /> },
  ]},
  { label: "System", items: [
    { key: "settings" as NavSection, label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ]},
];
const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const AGENTS = [
  { id: "taal", name: "Taalagent", icon: "languages", prompt: "You are a language quality agent. Review grammar, spelling, readability, and natural flow." },
  { id: "structuur", name: "Structuuragent", icon: "filetext", prompt: "You are a structure agent. Evaluate heading hierarchy, paragraph flow, and content organization." },
  { id: "seo", name: "SEO-agent", icon: "target", prompt: "You are an SEO agent. Evaluate keyword usage, meta data quality, and search intent alignment." },
  { id: "ai-detect", name: "AI-detectieagent", icon: "shield", prompt: "You are an AI detection agent. Assess how human-like the writing sounds." },
  { id: "reviewer", name: "Reviewer", icon: "bookcheck", prompt: "You are a content reviewer. Evaluate factual accuracy, depth of insight, and value." },
  { id: "hoofdredacteur", name: "Hoofdredacteur", icon: "crown", prompt: "You are the chief editor. Give a final holistic assessment." },
];

const AGENT_ICONS: Record<string, React.ReactNode> = {
  languages: <Languages className="w-5 h-5" />, filetext: <FileText className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />, shield: <Shield className="w-5 h-5" />,
  bookcheck: <BookCheck className="w-5 h-5" />, crown: <Crown className="w-5 h-5" />,
};

const EMPTY_POST = (): Omit<BlogPost, "id" | "created_at" | "updated_at"> => ({
  title: "", slug: "", content: "", excerpt: "", category: "e-commerce", tags: [],
  cover_image_url: null, published: false, scheduled_at: null, meta_title: null,
  meta_description: null, og_image: null, og_title: null, og_description: null,
  canonical_url: null, primary_keyword: null, content_nl: null, title_nl: null,
  excerpt_nl: null, meta_title_nl: null, meta_description_nl: null, status: "draft", author_id: null,
});

const GHOST_PHASES: { key: GhostPhase; label: string }[] = [
  { key: "researching", label: "Researching context..." }, { key: "drafting", label: "Drafting in your voice..." }, { key: "seo", label: "Generating SEO metadata..." },
];
const parseGaps = (content: string): GhostDraft["gaps"] => {
  const gaps: GhostDraft["gaps"] = []; const labels = ["Hook", "Case Study", "Conclusion"];
  let m: RegExpExecArray | null; let i = 0;
  const re = /\[HANS:\s*([^\]]+)\]/g;
  while ((m = re.exec(content)) !== null) { gaps.push({ id: `gap-${i}`, label: labels[i] ?? `Gap ${i + 1}`, placeholder: m[0], filled: false }); i++; }
  return gaps;
};
const computeSeoChecks = (title: string, metaDesc: string, keyword: string, content: string, wordCount: number): SeoCheckItem[] => {
  const kw = keyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const firstPara = contentLower.split(/\n\n/)[0] ?? "";
  const kwCount = kw ? (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
  const density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
  const hasH2BeforeH3 = (() => { const h2i = content.indexOf("## "); const h3i = content.indexOf("### "); return h2i >= 0 && (h3i < 0 || h2i < h3i); })();
  return [
    { label: "Title length (50-60 chars)", passed: title.length >= 50 && title.length <= 60, detail: `${title.length} chars` },
    { label: "Meta description (140-155 chars)", passed: metaDesc.length >= 140 && metaDesc.length <= 155, detail: `${metaDesc.length} chars` },
    { label: "Primary keyword in title", passed: kw.length > 0 && title.toLowerCase().includes(kw), detail: kw || "No keyword" },
    { label: "Keyword in first paragraph", passed: kw.length > 0 && firstPara.includes(kw), detail: kw ? (firstPara.includes(kw) ? "Found" : "Missing") : "No keyword" },
    { label: "Keyword density (1-3%)", passed: density >= 1 && density <= 3, detail: `${density.toFixed(1)}%` },
    { label: "At least one internal link", passed: content.includes("hansvanleeuwen.com") || content.includes("/writing/"), detail: content.includes("/writing/") ? "Found" : "Missing" },
    { label: "Heading hierarchy (h2 before h3)", passed: hasH2BeforeH3, detail: hasH2BeforeH3 ? "Correct" : "Fix order" },
    { label: "Image with alt text", passed: /!\[[^\]]+\]\(/.test(content), detail: /!\[[^\]]+\]\(/.test(content) ? "Found" : "Missing" },
    { label: "Word count > 800", passed: wordCount > 800, detail: `${wordCount} words` },
    { label: "Reading time displayed", passed: wordCount > 0, detail: `${Math.ceil(wordCount / 230)} min` },
  ];
};

// ── Score Ring Component ──
const ScoreRing = ({ score, size = 48 }: { score: number; size?: number }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className={`relative rounded-full ${scoreRingBg(score)} flex items-center justify-center`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-white/[0.06]" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className={`${scoreRingColor(score)} transition-all duration-700`} />
      </svg>
      <span className={`text-sm font-bold ${scoreClr(score)} relative z-10`}>{score}</span>
    </div>
  );
};

// ── Skeleton Shimmer ──
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
);

// ── Reusable small components ──
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}
    className={`rounded-xl border border-white/[0.05] hover:border-white/[0.08] transition-all duration-200 backdrop-blur-sm ${className}`} style={{ background: CMS_BG_2 }}>
    {children}
  </motion.div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-white/35 text-xs uppercase tracking-widest mb-2 block font-medium">{children}</label>
);
const Inp = ({ value, onChange, placeholder = "", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) => (
  <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className={`w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-blue-500/20 transition-all duration-150 placeholder:text-white/20 ${className}`} />
);

// ── SEO Progress Bar ──
const SeoBar = ({ value, max, label }: { value: number; max: number; label: string }) => {
  const min = max === 60 ? 50 : 120;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-white/30 text-xs">{label}</label>
        <span className={`text-xs font-medium ${charColor(value, min, max)}`}>{value}/{max}</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${charBarColor(value, min, max)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Mobile Bottom Nav ──
const MOBILE_NAV: { key: NavSection; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: "posts", label: "Posts", icon: <FileText className="w-5 h-5" /> },
  { key: "new-post", label: "Write", icon: <PlusCircle className="w-5 h-5" /> },
  { key: "seo", label: "SEO", icon: <Target className="w-5 h-5" /> },
  { key: "settings", label: "More", icon: <MoreHorizontal className="w-5 h-5" /> },
];

// ── Main Component ──
const BlogCMS = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeNav, setActiveNav] = useState<NavSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draftPost, setDraftPost] = useState(EMPTY_POST());
  const [isNewPost, setIsNewPost] = useState(false);
  const [editorLang, setEditorLang] = useState<PostLanguage>("en");
  const [metaSidebarOpen, setMetaSidebarOpen] = useState(true);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [agentReviews, setAgentReviews] = useState<AgentReview[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [voiceTemplates, setVoiceTemplates] = useState<VoiceTemplate[]>([]);
  const [blogMemory, setBlogMemory] = useState<BlogMemory[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [reviewsRunning, setReviewsRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<SeoSuggestion[]>([]);
  const [ghostModal, setGhostModal] = useState<SeoSuggestion | null>(null);
  const [ghostPhase, setGhostPhase] = useState<GhostPhase>("idle");
  const [ghostGaps, setGhostGaps] = useState<GhostDraft["gaps"]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null);
  const [seoReportLoading, setSeoReportLoading] = useState(false);
  const [jsonLdExpanded, setJsonLdExpanded] = useState(false);
  const [draftsFilter, setDraftsFilter] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // ── Data fetching ──
  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase.from("blog_posts").select("*").order(sortField, { ascending: sortDir === "asc" });
      if (error) throw error;
      setPosts((data as unknown as BlogPost[]) ?? []);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to load posts", variant: "destructive" });
    } finally { setLoadingPosts(false); }
  }, [sortField, sortDir, toast]);

  const fetchVoice = useCallback(async () => {
    setLoadingVoice(true);
    try {
      const { data, error } = await supabase.from("hvl_voice_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setVoiceTemplates((data as unknown as VoiceTemplate[]) ?? []);
    } catch { /* empty */ } finally { setLoadingVoice(false); }
  }, []);

  const fetchMemory = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("hans_blog_memory").select("*");
      if (error) throw error;
      setBlogMemory((data as unknown as BlogMemory[]) ?? []);
    } catch { /* empty */ }
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoadingMedia(true);
    try {
      const { data, error } = await supabase.from("media_library").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setMediaItems((data as unknown as MediaItem[]) ?? []);
    } catch { /* empty */ } finally { setLoadingMedia(false); }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("blog_seo_suggestions")
        .select("*")
        .neq("status", "dismissed")
        .order("priority", { ascending: false });
      if (error) throw error;
      setSuggestions((data as unknown as SeoSuggestion[]) ?? []);
    } catch { /* empty */ }
  }, []);

  const dismissSuggestion = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("blog_seo_suggestions")
        .update({ status: "dismissed" })
        .eq("id", id);
      if (error) throw error;
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);
  useEffect(() => {
    if (activeNav === "voice") { fetchVoice(); fetchMemory(); }
    if (activeNav === "media") fetchMedia();
  }, [activeNav, fetchVoice, fetchMemory, fetchMedia]);

  // ── CRUD ──
  const savePost = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        title: draftPost.title, slug: draftPost.slug, content: draftPost.content,
        excerpt: draftPost.excerpt, category: draftPost.category, tags: draftPost.tags,
        cover_image_url: draftPost.cover_image_url, published: draftPost.status === "published",
        scheduled_at: draftPost.scheduled_at, meta_title: draftPost.meta_title,
        meta_description: draftPost.meta_description, og_image: draftPost.og_image,
        og_title: draftPost.og_title, og_description: draftPost.og_description,
        canonical_url: draftPost.canonical_url, primary_keyword: draftPost.primary_keyword,
        content_nl: draftPost.content_nl, title_nl: draftPost.title_nl, excerpt_nl: draftPost.excerpt_nl,
        meta_title_nl: draftPost.meta_title_nl, meta_description_nl: draftPost.meta_description_nl,
        status: draftPost.status, author_id: user?.id ?? null,
      };
      if (editingPost) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", editingPost.id);
        if (error) throw error;
        toast({ title: "Saved", description: "Post updated." });
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
        toast({ title: "Created", description: "New post created." });
        setIsNewPost(false);
      }
      setLastSaved(new Date().toISOString());
      await fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  }, [draftPost, editingPost, user, toast, fetchPosts]);

  const deletePost = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Post removed." });
      if (editingPost?.id === id) { setEditingPost(null); setActiveNav("posts"); }
      await fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    }
  }, [editingPost, toast, fetchPosts]);

  const bulkAction = useCallback(async (action: "publish" | "unpublish" | "delete") => {
    const ids = Array.from(selectedPosts);
    if (!ids.length) return;
    try {
      if (action === "delete") {
        const { error } = await supabase.from("blog_posts").delete().in("id", ids);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").update({ status: action === "publish" ? "published" : "draft", published: action === "publish" }).in("id", ids);
        if (error) throw error;
      }
      setSelectedPosts(new Set());
      toast({ title: "Done", description: `${action} applied to ${ids.length} posts.` });
      await fetchPosts();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed", variant: "destructive" });
    }
  }, [selectedPosts, toast, fetchPosts]);

  // ── Editor helpers ──
  const openEditor = (post: BlogPost) => {
    setEditingPost(post);
    setDraftPost({ title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt,
      category: post.category, tags: post.tags ?? [], cover_image_url: post.cover_image_url,
      published: post.published, scheduled_at: post.scheduled_at, meta_title: post.meta_title,
      meta_description: post.meta_description, og_image: post.og_image, og_title: post.og_title,
      og_description: post.og_description, canonical_url: post.canonical_url,
      primary_keyword: post.primary_keyword, content_nl: post.content_nl, title_nl: post.title_nl,
      excerpt_nl: post.excerpt_nl, meta_title_nl: post.meta_title_nl,
      meta_description_nl: post.meta_description_nl, status: post.status, author_id: post.author_id,
    });
    setIsNewPost(false); setSlugManual(true); setActiveNav("new-post");
  };

  const startNewPost = () => { setEditingPost(null); setDraftPost(EMPTY_POST()); setIsNewPost(true); setSlugManual(false); setActiveNav("new-post"); };

  const startPostFromSuggestion = (suggestion: SeoSuggestion) => {
    setEditingPost(null);
    setDraftPost({
      ...EMPTY_POST(),
      title: suggestion.title,
      slug: suggestion.slug,
      primary_keyword: suggestion.primary_keyword,
      category: clusterToCategory(suggestion.cluster),
    });
    setIsNewPost(true);
    setSlugManual(true);
    setActiveNav("new-post");
  };

  const updateDraft = (field: string, value: unknown) => {
    setDraftPost((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !slugManual) setDraftPost((prev) => ({ ...prev, slug: slugify(value as string) }));
    if ((field === "content" || field === "content_nl") && typeof value === "string" && hasGaps) updateGapStatus(value);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => { if (editingPost) savePost(); }, 3000);
    setAutoSaveTimer(timer);
  };

  // ── AI Reviews ──
  const runAgentReview = useCallback(async (agent: (typeof AGENTS)[number]) => {
    setAgentReviews((prev) => prev.map((r) => r.agent_id === agent.id ? { ...r, loading: true } : r));
    try {
      const res = await fetch("https://n8n.srv1402218.hstgr.cloud/webhook/blog-agent-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agent.id, agent_system_prompt: agent.prompt, post_title: draftPost.title, post_content: draftPost.content, post_category: draftPost.category, post_keyword: draftPost.primary_keyword ?? "", post_language: editorLang }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      setAgentReviews((prev) => prev.map((r) => r.agent_id === agent.id ? { ...r,
        score: typeof data.score === "number" ? data.score : null,
        verdict: typeof data.verdict === "string" ? data.verdict : "",
        feedback: typeof data.feedback === "string" ? data.feedback : "",
        suggestions: Array.isArray(data.suggestions) ? (data.suggestions as string[]) : [], loading: false,
      } : r));
    } catch { setAgentReviews((prev) => prev.map((r) => r.agent_id === agent.id ? { ...r, loading: false, feedback: "Review failed." } : r)); }
  }, [draftPost, editorLang]);

  const runAllReviews = useCallback(() => {
    const init: AgentReview[] = AGENTS.map((a) => ({ agent_id: a.id, agent_name: a.name, icon: a.icon, score: null, verdict: "", feedback: "", suggestions: [], loading: true }));
    setAgentReviews(init); setReviewDrawerOpen(true); setReviewsRunning(true);
    AGENTS.forEach((a) => runAgentReview(a));
    setTimeout(() => setReviewsRunning(false), 8000);
  }, [runAgentReview]);

  // ── Ghost Writer ──
  const generateGhostDraft = useCallback(async (suggestion: SeoSuggestion) => {
    setGhostModal(null);
    setGhostPhase("researching");
    setActiveNav("new-post");
    setEditingPost(null);
    setIsNewPost(true);
    setSlugManual(true);
    const phases: GhostPhase[] = ["researching", "drafting", "seo"];
    let pi = 0;
    const interval = setInterval(() => { pi++; if (pi < phases.length) setGhostPhase(phases[pi]); }, 3000);
    try {
      const res = await fetch("https://n8n.srv1402218.hstgr.cloud/webhook/blog-ghost-write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: suggestion.title, slug: suggestion.slug, primary_keyword: suggestion.primary_keyword, cluster: suggestion.cluster, intent: suggestion.intent }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      const content = typeof data.content === "string" ? data.content : "";
      const gaps = parseGaps(content);
      setDraftPost({
        ...EMPTY_POST(), title: typeof data.title === "string" ? data.title : suggestion.title,
        slug: typeof data.slug === "string" ? data.slug : suggestion.slug,
        content, excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
        meta_title: typeof data.meta_title === "string" ? data.meta_title : null,
        meta_description: typeof data.meta_description === "string" ? data.meta_description : null,
        primary_keyword: typeof data.primary_keyword === "string" ? data.primary_keyword : suggestion.primary_keyword,
        category: clusterToCategory(suggestion.cluster),
      });
      setGhostGaps(gaps);
      setGhostPhase("done");
    } catch (err: unknown) {
      toast({ title: "Ghost Writer Failed", description: err instanceof Error ? err.message : "Draft generation failed", variant: "destructive" });
      setGhostPhase("idle");
    } finally { clearInterval(interval); }
  }, [toast]);

  const generateSeoReport = useCallback(async () => {
    setSeoReportLoading(true);
    try {
      const res = await fetch("https://n8n.srv1402218.hstgr.cloud/webhook/blog-auto-seo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftPost.title, slug: draftPost.slug, content: draftPost.content, meta_title: draftPost.meta_title, meta_description: draftPost.meta_description, primary_keyword: draftPost.primary_keyword }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      const score = typeof data.score === "number" ? data.score : 0;
      const checks = Array.isArray(data.checks) ? (data.checks as SeoCheckItem[]) : computeSeoChecks(draftPost.title, draftPost.meta_description ?? "", draftPost.primary_keyword ?? "", draftPost.content, wc(draftPost.content));
      const jsonLd = typeof data.json_ld === "string" ? data.json_ld : JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: draftPost.title, author: { "@type": "Person", name: "Hans van Leeuwen" } }, null, 2);
      setSeoReport({ score, checks, jsonLd });
    } catch {
      const checks = computeSeoChecks(draftPost.title, draftPost.meta_description ?? "", draftPost.primary_keyword ?? "", draftPost.content, wc(draftPost.content));
      const passed = checks.filter((c) => c.passed).length;
      setSeoReport({ score: Math.round((passed / checks.length) * 100), checks, jsonLd: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: draftPost.title }, null, 2) });
    } finally { setSeoReportLoading(false); }
  }, [draftPost]);

  // ── Gap tracking ──
  const updateGapStatus = useCallback((content: string) => {
    setGhostGaps((prev) => prev.map((g) => ({ ...g, filled: !content.includes(g.placeholder) })));
  }, []);
  const gapsFilled = ghostGaps.filter((g) => g.filled).length;
  const allGapsFilled = ghostGaps.length > 0 && gapsFilled === ghostGaps.length;
  const hasGaps = ghostGaps.length > 0;

  // ── Derived ──
  const filtered = posts
    .filter((p) => (draftsFilter ? p.status === "draft" : true) && (statusFilter === "all" || p.status === statusFilter) && (categoryFilter === "all" || p.category === categoryFilter) && (!searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => { const av = a[sortField] ?? ""; const bv = b[sortField] ?? ""; return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  const stats = { draft: posts.filter((p) => p.status === "draft").length, published: posts.filter((p) => p.status === "published").length, scheduled: posts.filter((p) => p.status === "scheduled" || p.scheduled_at).length, total: posts.length };
  const curTitle = editorLang === "nl" ? draftPost.title_nl ?? "" : draftPost.title;
  const curContent = editorLang === "nl" ? draftPost.content_nl ?? "" : draftPost.content;
  const curExcerpt = editorLang === "nl" ? draftPost.excerpt_nl ?? "" : draftPost.excerpt;
  const curMetaTitle = editorLang === "nl" ? draftPost.meta_title_nl ?? "" : draftPost.meta_title ?? "";
  const curMetaDesc = editorLang === "nl" ? draftPost.meta_description_nl ?? "" : draftPost.meta_description ?? "";
  const words = wc(curContent);

  // ── Auth guard ──
  if (authLoading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center" style={{ background: CMS_BG_0 }}>
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="flex gap-3 justify-center mt-6">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>
      </div>
    </div>
  );
  if (!user) return (
    <div className="pt-20 min-h-screen flex items-center justify-center" style={{ background: CMS_BG_0 }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto"><Pen className="w-5 h-5 text-white/30" /></div>
        <div className="text-white/60 text-lg font-medium">Please sign in to access the CMS.</div>
      </div>
    </div>
  );

  // ── Sidebar nav button ──
  const navBtn = (item: (typeof NAV_ITEMS)[number]) => (
    <motion.button key={item.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={() => { if (item.key === "new-post") startNewPost(); else setActiveNav(item.key); }}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg mx-2 transition-all duration-150 relative group ${
        activeNav === item.key
          ? "text-white bg-gradient-to-r from-blue-500/20 to-indigo-500/20 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]"
          : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
      }`}
      style={{ width: sidebarOpen ? "calc(100% - 16px)" : "auto" }}
      title={sidebarOpen ? undefined : item.label}
    >
      <span className={activeNav === item.key ? "text-blue-400" : "text-white/40 group-hover:text-white/60"}>{item.icon}</span>
      {sidebarOpen && <span className="font-medium">{item.label}</span>}
    </motion.button>
  );

  // ── Metadata panel (shared desktop/mobile) ──
  const metaPanel = () => (
    <div className="p-5 space-y-4">
      <div><Label>Status</Label><select value={draftPost.status} onChange={(e) => updateDraft("status", e.target.value)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] transition-colors"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select></div>
      {draftPost.status === "scheduled" && <div><Label>Schedule Date</Label><input type="datetime-local" value={draftPost.scheduled_at ?? ""} onChange={(e) => updateDraft("scheduled_at", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] transition-colors" /></div>}
      <div className="h-px bg-white/[0.05]" />
      <div><Label>Category</Label><Inp value={draftPost.category} onChange={(v) => updateDraft("category", v)} placeholder="e-commerce" /></div>
      <div>
        <Label>Tags</Label>
        <Inp value={draftPost.tags?.join(", ") ?? ""} onChange={(v) => updateDraft("tags", v.split(",").map((t) => t.trim()).filter(Boolean))} placeholder="seo, marketing" />
        {draftPost.tags?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{draftPost.tags.map((t) => <Badge key={t} className="bg-white/[0.06] text-white/60 text-xs rounded-full px-2.5">{t}</Badge>)}</div>}
      </div>
      <div>
        <Label>Cover Image</Label>
        <Inp value={draftPost.cover_image_url ?? ""} onChange={(v) => updateDraft("cover_image_url", v || null)} placeholder="https://..." />
        {draftPost.cover_image_url && <img src={draftPost.cover_image_url} alt="Cover" className="mt-2 rounded-xl max-h-32 w-full object-cover border border-white/[0.05]" />}
      </div>
      <div><Label>Voice Template</Label><select className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] transition-colors" defaultValue=""><option value="">None</option>{voiceTemplates.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
      <div className="h-px bg-white/[0.05]" />
      {/* SEO collapsible */}
      <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: CMS_BG_3 }}>
        <button onClick={() => setSeoExpanded(!seoExpanded)} className="w-full flex items-center justify-between px-4 py-3 text-white/50 text-sm hover:bg-white/[0.02] transition-colors">
          <span className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> <span className="font-medium">SEO Settings</span></span>
          <motion.span animate={{ rotate: seoExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4" /></motion.span>
        </button>
        <AnimatePresence>{seoExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05]">
              <div className="pt-3"><label className="text-white/30 text-xs mb-1 block">Primary Keyword</label><Inp value={draftPost.primary_keyword ?? ""} onChange={(v) => updateDraft("primary_keyword", v || null)} /></div>
              <SeoBar value={curMetaTitle.length} max={60} label="Meta Title" />
              <Inp value={curMetaTitle} onChange={(v) => updateDraft(editorLang === "nl" ? "meta_title_nl" : "meta_title", v || null)} />
              <SeoBar value={curMetaDesc.length} max={160} label="Meta Description" />
              <textarea value={curMetaDesc} onChange={(e) => updateDraft(editorLang === "nl" ? "meta_description_nl" : "meta_description", e.target.value || null)} rows={3} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] resize-none transition-colors" />
              <div className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04]">
                <div className="text-xs text-white/30 mb-2 uppercase tracking-widest">Google Preview</div>
                <div className="text-blue-400 text-sm truncate font-medium">{curMetaTitle || curTitle || "Page title"}</div>
                <div className="text-emerald-500 text-xs truncate">hansvanleeuwen.com/{draftPost.slug || "post-slug"}</div>
                <div className="text-white/50 text-xs line-clamp-2 mt-1">{curMetaDesc || curExcerpt || "Description..."}</div>
              </div>
              <div><label className="text-white/30 text-xs mb-1 block">Canonical URL</label><Inp value={draftPost.canonical_url ?? ""} onChange={(v) => updateDraft("canonical_url", v || null)} /></div>
              <div className="h-px bg-white/[0.05] my-3" />
              <div className="text-white/30 text-xs uppercase tracking-widest mb-3 font-medium">SEO Analysis</div>
              {renderSeoDashboard()}
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>
      <div className="h-px bg-white/[0.05]" />
      <div><Label>OG Title</Label><Inp value={draftPost.og_title ?? ""} onChange={(v) => updateDraft("og_title", v || null)} /></div>
      <div><Label>OG Description</Label><textarea value={draftPost.og_description ?? ""} onChange={(e) => updateDraft("og_description", e.target.value || null)} rows={2} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none focus:border-white/[0.12] resize-none transition-colors" /></div>
      <div className="flex gap-2 pt-2">
        <Button onClick={savePost} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10" size="sm">
          {draftPost.status === "published" ? <><Eye className="w-4 h-4 mr-1" /> Publish</> : <><Save className="w-4 h-4 mr-1" /> Save Draft</>}
        </Button>
        {editingPost && <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deletePost(editingPost.id)}><Trash2 className="w-4 h-4" /></Button>}
      </div>
    </div>
  );

  // ── View renderers ──

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">{getGreeting()}, Hans</h1>
          <p className="text-white/35 text-sm mt-1">Here is your editorial overview</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={startNewPost} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10"><PlusCircle className="w-4 h-4 mr-2" /> New Post</Button>
        </motion.div>
      </div>
      {/* SEO Content Ideas Pills */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-400/60" />
            <span className="text-white/20 text-[10px] uppercase tracking-[0.15em] font-semibold">Powered by SEO Cluster Analysis</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-white/80">Content Ideas</h2>
          <div className="relative">
            {/* Left fade */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10" style={{ background: `linear-gradient(to right, ${CMS_BG_0}, transparent)` }} />
            {/* Right fade */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10" style={{ background: `linear-gradient(to left, ${CMS_BG_0}, transparent)` }} />
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {suggestions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <div className={`group relative flex items-center gap-2 px-4 py-2 rounded-full border ${clusterBorder(s.cluster)} bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 cursor-pointer`}>
                    <button
                      onClick={() => setGhostModal(s)}
                      className="flex items-center gap-2 text-sm text-white/70 hover:text-white/90 transition-colors"
                    >
                      {s.intent === "commercial" ? (
                        <DollarSign className="w-3 h-3 text-emerald-400/70 flex-shrink-0" />
                      ) : (
                        <Info className="w-3 h-3 text-blue-400/70 flex-shrink-0" />
                      )}
                      <span className="whitespace-nowrap font-medium">{s.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${clusterBadgeBg(s.cluster)} whitespace-nowrap`}>
                        {s.cluster}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${difficultyDot(s.difficulty)}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissSuggestion(s.id); }}
                      className="text-white/0 group-hover:text-white/30 hover:!text-white/60 transition-all ml-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([["Total", stats.total, "text-white/90"], ["Published", stats.published, "text-emerald-400"], ["Drafts", stats.draft, "text-zinc-400"], ["Scheduled", stats.scheduled, "text-blue-400"]] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-xl border border-white/[0.05] hover:border-white/[0.08] transition-all duration-200 overflow-hidden" style={{ background: CMS_BG_2 }}>
            <div className={`h-0.5 bg-gradient-to-r ${STAT_BORDERS[l]}`} />
            <div className="p-5">
              <div className={`text-4xl font-bold tabular-nums ${c}`}>{v}</div>
              <div className="text-white/35 text-sm mt-1 font-medium">{l}</div>
              <div className="flex items-center gap-1 mt-2 text-white/20 text-xs">
                <BarChart3 className="w-3 h-3" />
                <div className="flex gap-0.5 items-end h-3">
                  {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                    <div key={i} className="w-1 rounded-full bg-white/10" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startNewPost} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.06] hover:text-white/80 transition-all"><PlusCircle className="w-4 h-4" /> Write</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveNav("media")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.06] hover:text-white/80 transition-all"><Image className="w-4 h-4" /> Media</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveNav("seo")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60 text-sm hover:bg-white/[0.06] hover:text-white/80 transition-all"><Target className="w-4 h-4" /> SEO</motion.button>
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white/80 mb-3">Recent Drafts</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.filter((p) => p.status === "draft").slice(0, 6).map((p) => (
            <motion.button key={p.id} whileHover={{ y: -2 }} onClick={() => openEditor(p)} className="text-left rounded-xl border border-white/[0.05] p-4 hover:border-white/[0.1] transition-all duration-200 group overflow-hidden relative" style={{ background: CMS_BG_2 }}>
              {p.cover_image_url && <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"><img src={p.cover_image_url} alt="" className="w-full h-full object-cover" /></div>}
              <div className="relative">
                <div className="text-white/90 font-medium truncate">{p.title || "Untitled"}</div>
                <div className="text-white/35 text-sm mt-1">{fmtDate(p.updated_at)}</div>
                <div className="text-white/25 text-xs mt-2 line-clamp-2 leading-relaxed">{p.excerpt}</div>
              </div>
            </motion.button>
          ))}
        </div>
        {posts.filter((p) => p.status === "draft").length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3"><FileText className="w-7 h-7 text-white/15" /></div>
            <div className="text-white/30 text-sm">No drafts yet. Start writing.</div>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white/80 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Editorial Calendar</h2>
        <div className="space-y-2">
          {posts.filter((p) => p.scheduled_at).sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? "")).slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/[0.05] px-4 py-3 hover:border-white/[0.08] transition-all" style={{ background: CMS_BG_2 }}>
              <div><div className="text-white/90 text-sm font-medium">{p.title}</div><div className="text-white/35 text-xs">{p.category}</div></div>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full">{p.scheduled_at ? fmtDate(p.scheduled_at) : ""}</Badge>
            </div>
          ))}
          {!posts.some((p) => p.scheduled_at) && <div className="text-white/30 text-sm">No scheduled posts.</div>}
        </div>
      </div>
    </div>
  );

  const renderPostsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">Posts</h1>
          <div className="flex rounded-xl border border-white/[0.05] p-0.5" style={{ background: CMS_BG_2 }}>
            <button onClick={() => setDraftsFilter(false)} className={`px-3 py-1 text-xs rounded-lg transition-all ${!draftsFilter ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}>All</button>
            <button onClick={() => setDraftsFilter(true)} className={`px-3 py-1 text-xs rounded-lg transition-all ${draftsFilter ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}>Drafts</button>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={startNewPost} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10"><PlusCircle className="w-4 h-4 mr-2" /> New Post</Button>
        </motion.div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.04] text-white/90 text-sm placeholder:text-white/25 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-blue-500/20 transition-all" />
        </div>
        <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-white/25" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-white/[0.12] transition-colors"><option value="all">All status</option><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-white/[0.12] transition-colors"><option value="all">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="flex items-center gap-1 ml-auto rounded-xl border border-white/[0.05] p-1" style={{ background: CMS_BG_2 }}>
          <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("card")} className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}><Grid3X3 className="w-4 h-4" /></button>
        </div>
      </div>
      {selectedPosts.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
          <span className="text-blue-400 text-sm font-medium">{selectedPosts.size} selected</span>
          <Button size="sm" variant="ghost" className="text-emerald-400 text-xs hover:bg-emerald-500/10" onClick={() => bulkAction("publish")}>Publish</Button>
          <Button size="sm" variant="ghost" className="text-zinc-400 text-xs hover:bg-zinc-500/10" onClick={() => bulkAction("unpublish")}>Unpublish</Button>
          <Button size="sm" variant="ghost" className="text-red-400 text-xs hover:bg-red-500/10" onClick={() => bulkAction("delete")}>Delete</Button>
          <Button size="sm" variant="ghost" className="text-white/40 text-xs ml-auto" onClick={() => setSelectedPosts(new Set())}>Clear</Button>
        </motion.div>
      )}
      {loadingPosts && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: CMS_BG_2 }}>
              <Skeleton className="h-4 w-4" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}
      {!loadingPosts && viewMode === "table" && (
        <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: CMS_BG_2 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3.5 text-left w-8"><input type="checkbox" checked={selectedPosts.size === filtered.length && filtered.length > 0} onChange={(e) => setSelectedPosts(e.target.checked ? new Set(filtered.map((p) => p.id)) : new Set())} className="accent-blue-500 rounded" /></th>
              <th className="px-4 py-3.5 text-left text-white/35 font-medium text-xs uppercase tracking-widest"><button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => { setSortField("title"); setSortDir(sortField === "title" && sortDir === "asc" ? "desc" : "asc"); }}>Title <ArrowUpDown className="w-3 h-3" /></button></th>
              <th className="px-4 py-3.5 text-left text-white/35 font-medium text-xs uppercase tracking-widest hidden md:table-cell">Status</th>
              <th className="px-4 py-3.5 text-left text-white/35 font-medium text-xs uppercase tracking-widest hidden lg:table-cell">Category</th>
              <th className="px-4 py-3.5 text-left text-white/35 font-medium text-xs uppercase tracking-widest hidden lg:table-cell">Words</th>
              <th className="px-4 py-3.5 text-left text-white/35 font-medium text-xs uppercase tracking-widest"><button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => { setSortField("updated_at"); setSortDir(sortField === "updated_at" && sortDir === "desc" ? "asc" : "desc"); }}>Date <ArrowUpDown className="w-3 h-3" /></button></th>
              <th className="px-4 py-3.5 w-12"></th>
            </tr></thead>
            <tbody>{filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all duration-150 cursor-pointer group" onClick={() => openEditor(p)}>
                <td className="px-4 py-3.5 relative" onClick={(e) => e.stopPropagation()}>
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-all duration-200 ${STATUS_DOT[p.status] ?? "bg-zinc-500"} opacity-0 group-hover:opacity-100`} />
                  <input type="checkbox" checked={selectedPosts.has(p.id)} onChange={(e) => { const n = new Set(selectedPosts); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSelectedPosts(n); }} className="accent-blue-500 rounded" />
                </td>
                <td className="px-4 py-3.5 text-white/90 font-medium">{p.title || "Untitled"}</td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <Badge className={`${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft} rounded-full px-2.5 flex items-center gap-1.5 w-fit`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-zinc-400"}`} />
                    {p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-white/40 hidden lg:table-cell">{p.category}</td>
                <td className="px-4 py-3.5 text-white/35 tabular-nums hidden lg:table-cell">{wc(p.content)}</td>
                <td className="px-4 py-3.5 text-white/35">{fmtDate(p.updated_at)}</td>
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}><button onClick={() => deletePost(p.id)} className="text-white/15 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3"><Search className="w-7 h-7 text-white/15" /></div>
              <div className="text-white/30 text-sm">No posts found.</div>
            </div>
          )}
        </div>
      )}
      {!loadingPosts && viewMode === "card" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
              className="rounded-xl border border-white/[0.05] overflow-hidden cursor-pointer hover:border-white/[0.1] transition-all duration-200 group" style={{ background: CMS_BG_2 }} onClick={() => openEditor(p)}>
              {p.cover_image_url && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img src={p.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3"><Badge className={`${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft} rounded-full px-2.5 flex items-center gap-1.5 w-fit`}><span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-zinc-400"}`} />{p.status}</Badge></div>
                </div>
              )}
              <div className="p-5">
                {!p.cover_image_url && (
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft} rounded-full px-2.5 flex items-center gap-1.5 w-fit`}><span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-zinc-400"}`} />{p.status}</Badge>
                    <span className="text-white/25 text-xs">{fmtDate(p.updated_at)}</span>
                  </div>
                )}
                <h3 className="text-white/90 font-medium mb-1">{p.title || "Untitled"}</h3>
                <p className="text-white/35 text-sm line-clamp-2 leading-relaxed">{p.excerpt}</p>
                <div className="flex items-center gap-3 mt-3 text-white/25 text-xs"><span>{p.category}</span><span className="tabular-nums">{wc(p.content)} words</span></div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3"><Search className="w-7 h-7 text-white/15" /></div>
              <div className="text-white/30 text-sm">No posts found.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEditor = () => (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      <div className="flex-1 min-w-0 space-y-4 lg:pr-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveNav("posts")} className="text-white/40 hover:text-white/80 p-1 rounded-lg hover:bg-white/[0.04] transition-all"><ChevronLeft className="w-5 h-5" /></motion.button>
            <h1 className="text-xl font-semibold tracking-tight text-white/90">{isNewPost ? "New Post" : "Edit Post"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className={`hover:bg-white/[0.04] ${previewMode ? "text-blue-400 bg-blue-500/10" : "text-white/50 hover:text-white/80"}`} onClick={() => setPreviewMode(!previewMode)}><Eye className="w-4 h-4 mr-1" /> Preview</Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white/80 hover:bg-white/[0.04]" onClick={() => setReviewDrawerOpen(true)}><Sparkles className="w-4 h-4 mr-1 text-blue-400" /> AI Review</Button>
            </motion.div>
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white/80 hover:bg-white/[0.04] hidden lg:flex" onClick={() => setMetaSidebarOpen(!metaSidebarOpen)}><Settings className="w-4 h-4" /></Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {hasGaps && !allGapsFilled ? (
                <Button disabled className="bg-white/[0.04] text-white/25 border border-white/[0.06] cursor-not-allowed" size="sm"><Lock className="w-4 h-4 mr-1" /> Publish Locked</Button>
              ) : (
                <Button onClick={savePost} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10" size="sm"><Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}</Button>
              )}
            </motion.div>
            {allGapsFilled && <Button variant="ghost" size="sm" className="text-emerald-400 hover:bg-emerald-500/10" onClick={runAllReviews}><Sparkles className="w-4 h-4 mr-1" /> Run AI Review</Button>}
          </div>
        </div>
        <Tabs value={editorLang} onValueChange={(v) => setEditorLang(v as PostLanguage)}>
          <TabsList className="bg-white/[0.04] border border-white/[0.05] rounded-xl">
            <TabsTrigger value="en" className="text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm">English</TabsTrigger>
            <TabsTrigger value="nl" className="text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm">Nederlands</TabsTrigger>
          </TabsList>
        </Tabs>
        <input type="text" placeholder="What's on your mind?" value={curTitle} onChange={(e) => updateDraft(editorLang === "nl" ? "title_nl" : "title", e.target.value)} className="w-full text-4xl font-semibold tracking-tight bg-transparent border-none outline-none text-white/90 placeholder:text-white/15" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/25 text-xs uppercase tracking-widest">Slug</span>
          <input type="text" value={draftPost.slug} onChange={(e) => { setSlugManual(true); updateDraft("slug", e.target.value); }} className="flex-1 bg-transparent border-b border-white/[0.05] text-white/50 text-sm outline-none focus:border-blue-500/30 py-1 transition-colors" />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setSlugManual(false); updateDraft("slug", slugify(draftPost.title)); }} className="text-white/25 hover:text-white/50 transition-colors" title="Regenerate"><RefreshCw className="w-3 h-3" /></motion.button>
        </div>
        {renderHumanGatesBar()}
        {/* Related SEO suggestions bar */}
        {suggestions.length > 0 && (() => {
          const currentSlug = draftPost.slug;
          const currentCluster = suggestions.find((s) => s.slug === currentSlug)?.cluster;
          const related = suggestions
            .filter((s) =>
              s.slug !== currentSlug &&
              (s.related_post_slug === currentSlug ||
                (currentCluster && s.cluster === currentCluster))
            )
            .slice(0, 3);
          if (related.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02]"
            >
              <span className="text-white/20 text-[10px] uppercase tracking-widest flex-shrink-0">Related</span>
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {related.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => startPostFromSuggestion(s)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs text-white/50 hover:text-white/80 bg-white/[0.02] hover:bg-white/[0.05] transition-all whitespace-nowrap ${clusterBorder(s.cluster)}`}
                  >
                    {s.intent === "commercial" ? (
                      <DollarSign className="w-2.5 h-2.5 text-emerald-400/60" />
                    ) : (
                      <Info className="w-2.5 h-2.5 text-blue-400/60" />
                    )}
                    {s.title}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })()}
        <AnimatePresence mode="wait">
          {previewMode ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderPreview()}
            </motion.div>
          ) : (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
              <textarea ref={contentRef} placeholder="Write your content in markdown..." value={curContent} onChange={(e) => updateDraft(editorLang === "nl" ? "content_nl" : "content", e.target.value)} className="w-full min-h-[400px] lg:min-h-[500px] rounded-xl border border-white/[0.05] p-6 text-white/90 text-sm leading-relaxed placeholder:text-white/15 focus:outline-none focus:border-white/[0.1] focus:ring-1 focus:ring-blue-500/10 font-mono resize-y transition-all" style={{ background: "hsl(225, 20%, 6%)", lineHeight: "1.8" }} />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Floating bottom bar */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.05] text-xs" style={{ background: CMS_BG_2 }}>
          <div className="flex items-center gap-4 text-white/30">
            <span className="tabular-nums">{words} words</span>
            <span className="w-px h-3 bg-white/[0.08]" />
            <span>{rt(words)}</span>
            <span className="w-px h-3 bg-white/[0.08]" />
            <span className="flex items-center gap-1"><Languages className="w-3 h-3" /> {editorLang.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/25">
            {lastSaved && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Saved {new Date(lastSaved).toLocaleTimeString()}</span>}
            {saving && <span className="flex items-center gap-1 text-blue-400"><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</span>}
            {!saving && !lastSaved && <span>Not saved</span>}
          </div>
        </div>
        <div><label className="text-white/35 text-xs uppercase tracking-widest mb-2 block font-medium">Excerpt</label><textarea placeholder="Brief summary..." value={curExcerpt} onChange={(e) => updateDraft(editorLang === "nl" ? "excerpt_nl" : "excerpt", e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.05] p-4 text-white/80 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/[0.1] focus:ring-1 focus:ring-blue-500/10 resize-y leading-relaxed transition-all" style={{ background: CMS_BG_2 }} /></div>
      </div>
      {/* Desktop meta sidebar */}
      <AnimatePresence>{metaSidebarOpen && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="hidden lg:block border-l border-white/[0.05] overflow-y-auto flex-shrink-0" style={{ background: CMS_BG_1 }}>{metaPanel()}</motion.div>
      )}</AnimatePresence>
      {/* Mobile meta toggle */}
      <div className="lg:hidden border-t border-white/[0.05] pt-4">
        <button onClick={() => setMetaSidebarOpen(!metaSidebarOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.05] text-white/50 text-sm hover:bg-white/[0.02] transition-all" style={{ background: CMS_BG_2 }}>
          <span className="font-medium">Post Settings & SEO</span>
          <motion.span animate={{ rotate: metaSidebarOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4" /></motion.span>
        </button>
        <AnimatePresence>{metaSidebarOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="mt-2 rounded-xl border border-white/[0.05]" style={{ background: CMS_BG_2 }}>{metaPanel()}</div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </div>
  );

  const renderReviewDrawer = () => (
    <AnimatePresence>{reviewDrawerOpen && (<>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setReviewDrawerOpen(false)} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed top-16 right-0 z-50 w-full max-w-md h-[calc(100vh-64px)] border-l border-white/[0.06] overflow-y-auto" style={{ background: CMS_BG_1 }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-white/90 flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-400" /> AI Review Panel</h2>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setReviewDrawerOpen(false)} className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/[0.04] transition-all"><X className="w-5 h-5" /></motion.button>
          </div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={runAllReviews} className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10 mb-6 ${reviewsRunning ? "animate-pulse" : ""}`}>
              <RefreshCw className={`w-4 h-4 mr-2 ${reviewsRunning ? "animate-spin" : ""}`} /> Run All Reviews
            </Button>
          </motion.div>
          <div className="space-y-3">
            {(agentReviews.length > 0 ? agentReviews : AGENTS.map((a) => ({ agent_id: a.id, agent_name: a.name, icon: a.icon, score: null, verdict: "", feedback: "", suggestions: [], loading: false }))).map((r) => (
              <motion.div key={r.agent_id} layout transition={{ duration: 0.2 }}
                className={`rounded-xl border ${r.score !== null ? scoreBg(r.score) : "border-white/[0.05]"} overflow-hidden`}
                style={r.score === null ? { background: CMS_BG_2 } : undefined}>
                <button onClick={() => setExpandedAgent(expandedAgent === r.agent_id ? null : r.agent_id)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.score !== null ? scoreRingBg(r.score) : "bg-white/[0.04]"}`}>
                    <span className="text-white/50">{AGENT_ICONS[r.icon]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 font-medium text-sm">{r.agent_name}</div>
                    {r.loading && <div className="text-white/30 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...</div>}
                    {!r.loading && r.verdict && <div className="text-white/40 text-xs truncate">{r.verdict}</div>}
                  </div>
                  {r.score !== null && <ScoreRing score={r.score} />}
                  <motion.span animate={{ rotate: expandedAgent === r.agent_id ? 90 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronRight className="w-4 h-4 text-white/25" />
                  </motion.span>
                </button>
                <AnimatePresence>{expandedAgent === r.agent_id && r.feedback && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="px-4 pb-4 border-t border-white/[0.05] pt-3">
                      <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{r.feedback}</p>
                      {r.suggestions.length > 0 && <div className="mt-3"><div className="text-white/30 text-xs uppercase tracking-widest mb-2">Suggestions</div><ul className="space-y-1.5">{r.suggestions.map((s, i) => <li key={i} className="text-white/50 text-sm flex items-start gap-2 leading-relaxed"><span className="text-blue-400 mt-0.5 shrink-0">-</span> {s}</li>)}</ul></div>}
                    </div>
                  </motion.div>
                )}</AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>)}</AnimatePresence>
  );

  const renderMedia = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Media Library</h1>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button variant="ghost" className="text-white/50 hover:text-white/80 hover:bg-white/[0.04]" onClick={fetchMedia}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </motion.div>
      </div>
      {loadingMedia && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: CMS_BG_2 }}>
              <Skeleton className="h-32 w-full rounded-none" /><div className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))}
        </div>
      )}
      {!loadingMedia && mediaItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-4"><Image className="w-9 h-9 text-white/15" /></div>
          <div className="text-white/30 text-sm">No media files yet.</div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((m) => (
          <motion.div key={m.id} whileHover={{ y: -2 }} className="rounded-xl border border-white/[0.05] overflow-hidden group cursor-pointer hover:border-white/[0.1] transition-all duration-200" style={{ background: CMS_BG_2 }}>
            {m.mime_type?.startsWith("image/") ? <img src={m.public_url} alt={m.alt_text ?? m.file_name} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-32 flex items-center justify-center bg-white/[0.02]"><FileText className="w-8 h-8 text-white/15" /></div>}
            <div className="p-3"><div className="text-white/80 text-xs truncate font-medium">{m.file_name}</div><div className="text-white/25 text-xs mt-1">{m.folder ?? "root"}</div>
              <button onClick={() => { navigator.clipboard.writeText(m.public_url).catch(() => { /* empty */ }); toast({ title: "Copied", description: "URL copied." }); }} className="text-blue-400 text-xs mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3" /> Copy URL</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSEO = () => {
    const kw = draftPost.primary_keyword ?? "";
    const kwCount = kw && curContent ? (curContent.toLowerCase().match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
    const kwDens = words > 0 ? ((kwCount / words) * 100).toFixed(1) : "0.0";
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">SEO Tools</h1>
        {!editingPost && !isNewPost && (
          <div className="rounded-xl border border-white/[0.05] p-12 text-center" style={{ background: CMS_BG_2 }}>
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-4"><Target className="w-7 h-7 text-white/15" /></div>
            <div className="text-white/35 text-sm">Open a post in the editor first to use SEO tools.</div>
          </div>
        )}
        {(editingPost || isNewPost) && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5"><h3 className="text-white/80 font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> Keyword Density</h3>
              {kw ? <><div className="text-white/50 text-sm leading-relaxed">Keyword: <span className="text-white/90 font-medium">{kw}</span></div><div className="text-white/50 text-sm mt-1">Occurrences: <span className="text-white/90 tabular-nums">{kwCount}</span></div><div className="text-white/50 text-sm mt-1">Density: <span className={parseFloat(kwDens) >= 1 && parseFloat(kwDens) <= 3 ? "text-emerald-400" : "text-amber-400"}>{kwDens}%</span></div><div className="text-white/25 text-xs mt-2">Target: 1-3%</div></> : <div className="text-white/30 text-sm">Set a primary keyword first.</div>}
            </Card>
            <Card className="p-5"><h3 className="text-white/80 font-medium mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Readability</h3>
              <div className="text-white/50 text-sm leading-relaxed">Words: <span className="text-white/90 tabular-nums">{words}</span></div>
              <div className="text-white/50 text-sm mt-1">Reading time: <span className="text-white/90">{rt(words)}</span></div>
              <div className="text-white/50 text-sm mt-1">Paragraphs: <span className="text-white/90 tabular-nums">{curContent.split(/\n\n+/).filter(Boolean).length}</span></div>
              <div className="text-white/50 text-sm mt-1">Avg words/sentence: <span className="text-white/90 tabular-nums">{curContent ? Math.round(words / Math.max(1, (curContent.match(/[.!?]+/g) ?? []).length)) : 0}</span></div>
            </Card>
            <Card className="p-5 md:col-span-2"><h3 className="text-white/80 font-medium mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4 text-blue-400" /> SERP Preview</h3>
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04]">
                <div className="text-blue-400 text-lg truncate font-medium">{curMetaTitle || curTitle || "Page Title"}</div>
                <div className="text-emerald-500 text-sm truncate">hansvanleeuwen.com/{draftPost.slug || "post-slug"}</div>
                <div className="text-white/50 text-sm line-clamp-2 mt-1 leading-relaxed">{curMetaDesc || curExcerpt || "Description..."}</div>
              </div>
              <div className="mt-3 space-y-2">
                <SeoBar value={curMetaTitle.length} max={60} label="Title Length" />
                <SeoBar value={curMetaDesc.length} max={160} label="Description Length" />
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderVoice = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white/90">Voice & Style</h1>
      <div><h2 className="text-lg font-semibold tracking-tight text-white/80 mb-3">Voice Templates</h2>
        {loadingVoice && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => <div key={i} className="rounded-xl p-5 space-y-3" style={{ background: CMS_BG_2 }}><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>)}
          </div>
        )}
        {!loadingVoice && voiceTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mb-3"><Mic className="w-7 h-7 text-white/15" /></div>
            <div className="text-white/30 text-sm">No voice templates found.</div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">{voiceTemplates.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-white/90 font-medium">{v.name}</h3><Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full">{v.category}</Badge></div>
            <div className="space-y-1.5 text-sm"><div className="text-white/40 leading-relaxed">Tone: <span className="text-white/70">{v.tone}</span></div><div className="text-white/40">Perspective: <span className="text-white/70">{v.perspective}</span></div><div className="text-white/40">Audience: <span className="text-white/70">{v.target_audience}</span></div></div>
            {v.banned_words?.length > 0 && <div className="mt-3"><div className="text-white/25 text-xs uppercase tracking-widest mb-1.5">Banned Words</div><div className="flex flex-wrap gap-1">{v.banned_words.slice(0, 8).map((w) => <Badge key={w} className="bg-red-500/10 text-red-400 text-xs rounded-full">{w}</Badge>)}{v.banned_words.length > 8 && <Badge className="bg-white/[0.04] text-white/35 text-xs rounded-full">+{v.banned_words.length - 8}</Badge>}</div></div>}
            {v.content_rules && <div className="mt-3"><div className="text-white/25 text-xs uppercase tracking-widest mb-1.5">Content Rules</div><div className="text-white/40 text-xs line-clamp-3 leading-relaxed">{v.content_rules}</div></div>}
          </Card>
        ))}</div>
      </div>
      <div><h2 className="text-lg font-semibold tracking-tight text-white/80 mb-3">Editorial Memory</h2>
        {blogMemory.length === 0 && (
          <div className="text-white/30 text-sm">No editorial memory entries.</div>
        )}
        <div className="space-y-3">{blogMemory.map((m) => (
          <Card key={m.content_category} className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-white/90 font-medium capitalize">{m.content_category}</h3><span className="text-white/25 text-xs">{fmtDate(m.updated_at)}</span></div>
            {m.brand_voice_context && <div className="mb-3"><div className="text-white/25 text-xs uppercase tracking-widest mb-1.5">Brand Voice</div><div className="text-white/50 text-sm whitespace-pre-wrap leading-relaxed">{m.brand_voice_context}</div></div>}
            {m.narrative_history && <div><div className="text-white/25 text-xs uppercase tracking-widest mb-1.5">Narrative History</div><div className="text-white/40 text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed">{m.narrative_history}</div></div>}
          </Card>
        ))}</div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white/90">Settings</h1>
      <Card className="p-6">
        <h3 className="text-white/80 font-medium mb-4">CMS Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><span className="text-white/50 text-sm">Default editor language</span><select value={editorLang} onChange={(e) => setEditorLang(e.target.value as PostLanguage)} className="rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-white/[0.12] transition-colors"><option value="en">English</option><option value="nl">Nederlands</option></select></div>
          <div className="h-px bg-white/[0.05]" />
          <div className="flex items-center justify-between"><span className="text-white/50 text-sm">Default view mode</span><select value={viewMode} onChange={(e) => setViewMode(e.target.value as "table" | "card")} className="rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-white/[0.12] transition-colors"><option value="table">Table</option><option value="card">Cards</option></select></div>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-white/80 font-medium mb-2">Account</h3>
        <div className="text-white/50 text-sm">{user?.email ?? "Unknown"}</div>
      </Card>
    </div>
  );

  // ── Ghost Writer Modal ──
  const renderGhostModal = () => (
    <AnimatePresence>{ghostModal && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setGhostModal(null)} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] p-6 space-y-5" style={{ background: CMS_BG_1 }}>
            <div className="flex items-center justify-between">
              <h3 className="text-white/90 font-semibold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-400" /> Generate draft with AI?</h3>
              <button onClick={() => setGhostModal(null)} className="text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-xl border border-white/[0.06] p-4 space-y-2" style={{ background: CMS_BG_2 }}>
              <div className="text-white/90 font-medium">{ghostModal.title}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge className={`${clusterBadgeBg(ghostModal.cluster)} rounded-full`}>{ghostModal.cluster}</Badge>
                <Badge className="bg-white/[0.06] text-white/50 rounded-full">{ghostModal.primary_keyword}</Badge>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-white/50">
              <div className="flex items-center gap-2"><Pen className="w-3.5 h-3.5 text-blue-400" /> Hans&apos;s voice &bull; 1200-1500 words &bull; 3 human gaps</div>
              <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-amber-400" /> AI-written content requires human gate approval</div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setGhostModal(null)} variant="ghost" className="flex-1 text-white/50 hover:text-white/80 hover:bg-white/[0.04]">Write manually</Button>
              <Button onClick={() => generateGhostDraft(ghostModal)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10">
                <Sparkles className="w-4 h-4 mr-1" /> Generate
              </Button>
            </div>
          </div>
        </motion.div>
      </>
    )}</AnimatePresence>
  );

  // ── Ghost Writer Loading Overlay ──
  const renderGhostLoading = () => (
    <AnimatePresence>{ghostPhase !== "idle" && ghostPhase !== "done" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="rounded-2xl border border-white/[0.08] p-8 text-center space-y-6 max-w-sm" style={{ background: CMS_BG_1 }}>
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Sparkles className="w-7 h-7 text-blue-400" /></motion.div>
          </div>
          <div className="space-y-3">
            {GHOST_PHASES.map((p) => (
              <motion.div key={p.key} animate={{ opacity: ghostPhase === p.key ? 1 : 0.3 }} className="flex items-center gap-3 text-sm">
                {ghostPhase === p.key ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-blue-400" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                <span className={ghostPhase === p.key ? "text-white/90 font-medium" : "text-white/30"}>{p.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );

  // ── Human Gates Status Bar ──
  const renderHumanGatesBar = () => {
    if (!hasGaps) return null;
    const labels = ["Hook", "Case Study", "Conclusion"];
    return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between px-4 py-2 rounded-xl border transition-all duration-300" style={{ background: allGapsFilled ? "rgba(16, 185, 129, 0.05)" : CMS_BG_2, borderColor: allGapsFilled ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          {ghostGaps.map((g, i) => (
            <div key={g.id} className="flex items-center gap-1.5 text-xs">
              {g.filled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-white/25" />}
              <span className={g.filled ? "text-emerald-400 font-medium" : "text-white/40"}>{labels[i] ?? g.label}</span>
              {i < ghostGaps.length - 1 && <span className="text-white/10 ml-1">|</span>}
            </div>
          ))}
        </div>
        <div className="text-xs">
          {allGapsFilled ? (
            <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-emerald-400 font-medium flex items-center gap-1"><Unlock className="w-3 h-3" /> All gates passed</motion.span>
          ) : (
            <span className="text-white/30">{gapsFilled} of {ghostGaps.length} human gates filled</span>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Preview Renderer ──
  const renderPreview = () => {
    const md = curContent;
    const rendered = md
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white/90 mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90 font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-white/70 italic">$1</em>')
      .replace(/\[HANS:\s*([^\]]+)\]/g, '<span class="inline-block px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm animate-pulse">[$1 - needs your input]</span>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 underline underline-offset-2">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-4" />')
      .replace(/^(?!<[h123a]|<img|<strong|<em|<span|<ul|<li)(.+)$/gm, '<p class="text-white/70 leading-relaxed mb-3">$1</p>')
      .replace(/\n{2,}/g, "");
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-2xl border border-white/[0.06] p-8 overflow-y-auto" style={{ background: CMS_BG_1, maxHeight: "70vh" }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">{curTitle || "Untitled"}</h1>
            <div className="flex items-center gap-3 text-white/35 text-sm">
              <span>Hans van Leeuwen</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>{rt(words)}</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>{fmtDate(new Date().toISOString())}</span>
            </div>
          </div>
          <div className="prose-dark" dangerouslySetInnerHTML={{ __html: rendered }} />
          {draftPost.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/[0.06]">
              {draftPost.tags.map((t) => <Badge key={t} className="bg-white/[0.06] text-white/50 rounded-full">{t}</Badge>)}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── SEO Dashboard Panel (in meta sidebar) ──
  const renderSeoDashboard = () => {
    const localChecks = computeSeoChecks(curTitle, curMetaDesc, draftPost.primary_keyword ?? "", curContent, words);
    const localPassed = localChecks.filter((c) => c.passed).length;
    const localScore = Math.round((localPassed / localChecks.length) * 100);
    const checks = seoReport?.checks ?? localChecks;
    const score = seoReport?.score ?? localScore;
    const iconMap: Record<string, React.ReactNode> = {
      "Title length": <Type className="w-3.5 h-3.5" />, "Meta description": <FileText className="w-3.5 h-3.5" />,
      "keyword in title": <Target className="w-3.5 h-3.5" />, "first paragraph": <AlertTriangle className="w-3.5 h-3.5" />,
      "density": <BarChart3 className="w-3.5 h-3.5" />, "internal link": <Link className="w-3.5 h-3.5" />,
      "Heading": <Heading className="w-3.5 h-3.5" />, "Image": <ImageIcon className="w-3.5 h-3.5" />,
      "Word count": <FileText className="w-3.5 h-3.5" />, "Reading": <Clock className="w-3.5 h-3.5" />,
    };
    const getIcon = (label: string) => { for (const k of Object.keys(iconMap)) { if (label.includes(k)) return iconMap[k]; } return <Target className="w-3.5 h-3.5" />; };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-3"><ScoreRing score={score} size={72} /></div>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1">
              <span className={c.passed ? "text-emerald-400" : "text-red-400"}>{c.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</span>
              <span className="text-white/30">{getIcon(c.label)}</span>
              <span className={c.passed ? "text-white/60" : "text-white/40"}>{c.label}</span>
              <span className="ml-auto text-white/25">{c.detail}</span>
            </div>
          ))}
        </div>
        <Button onClick={generateSeoReport} disabled={seoReportLoading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/10" size="sm">
          {seoReportLoading ? <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Analyzing...</> : <><Target className="w-3.5 h-3.5 mr-1" /> Generate Full SEO Report</>}
        </Button>
        {seoReport?.jsonLd && (
          <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: CMS_BG_3 }}>
            <button onClick={() => setJsonLdExpanded(!jsonLdExpanded)} className="w-full flex items-center justify-between px-3 py-2 text-white/40 text-xs hover:bg-white/[0.02]">
              <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> JSON-LD Preview</span>
              <motion.span animate={{ rotate: jsonLdExpanded ? 180 : 0 }}><ChevronDown className="w-3 h-3" /></motion.span>
            </button>
            <AnimatePresence>{jsonLdExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <pre className="px-3 pb-3 text-[10px] text-white/40 font-mono overflow-x-auto leading-relaxed">{seoReport.jsonLd}</pre>
              </motion.div>
            )}</AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard": return renderDashboard();
      case "posts": return renderPostsList();
      case "new-post": return renderEditor();
      case "media": return renderMedia();
      case "seo": return renderSEO();
      case "voice": return renderVoice();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div className="pt-20 min-h-screen pb-16 lg:pb-0" style={{ background: CMS_BG_0 }}>
      {/* Desktop sidebar — glass morphism */}
      <aside className={`fixed top-16 left-0 z-30 h-[calc(100vh-64px)] border-r border-white/[0.05] transition-all duration-300 ${sidebarOpen ? "w-[280px]" : "w-[60px]"} hidden lg:flex flex-col`}
        style={{ background: `linear-gradient(180deg, hsl(225, 20%, 8%) 0%, hsl(225, 18%, 5%) 100%)`, backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Pen className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90 font-semibold text-sm tracking-wide">Editorial</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
              <Pen className="w-4 h-4 text-white" />
            </div>
          )}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(!sidebarOpen)} className={`text-white/30 hover:text-white/60 transition-colors ${sidebarOpen ? "" : "hidden"}`}>{sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</motion.button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto space-y-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {sidebarOpen && <div className="px-5 pt-4 pb-1.5 text-white/20 text-[10px] uppercase tracking-[0.15em] font-semibold">{group.label}</div>}
              {!sidebarOpen && group.label !== "Content" && <div className="mx-3 my-2 h-px bg-white/[0.05]" />}
              {group.items.map((item) => navBtn(item))}
            </div>
          ))}
        </nav>
      </aside>
      {/* Mobile sidebar */}
      <AnimatePresence>{mobileSidebarOpen && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed top-16 left-0 z-50 w-[280px] h-[calc(100vh-64px)] border-r border-white/[0.05] flex flex-col lg:hidden" style={{ background: `linear-gradient(180deg, hsl(225, 20%, 8%) 0%, hsl(225, 18%, 5%) 100%)` }}>
          <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Pen className="w-4 h-4 text-white" /></div>
              <span className="text-white/90 font-semibold text-sm">Editorial</span>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setMobileSidebarOpen(false)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></motion.button>
          </div>
          <nav className="flex-1 py-3 space-y-1">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-5 pt-4 pb-1.5 text-white/20 text-[10px] uppercase tracking-[0.15em] font-semibold">{group.label}</div>
                {group.items.map((item) => (
                  <motion.button key={item.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { if (item.key === "new-post") startNewPost(); else setActiveNav(item.key); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg mx-2 transition-all ${activeNav === item.key ? "text-white bg-gradient-to-r from-blue-500/20 to-indigo-500/20" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"}`}
                    style={{ width: "calc(100% - 16px)" }}>
                    <span className={activeNav === item.key ? "text-blue-400" : "text-white/40"}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            ))}
          </nav>
        </motion.aside>
      </>)}</AnimatePresence>
      {renderReviewDrawer()}
      {renderGhostModal()}
      {renderGhostLoading()}
      {/* Mobile header */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-20 border-b border-white/[0.05] px-4 py-2.5 flex items-center gap-3 backdrop-blur-xl" style={{ background: "hsla(225, 20%, 4%, 0.8)" }}>
        <button onClick={() => setMobileSidebarOpen(true)} className="text-white/50 hover:text-white/80 transition-colors"><Menu className="w-5 h-5" /></button>
        <span className="text-white/80 text-sm font-medium tracking-tight">{NAV_ITEMS.find((n) => n.key === activeNav)?.label ?? "CMS"}</span>
      </div>
      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] flex items-center justify-around py-2 backdrop-blur-xl" style={{ background: "hsla(225, 20%, 4%, 0.9)" }}>
        {MOBILE_NAV.map((item) => (
          <button key={item.key} onClick={() => { if (item.key === "new-post") startNewPost(); else setActiveNav(item.key); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${activeNav === item.key ? "text-blue-400" : "text-white/30"}`}>
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Main content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[60px]"} pt-12 lg:pt-0`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div key={activeNav} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }}>{renderContent()}</motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default BlogCMS;
