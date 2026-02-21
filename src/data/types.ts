export interface CaseStudy {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  year: string;
  externalUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: "professional" | "personal";
  tags: string[];
  date: string;
  readTime: string;
  slug: string;
}
