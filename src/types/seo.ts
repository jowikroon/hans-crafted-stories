export interface ScoreBreakdown {
  technical: number;
  content: number;
  schema: number;
  performance: number;
  freshness: number;
}

export interface TechnicalScores {
  technical_score: number;
  performance: number;
  accessibility: number;
  seo_score: number;
  lcp_ms: number;
  cls: number;
  tbt_ms: number;
  fcp_ms: number;
}

export interface ContentAnalysis {
  content_score: number;
  intent_match: string;
  freshness_risk: string;
  thin_content_risk: string;
  word_count: number;
}

export interface SeoAudit {
  id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed";
  audit_type: string;
  overall_score: number | null;
  report_html: string | null;
  report_summary: string | null;
  score_breakdown: ScoreBreakdown | null;
  critical_issues: string[];
  quick_wins: string[];
  technical_scores: TechnicalScores | null;
  content_analysis: ContentAnalysis | null;
  error_message: string | null;
  send_email: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoActionItem {
  id: string;
  audit_id: string;
  url: string;
  title: string;
  description: string | null;
  source_type: string;
  severity: string;
  impact: string;
  status: "open" | "in_progress" | "done" | "dismissed";
  priority_order: number;
  completed_at: string | null;
  created_at: string;
}

export interface SeoPageMetadata {
  id: string;
  url: string;
  audit_id: string | null;
  title_tag: string;
  meta_description: string;
  canonical_url: string;
  h1: string;
  h2_list: string[];
  og_title: string;
  og_description: string;
  robots_meta: string;
  lang: string;
  word_count: number;
  internal_link_count: number;
  external_link_count: number;
  images_total: number;
  images_missing_alt: number;
  schema_types: string[];
  has_schema: boolean;
  recommended_title: string;
  recommended_meta: string;
  recommended_h1: string;
  updated_at: string;
}

export type SeoView = "audit" | "history" | "actions" | "dashboard";
