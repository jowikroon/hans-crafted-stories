export interface CaseStudy {
  id: string;
  title: string;
  titleNl?: string;
  category: string;
  description: string;
  descriptionNl?: string;
  image: string;
  year: string;
  externalUrl?: string;
  internalUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  titleNl?: string;
  excerptNl?: string;
  category: "professional" | "personal";
  tags: string[];
  date: string;
  readTime: string;
  slug: string;
  imageUrl?: string;
  /**
   * True when this post is a draft (status='draft', published=false).
   * Surfaced on /writing only when Hans is authenticated. RLS handles
   * the server-side gate; this flag drives the CONCEPT badge.
   */
  isDraft?: boolean;
}
