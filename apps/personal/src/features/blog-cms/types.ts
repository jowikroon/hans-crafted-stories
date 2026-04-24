export type BlogCmsTermCategory = "ecommerce" | "ai" | "marketplace" | "automation" | "internal";
export type BlogCmsReviewStatus = "draft" | "review" | "confirmed" | "archived";
export type YouTubeSourceStatus = "imported" | "transcribing" | "transcribed" | "analyzed" | "used" | "failed";
export type AgentRunStatus = "queued" | "running" | "completed" | "needs_review" | "failed";

export interface WikiTerm {
  id: string;
  term: string;
  slug: string;
  category: BlogCmsTermCategory;
  short_definition: string;
  long_definition: string | null;
  synonyms: string[];
  related_terms: string[];
  status: BlogCmsReviewStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleWikiTerm {
  id: string;
  article_id: string;
  wiki_term_id: string;
  source: "manual" | "agent_suggested";
  confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface YouTubeSource {
  id: string;
  url: string;
  video_id: string | null;
  title: string | null;
  short_name: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  transcript_language: string | null;
  context_summary: string | null;
  key_topics: string[];
  suggested_wiki_terms: string[];
  article_opportunities: string[];
  status: YouTubeSourceStatus;
  linked_article_id: string | null;
  voice_template_id: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentReviewRun {
  id: string;
  agent_key: string;
  agent_label: string;
  article_id: string | null;
  youtube_source_id: string | null;
  task: string;
  prompt: string | null;
  input_snapshot: Record<string, unknown> | null;
  output: Record<string, unknown> | string | null;
  score: number | null;
  status: AgentRunStatus;
  error_message: string | null;
  model: string | null;
  duration_ms: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const BLOG_CMS_AGENTS = [
  { key: "seo", label: "SEO Agent" },
  { key: "voice", label: "Voice Agent" },
  { key: "wiki", label: "Wiki Term Agent" },
  { key: "youtube", label: "YouTube Context Agent" },
  { key: "fact_check", label: "Fact Check Agent" },
  { key: "marketplace", label: "Marketplace Agent" },
  { key: "readability", label: "Readability Agent" },
  { key: "publish_guard", label: "Publish Guard" },
] as const;

export const BLOG_CMS_CONTENT_OS_TABLES = {
  wikiTerms: "blog_cms_wiki_terms",
  articleWikiTerms: "blog_cms_article_wiki_terms",
  youtubeSources: "blog_cms_youtube_sources",
  agentReviews: "blog_cms_agent_reviews",
} as const;
