import { supabase } from "@/integrations/supabase/client";

export interface PageContentVersion {
  id: string;
  content_id: string;
  page: string;
  content_key: string;
  content_value: string;
  content_group: string;
  content_label: string;
  changed_by: string | null;
  created_at: string;
}

export async function getVersionsForField(contentId: string): Promise<PageContentVersion[]> {
  const { data, error } = await supabase
    .from("page_content_versions" as any)
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as PageContentVersion[];
}

export async function getVersionsForPage(page: string): Promise<PageContentVersion[]> {
  const { data, error } = await supabase
    .from("page_content_versions" as any)
    .select("*")
    .eq("page", page)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as PageContentVersion[];
}
