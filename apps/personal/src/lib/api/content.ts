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
  status?: string | null;
  image_url: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  og_title: string;
  og_description: string;
  canonical_url: string;
  primary_keyword: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hans's auth user_id. Only this user sees draft posts on /writing.
 * Backed by Supabase RLS — frontend filter is UX-only, not a security boundary.
 */
const HANS_USER_ID = "0200ed4f-c866-4ec3-b235-541843133c1a";

async function isHansSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id === HANS_USER_ID;
  } catch {
    return false;
  }
}

/**
 * Drafts (status='draft') are surfaced only when Hans is authenticated.
 * Anonymous visitors are limited by RLS to published=true AND status='published'.
 */
export function isDraftPost(post: Pick<BlogPostRow, "published" | "status">): boolean {
  if (post.published) return false;
  return post.status === "draft";
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
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

// ── Blog Posts ───────────────────────────────────────────

/**
 * Fetch blog posts. By default returns only published posts (status='published',
 * published=true). When Hans is authenticated, also returns drafts so /writing
 * acts as his single source of truth across CMS + public view.
 *
 * Server-side authority is Supabase RLS:
 *   - anon role: SELECT only where published=true AND status='published'
 *   - authenticated as Hans: SELECT all rows
 *   - service_role: SELECT all (used by SSR / n8n)
 *
 * Passing publishedOnly=true keeps the legacy contract for callers that
 * explicitly want public posts regardless of session.
 */
export async function getBlogPosts(publishedOnly = true): Promise<BlogPostRow[]> {
  const hansAuthed = !publishedOnly ? false : await isHansSession();
  const includeDrafts = !publishedOnly || hansAuthed;

  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false } as never)
    .order("created_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("published", true).eq("status", "published");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as BlogPostRow[]) || [];
}

export async function getBlogPost(slug: string, publishedOnly = true): Promise<BlogPostRow | null> {
  const hansAuthed = !publishedOnly ? false : await isHansSession();
  const includeDrafts = !publishedOnly || hansAuthed;

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug);

  if (!includeDrafts) {
    query = query.eq("published", true).eq("status", "published");
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as unknown as BlogPostRow | null;
}

export async function createBlogPost(post: Partial<BlogPostRow>): Promise<BlogPostRow> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(post as unknown)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as BlogPostRow;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPostRow>): Promise<BlogPostRow> {
  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates as unknown)
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
    .insert(study as unknown)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CaseStudyRow;
}

export async function updateCaseStudy(id: string, updates: Partial<CaseStudyRow>): Promise<CaseStudyRow> {
  const { data, error } = await supabase
    .from("case_studies")
    .update(updates as unknown)
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