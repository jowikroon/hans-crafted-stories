import { createContext, useContext, type ReactNode } from "react";
import type { BlogPostRow, CaseStudyRow } from "@/lib/api/content";

export interface PreloadedData {
  blogPost: BlogPostRow | null;
  blogPosts?: BlogPostRow[] | null;
  /** Gepubliceerde CMS-projecten voor /work (prerender = client, geen tweede bron). */
  caseStudies?: CaseStudyRow[] | null;
}

const PreloadedDataContext = createContext<PreloadedData>({ blogPost: null, blogPosts: null });

export function PreloadedDataProvider({
  value,
  children,
}: {
  value: PreloadedData;
  children: ReactNode;
}) {
  return (
    <PreloadedDataContext.Provider value={value}>
      {children}
    </PreloadedDataContext.Provider>
  );
}

export function usePreloadedData(): PreloadedData {
  return useContext(PreloadedDataContext);
}

/** Returns the preloaded blog post if it matches the current slug (for SSR/hydration). */
export function usePreloadedBlogPost(slug: string | undefined): BlogPostRow | null {
  const { blogPost } = useContext(PreloadedDataContext);
  if (!slug || !blogPost) return null;
  return blogPost.slug === slug ? blogPost : null;
}

/** Preloaded /work-projecten (build-time uit dezelfde CMS-query als de client). */
export function usePreloadedCaseStudies(): CaseStudyRow[] | null {
  const { caseStudies } = useContext(PreloadedDataContext);
  return caseStudies ?? null;
}

/** Returns preloaded blog posts list if available (for /writing SSR/hydration). */
export function usePreloadedBlogPosts(): BlogPostRow[] | null {
  const { blogPosts } = useContext(PreloadedDataContext);
  return blogPosts ?? null;
}
