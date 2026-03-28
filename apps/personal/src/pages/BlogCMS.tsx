import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, PlusCircle, Search, Target, Shield, BookCheck, Crown,
  ChevronRight, ChevronDown, X, Save, Eye, Trash2, Clock, BarChart3, Sparkles,
  ArrowUpDown, Filter, RefreshCw, Pen, Lock, Unlock, CheckCircle2, Circle,
  AlertTriangle, Code2, Link, Heading, ImageIcon, Type, Languages, Mic,
  Brain, GripVertical, DollarSign, Info,
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
type CmsView = "write" | "manage" | "analyze";
type SortField = "created_at" | "title" | "status" | "updated_at";
type PostLanguage = "en" | "nl";

// ── Design Tokens ──
const BG0 = "hsl(225, 20%, 4%)";
const BG1 = "hsl(225, 18%, 8%)";
const BG2 = "hsl(225, 16%, 10%)";
const BG3 = "hsl(225, 14%, 13%)";

// ── Helpers ──
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const rt = (w: number) => `${Math.ceil(w / 230)} min read`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const scoreClr = (s: number) => s >= 80 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400";
const scoreRingColor = (s: number) => s >= 80 ? "stroke-emerald-500" : s >= 50 ? "stroke-amber-500" : "stroke-red-500";
const scoreBadgeBg = (s: number) => s >= 80 ? "bg-emerald-500/15 border-emerald-500/30" : s >= 50 ? "bg-amber-500/15 border-amber-500/30" : "bg-red-500/15 border-red-500/30";
const scoreBg = (s: number) => s >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 50 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};
const STATUS_DOT: Record<string, string> = { draft: "bg-zinc-400", published: "bg-emerald-400", scheduled: "bg-blue-400" };
const CLUSTER_BORDER: Record<string, string> = {
  "marketplace-strategie": "border-blue-500/40", "conversie-optimalisatie": "border-emerald-500/40",
  "autoriteit": "border-purple-500/40", "tech-innovatie": "border-amber-500/40", "regelgeving": "border-zinc-400/40",
};
const CLUSTER_BADGE_BG: Record<string, string> = {
  "marketplace-strategie": "bg-blue-500/10 text-blue-400", "conversie-optimalisatie": "bg-emerald-500/10 text-emerald-400",
  "autoriteit": "bg-purple-500/10 text-purple-400", "tech-innovatie": "bg-amber-500/10 text-amber-400", "regelgeving": "bg-zinc-500/10 text-zinc-400",
};
const DIFFICULTY_DOT: Record<string, string> = { low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-red-400" };
const clusterBorder = (c: string) => CLUSTER_BORDER[c] ?? "border-white/10";
const clusterBadgeBg = (c: string) => CLUSTER_BADGE_BG[c] ?? "bg-white/[0.06] text-white/50";
const difficultyDot = (d: string) => DIFFICULTY_DOT[d] ?? "bg-zinc-400";
const clusterToCategory = (cluster: string): string => {
  const map: Record<string, string> = { "marketplace-strategie": "e-commerce", "conversie-optimalisatie": "conversion", "autoriteit": "authority", "tech-innovatie": "technology", "regelgeving": "regulation" };
  return map[cluster] ?? "e-commerce";
};

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

const GHOST_PHASES: { key: GhostPhase; label: string; icon: React.ReactNode }[] = [
  { key: "researching", label: "Researching context", icon: <Brain className="w-5 h-5" /> },
  { key: "drafting", label: "Writing in your voice", icon: <Pen className="w-5 h-5" /> },
  { key: "seo", label: "Optimizing SEO", icon: <Target className="w-5 h-5" /> },
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

const ScoreRing = ({ score, size = 48 }: { score: number; size?: number }) => {
  const r = (size - 6) / 2; const circ = 2 * Math.PI * r; const offset = circ - (score / 100) * circ;
  return (
    <div className="relative rounded-full flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-white/[0.06]" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className={`${scoreRingColor(score)} transition-all duration-700`} />
      </svg>
      <span className={`text-sm font-bold ${scoreClr(score)} relative z-10`}>{score}</span>
    </div>
  );
};

const Skeleton = ({ className = "" }: { className?: string }) => (<div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />);

// ── Main Component ──
const BlogCMS = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<CmsView>("write");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draftPost, setDraftPost] = useState(EMPTY_POST());
  const [isNewPost, setIsNewPost] = useState(false);
  const [editorLang, setEditorLang] = useState<PostLanguage>("en");
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [splitRatio, setSplitRatio] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [agentReviews, setAgentReviews] = useState<AgentReview[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [reviewsRunning, setReviewsRunning] = useState(false);
  const [voiceTemplates, setVoiceTemplates] = useState<VoiceTemplate[]>([]);
  const [blogMemory, setBlogMemory] = useState<BlogMemory[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [suggestions, setSuggestions] = useState<SeoSuggestion[]>([]);
  const [ghostModal, setGhostModal] = useState<SeoSuggestion | null>(null);
  const [ghostPhase, setGhostPhase] = useState<GhostPhase>("idle");
  const [ghostGaps, setGhostGaps] = useState<GhostDraft["gaps"]>([]);
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null);
  const [seoReportLoading, setSeoReportLoading] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [jsonLdExpanded, setJsonLdExpanded] = useState(false);

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

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("blog_seo_suggestions").select("*").neq("status", "dismissed").order("priority", { ascending: false });
      if (error) throw error;
      setSuggestions((data as unknown as SeoSuggestion[]) ?? []);
    } catch { /* empty */ }
  }, []);

  const dismissSuggestion = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("blog_seo_suggestions").update({ status: "dismissed" }).eq("id", id);
      if (error) throw error;
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);
  useEffect(() => { if (activeView === "analyze") { fetchVoice(); fetchMemory(); } }, [activeView, fetchVoice, fetchMemory]);

  const savePost = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        title: draftPost.title, slug: draftPost.slug, content: draftPost.content, excerpt: draftPost.excerpt,
        category: draftPost.category, tags: draftPost.tags, cover_image_url: draftPost.cover_image_url,
        published: draftPost.status === "published", scheduled_at: draftPost.scheduled_at,
        meta_title: draftPost.meta_title, meta_description: draftPost.meta_description,
        og_image: draftPost.og_image, og_title: draftPost.og_title, og_description: draftPost.og_description,
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
      if (editingPost?.id === id) { setEditingPost(null); }
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

  const openEditor = (post: BlogPost) => {
    setEditingPost(post);
    setDraftPost({ title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt,
      category: post.category, tags: post.tags ?? [], cover_image_url: post.cover_image_url,
      published: post.published, scheduled_at: post.scheduled_at, meta_title: post.meta_title,
      meta_description: post.meta_description, og_image: post.og_image, og_title: post.og_title,
      og_description: post.og_description, canonical_url: post.canonical_url,
      primary_keyword: post.primary_keyword, content_nl: post.content_nl, title_nl: post.title_nl,
      excerpt_nl: post.excerpt_nl, meta_title_nl: post.meta_title_nl,
      meta_description_nl: post.meta_description_nl, status: post.status, author_id: post.author_id });
    setIsNewPost(false); setSlugManual(true); setActiveView("write");
  };

  const startNewPost = () => { setEditingPost(null); setDraftPost(EMPTY_POST()); setIsNewPost(true); setSlugManual(false); setActiveView("write"); };

  const startPostFromSuggestion = (suggestion: SeoSuggestion) => {
    setEditingPost(null);
    setDraftPost({ ...EMPTY_POST(), title: suggestion.title, slug: suggestion.slug, primary_keyword: suggestion.primary_keyword, category: clusterToCategory(suggestion.cluster) });
    setIsNewPost(true); setSlugManual(true); setActiveView("write");
  };

  const updateDraft = (field: string, value: unknown) => {
    setDraftPost((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !slugManual) setDraftPost((prev) => ({ ...prev, slug: slugify(value as string) }));
    if ((field === "content" || field === "content_nl") && typeof value === "string" && hasGaps) updateGapStatus(value);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => { if (editingPost) savePost(); }, 3000);
    setAutoSaveTimer(timer);
  };

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

  const generateGhostDraft = useCallback(async (suggestion: SeoSuggestion) => {
    setGhostModal(null); setGhostPhase("researching"); setActiveView("write");
    setEditingPost(null); setIsNewPost(true); setSlugManual(true);
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
      setDraftPost({ ...EMPTY_POST(), title: typeof data.title === "string" ? data.title : suggestion.title,
        slug: typeof data.slug === "string" ? data.slug : suggestion.slug, content,
        excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
        meta_title: typeof data.meta_title === "string" ? data.meta_title : null,
        meta_description: typeof data.meta_description === "string" ? data.meta_description : null,
        primary_keyword: typeof data.primary_keyword === "string" ? data.primary_keyword : suggestion.primary_keyword,
        category: clusterToCategory(suggestion.cluster) });
      setGhostGaps(gaps); setGhostPhase("done");
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

  const updateGapStatus = useCallback((content: string) => {
    setGhostGaps((prev) => prev.map((g) => ({ ...g, filled: !content.includes(g.placeholder) })));
  }, []);
  const gapsFilled = ghostGaps.filter((g) => g.filled).length;
  const allGapsFilled = ghostGaps.length > 0 && gapsFilled === ghostGaps.length;
  const hasGaps = ghostGaps.length > 0;

  const filtered = posts
    .filter((p) => (statusFilter === "all" || p.status === statusFilter) && (!searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => { const av = a[sortField] ?? ""; const bv = b[sortField] ?? ""; return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
  const stats = { draft: posts.filter((p) => p.status === "draft").length, published: posts.filter((p) => p.status === "published").length, scheduled: posts.filter((p) => p.status === "scheduled" || p.scheduled_at).length, total: posts.length };
  const curTitle = editorLang === "nl" ? draftPost.title_nl ?? "" : draftPost.title;
  const curContent = editorLang === "nl" ? draftPost.content_nl ?? "" : draftPost.content;
  const curExcerpt = editorLang === "nl" ? draftPost.excerpt_nl ?? "" : draftPost.excerpt;
  const curMetaTitle = editorLang === "nl" ? draftPost.meta_title_nl ?? "" : draftPost.meta_title ?? "";
  const curMetaDesc = editorLang === "nl" ? draftPost.meta_description_nl ?? "" : draftPost.meta_description ?? "";
  const words = wc(curContent);
  const hasEditorContent = editingPost !== null || isNewPost;
  const localChecks = computeSeoChecks(curTitle, curMetaDesc, draftPost.primary_keyword ?? "", curContent, words);
  const localPassed = localChecks.filter((c) => c.passed).length;
  const localScore = localChecks.length > 0 ? Math.round((localPassed / localChecks.length) * 100) : 0;
  const seoScore = seoReport?.score ?? localScore;

  const handleSplitDrag = useCallback((e: MouseEvent) => {
    if (!splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitRatio(Math.max(30, Math.min(80, pct)));
  }, []);
  const stopDrag = useCallback(() => { setIsDragging(false); document.removeEventListener("mousemove", handleSplitDrag); document.removeEventListener("mouseup", stopDrag); }, [handleSplitDrag]);
  const startDrag = useCallback(() => { setIsDragging(true); document.addEventListener("mousemove", handleSplitDrag); document.addEventListener("mouseup", stopDrag); }, [handleSplitDrag, stopDrag]);

  if (authLoading) return (<div className="pt-20 min-h-screen flex items-center justify-center" style={{ background: BG0 }}><div className="space-y-4 w-64"><Skeleton className="h-8 w-48 mx-auto" /><Skeleton className="h-4 w-32 mx-auto" /></div></div>);
  if (!user) return (<div className="pt-20 min-h-screen flex items-center justify-center" style={{ background: BG0 }}><div className="text-center space-y-3"><div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto"><Pen className="w-5 h-5 text-white/30" /></div><div className="text-white/60 text-lg font-medium">Please sign in to access the CMS.</div></div></div>);

  const renderPreview = () => {
    const rendered = curContent
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white/90 mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white/90 mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90 font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-white/70 italic">$1</em>')
      .replace(/\[HANS:\s*([^\]]+)\]/g, '<span class="inline-block px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm my-2">$1 — needs your input</span>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl max-w-full my-4" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 underline underline-offset-2">$1</a>')
      .replace(/^(?!<[h123a]|<img|<strong|<em|<span|<ul|<li)(.+)$/gm, '<p class="text-white/70 leading-relaxed mb-3">$1</p>')
      .replace(/\n{2,}/g, "");
    return (
      <div className="p-8 overflow-y-auto h-full" style={{ background: BG1 }}>
        <div className="max-w-[680px] mx-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{curTitle || "Untitled"}</h1>
          <div className="flex items-center gap-3 text-white/35 text-sm mb-8">
            <span>Hans van Leeuwen</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>{rt(words)}</span><span className="w-1 h-1 rounded-full bg-white/20" /><span>{fmtDate(new Date().toISOString())}</span>
          </div>
          <div className="prose-dark" dangerouslySetInnerHTML={{ __html: rendered }} />
          {draftPost.tags?.length > 0 && (<div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/[0.06]">{draftPost.tags.map((t) => <Badge key={t} className="bg-white/[0.06] text-white/50 rounded-full">{t}</Badge>)}</div>)}
          <div className="mt-12 pt-6 border-t border-white/[0.06] text-white/25 text-sm italic">— Hans van Leeuwen, Amersfoort</div>
        </div>
      </div>
    );
  };

  const seoIcon = (label: string) => {
    if (label.includes("Title length")) return <Type className="w-3.5 h-3.5" />;
    if (label.includes("Meta")) return <FileText className="w-3.5 h-3.5" />;
    if (label.includes("keyword in title")) return <Target className="w-3.5 h-3.5" />;
    if (label.includes("first paragraph")) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (label.includes("density")) return <BarChart3 className="w-3.5 h-3.5" />;
    if (label.includes("internal link")) return <Link className="w-3.5 h-3.5" />;
    if (label.includes("Heading")) return <Heading className="w-3.5 h-3.5" />;
    if (label.includes("Image")) return <ImageIcon className="w-3.5 h-3.5" />;
    if (label.includes("Word count")) return <FileText className="w-3.5 h-3.5" />;
    if (label.includes("Reading")) return <Clock className="w-3.5 h-3.5" />;
    return <Target className="w-3.5 h-3.5" />;
  };

  // ── WRITE VIEW ──
  const renderWrite = () => {
    if (!hasEditorContent) return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg w-full space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20">
            <span className="text-white text-2xl font-bold tracking-tight">HVL</span>
          </div>
          <div><h1 className="text-2xl font-semibold tracking-tight text-white/90">Waar wil je over schrijven?</h1><p className="text-white/35 text-sm mt-2">Kies een onderwerp of begin met een leeg canvas</p></div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input type="text" placeholder="Type een onderwerp of keyword..." className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/90 text-lg placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/10 transition-all" onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLInputElement).value) { setDraftPost({ ...EMPTY_POST(), title: (e.target as HTMLInputElement).value }); setIsNewPost(true); } }} />
          </div>
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2"><Sparkles className="w-3 h-3 text-blue-400/60" /><span className="text-white/20 text-[10px] uppercase tracking-[0.15em] font-semibold">SEO Content Ideas</span></div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 8).map((s, i) => (
                  <motion.button key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setGhostModal(s)} className={`group flex items-center gap-2 px-4 py-2 rounded-full border ${clusterBorder(s.cluster)} bg-white/[0.03] hover:bg-white/[0.06] transition-all text-sm text-white/60 hover:text-white/90`}>
                    {s.intent === "commercial" ? <DollarSign className="w-3 h-3 text-emerald-400/70" /> : <Info className="w-3 h-3 text-blue-400/70" />}
                    <span className="whitespace-nowrap">{s.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${clusterBadgeBg(s.cluster)}`}>{s.cluster}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot(s.difficulty)}`} />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={startNewPost} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/20 px-8"><PlusCircle className="w-4 h-4 mr-2" /> Start met leeg canvas</Button>
        </motion.div>
      </div>
    );

    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditingPost(null); setIsNewPost(false); }} className="text-white/40 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"><X className="w-5 h-5" /></motion.button>
            <h2 className="text-lg font-semibold tracking-tight text-white/90">{isNewPost ? "Nieuw artikel" : "Bewerken"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={editorLang} onValueChange={(v) => setEditorLang(v as PostLanguage)}>
              <TabsList className="bg-white/[0.04] border border-white/[0.05] rounded-lg h-8">
                <TabsTrigger value="en" className="text-xs rounded-md px-3 data-[state=active]:bg-white/[0.1] data-[state=active]:text-white">EN</TabsTrigger>
                <TabsTrigger value="nl" className="text-xs rounded-md px-3 data-[state=active]:bg-white/[0.1] data-[state=active]:text-white">NL</TabsTrigger>
              </TabsList>
            </Tabs>
            {draftPost.primary_keyword && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full text-xs">{draftPost.primary_keyword}</Badge>}
          </div>
        </div>
        <div ref={splitRef} className="flex rounded-2xl border border-white/[0.05] overflow-hidden relative" style={{ background: BG1, height: "calc(100vh - 260px)", minHeight: 500, userSelect: isDragging ? "none" : "auto" }}>
          <div className="flex flex-col overflow-hidden" style={{ width: `${splitRatio}%` }}>
            <div className="p-6 pb-0 space-y-3 flex-shrink-0">
              <input type="text" placeholder="Waar wil je over schrijven?" value={curTitle} onChange={(e) => updateDraft(editorLang === "nl" ? "title_nl" : "title", e.target.value)} className="w-full text-3xl font-bold tracking-tight bg-transparent border-none outline-none text-white/90 placeholder:text-white/15" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/20 text-[10px] uppercase tracking-widest">slug</span>
                <input type="text" value={draftPost.slug} onChange={(e) => { setSlugManual(true); updateDraft("slug", e.target.value); }} className="flex-1 bg-transparent border-b border-white/[0.05] text-white/40 text-xs outline-none focus:border-blue-500/30 py-1 transition-colors font-mono" />
                <button onClick={() => { setSlugManual(false); updateDraft("slug", slugify(draftPost.title)); }} className="text-white/20 hover:text-white/50 transition-colors"><RefreshCw className="w-3 h-3" /></button>
              </div>
            </div>
            {hasGaps && (<div className="px-6 pt-3 flex-shrink-0"><div className="flex items-center gap-2 flex-wrap">
              {ghostGaps.map((g) => (
                <motion.div key={g.id} animate={g.filled ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all duration-300 ${g.filled ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                  {g.filled ? <Unlock className="w-3 h-3 text-emerald-400" /> : <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}><Lock className="w-3 h-3 text-amber-400" /></motion.div>}
                  <span className={g.filled ? "text-emerald-400" : "text-amber-400"}>{g.label}</span>
                </motion.div>
              ))}
            </div></div>)}
            <div className="flex-1 p-6 overflow-hidden">
              <textarea ref={contentRef} placeholder="Begin met schrijven in markdown..." value={curContent}
                onChange={(e) => updateDraft(editorLang === "nl" ? "content_nl" : "content", e.target.value)}
                className="w-full h-full rounded-xl border border-white/[0.04] p-5 text-white/85 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/[0.08] font-mono resize-none transition-all"
                style={{ background: "hsl(225, 22%, 5%)", lineHeight: "1.8" }} />
            </div>
          </div>
          <div className="hidden lg:flex w-0 relative z-10 items-center justify-center cursor-col-resize group" onMouseDown={startDrag}>
            <div className={`absolute inset-y-0 w-[3px] transition-colors ${isDragging ? "bg-blue-500/60" : "bg-white/[0.05] group-hover:bg-blue-500/30"}`} />
            <div className={`relative z-10 w-5 h-10 rounded-full border flex items-center justify-center transition-all ${isDragging ? "bg-blue-500/20 border-blue-500/40" : "bg-white/[0.04] border-white/[0.06] group-hover:border-blue-500/30"}`}><GripVertical className="w-3 h-3 text-white/30" /></div>
          </div>
          <div className="hidden lg:block overflow-y-auto border-l border-white/[0.05]" style={{ width: `${100 - splitRatio}%` }}>{renderPreview()}</div>
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-3 flex items-center justify-between px-5 py-3 rounded-xl border transition-all duration-300 ${allGapsFilled ? "border-emerald-500/20" : "border-white/[0.05]"}`}
          style={{ background: allGapsFilled ? "rgba(16, 185, 129, 0.03)" : BG2 }}>
          <div className="flex items-center gap-4">
            {hasGaps && (<div className="flex items-center gap-2">
              {ghostGaps.map((g) => (<div key={g.id} title={g.label}>{g.filled ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-white/20" />}</div>))}
              <span className="text-xs text-white/30 ml-1">{allGapsFilled ? <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-emerald-400 font-medium">Ready to publish</motion.span> : `${gapsFilled} of ${ghostGaps.length} gates`}</span>
            </div>)}
            <div className="flex items-center gap-3 text-xs text-white/25">
              <span className="tabular-nums">{words} words</span><span className="w-px h-3 bg-white/[0.06]" /><span>{rt(words)}</span><span className="w-px h-3 bg-white/[0.06]" />
              <span className="flex items-center gap-1"><Languages className="w-3 h-3" /> {editorLang.toUpperCase()}</span>
              {lastSaved && <><span className="w-px h-3 bg-white/[0.06]" /><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(lastSaved).toLocaleTimeString()}</span></>}
              {saving && <span className="text-blue-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Saving</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/80 hover:bg-white/[0.04] text-xs" onClick={() => setReviewDrawerOpen(true)} disabled={hasGaps && !allGapsFilled}>
              <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-400" /> AI Review
            </Button>
            {hasGaps && !allGapsFilled ? (
              <Button disabled size="sm" className="bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed text-xs"><Lock className="w-3.5 h-3.5 mr-1" /> Publish Locked</Button>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={savePost} disabled={saving} size="sm" className={`border-0 shadow-lg text-xs ${draftPost.status === "published" ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/10" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/10"} text-white`}>
                  {draftPost.status === "published" ? <><Eye className="w-3.5 h-3.5 mr-1" /> Publish</> : <><Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving..." : "Save Draft"}</>}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.05] p-4" style={{ background: BG2 }}>
            <label className="text-white/25 text-[10px] uppercase tracking-widest mb-2 block font-medium">Excerpt</label>
            <textarea placeholder="Korte samenvatting..." value={curExcerpt} onChange={(e) => updateDraft(editorLang === "nl" ? "excerpt_nl" : "excerpt", e.target.value)} rows={3} className="w-full rounded-lg border border-white/[0.04] p-3 text-white/70 text-sm placeholder:text-white/15 focus:outline-none focus:border-white/[0.08] resize-none leading-relaxed transition-all bg-transparent" />
          </div>
          <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: BG2 }}>
            <button onClick={() => setSeoExpanded(!seoExpanded)} className="w-full flex items-center justify-between px-4 py-3 text-white/40 text-sm hover:bg-white/[0.02] transition-colors">
              <span className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> <span className="font-medium text-white/60">Post Settings & SEO</span></span>
              <div className="flex items-center gap-2"><Badge className="bg-white/[0.06] text-white/40 rounded-full text-[10px]">{draftPost.status}</Badge><motion.span animate={{ rotate: seoExpanded ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.span></div>
            </button>
            <AnimatePresence>{seoExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Status</label><select value={draftPost.status} onChange={(e) => updateDraft("status", e.target.value)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select></div>
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Category</label><input type="text" value={draftPost.category} onChange={(e) => updateDraft("category", e.target.value)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                  </div>
                  {draftPost.status === "scheduled" && (<div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Schedule</label><input type="datetime-local" value={draftPost.scheduled_at ?? ""} onChange={(e) => updateDraft("scheduled_at", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>)}
                  <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Tags</label><input type="text" value={draftPost.tags?.join(", ") ?? ""} onChange={(e) => updateDraft("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} placeholder="seo, marketing" className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors placeholder:text-white/20" /></div>
                  <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Cover Image</label><input type="text" value={draftPost.cover_image_url ?? ""} onChange={(e) => updateDraft("cover_image_url", e.target.value || null)} placeholder="https://..." className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors placeholder:text-white/20" /></div>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Primary Keyword</label><input type="text" value={draftPost.primary_keyword ?? ""} onChange={(e) => updateDraft("primary_keyword", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Canonical URL</label><input type="text" value={draftPost.canonical_url ?? ""} onChange={(e) => updateDraft("canonical_url", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                  </div>
                  <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Meta Title</label><input type="text" value={curMetaTitle} onChange={(e) => updateDraft(editorLang === "nl" ? "meta_title_nl" : "meta_title", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                  <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">Meta Description</label><textarea value={curMetaDesc} onChange={(e) => updateDraft(editorLang === "nl" ? "meta_description_nl" : "meta_description", e.target.value || null)} rows={2} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none resize-none transition-colors" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">OG Title</label><input type="text" value={draftPost.og_title ?? ""} onChange={(e) => updateDraft("og_title", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                    <div><label className="text-white/25 text-[10px] uppercase tracking-widest mb-1 block">OG Description</label><input type="text" value={draftPost.og_description ?? ""} onChange={(e) => updateDraft("og_description", e.target.value || null)} className="w-full rounded-lg border border-white/[0.05] bg-white/[0.04] text-white/80 text-sm px-3 py-2 focus:outline-none transition-colors" /></div>
                  </div>
                  <div className="rounded-lg p-3 bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-white/20 mb-2 uppercase tracking-widest">Google Preview</div>
                    <div className="text-blue-400 text-sm truncate font-medium">{curMetaTitle || curTitle || "Page title"}</div>
                    <div className="text-emerald-500 text-xs truncate">hansvanleeuwen.com/{draftPost.slug || "post-slug"}</div>
                    <div className="text-white/40 text-xs line-clamp-2 mt-1">{curMetaDesc || curExcerpt || "Description..."}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={savePost} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10" size="sm"><Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving..." : "Save"}</Button>
                    {editingPost && <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deletePost(editingPost.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                </div>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  // ── MANAGE VIEW ──
  const renderManage = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight text-white/90">Welkom terug, Hans</h1><p className="text-white/30 text-sm mt-0.5">{stats.total} articles &middot; {stats.published} published &middot; {stats.draft} drafts</p></div>
        <Button onClick={startNewPost} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10"><PlusCircle className="w-4 h-4 mr-2" /> New Post</Button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-xl border border-white/[0.05] p-0.5" style={{ background: BG2 }}>
          {(["all", "draft", "published", "scheduled"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 text-xs rounded-lg transition-all capitalize ${statusFilter === s ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/60"}`}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.05] bg-white/[0.04] text-white/90 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/[0.12] transition-all" />
        </div>
        <button className="flex items-center gap-1 text-white/30 text-xs hover:text-white/60 transition-colors" onClick={() => { setSortField("updated_at"); setSortDir(sortDir === "desc" ? "asc" : "desc"); }}><Filter className="w-3.5 h-3.5" /> Sort</button>
      </div>
      {selectedPosts.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-blue-400 text-sm font-medium">{selectedPosts.size} selected</span>
          <Button size="sm" variant="ghost" className="text-emerald-400 text-xs hover:bg-emerald-500/10" onClick={() => bulkAction("publish")}>Publish</Button>
          <Button size="sm" variant="ghost" className="text-zinc-400 text-xs hover:bg-zinc-500/10" onClick={() => bulkAction("unpublish")}>Unpublish</Button>
          <Button size="sm" variant="ghost" className="text-red-400 text-xs hover:bg-red-500/10" onClick={() => bulkAction("delete")}>Delete</Button>
          <Button size="sm" variant="ghost" className="text-white/40 text-xs ml-auto" onClick={() => setSelectedPosts(new Set())}>Clear</Button>
        </motion.div>
      )}
      {loadingPosts ? (<div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>) : (
        <div className="rounded-xl border border-white/[0.05] overflow-hidden" style={{ background: BG2 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left w-8"><input type="checkbox" checked={selectedPosts.size === filtered.length && filtered.length > 0} onChange={(e) => setSelectedPosts(e.target.checked ? new Set(filtered.map((p) => p.id)) : new Set())} className="accent-blue-500 rounded" /></th>
              <th className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-widest"><button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => { setSortField("title"); setSortDir(sortField === "title" && sortDir === "asc" ? "desc" : "asc"); }}>Title <ArrowUpDown className="w-3 h-3" /></button></th>
              <th className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-widest hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-widest hidden lg:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-widest hidden lg:table-cell">Words</th>
              <th className="px-4 py-3 text-left text-white/30 font-medium text-xs uppercase tracking-widest"><button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => { setSortField("updated_at"); setSortDir(sortField === "updated_at" && sortDir === "desc" ? "asc" : "desc"); }}>Date <ArrowUpDown className="w-3 h-3" /></button></th>
              <th className="px-4 py-3 w-10"></th>
            </tr></thead>
            <tbody>{filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all cursor-pointer group" onClick={() => openEditor(p)}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedPosts.has(p.id)} onChange={(e) => { const n = new Set(selectedPosts); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSelectedPosts(n); }} className="accent-blue-500 rounded" /></td>
                <td className="px-4 py-3 text-white/90 font-medium">{p.title || "Untitled"}</td>
                <td className="px-4 py-3 hidden md:table-cell"><Badge className={`${STATUS_COLORS[p.status] ?? STATUS_COLORS.draft} rounded-full px-2.5 flex items-center gap-1.5 w-fit`}><span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] ?? "bg-zinc-400"}`} />{p.status}</Badge></td>
                <td className="px-4 py-3 text-white/35 hidden lg:table-cell">{p.category}</td>
                <td className="px-4 py-3 text-white/30 tabular-nums hidden lg:table-cell">{wc(p.content)}</td>
                <td className="px-4 py-3 text-white/30">{fmtDate(p.updated_at)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><button onClick={() => deletePost(p.id)} className="text-white/10 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && (<div className="flex flex-col items-center justify-center py-16"><Search className="w-7 h-7 text-white/10 mb-3" /><div className="text-white/25 text-sm">No posts found.</div></div>)}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-white/20 text-[10px] uppercase tracking-widest font-medium">Next topics to write</span>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {suggestions.slice(0, 6).map((s) => (
              <button key={s.id} onClick={() => setGhostModal(s)} className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border ${clusterBorder(s.cluster)} bg-white/[0.02] hover:bg-white/[0.05] transition-all text-xs text-white/50 hover:text-white/80 whitespace-nowrap flex-shrink-0`}>
                <Sparkles className="w-3 h-3 text-blue-400/50" />{s.title}
                <button onClick={(e) => { e.stopPropagation(); dismissSuggestion(s.id); }} className="text-white/0 group-hover:text-white/30 hover:!text-white/60 transition-all"><X className="w-3 h-3" /></button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── ANALYZE VIEW ──
  const renderAnalyze = () => {
    const checks = seoReport?.checks ?? localChecks;
    const score = seoReport?.score ?? localScore;
    const weakPosts = posts.filter((p) => p.status === "published").sort((a, b) => wc(a.content) - wc(b.content)).slice(0, 5);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Analyze</h1>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/[0.05] p-5" style={{ background: BG2 }}>
            <h3 className="text-white/80 font-medium mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> SEO Overview</h3>
            {hasEditorContent ? (<div className="space-y-4">
              <div className="flex justify-center"><ScoreRing score={score} size={72} /></div>
              <div className="space-y-1">{checks.map((c, i) => (<div key={i} className="flex items-center gap-2 text-xs py-0.5"><span className={c.passed ? "text-emerald-400" : "text-red-400"}>{c.passed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}</span><span className="text-white/25">{seoIcon(c.label)}</span><span className={c.passed ? "text-white/50" : "text-white/35"}>{c.label}</span><span className="ml-auto text-white/20 text-[10px]">{c.detail}</span></div>))}</div>
              <Button onClick={generateSeoReport} disabled={seoReportLoading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0" size="sm">{seoReportLoading ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing</> : <><Target className="w-3 h-3 mr-1" /> Full SEO Report</>}</Button>
              {seoReport?.jsonLd && (<div className="rounded-lg border border-white/[0.05] overflow-hidden" style={{ background: BG3 }}>
                <button onClick={() => setJsonLdExpanded(!jsonLdExpanded)} className="w-full flex items-center justify-between px-3 py-2 text-white/30 text-xs hover:bg-white/[0.02]"><span className="flex items-center gap-1.5"><Code2 className="w-3 h-3" /> JSON-LD</span><motion.span animate={{ rotate: jsonLdExpanded ? 180 : 0 }}><ChevronDown className="w-3 h-3" /></motion.span></button>
                <AnimatePresence>{jsonLdExpanded && (<motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><pre className="px-3 pb-3 text-[10px] text-white/30 font-mono overflow-x-auto leading-relaxed">{seoReport.jsonLd}</pre></motion.div>)}</AnimatePresence>
              </div>)}
            </div>) : (<div className="space-y-3"><p className="text-white/30 text-sm">Open a post to see detailed SEO analysis.</p><div className="text-white/20 text-xs">Weakest posts by word count:</div>
              {weakPosts.map((p) => (<button key={p.id} onClick={() => openEditor(p)} className="w-full text-left flex items-center justify-between py-1.5 text-xs hover:bg-white/[0.02] rounded-lg px-2 transition-colors"><span className="text-white/50 truncate">{p.title}</span><span className="text-white/20 tabular-nums flex-shrink-0 ml-2">{wc(p.content)}w</span></button>))}
            </div>)}
          </div>
          <div className="rounded-xl border border-white/[0.05] p-5" style={{ background: BG2 }}>
            <h3 className="text-white/80 font-medium mb-4 flex items-center gap-2"><Mic className="w-4 h-4 text-purple-400" /> Voice Templates</h3>
            {loadingVoice ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : voiceTemplates.length === 0 ? (<div className="text-white/30 text-sm py-8 text-center">No voice templates found.</div>) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {voiceTemplates.map((v) => (<div key={v.id} className="rounded-lg border border-white/[0.05] p-3 hover:border-white/[0.08] transition-all" style={{ background: BG3 }}>
                  <div className="flex items-center justify-between mb-2"><span className="text-white/80 font-medium text-sm">{v.name}</span><Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full text-[10px]">{v.category}</Badge></div>
                  <div className="space-y-1 text-xs"><div className="text-white/35">Tone: <span className="text-white/60">{v.tone}</span></div><div className="text-white/35">Audience: <span className="text-white/60">{v.target_audience}</span></div></div>
                  {v.banned_words?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{v.banned_words.slice(0, 5).map((w) => <Badge key={w} className="bg-red-500/10 text-red-400 text-[10px] rounded-full">{w}</Badge>)}{v.banned_words.length > 5 && <Badge className="bg-white/[0.04] text-white/30 text-[10px] rounded-full">+{v.banned_words.length - 5}</Badge>}</div>}
                  {v.content_rules && <div className="mt-2 text-white/30 text-[11px] line-clamp-2 leading-relaxed">{v.content_rules}</div>}
                </div>))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/[0.05] p-5" style={{ background: BG2 }}>
            <h3 className="text-white/80 font-medium mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-amber-400" /> Editorial Memory</h3>
            {blogMemory.length === 0 ? (<div className="text-white/30 text-sm py-8 text-center">No editorial memory entries.</div>) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {blogMemory.map((m) => (<div key={m.content_category} className="rounded-lg border border-white/[0.05] p-3 hover:border-white/[0.08] transition-all" style={{ background: BG3 }}>
                  <div className="flex items-center justify-between mb-2"><span className="text-white/80 font-medium text-sm capitalize">{m.content_category}</span><span className="text-white/20 text-[10px]">{fmtDate(m.updated_at)}</span></div>
                  {m.brand_voice_context && <div className="mb-2"><div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">Brand Voice</div><div className="text-white/40 text-xs whitespace-pre-wrap leading-relaxed line-clamp-3">{m.brand_voice_context}</div></div>}
                  {m.narrative_history && <div><div className="text-white/20 text-[10px] uppercase tracking-widest mb-1">History</div><div className="text-white/30 text-xs whitespace-pre-wrap line-clamp-3 leading-relaxed">{m.narrative_history}</div></div>}
                </div>))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Review Drawer ──
  const renderReviewDrawer = () => (
    <AnimatePresence>{reviewDrawerOpen && (<>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setReviewDrawerOpen(false)} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed top-16 right-0 z-50 w-full max-w-md h-[calc(100vh-64px)] border-l border-white/[0.06] overflow-y-auto" style={{ background: BG1 }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold tracking-tight text-white/90 flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-400" /> AI Review Panel</h2><button onClick={() => setReviewDrawerOpen(false)} className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/[0.04] transition-all"><X className="w-5 h-5" /></button></div>
          <Button onClick={runAllReviews} className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10 mb-6 ${reviewsRunning ? "animate-pulse" : ""}`}><RefreshCw className={`w-4 h-4 mr-2 ${reviewsRunning ? "animate-spin" : ""}`} /> Run All Reviews</Button>
          {agentReviews.length > 0 && agentReviews.every((r) => r.score !== null && !r.loading) && (() => {
            const avg = Math.round(agentReviews.reduce((s, r) => s + (r.score ?? 0), 0) / agentReviews.length);
            return (<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center mb-6">
              <div className={`px-6 py-3 rounded-2xl border ${scoreBadgeBg(avg)} flex items-center gap-3`}>
                <ScoreRing score={avg} size={56} />
                <div><div className={`text-lg font-bold ${scoreClr(avg)}`}>Overall: {avg}/100</div><div className="text-white/30 text-xs">{avg >= 80 ? "Excellent quality" : avg >= 50 ? "Needs improvement" : "Major revisions needed"}</div></div>
                {avg >= 80 && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 2, duration: 0.3 }}><CheckCircle2 className="w-6 h-6 text-emerald-400" /></motion.div>}
              </div>
            </motion.div>);
          })()}
          <div className="space-y-3">
            {(agentReviews.length > 0 ? agentReviews : AGENTS.map((a) => ({ agent_id: a.id, agent_name: a.name, icon: a.icon, score: null, verdict: "", feedback: "", suggestions: [], loading: false }))).map((r) => (
              <motion.div key={r.agent_id} layout transition={{ duration: 0.2 }} className={`rounded-xl border ${r.score !== null ? scoreBg(r.score) : "border-white/[0.05]"} overflow-hidden`} style={r.score === null ? { background: BG2 } : undefined}>
                <button onClick={() => setExpandedAgent(expandedAgent === r.agent_id ? null : r.agent_id)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04]"><span className="text-white/50">{AGENT_ICONS[r.icon]}</span></div>
                  <div className="flex-1 min-w-0"><div className="text-white/90 font-medium text-sm">{r.agent_name}</div>{r.loading && <div className="text-white/30 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...</div>}{!r.loading && r.verdict && <div className="text-white/40 text-xs truncate">{r.verdict}</div>}</div>
                  {r.score !== null && <ScoreRing score={r.score} />}
                  <motion.span animate={{ rotate: expandedAgent === r.agent_id ? 90 : 0 }}><ChevronRight className="w-4 h-4 text-white/20" /></motion.span>
                </button>
                <AnimatePresence>{expandedAgent === r.agent_id && r.feedback && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="px-4 pb-4 border-t border-white/[0.05] pt-3"><p className="text-white/55 text-sm whitespace-pre-wrap leading-relaxed">{r.feedback}</p>{r.suggestions.length > 0 && <div className="mt-3"><div className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Suggestions</div><ul className="space-y-1.5">{r.suggestions.map((s, i) => <li key={i} className="text-white/45 text-sm flex items-start gap-2 leading-relaxed"><span className="text-blue-400 mt-0.5 shrink-0">-</span> {s}</li>)}</ul></div>}</div></motion.div>)}</AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>)}</AnimatePresence>
  );

  const renderGhostModal = () => (
    <AnimatePresence>{ghostModal && (<>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setGhostModal(null)} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] p-6 space-y-5" style={{ background: BG1 }}>
          <div className="flex items-center justify-between"><h3 className="text-white/90 font-semibold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-400" /> Ghost Writer</h3><button onClick={() => setGhostModal(null)} className="text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button></div>
          <div className="rounded-xl border border-white/[0.06] p-4 space-y-2" style={{ background: BG2 }}><div className="text-white/90 font-medium">{ghostModal.title}</div><div className="flex flex-wrap gap-2 text-xs"><Badge className={`${clusterBadgeBg(ghostModal.cluster)} rounded-full`}>{ghostModal.cluster}</Badge><Badge className="bg-white/[0.06] text-white/50 rounded-full">{ghostModal.primary_keyword}</Badge></div></div>
          <div className="space-y-1.5 text-sm text-white/50">
            <div className="flex items-center gap-2"><Pen className="w-3.5 h-3.5 text-blue-400" /> Hans&apos;s voice &bull; 1200-1500 words &bull; 3 human gaps</div>
            <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-amber-400" /> AI content requires human gate approval</div>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-white/30" /> ~30 seconds</div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => { startPostFromSuggestion(ghostModal); setGhostModal(null); }} variant="ghost" className="flex-1 text-white/50 hover:text-white/80 hover:bg-white/[0.04]">Write manually</Button>
            <Button onClick={() => generateGhostDraft(ghostModal)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/10"><Sparkles className="w-4 h-4 mr-1" /> Generate</Button>
          </div>
        </div>
      </motion.div>
    </>)}</AnimatePresence>
  );

  const renderGhostLoading = () => (
    <AnimatePresence>{ghostPhase !== "idle" && ghostPhase !== "done" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(225, 25%, 4%) 0%, hsl(240, 20%, 8%) 100%)" }}>
        <div className="text-center space-y-8 max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto border border-blue-500/20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}><Sparkles className="w-8 h-8 text-blue-400" /></motion.div></div>
          <div className="space-y-6">
            {GHOST_PHASES.map((p, i) => {
              const phaseIdx = GHOST_PHASES.findIndex((ph) => ph.key === ghostPhase);
              const isActive = i === phaseIdx; const isDone = i < phaseIdx;
              return (<div key={p.key} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${isDone ? "bg-emerald-500/20 border-emerald-500/30" : isActive ? "bg-blue-500/20 border-blue-500/30" : "bg-white/[0.04] border-white/[0.06]"}`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : isActive ? <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}><span className="text-blue-400">{p.icon}</span></motion.div> : <span className="text-white/20">{p.icon}</span>}
                </div>
                <span className={`text-sm font-medium transition-colors duration-500 ${isDone ? "text-emerald-400" : isActive ? "text-white/90" : "text-white/20"}`}>{p.label}</span>
                {i < GHOST_PHASES.length - 1 && <div className={`flex-1 h-px transition-colors duration-500 ${isDone ? "bg-emerald-500/30" : "bg-white/[0.05]"}`} />}
              </div>);
            })}
          </div>
          <p className="text-white/20 text-xs">Estimated: ~30 seconds</p>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );

  const NAV_TABS: { key: CmsView; label: string; icon: React.ReactNode }[] = [
    { key: "write", label: "Write", icon: <Pen className="w-4 h-4" /> },
    { key: "manage", label: "Manage", icon: <FileText className="w-4 h-4" /> },
    { key: "analyze", label: "Analyze", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="pt-20 min-h-screen pb-20 lg:pb-0" style={{ background: BG0 }}>
      <div className="hidden lg:block fixed top-16 left-0 right-0 z-30 border-b border-white/[0.06]" style={{ background: "hsla(225, 20%, 4%, 0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 mr-4"><div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Pen className="w-3 h-3 text-white" /></div><span className="text-white/70 font-semibold text-sm tracking-wide">HVL Editorial</span></div>
            {NAV_TABS.map((tab) => (<button key={tab.key} onClick={() => setActiveView(tab.key)} className={`relative flex items-center gap-2 text-sm font-medium py-3.5 transition-colors ${activeView === tab.key ? "text-white" : "text-white/35 hover:text-white/60"}`}>{tab.icon} {tab.label}{activeView === tab.key && <motion.div layoutId="navIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />}</button>))}
          </div>
          {hasEditorContent && words > 0 && (<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setActiveView("analyze")} className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${scoreBadgeBg(seoScore)}`}><span className={scoreClr(seoScore)}>{seoScore}</span></motion.button>)}
        </div>
      </div>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] flex items-center justify-around py-2.5 backdrop-blur-xl" style={{ background: "hsla(225, 20%, 4%, 0.92)" }}>
        {NAV_TABS.map((tab) => (<button key={tab.key} onClick={() => setActiveView(tab.key)} className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${activeView === tab.key ? "text-blue-400" : "text-white/30"}`}>{tab.icon}<span className="text-[10px] font-medium">{tab.label}</span></button>))}
      </nav>
      {renderReviewDrawer()}
      {renderGhostModal()}
      {renderGhostLoading()}
      <main className="pt-12 lg:pt-14">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {activeView === "write" && renderWrite()}
              {activeView === "manage" && renderManage()}
              {activeView === "analyze" && renderAnalyze()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default BlogCMS;
