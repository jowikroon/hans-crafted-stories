import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface SiteAuditResult {
  url: string;
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  headings: { tag: string; text: string }[];
  h1Count: number;
  totalLinks: number;
  totalImages: number;
  imagesWithoutAlt: number;
  wordCount: number;
  issues: string[];
}

export interface KeywordResult {
  seed_keyword: string;
  search_intent: string;
  difficulty: string;
  related_keywords: {
    keyword: string;
    intent: string;
    difficulty: string;
    relevance: string;
  }[];
  content_suggestions: {
    title: string;
    type: string;
    target_keyword: string;
  }[];
  summary: string;
}

export interface WebhookResult {
  success: boolean;
  status: number;
  data: unknown;
}

export interface PortalTool {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tool_type: string;
  config: Record<string, unknown>;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
});

export const portalApi = {
  async runSiteAudit(url: string): Promise<{ success: boolean; data?: SiteAuditResult; error?: string }> {
    const res = await fetch(`${FUNCTIONS_URL}/site-audit`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  async triggerWebhook(webhook_url: string, payload?: Record<string, unknown>): Promise<{ success: boolean; data?: WebhookResult; error?: string }> {
    const res = await fetch(`${FUNCTIONS_URL}/trigger-webhook`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ webhook_url, payload }),
    });
    return res.json();
  },

  async keywordResearch(keyword: string): Promise<{ success: boolean; data?: KeywordResult; error?: string }> {
    const res = await fetch(`${FUNCTIONS_URL}/keyword-research`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ keyword }),
    });
    return res.json();
  },

  async getTools(): Promise<PortalTool[]> {
    const { data, error } = await supabase
      .from("portal_tools")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data as unknown as PortalTool[]) || [];
  },

  async addTool(tool: Omit<PortalTool, "id" | "created_at">): Promise<PortalTool> {
    const { data, error } = await supabase
      .from("portal_tools")
      .insert(tool as never)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as PortalTool;
  },

  async updateTool(id: string, updates: Partial<PortalTool>): Promise<PortalTool> {
    const { data, error } = await supabase
      .from("portal_tools")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as PortalTool;
  },

  async deleteTool(id: string): Promise<void> {
    const { error } = await supabase.from("portal_tools").delete().eq("id", id);
    if (error) throw error;
  },
};
