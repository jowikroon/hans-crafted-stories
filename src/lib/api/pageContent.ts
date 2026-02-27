import { supabase } from "@/integrations/supabase/client";

export interface PageContentRow {
  id: string;
  page: string;
  content_key: string;
  content_value: string;
  content_group: string;
  content_label: string;
  content_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getPageContent(page: string): Promise<PageContentRow[]> {
  const { data, error } = await supabase
    .from("page_content")
    .select("*")
    .eq("page", page)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as PageContentRow[];
}

export async function getAllPageContent(): Promise<PageContentRow[]> {
  const { data, error } = await supabase
    .from("page_content")
    .select("*")
    .order("page")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as PageContentRow[];
}

export async function updatePageContent(id: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("page_content")
    .update({ content_value: value } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function updatePageContentBatch(updates: { id: string; content_value: string }[]): Promise<void> {
  const promises = updates.map((u) =>
    supabase.from("page_content").update({ content_value: u.content_value } as any).eq("id", u.id)
  );
  const results = await Promise.all(promises);
  const err = results.find((r) => r.error);
  if (err?.error) throw err.error;
}
