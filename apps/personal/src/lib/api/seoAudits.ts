import { supabase } from "@/integrations/supabase/client";

export interface SeoAudit {
  id: string;
  url: string;
  domain: string;
  path: string;
  title: string;
  title_length: number;
  meta_description: string;
  meta_description_length: number;
  h1_count: number;
  headings: { tag: string; text: string }[];
  total_links: number;
  total_images: number;
  images_without_alt: number;
  word_count: number;
  issues: string[];
  seo_score: number;
  critical_count: number;
  warning_count: number;
  passed_count: number;
  technical_audit: string;
  content_audit: string;
  audited_by: string;
  category?: string | null;
  requested_by?: string | null;
  share_slug?: string | null;
  created_at: string;
}

/** Extract domain from a URL string */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.split("/")[0].replace(/^www\./, "");
  }
}

/**
 * Normalize a user-typed URL so the same page always lands on the same
 * (domain, path) history: force https, lowercase host, strip www + hash,
 * strip trailing slash (except root). Query strings are preserved.
 */
export function normalizeUrl(input: string): { url: string; domain: string; path: string } {
  const raw = input.trim();
  let u: URL;
  try {
    u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return { url: raw, domain: extractDomain(raw), path: extractPath(raw) };
  }
  u.protocol = "https:";
  u.hostname = u.hostname.toLowerCase();
  u.hash = "";
  let path = u.pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  u.pathname = path;
  const domain = u.hostname.replace(/^www\./, "");
  return { url: u.toString(), domain, path: path || "/" };
}

/** Count scans this user ran today (client-side daily limit) */
export async function countTodaysScans(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("seo_audits" as unknown)
    .select("id", { count: "exact", head: true })
    .eq("requested_by", userId)
    .gte("created_at", today.toISOString());
  if (error) return 0;
  return count ?? 0;
}

/** Categorize a page path for domain-level grouping (homepage/blog/product/…) */
export function categorizePath(path: string): string {
  const p = (path || "/").toLowerCase();
  if (p === "/" || p === "") return "homepage";
  if (/\/(blog|writing|articles?|news|insights|kennisbank)(\/|$)/.test(p)) return "blog";
  if (/\/(products?|shop|store|items?|p)(\/|$)/.test(p)) return "product";
  if (/\/(categor(y|ies)|collections?|c)(\/|$)/.test(p)) return "category";
  if (/\/(about|over-ons|over|team|company|work|portfolio|cases?)(\/|$)/.test(p)) return "about";
  if (/\/(contact|support|help|faq)(\/|$)/.test(p)) return "contact";
  if (/\/(privacy|terms|cookies?|imprint|impressum|legal|voorwaarden|disclaimer)(\/|$)/.test(p)) return "legal";
  return "other";
}

/** Extract path from a URL string */
export function extractPath(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.pathname || "/";
  } catch {
    const parts = url.split("/");
    return "/" + parts.slice(1).join("/") || "/";
  }
}

/** Get all audits grouped by domain, newest first */
export async function getAuditsByDomain(domain?: string): Promise<SeoAudit[]> {
  let query = supabase
    .from("seo_audits" as unknown)
    .select("*")
    .order("created_at", { ascending: false });
  if (domain) query = query.eq("domain", domain);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as SeoAudit[];
}

/** Get the latest audit for a specific page */
export async function getLatestAudit(domain: string, path: string): Promise<SeoAudit | null> {
  const { data, error } = await supabase
    .from("seo_audits" as unknown)
    .select("*")
    .eq("domain", domain)
    .eq("path", path)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SeoAudit | null;
}

/** Get audit history for a specific page */
export async function getAuditHistory(domain: string, path: string): Promise<SeoAudit[]> {
  const { data, error } = await supabase
    .from("seo_audits" as unknown)
    .select("*")
    .eq("domain", domain)
    .eq("path", path)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as SeoAudit[];
}

/** Get all unique domains */
export async function getAuditDomains(): Promise<{ domain: string; count: number; latest: string }[]> {
  const { data, error } = await supabase
    .from("seo_audits" as unknown)
    .select("domain, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as { domain: string; created_at: string }[];
  const map = new Map<string, { count: number; latest: string }>();
  for (const r of rows) {
    const existing = map.get(r.domain);
    if (existing) {
      existing.count++;
    } else {
      map.set(r.domain, { count: 1, latest: r.created_at });
    }
  }
  return Array.from(map.entries()).map(([domain, v]) => ({ domain, ...v }));
}

/** Save an audit result */
export async function saveAudit(audit: Omit<SeoAudit, "id" | "created_at">): Promise<SeoAudit> {
  const { data, error } = await supabase
    .from("seo_audits" as unknown)
    .insert(audit as unknown)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SeoAudit;
}

/** Delete an audit */
export async function deleteAudit(id: string): Promise<void> {
  const { error } = await supabase.from("seo_audits" as unknown).delete().eq("id", id);
  if (error) throw error;
}

/** Compute a simple SEO score from a SiteAuditResult */
export function computeSeoScore(result: {
  titleLength: number;
  metaDescriptionLength: number;
  h1Count: number;
  imagesWithoutAlt: number;
  wordCount: number;
  issues: string[];
}): { score: number; critical: number; warning: number; passed: number } {
  let score = 100;
  let critical = 0;
  let warning = 0;
  let passed = 0;

  // Title check
  if (result.titleLength === 0) { score -= 20; critical++; }
  else if (result.titleLength < 30 || result.titleLength > 60) { score -= 5; warning++; }
  else passed++;

  // Meta description
  if (result.metaDescriptionLength === 0) { score -= 15; critical++; }
  else if (result.metaDescriptionLength < 50 || result.metaDescriptionLength > 160) { score -= 5; warning++; }
  else passed++;

  // H1
  if (result.h1Count === 0) { score -= 15; critical++; }
  else if (result.h1Count > 1) { score -= 5; warning++; }
  else passed++;

  // Images without alt
  if (result.imagesWithoutAlt > 0) { score -= Math.min(10, result.imagesWithoutAlt * 2); warning++; }
  else passed++;

  // Word count
  if (result.wordCount < 300) { score -= 10; warning++; }
  else if (result.wordCount >= 1000) passed++;
  else passed++;

  // Issues from the audit
  critical += result.issues.filter(i => i.toLowerCase().includes("missing") || i.toLowerCase().includes("error")).length;
  warning += result.issues.filter(i => !i.toLowerCase().includes("missing") && !i.toLowerCase().includes("error")).length;
  score -= Math.min(20, result.issues.length * 3);

  return { score: Math.max(0, Math.min(100, score)), critical, warning, passed };
}
