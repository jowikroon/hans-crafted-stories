import { Server, Workflow, Shield, Activity, Database, Container, Search, FileText, Rss, Megaphone, BarChart3, Code } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SubCategory {
  id: string;
  label: string;
  systemHint: string;
}

export interface ContextCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  subcategories: SubCategory[];
}

export const empireCategories: ContextCategory[] = [
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Server,
    subcategories: [
      { id: "vps-primary", label: "VPS Primary", systemHint: "Focus on primary VPS server srv1402218 — Nginx, Node, system resources." },
      { id: "vps-industrial", label: "VPS Industrial", systemHint: "Focus on industrial VPS server srv1411336 — heavy workloads, Docker." },
      { id: "cloudflare", label: "Cloudflare", systemHint: "Focus on Cloudflare Workers, Zero Trust, DNS, and CDN configuration." },
      { id: "dns", label: "DNS", systemHint: "Focus on DNS records, propagation, and domain management." },
      { id: "ssl", label: "SSL", systemHint: "Focus on SSL certificates, HTTPS configuration, and TLS settings." },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: Workflow,
    subcategories: [
      { id: "autoseo", label: "AutoSEO", systemHint: "Focus on the AutoSEO n8n workflow — triggers, nodes, and execution." },
      { id: "product-titles", label: "Product Titles", systemHint: "Focus on the Product Title Optimizer workflow." },
      { id: "channable", label: "Channable", systemHint: "Focus on Channable feed optimization workflows." },
      { id: "custom", label: "Custom", systemHint: "Focus on building new custom n8n workflows." },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    subcategories: [
      { id: "zero-trust", label: "Zero Trust", systemHint: "Focus on Cloudflare Zero Trust access policies." },
      { id: "firewall", label: "Firewall", systemHint: "Focus on firewall rules, iptables, and network security." },
      { id: "auth", label: "Auth", systemHint: "Focus on authentication, API keys, and access tokens." },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
    subcategories: [
      { id: "health", label: "Health Checks", systemHint: "Focus on service health monitoring and uptime." },
      { id: "logs", label: "Logs", systemHint: "Focus on log analysis, error tracking, and debugging." },
      { id: "alerts", label: "Alerts", systemHint: "Focus on monitoring alerts and notification rules." },
    ],
  },
  {
    id: "database",
    label: "Database",
    icon: Database,
    subcategories: [
      { id: "supabase", label: "Supabase", systemHint: "Focus on Supabase database, edge functions, and RLS policies." },
      { id: "queries", label: "Queries", systemHint: "Focus on SQL queries, optimization, and indexing." },
      { id: "migrations", label: "Migrations", systemHint: "Focus on database migrations and schema changes." },
    ],
  },
  {
    id: "docker",
    label: "Docker",
    icon: Container,
    subcategories: [
      { id: "mcp-gateway", label: "MCP Gateway", systemHint: "Focus on Docker MCP Gateway and custom MCP servers." },
      { id: "containers", label: "Containers", systemHint: "Focus on Docker container management, compose, and images." },
      { id: "networking", label: "Networking", systemHint: "Focus on Docker networking, ports, and inter-service communication." },
    ],
  },
];

export const hansAICategories: ContextCategory[] = [
  {
    id: "seo",
    label: "SEO",
    icon: Search,
    subcategories: [
      { id: "technical-seo", label: "Technical SEO", systemHint: "Focus on technical SEO — crawlability, indexing, Core Web Vitals." },
      { id: "on-page", label: "On-Page", systemHint: "Focus on on-page SEO — headings, content structure, keyword density." },
      { id: "keywords", label: "Keywords", systemHint: "Focus on keyword research, search intent, and ranking opportunities." },
      { id: "meta-tags", label: "Meta Tags", systemHint: "Focus on meta titles, descriptions, and Open Graph tags." },
      { id: "schema", label: "Schema", systemHint: "Focus on structured data, JSON-LD, and rich snippets." },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    subcategories: [
      { id: "blog", label: "Blog Posts", systemHint: "Focus on blog content creation, structure, and optimization." },
      { id: "product", label: "Product Copy", systemHint: "Focus on product descriptions and e-commerce copy." },
      { id: "landing", label: "Landing Pages", systemHint: "Focus on landing page copy, CTAs, and conversion." },
    ],
  },
  {
    id: "feeds",
    label: "Feeds",
    icon: Rss,
    subcategories: [
      { id: "channable", label: "Channable", systemHint: "Focus on Channable feed setup, rules, and optimization." },
      { id: "google-shopping", label: "Google Shopping", systemHint: "Focus on Google Shopping feed attributes and compliance." },
      { id: "product-data", label: "Product Data", systemHint: "Focus on product data quality, mapping, and enrichment." },
    ],
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    subcategories: [
      { id: "google-ads", label: "Google Ads", systemHint: "Focus on Google Ads campaigns, bidding, and optimization." },
      { id: "social", label: "Social Media", systemHint: "Focus on social media campaigns and content strategy." },
      { id: "email", label: "Email", systemHint: "Focus on email marketing campaigns and automation." },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    subcategories: [
      { id: "ga4", label: "GA4", systemHint: "Focus on Google Analytics 4 setup, events, and reporting." },
      { id: "gsc", label: "Search Console", systemHint: "Focus on Google Search Console data and performance." },
      { id: "reporting", label: "Reporting", systemHint: "Focus on data visualization and automated reporting." },
    ],
  },
  {
    id: "code",
    label: "Code",
    icon: Code,
    subcategories: [
      { id: "react", label: "React", systemHint: "Focus on React components, hooks, and front-end architecture." },
      { id: "api", label: "API", systemHint: "Focus on API integrations, endpoints, and data fetching." },
      { id: "automation", label: "Automation", systemHint: "Focus on code automation scripts and tooling." },
    ],
  },
];

// Unified categories — merge empire + hansAI (de-duplicate channable which appears in both)
export const unifiedCategories: ContextCategory[] = [
  ...empireCategories,
  ...hansAICategories.map(cat => {
    // Avoid duplicate subcategory IDs across empire + hansAI
    if (cat.id === "feeds") {
      return {
        ...cat,
        subcategories: cat.subcategories.map(sub =>
          sub.id === "channable" ? { ...sub, id: "channable-feeds", label: "Channable Feeds" } : sub
        ),
      };
    }
    return cat;
  }),
];

export function buildContextPrefix(
  categories: ContextCategory[],
  categoryId: string | null,
  subId: string | null
): string {
  if (!categoryId || !subId) return "";
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return "";
  const sub = cat.subcategories.find(s => s.id === subId);
  if (!sub) return "";
  return `[CONTEXT: Focus on ${cat.label} > ${sub.label}. ${sub.systemHint}]\n\n`;
}
