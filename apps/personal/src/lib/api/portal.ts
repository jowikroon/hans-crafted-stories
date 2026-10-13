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

export interface ToolAttribute {
  id: string;
  tool_id: string;
  key: string;
  value: string;
  created_at: string;
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
  category: string;
  features: string[];
  created_at: string;
  attributes?: ToolAttribute[];
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
    const { data, error } = await supabase.rpc('portal_tool_catalog' as never);
    if (error) throw error;
    const tools = (data as unknown as PortalTool[]) || [];
    // Only owner rows include user_id. Members receive no internal attributes.
    if (tools.some(tool => tool.user_id)) {
      const { data: attributes, error: attrError } = await supabase.from('tool_attributes').select('*').in('tool_id', tools.map(tool => tool.id));
      if (attrError) throw attrError;
      for (const tool of tools) tool.attributes = (attributes || []).filter(attr => attr.tool_id === tool.id);
    }
    return tools;
  },

  async launchTool(toolId: string): Promise<string> {
    const { data, error } = await supabase.rpc('portal_launch_tool' as never, { _tool: toolId } as never);
    if (error) throw error;
    return data as unknown as string;
  },

  async addTool(tool: Omit<PortalTool, "id" | "created_at" | "attributes">): Promise<PortalTool> {
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

  // --- Attribute CRUD ---

  async getAttributes(toolId: string): Promise<ToolAttribute[]> {
    const { data, error } = await supabase
      .from("tool_attributes")
      .select("*")
      .eq("tool_id", toolId)
      .order("created_at");
    if (error) throw error;
    return (data as unknown as ToolAttribute[]) || [];
  },

  async addAttribute(toolId: string, key: string, value: string): Promise<ToolAttribute> {
    const { data, error } = await supabase
      .from("tool_attributes")
      .insert({ tool_id: toolId, key, value } as never)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ToolAttribute;
  },

  async updateAttribute(id: string, value: string): Promise<ToolAttribute> {
    const { data, error } = await supabase
      .from("tool_attributes")
      .update({ value } as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ToolAttribute;
  },

  async deleteAttribute(id: string): Promise<void> {
    const { error } = await supabase.from("tool_attributes").delete().eq("id", id);
    if (error) throw error;
  },
};
