'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  Bot,
  Languages,
  FileText,
  Target,
  Shield,
  BookCheck,
  Crown,
  Loader2,
  ChevronDown,
  Zap,
  Copy,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Tag,
  BarChart3,
  PenTool,
  Code,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  Link2,
  Globe,
  Settings,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  BlogPostRow,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/lib/api/content";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════════
   BlogCMS — Professional Editorial Dashboard with AI Review Pipeline
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Agent definitions ──────────────────────────────────────────────────────
interface AgentDef {
  id: string;
  name: string;
  nameNl: string;
  role: string;
  icon: typeof Bot;
  color: string;
  bgColor: string;
  systemPrompt: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "language",
    name: "Language Agent",
    nameNl: "Taalagent",
    role: "Dutch fluency, grammar, clarity",
    icon: Languages,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    systemPrompt: `You are a Dutch-native language expert. Review the blog post for:
- Grammar and spelling (Dutch or English as appropriate)
- Sentence flow and readability
- Vocabulary precision — replace vague words with specific ones
- Natural Dutch phrasing (no translated-English awkwardness)
Return a JSON object: { "score": 0-100, "issues": [{ "type": "grammar"|"clarity"|"fluency", "text": "...", "suggestion": "...", "line": "..." }], "summary": "..." }`,
  },
  {
    id: "structure",
    name: "Structure Agent",
    nameNl: "Structuuragent",
    role: "Headings, flow, logic",
    icon: FileText,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    systemPrompt: `You are a content structure analyst. Review the blog post for:
- H2/H3 heading hierarchy and logical progression
- Paragraph length and rhythm (mix short and long)
- Introduction hook strength
- Conclusion with clear takeaway or CTA
- Section transitions
Return a JSON object: { "score": 0-100, "issues": [{ "type": "heading"|"flow"|"length"|"hook"|"conclusion", "text": "...", "suggestion": "..." }], "summary": "..." }`,
  },
  {
    id: "seo",
    name: "SEO Agent",
    nameNl: "SEO-agent",
    role: "Keywords, meta, search intent",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    systemPrompt: `You are an SEO specialist for Dutch and international e-commerce. Analyze:
- Primary keyword density and placement (title, H1, first paragraph, meta)
- Secondary keyword opportunities
- Meta title (50-60 chars) and meta description (150-160 chars) quality
- Internal linking opportunities
- Schema.org readiness
- Search intent alignment
Return a JSON object: { "score": 0-100, "issues": [{ "type": "keyword"|"meta"|"linking"|"intent", "text": "...", "suggestion": "..." }], "keyword_analysis": { "primary": "...", "density": 0.0, "recommended_density": "1.5-2.5%", "missing_placements": [] }, "summary": "..." }`,
  },
  {
    id: "ai-detection",
    name: "AI Detection Agent",
    nameNl: "AI-detectieagent",
    role: "Humanize, reduce AI patterns",
    icon: Shield,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    systemPrompt: `You are an AI-content detection specialist. Analyze the text for patterns that AI detectors flag:
- Repetitive sentence openings ("Furthermore," "Moreover," "In conclusion,")
- Uniform paragraph length
- Overly formal or generic phrasing
- Lack of personal anecdotes, specific numbers, or named examples
- Perfect grammar without conversational imperfections
- Predictable structure
Score how likely this text would be flagged as AI-written.
Return a JSON object: { "score": 0-100 (100 = fully human-passing), "ai_probability": 0-100, "patterns_found": [{ "pattern": "...", "example": "...", "fix": "..." }], "summary": "..." }`,
  },
  {
    id: "reviewer",
    name: "Reviewer",
    nameNl: "Reviewer",
    role: "Fact-check, audience fit, tone",
    icon: BookCheck,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    systemPrompt: `You are an editorial reviewer for hansvanleeuwen.com. Check the blog post for:
- Factual accuracy of claims, statistics, market data
- Audience fit (e-commerce professionals, marketplace sellers, NL/EU market)
- Tone consistency: strategic, data-driven, direct, no fluff
- Value density — every paragraph teaches or informs
- Comparison with existing posts to avoid duplicate angles
Return a JSON object: { "score": 0-100, "issues": [{ "type": "fact"|"audience"|"tone"|"value", "text": "...", "suggestion": "..." }], "summary": "..." }`,
  },
  {
    id: "chief-editor",
    name: "Chief Editor",
    nameNl: "Hoofdredacteur",
    role: "Hans's voice, final authority",
    icon: Crown,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    systemPrompt: `You are the Chief Editor — the digital twin of Hans van Leeuwen. Final authority over all content.

Hans's voice profile:
- Strategic and system-oriented. No trend-chasing.
- Data-driven: specific numbers, percentages, timeframes. "20% in 3 months" not "grew significantly"
- Direct Dutch communication: no hedging, no "I think", no "perhaps"
- First person singular. Personal experience woven in.
- Banned words: leverage, synergy, game-changer, deep dive, unlock, empower, journey, at the end of the day
- Short paragraphs (2-4 sentences max). Occasional one-liners for impact.
- References to Dutch/Benelux ecosystem (bol.com, Amazon.nl, Marktplaats, Thuiswinkel Waarborg)

Synthesize all agent reviews and produce the FINAL editorial verdict.
Return a JSON object: { "verdict": "publish"|"revise"|"reject", "score": 0-100, "voice_match": 0-100, "revisions": [{ "priority": "critical"|"important"|"nice-to-have", "instruction": "..." }], "summary": "..." }`,
  },
];

// ── Agent review result type ───────────────────────────────────────────────
interface AgentReview {
  agentId: string;
  status: "idle" | "running" | "done" | "error";
  score?: number;
  summary?: string;
  details?: any;
  error?: string;
}

// ── N8N webhook endpoint ───────────────────────────────────────────────────
const N8N_BLOG_AGENT_URL = "https://n8n.srv1402218.hstgr.cloud/webhook/blog-agent-review";

async function runAgentReview(
  agent: AgentDef,
  postContent: string,
  postTitle: string,
  postCategory: string,
  postKeyword: string,
): Promise<any> {
  const res = await fetch(N8N_BLOG_AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agent.id,
      agent_system_prompt: agent.systemPrompt,
      post_title: postTitle,
      post_content: postContent,
      post_category: postCategory,
      post_keyword: postKeyword,
    }),
  });
  if (!res.ok) throw new Error(`Agent ${agent.id} failed: ${res.status}`);
  return res.json();
}

// ── Scoring utilities ──────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

// ── SEO scoring (client-side) ──────────────────────────────────────────────
interface SEOMetrics {
  score: number;
  keywordInTitle: boolean;
  keywordInFirstPara: boolean;
  keywordInHeadings: number;
  keywordDensity: number;
  metaTitleLength: number;
  metaDescLength: number;
  contentLength: number;
  hasInternalLinks: boolean;
  readabilityScore: number;
}

function calculateSEOScore(
  title: string,
  content: string,
  metaTitle: string,
  metaDesc: string,
  keyword: string,
): SEOMetrics {
  const keyword_lower = keyword.toLowerCase();
  const title_lower = title.toLowerCase();
  const content_lower = content.toLowerCase();

  // Keyword placement
  const keywordInTitle = keyword_lower && title_lower.includes(keyword_lower);
  const paras = content.split("\n\n");
  const firstPara = paras[0] || "";
  const keywordInFirstPara = keyword_lower && firstPara.toLowerCase().includes(keyword_lower);

  const h2Count = (content.match(/^##\s/gm) || []).length;
  const h2Text = content.split("\n").filter((l) => l.startsWith("##")).join(" ").toLowerCase();
  const keywordInHeadings = keyword_lower && h2Text.includes(keyword_lower) ? h2Count : 0;

  // Keyword density
  const wordCount = content.split(/\s+/).length;
  const keywordCount = (content.match(new RegExp(keyword_lower, "gi")) || []).length;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // Length checks
  const metaTitleLength = metaTitle.length;
  const metaDescLength = metaDesc.length;
  const contentLength = content.split(/\s+/).length;

  // Internal links
  const hasInternalLinks = /\[.*?\]\(\/\w+/i.test(content);

  // Readability (simplified Flesch score)
  const sentences = (content.match(/[.!?]+/g) || []).length || 1;
  const avgWordPerSentence = wordCount / sentences;
  const avgCharPerWord = content.replace(/\s/g, "").length / wordCount;
  const readability = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * avgWordPerSentence - 84.6 * (avgCharPerWord / 5))
  );

  // Composite score
  let score = 0;
  if (keywordInTitle) score += 15;
  if (keywordInFirstPara) score += 15;
  if (keywordInHeadings > 0) score += 10;
  if (density > 0.5 && density < 3) score += 15;
  if (metaTitleLength >= 40 && metaTitleLength <= 60) score += 12;
  if (metaDescLength >= 120 && metaDescLength <= 160) score += 12;
  if (contentLength >= 1500) score += 15;
  if (hasInternalLinks) score += 10;

  return {
    score: Math.min(100, score),
    keywordInTitle,
    keywordInFirstPara,
    keywordInHeadings,
    keywordDensity: parseFloat(density.toFixed(2)),
    metaTitleLength,
    metaDescLength,
    contentLength,
    hasInternalLinks,
    readabilityScore: Math.round(readability),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const BlogCMS = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // ── Post list state ────────────────────────────────────────────────────
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "word-count">("newest");

  // ── Editor state ───────────────────────────────────────────────────────
  const [activePost, setActivePost] = useState<BlogPostRow | null>(null);
  const [editorMode, setEditorMode] = useState<"dashboard" | "posts" | "edit" | "review">("dashboard");
  const [editLang, setEditLang] = useState<"en" | "nl">("nl");

  // ── Draft fields ───────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [titleNl, setTitleNl] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptNl, setExcerptNl] = useState("");
  const [content, setContent] = useState("");
  const [contentNl, setContentNl] = useState("");
  const [category, setCategory] = useState("professional");
  const [tags, setTags] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // ── Agent review state ─────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Record<string, AgentReview>>({});
  const [reviewRunning, setReviewRunning] = useState(false);

  // ── Brand voice from editorial memory ──────────────────────────────────
  const [brandVoice, setBrandVoice] = useState("");
  const [narrativeHistory, setNarrativeHistory] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [expandedSidebar, setExpandedSidebar] = useState(true);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // ── Load posts ─────────────────────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getBlogPosts(false);
      setPosts(p);
    } catch (e: any) {
      toast({ title: "Error loading posts", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // ── Load editorial memory for category ──────────────────────────────
  const loadEditorialMemory = useCallback(async (cat: string) => {
    try {
      const { data } = await supabase
        .from("hans_blog_memory")
        .select("brand_voice_context, narrative_history")
        .eq("content_category", cat)
        .maybeSingle();
      if (data) {
        setBrandVoice(data.brand_voice_context || "");
        setNarrativeHistory(data.narrative_history || "");
      } else {
        setBrandVoice("");
        setNarrativeHistory("");
      }
    } catch (e: any) {
      console.error("Error loading editorial memory:", e);
    }
  }, []);

  // ── Save editorial memory ──────────────────────────────────────────────
  const saveEditorialMemory = useCallback(async (cat: string, voice: string, history: string) => {
    try {
      const { data: existing } = await supabase
        .from("hans_blog_memory")
        .select("content_category")
        .eq("content_category", cat)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("hans_blog_memory")
          .update({ brand_voice_context: voice, narrative_history: history })
          .eq("content_category", cat);
      } else {
        await supabase
          .from("hans_blog_memory")
          .insert({ content_category: cat, brand_voice_context: voice, narrative_history: history });
      }
    } catch (e: any) {
      console.error("Error saving editorial memory:", e);
    }
  }, []);

  // ── Categories derived from posts ──────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(posts.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [posts]);

  // ── Filtered/sorted posts ──────────────────────────────────────────────
  const filteredPosts = useMemo(() => {
    let result = posts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }

    if (filterStatus !== "all") {
      result = result.filter((p) => {
        if (filterStatus === "published") return p.published;
        if (filterStatus === "draft") return !p.published && !p.scheduled_at;
        if (filterStatus === "scheduled") return !!p.scheduled_at;
        return true;
      });
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "newest") return b.created_at.localeCompare(a.created_at);
      if (sortBy === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "word-count") {
        const aWords = (a.content || "").split(/\s+/).length;
        const bWords = (b.content || "").split(/\s+/).length;
        return bWords - aWords;
      }
      return 0;
    });

    return result;
  }, [posts, searchQuery, filterCategory, filterStatus, sortBy]);

  // ── Dashboard stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const published = posts.filter((p) => p.published).length;
    const drafts = posts.filter((p) => !p.published && !p.scheduled_at).length;
    const scheduled = posts.filter((p) => p.scheduled_at).length;
    const avgWordCount = posts.length
      ? Math.round(
          posts.reduce((sum, p) => sum + (p.content || "").split(/\s+/).length, 0) / posts.length
        )
      : 0;
    return { total: posts.length, published, drafts, scheduled, avgWordCount };
  }, [posts]);

  // ── Recent activity (last 10 updates) ───────────────────────────────────
  const recentActivity = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        title: p.title,
        action: p.published ? "Published" : "Updated",
        time: new Date(p.updated_at).toLocaleDateString(),
      }));
  }, [posts]);

  // ── Calendar data (posts by month) ─────────────────────────────────────
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const postsByDate: Record<number, number> = {};
    posts.forEach((p) => {
      const date = new Date(p.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        postsByDate[day] = (postsByDate[day] || 0) + 1;
      }
    });

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, count: postsByDate[day] || 0 });
    }
    return days;
  }, [posts]);

  // ── SEO metrics for active post ────────────────────────────────────────
  const seoMetrics = useMemo(() => {
    const content = editLang === "nl" ? (contentNl || content) : content;
    const postTitle = editLang === "nl" ? (titleNl || title) : title;
    return calculateSEOScore(postTitle, content, metaTitle, metaDescription, primaryKeyword);
  }, [title, titleNl, content, contentNl, metaTitle, metaDescription, primaryKeyword, editLang]);

  // ── Open post for editing ──────────────────────────────────────────────
  const openPost = (post: BlogPostRow) => {
    setActivePost(post);
    setTitle(post.title || "");
    setTitleNl(post.title_nl || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setExcerptNl(post.excerpt_nl || "");
    setContent(post.content || "");
    setContentNl(post.content_nl || "");
    setCategory(post.category || "professional");
    setTags(post.tags?.join(", ") || "");
    setPrimaryKeyword(post.primary_keyword || "");
    setImageUrl(post.image_url || "");
    setMetaTitle(post.meta_title || "");
    setMetaDescription(post.meta_description || "");
    setOgTitle(post.og_title || "");
    setOgDescription(post.og_description || "");
    setPublished(post.published || false);
    setScheduledAt(post.scheduled_at || "");
    setReviews({});
    setEditLang("nl");
    setShowMarkdownPreview(false);
    setEditorMode("edit");
    loadEditorialMemory(post.category || "professional");
  };

  // ── Create new post ────────────────────────────────────────────────────
  const newPost = () => {
    setActivePost(null);
    setTitle("");
    setTitleNl("");
    setSlug("");
    setExcerpt("");
    setExcerptNl("");
    setContent("");
    setContentNl("");
    setCategory("professional");
    setTags("");
    setPrimaryKeyword("");
    setImageUrl("");
    setMetaTitle("");
    setMetaDescription("");
    setOgTitle("");
    setOgDescription("");
    setPublished(false);
    setScheduledAt("");
    setReviews({});
    setEditLang("nl");
    setShowMarkdownPreview(false);
    setEditorMode("edit");
    loadEditorialMemory("professional");
  };

  // ── Auto-slug generation ───────────────────────────────────────────────
  useEffect(() => {
    if (!activePost && title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 60)
      );
    }
  }, [title, activePost, slug]);

  // ── Save post ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const data: Partial<BlogPostRow> = {
      title,
      title_nl: titleNl,
      slug,
      excerpt,
      excerpt_nl: excerptNl,
      content,
      content_nl: contentNl,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      primary_keyword: primaryKeyword,
      image_url: imageUrl,
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_title: ogTitle,
      og_description: ogDescription,
      published,
      scheduled_at: scheduledAt || null,
    };

    try {
      if (activePost) {
        await updateBlogPost(activePost.id, data);
        toast({ title: "Post updated" });
      } else {
        const created = await createBlogPost(data);
        setActivePost(created);
        toast({ title: "Post created" });
      }
      loadPosts();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
  };

  // ── Delete post ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post permanently?")) return;
    try {
      await deleteBlogPost(id);
      toast({ title: "Post deleted" });
      setEditorMode("posts");
      loadPosts();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  // ── Run all agent reviews ──────────────────────────────────────────────
  const runAllAgents = async () => {
    const postContent = editLang === "nl" ? (contentNl || content) : content;
    const postTitle = editLang === "nl" ? (titleNl || title) : title;

    if (!postContent || postContent.trim().length < 50) {
      toast({
        title: "Content too short",
        description: "Write at least 50 words before running review.",
        variant: "destructive",
      });
      return;
    }

    setReviewRunning(true);
    setEditorMode("review");

    const initial: Record<string, AgentReview> = {};
    for (const a of AGENTS) {
      initial[a.id] = { agentId: a.id, status: "running" };
    }
    setReviews(initial);

    const regularAgents = AGENTS.filter((a) => a.id !== "chief-editor");
    const chiefEditor = AGENTS.find((a) => a.id === "chief-editor")!;

    for (const agent of regularAgents) {
      try {
        const result = await runAgentReview(agent, postContent, postTitle, category, primaryKeyword);
        setReviews((prev) => ({
          ...prev,
          [agent.id]: {
            agentId: agent.id,
            status: "done",
            score: result.score,
            summary: result.summary,
            details: result,
          },
        }));
      } catch (e: any) {
        setReviews((prev) => ({
          ...prev,
          [agent.id]: { agentId: agent.id, status: "error", error: e.message },
        }));
      }
    }

    try {
      const result = await runAgentReview(chiefEditor, postContent, postTitle, category, primaryKeyword);
      setReviews((prev) => ({
        ...prev,
        [chiefEditor.id]: {
          agentId: chiefEditor.id,
          status: "done",
          score: result.score,
          summary: result.summary,
          details: result,
        },
      }));
    } catch (e: any) {
      setReviews((prev) => ({
        ...prev,
        [chiefEditor.id]: { agentId: chiefEditor.id, status: "error", error: e.message },
      }));
    }

    setReviewRunning(false);
  };

  // ── Word count ─────────────────────────────────────────────────────────
  const wordCount = useMemo(() => {
    const currentContent = editLang === "nl" ? contentNl : content;
    return currentContent.split(/\s+/).filter((w) => w).length;
  }, [content, contentNl, editLang]);

  // ── Reading time estimate ──────────────────────────────────────────────
  const readingTime = useMemo(() => {
    return Math.ceil(wordCount / 200);
  }, [wordCount]);

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[hsl(220,20%,4%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60">You must be logged in as an admin to access the CMS.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[hsl(220,20%,4%)] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[hsl(220,18%,8%)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Blog CMS</h1>
                <p className="text-xs text-white/50">Editorial dashboard with AI review pipeline</p>
              </div>
            </div>
            <div className="text-xs text-white/50">
              {stats.total} posts • {stats.published} published
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {editorMode === "dashboard" && <DashboardTab stats={stats} recentActivity={recentActivity} calendarDays={calendarDays} onPostClick={openPost} posts={posts} onNewPost={newPost} onSwitchMode={() => setEditorMode("posts")} />}

        {editorMode === "posts" && (
          <PostsListTab
            filteredPosts={filteredPosts}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={categories}
            onOpenPost={openPost}
            onDelete={handleDelete}
            onNewPost={newPost}
            onDashboard={() => setEditorMode("dashboard")}
          />
        )}

        {editorMode === "edit" && (
          <EditorView
            activePost={activePost}
            title={title}
            setTitle={setTitle}
            titleNl={titleNl}
            setTitleNl={setTitleNl}
            slug={slug}
            setSlug={setSlug}
            excerpt={excerpt}
            setExcerpt={setExcerpt}
            excerptNl={excerptNl}
            setExcerptNl={setExcerptNl}
            content={content}
            setContent={setContent}
            contentNl={contentNl}
            setContentNl={setContentNl}
            category={category}
            setCategory={setCategory}
            tags={tags}
            setTags={setTags}
            primaryKeyword={primaryKeyword}
            setPrimaryKeyword={setPrimaryKeyword}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
            ogTitle={ogTitle}
            setOgTitle={setOgTitle}
            ogDescription={ogDescription}
            setOgDescription={setOgDescription}
            published={published}
            setPublished={setPublished}
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
            editLang={editLang}
            setEditLang={setEditLang}
            wordCount={wordCount}
            readingTime={readingTime}
            seoMetrics={seoMetrics}
            showMarkdownPreview={showMarkdownPreview}
            setShowMarkdownPreview={setShowMarkdownPreview}
            contentRef={contentRef}
            onSave={handleSave}
            onDelete={() => activePost && handleDelete(activePost.id)}
            onRunAgents={runAllAgents}
            onBackToList={() => setEditorMode("posts")}
            onSwitchToReview={() => setEditorMode("review")}
            brandVoice={brandVoice}
            setBrandVoice={setBrandVoice}
            narrativeHistory={narrativeHistory}
            setNarrativeHistory={setNarrativeHistory}
            onSaveEditorialMemory={() => saveEditorialMemory(category, brandVoice, narrativeHistory)}
            reviews={reviews}
            reviewRunning={reviewRunning}
            categories={categories}
          />
        )}

        {editorMode === "review" && (
          <ReviewView
            reviews={reviews}
            reviewRunning={reviewRunning}
            onBack={() => setEditorMode("edit")}
            onRunAgents={runAllAgents}
          />
        )}
      </div>

      {/* Floating Action Button */}
      {editorMode === "posts" && (
        <motion.button
          onClick={newPost}
          className="fixed bottom-8 right-8 p-4 bg-rose-500 hover:bg-rose-600 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function DashboardTab({
  stats,
  recentActivity,
  calendarDays,
  onPostClick,
  posts,
  onNewPost,
  onSwitchMode,
}: {
  stats: { total: number; published: number; drafts: number; scheduled: number; avgWordCount: number };
  recentActivity: Array<{ id: string; title: string; action: string; time: string }>;
  calendarDays: Array<{ day: number; count: number } | null>;
  onPostClick: (post: BlogPostRow) => void;
  posts: BlogPostRow[];
  onNewPost: () => void;
  onSwitchMode: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-4"
          whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          <div className="text-white/60 text-sm mb-2">Total Posts</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </motion.div>

        <motion.div
          className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4"
          whileHover={{ borderColor: "rgba(16,185,129,0.3)" }}
        >
          <div className="text-emerald-400/80 text-sm mb-2">Published</div>
          <div className="text-3xl font-bold text-emerald-400">{stats.published}</div>
        </motion.div>

        <motion.div
          className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4"
          whileHover={{ borderColor: "rgba(251,146,60,0.3)" }}
        >
          <div className="text-amber-400/80 text-sm mb-2">Drafts</div>
          <div className="text-3xl font-bold text-amber-400">{stats.drafts}</div>
        </motion.div>

        <motion.div
          className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4"
          whileHover={{ borderColor: "rgba(59,130,246,0.3)" }}
        >
          <div className="text-blue-400/80 text-sm mb-2">Scheduled</div>
          <div className="text-3xl font-bold text-blue-400">{stats.scheduled}</div>
        </motion.div>

        <motion.div
          className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4"
          whileHover={{ borderColor: "rgba(168,85,247,0.3)" }}
        >
          <div className="text-violet-400/80 text-sm mb-2">Avg Word Count</div>
          <div className="text-3xl font-bold text-violet-400">{stats.avgWordCount}</div>
        </motion.div>
      </div>

      {/* Calendar & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-400" />
            This Month
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs text-white/50 font-medium py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((item, idx) =>
              item === null ? (
                <div key={`empty-${idx}`} />
              ) : (
                <div
                  key={item.day}
                  className={`aspect-square flex items-center justify-center rounded text-sm font-medium cursor-pointer transition-colors ${
                    item.count > 0
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "text-white/50 hover:bg-white/5"
                  }`}
                >
                  {item.day}
                </div>
              )
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">Publish Rate</span>
              <span className="font-medium">{stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/60"
                style={{ width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` }}
              />
            </div>
            <div className="text-xs text-white/50 pt-2 border-t border-white/[0.06]">
              {stats.drafts} posts awaiting publication
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Recent Activity
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentActivity.length === 0 ? (
            <p className="text-white/50 text-sm">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                whileHover={{ x: 4 }}
                onClick={() => {
                  const post = posts.find((p) => p.id === activity.id);
                  if (post) onPostClick(post);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-white/50">{activity.action}</p>
                </div>
                <p className="text-xs text-white/40 whitespace-nowrap ml-2">{activity.time}</p>
              </motion.div>
            ))
          )}
        </div>
        <Button
          onClick={onSwitchMode}
          variant="outline"
          className="w-full mt-4 border-white/[0.06] hover:bg-white/5"
        >
          View All Posts
        </Button>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-rose-500/10 to-rose-500/5 border border-rose-500/20 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Create New Post</h3>
        <p className="text-white/70 text-sm mb-4">
          Start drafting your next article with the full editorial pipeline
        </p>
        <Button
          onClick={onNewPost}
          className="bg-rose-500 hover:bg-rose-600 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   POSTS LIST TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function PostsListTab({
  filteredPosts,
  loading,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  categories,
  onOpenPost,
  onDelete,
  onNewPost,
  onDashboard,
}: {
  filteredPosts: BlogPostRow[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string | "all";
  setFilterCategory: (c: string | "all") => void;
  filterStatus: "all" | "published" | "draft" | "scheduled";
  setFilterStatus: (s: "all" | "published" | "draft" | "scheduled") => void;
  sortBy: "newest" | "oldest" | "title" | "word-count";
  setSortBy: (s: "newest" | "oldest" | "title" | "word-count") => void;
  categories: string[];
  onOpenPost: (post: BlogPostRow) => void;
  onDelete: (id: string) => void;
  onNewPost: () => void;
  onDashboard: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-white/[0.12] transition-colors"
          />
        </div>
        <Button
          onClick={onDashboard}
          variant="outline"
          className="border-white/[0.06] hover:bg-white/5"
        >
          Dashboard
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded px-3 py-1 text-sm outline-none"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as any)}
          className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded px-3 py-1 text-sm outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded px-3 py-1 text-sm outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A-Z</option>
          <option value="word-count">Word Count</option>
        </select>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/40 mb-2" />
          <p className="text-white/60">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-white/20 mb-2" />
          <p className="text-white/60">No posts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg overflow-hidden hover:border-white/[0.12] transition-colors cursor-pointer group"
              whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
              onClick={() => onOpenPost(post)}
            >
              {/* Thumbnail */}
              {post.image_url && (
                <div className="h-40 bg-gradient-to-br from-rose-500/10 to-transparent overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight text-base flex-1">{post.title}</h3>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${
                      post.published
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : post.scheduled_at
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {post.published ? "Published" : post.scheduled_at ? "Scheduled" : "Draft"}
                  </Badge>
                </div>

                <p className="text-xs text-white/50 line-clamp-2">{post.excerpt}</p>

                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{post.tags.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span>{(post.content || "").split(/\s+/).length} words</span>
                    <span className="text-white/30">•</span>
                    <span>{new Date(post.updated_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(post.id);
                    }}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDITOR VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function EditorView(props: any) {
  const {
    activePost,
    title,
    setTitle,
    titleNl,
    setTitleNl,
    slug,
    setSlug,
    excerpt,
    setExcerpt,
    excerptNl,
    setExcerptNl,
    content,
    setContent,
    contentNl,
    setContentNl,
    category,
    setCategory,
    tags,
    setTags,
    primaryKeyword,
    setPrimaryKeyword,
    imageUrl,
    setImageUrl,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    ogTitle,
    setOgTitle,
    ogDescription,
    setOgDescription,
    published,
    setPublished,
    scheduledAt,
    setScheduledAt,
    editLang,
    setEditLang,
    wordCount,
    readingTime,
    seoMetrics,
    showMarkdownPreview,
    setShowMarkdownPreview,
    contentRef,
    onSave,
    onDelete,
    onRunAgents,
    onBackToList,
    brandVoice,
    setBrandVoice,
    narrativeHistory,
    setNarrativeHistory,
    onSaveEditorialMemory,
    reviews,
    reviewRunning,
    categories,
  } = props;

  const [memoryExpanded, setMemoryExpanded] = useState(false);

  const currentTitle = editLang === "en" ? title : titleNl;
  const currentExcerpt = editLang === "en" ? excerpt : excerptNl;
  const currentContent = editLang === "en" ? content : contentNl;

  const setCurrentTitle = editLang === "en" ? setTitle : setTitleNl;
  const setCurrentExcerpt = editLang === "en" ? setExcerpt : setExcerptNl;
  const setCurrentContent = editLang === "en" ? setContent : setContentNl;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{activePost ? "Edit Post" : "New Post"}</h2>
          <p className="text-sm text-white/50 mt-1">
            {wordCount} words • {readingTime} min read
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-1">
            <button
              onClick={() => setEditLang("nl")}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                editLang === "nl"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              🇳🇱 NL
            </button>
            <button
              onClick={() => setEditLang("en")}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                editLang === "en"
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Writing Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full mt-2 bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg px-4 py-3 text-xl font-bold outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Excerpt</label>
            <textarea
              value={currentExcerpt}
              onChange={(e) => setCurrentExcerpt(e.target.value)}
              placeholder="Brief summary for previews..."
              className="w-full mt-2 bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg px-4 py-3 text-sm outline-none focus:border-white/[0.12] transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wide">Content</label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                className="text-xs"
              >
                {showMarkdownPreview ? "Editor" : "Preview"}
              </Button>
            </div>
            {!showMarkdownPreview && (
              <textarea
                ref={contentRef}
                value={currentContent}
                onChange={(e) => setCurrentContent(e.target.value)}
                placeholder="Write your post here (markdown supported)..."
                className="w-full min-h-[400px] bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg px-4 py-3 font-mono text-sm outline-none focus:border-white/[0.12] transition-colors resize-none"
              />
            )}
            {showMarkdownPreview && (
              <div className="w-full min-h-[400px] bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg px-4 py-3 overflow-auto prose prose-invert">
                <MarkdownPreview content={currentContent} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4 max-h-[100vh] overflow-y-auto pr-2">
          {/* SEO Score */}
          <SEOScoreCard seoMetrics={seoMetrics} />

          {/* AI Pipeline */}
          <AIAgentPanel
            reviews={reviews}
            reviewRunning={reviewRunning}
            onRunAgents={onRunAgents}
          />

          {/* Metadata */}
          <MetadataCard
            slug={slug}
            setSlug={setSlug}
            category={category}
            setCategory={setCategory}
            categories={categories}
            tags={tags}
            setTags={setTags}
            primaryKeyword={primaryKeyword}
            setPrimaryKeyword={setPrimaryKeyword}
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            published={published}
            setPublished={setPublished}
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
          />

          {/* Editorial Memory */}
          <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg">
            <button
              onClick={() => setMemoryExpanded(!memoryExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                Editorial Memory
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${memoryExpanded ? "rotate-180" : ""}`} />
            </button>
            {memoryExpanded && (
              <div className="border-t border-white/[0.06] p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-white/70">Brand Voice</label>
                  <textarea
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    onBlur={onSaveEditorialMemory}
                    placeholder="Brand voice rules..."
                    className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-2 text-xs outline-none focus:border-white/[0.12] resize-none"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/70">Recent Posts</label>
                  <textarea
                    value={narrativeHistory}
                    onChange={(e) => setNarrativeHistory(e.target.value)}
                    onBlur={onSaveEditorialMemory}
                    placeholder="Summary of recent posts..."
                    className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-2 text-xs outline-none focus:border-white/[0.12] resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 sticky bottom-0 bg-[hsl(220,20%,4%)] py-4">
            <Button
              onClick={onSave}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save
            </Button>
            {activePost && (
              <Button
                onClick={onDelete}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={onBackToList}
              variant="outline"
              className="w-full border-white/[0.06] hover:bg-white/5"
            >
              Back to Posts
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEO SCORE CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function SEOScoreCard({ seoMetrics }: { seoMetrics: SEOMetrics }) {
  return (
    <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Target className="w-4 h-4 text-emerald-400" />
        SEO Score
      </h3>

      {/* Score gauge */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={seoMetrics.score >= 80 ? "#10b981" : seoMetrics.score >= 60 ? "#f59e0b" : "#ef4444"}
              strokeWidth="2"
              strokeDasharray={`${seoMetrics.score} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{seoMetrics.score}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-white/70">
            {seoMetrics.score >= 80 ? "Excellent" : seoMetrics.score >= 60 ? "Good" : "Needs Work"}
          </div>
          <p className="text-xs text-white/50">
            {seoMetrics.keywordInTitle ? "✓" : "✗"} Keyword in title<br />
            {seoMetrics.keywordInFirstPara ? "✓" : "✗"} First paragraph<br />
            {seoMetrics.contentLength >= 1500 ? "✓" : "✗"} Word count
          </p>
        </div>
      </div>

      {/* Meta length indicators */}
      <div className="space-y-2 border-t border-white/[0.06] pt-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/70">Meta Title</span>
            <span className="text-white/50">{seoMetrics.metaTitleLength}/60</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                seoMetrics.metaTitleLength >= 50 && seoMetrics.metaTitleLength <= 60
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${(seoMetrics.metaTitleLength / 60) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/70">Meta Desc</span>
            <span className="text-white/50">{seoMetrics.metaDescLength}/160</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                seoMetrics.metaDescLength >= 120 && seoMetrics.metaDescLength <= 160
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${(seoMetrics.metaDescLength / 160) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI AGENT PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function AIAgentPanel({
  reviews,
  reviewRunning,
  onRunAgents,
}: {
  reviews: Record<string, AgentReview>;
  reviewRunning: boolean;
  onRunAgents: () => void;
}) {
  const overallScore = useMemo(() => {
    const scores = Object.values(reviews)
      .filter((r) => r.status === "done" && r.score !== undefined)
      .map((r) => r.score!);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [reviews]);

  return (
    <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        AI Review Pipeline
      </h3>

      {/* Overall Score */}
      {Object.keys(reviews).length > 0 && (
        <div className="bg-white/5 rounded p-2 text-center">
          <p className="text-xs text-white/60 mb-1">Overall Score</p>
          <p className="text-2xl font-bold text-emerald-400">{overallScore}</p>
        </div>
      )}

      {/* Agent Cards */}
      <div className="space-y-2">
        {AGENTS.map((agent) => {
          const review = reviews[agent.id];
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.id}
              className={`p-2 rounded border transition-colors ${
                review?.status === "done"
                  ? "bg-white/5 border-white/[0.06]"
                  : review?.status === "running"
                  ? "bg-white/5 border-white/[0.12]"
                  : "bg-white/[0.02] border-white/[0.06]"
              }`}
              layout
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${agent.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{agent.nameNl}</p>
                  <p className="text-xs text-white/40 truncate">{agent.role}</p>
                </div>
                {review?.status === "running" && (
                  <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                )}
                {review?.status === "done" && (
                  <span className={`text-xs font-bold ${scoreColor(review.score || 0)}`}>
                    {review.score}
                  </span>
                )}
                {review?.status === "error" && (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
              {review?.summary && review.status === "done" && (
                <p className="text-xs text-white/50 mt-2 line-clamp-2">{review.summary}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Run Button */}
      <Button
        onClick={onRunAgents}
        disabled={reviewRunning}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 disabled:opacity-50"
      >
        {reviewRunning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Run Full Pipeline
          </>
        )}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   METADATA CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function MetadataCard(props: any) {
  const {
    slug,
    setSlug,
    category,
    setCategory,
    categories,
    tags,
    setTags,
    primaryKeyword,
    setPrimaryKeyword,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    imageUrl,
    setImageUrl,
    published,
    setPublished,
    scheduledAt,
    setScheduledAt,
  } = props;

  return (
    <div className="bg-[hsl(220,18%,8%)] border border-white/[0.06] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Settings className="w-4 h-4 text-cyan-400" />
        Metadata
      </h3>

      {/* Slug */}
      <div>
        <label className="text-xs font-medium text-white/70">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-white/70">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-white/70">Tags (comma-separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tag1, tag2, tag3"
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
        />
      </div>

      {/* Primary Keyword */}
      <div>
        <label className="text-xs font-medium text-white/70">Primary Keyword</label>
        <input
          type="text"
          value={primaryKeyword}
          onChange={(e) => setPrimaryKeyword(e.target.value)}
          placeholder="Target keyword"
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
        />
      </div>

      {/* Meta Title */}
      <div>
        <label className="text-xs font-medium text-white/70">Meta Title</label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="SEO title (50-60 chars)"
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
        />
        <p className="text-xs text-white/40 mt-1">{metaTitle.length}/60</p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="text-xs font-medium text-white/70">Meta Description</label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="SEO description (120-160 chars)"
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12] resize-none"
          rows={2}
        />
        <p className="text-xs text-white/40 mt-1">{metaDescription.length}/160</p>
      </div>

      {/* Image URL */}
      <div>
        <label className="text-xs font-medium text-white/70">Cover Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
        />
      </div>

      {/* Publish / Schedule */}
      <div className="border-t border-white/[0.06] pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-white/70">Published</label>
          <button
            onClick={() => setPublished(!published)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              published ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/50"
            }`}
          >
            {published ? "Yes" : "No"}
          </button>
        </div>
        <div>
          <label className="text-xs font-medium text-white/70">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full mt-1 bg-white/5 border border-white/[0.06] rounded px-2 py-1 text-xs outline-none focus:border-white/[0.12]"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEW VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function ReviewView({
  reviews,
  reviewRunning,
  onBack,
  onRunAgents,
}: {
  reviews: Record<string, AgentReview>;
  reviewRunning: boolean;
  onBack: () => void;
  onRunAgents: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Review Results</h2>
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/[0.06] hover:bg-white/5"
        >
          Back to Editor
        </Button>
      </div>

      {/* Agent Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {AGENTS.map((agent) => {
          const review = reviews[agent.id];
          const Icon = agent.icon;

          return (
            <motion.div
              key={agent.id}
              className={`border rounded-lg overflow-hidden ${scoreBg(review?.score || 0)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${agent.color}`} />
                    <div>
                      <h3 className="font-semibold">{agent.nameNl}</h3>
                      <p className="text-sm text-white/60">{agent.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {review?.status === "running" && (
                      <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                    )}
                    {review?.status === "done" && (
                      <div className="text-3xl font-bold" style={{ color: scoreColor(review.score || 0).replace("text-", "").replace("-400", "") }}>
                        {review.score}
                      </div>
                    )}
                    {review?.status === "error" && (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Content */}
                {review?.status === "done" && (
                  <div className="space-y-3">
                    <p className="text-sm">{review.summary}</p>

                    {review.details?.issues && review.details.issues.length > 0 && (
                      <div className="space-y-2 bg-white/5 rounded p-3">
                        <p className="text-xs font-semibold text-white/70 uppercase">Issues</p>
                        {review.details.issues.slice(0, 3).map((issue: any, idx: number) => (
                          <div key={idx} className="text-xs text-white/60 border-l-2 border-white/20 pl-2">
                            <p className="font-medium">{issue.type}</p>
                            <p className="text-white/50">{issue.text}</p>
                            {issue.suggestion && (
                              <p className="text-emerald-400/70 mt-1">→ {issue.suggestion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {review?.status === "running" && (
                  <p className="text-sm text-white/60">Analyzing content...</p>
                )}

                {review?.status === "error" && (
                  <p className="text-sm text-red-400">{review.error}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rerun Button */}
      <div className="flex justify-center">
        <Button
          onClick={onRunAgents}
          disabled={reviewRunning}
          className="bg-amber-500 hover:bg-amber-600 text-white border-0 disabled:opacity-50"
        >
          {reviewRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-run Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MARKDOWN PREVIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function MarkdownPreview({ content }: { content: string }) {
  const html = content
    .split("\n")
    .map((line) => {
      if (line.startsWith("##")) {
        return `<h2>${line.replace(/^##\s/, "")}</h2>`;
      }
      if (line.startsWith("#")) {
        return `<h1>${line.replace(/^#\s/, "")}</h1>`;
      }
      if (line.startsWith("-")) {
        return `<li>${line.replace(/^-\s/, "")}</li>`;
      }
      return line ? `<p>${line}</p>` : "";
    })
    .join("");

  return (
    <div className="space-y-4 text-white/80 leading-relaxed">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default BlogCMS;
