import { supabase } from "@/integrations/supabase/client";

export interface BlogPostVersion {
  id: string;
  post_id: string;
  title: string;
  content: string;
  excerpt: string;
  changed_by: string | null;
  change_summary: string;
  created_at: string;
}

export async function getVersionsForPost(postId: string): Promise<BlogPostVersion[]> {
  const { data, error } = await supabase
    .from("blog_post_versions" as unknown)
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as BlogPostVersion[];
}
