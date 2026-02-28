import { supabase } from "@/integrations/supabase/client";

export interface BlogPostRow {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  title_nl: string;
  excerpt_nl: string;
  content_nl: string;
  category: string;
  tags: string[];
  slug: string;
  read_time: string;
  published: boolean;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface CaseStudyRow {
  id: string;
  title: string;
  title_nl: string;
  category: string;
  description: string;
  description_nl: string;
  content: string;
  content_nl: string;
  image: string;
  year: string;
  external_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Blog Posts ───────────────────────────────────────────

export async function getBlogPosts(publishedOnly = true): Promise<BlogPostRow[]> {
  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as BlogPostRow[]) || [];
}

export async function getBlogPost(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as BlogPostRow | null;
}

export async function createBlogPost(post: Partial<BlogPostRow>): Promise<BlogPostRow> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(post as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BlogPostRow;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPostRow>): Promise<BlogPostRow> {
  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BlogPostRow;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

// ── Case Studies ────────────────────────────────────────

export async function getCaseStudies(publishedOnly = true): Promise<CaseStudyRow[]> {
  let query = supabase
    .from("case_studies")
    .select("*")
    .order("sort_order");
  if (publishedOnly) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as CaseStudyRow[]) || [];
}

export async function createCaseStudy(study: Partial<CaseStudyRow>): Promise<CaseStudyRow> {
  const { data, error } = await supabase
    .from("case_studies")
    .insert(study as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CaseStudyRow;
}

export async function updateCaseStudy(id: string, updates: Partial<CaseStudyRow>): Promise<CaseStudyRow> {
  const { data, error } = await supabase
    .from("case_studies")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CaseStudyRow;
}

export async function deleteCaseStudy(id: string): Promise<void> {
  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) throw error;
}