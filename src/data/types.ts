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
}
