import { createContext, useContext, type ReactNode } from "react";
import type { BlogPostRow } from "@/lib/api/content";

export interface PreloadedData {
  blogPost: BlogPostRow | null;
}

const PreloadedDataContext = createContext<PreloadedData>({ blogPost: null });

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
