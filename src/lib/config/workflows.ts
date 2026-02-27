export interface WorkflowDef {
  name: string;
  label: string;
  webhook: string;
  description: string;
  keywords: string[];
  examples: string[];
  category: "seo" | "data" | "infra" | "ai" | "marketing";
}

export const N8N_BASE = "https://n8n.hansvanleeuwen.com";

export const WORKFLOWS: WorkflowDef[] = [
  {
    name: "autoseo",
    label: "AutoSEO Brain",
    webhook: `${N8N_BASE}/webhook/autoseo`,
    description: "Optimize product titles for SEO across NL/BE/DE/EN markets",
    keywords: ["seo", "title", "optimize", "product", "autoseo", "channable", "ranking", "search"],
    examples: ["optimize my product titles", "run autoseo", "improve SEO", "boost rankings"],
    category: "seo",
  },
  {
    name: "product-titles",
    label: "Product Title Optimizer",
    webhook: `${N8N_BASE}/webhook/product-titles`,
    description: "Rewrite and optimize product titles for better conversion and SEO",
    keywords: ["product", "title", "rewrite", "optimize", "titles", "naming", "product-titles"],
    examples: ["rewrite product titles", "optimize titles", "fix product names", "title optimizer"],
    category: "seo",
  },
  {
    name: "health-check",
    label: "Health Check",
    webhook: `${N8N_BASE}/webhook/health-check`,
    description: "Check all services and infrastructure health status",
    keywords: ["health", "check", "status", "ping", "uptime", "monitor", "alive"],
    examples: ["check health", "run health check", "are services up", "system status"],
    category: "infra",
  },
  {
    name: "product-feed",
    label: "Product Feed Optimizer",
    webhook: `${N8N_BASE}/webhook/product-feed`,
    description: "Optimize and sync product feeds across channels (Channable, Google Shopping)",
    keywords: ["feed", "product-feed", "channable", "google shopping", "sync", "export", "catalog"],
    examples: ["optimize product feed", "sync feeds", "update channable", "export products"],
    category: "data",
  },
  {
    name: "campaign",
    label: "Campaign Generator",
    webhook: `${N8N_BASE}/webhook/campaign`,
    description: "Generate and launch marketing campaigns with AI-powered copy",
    keywords: ["campaign", "ads", "google ads", "marketing", "launch", "advertise", "promote"],
    examples: ["create a campaign", "launch ads", "generate campaign", "start marketing"],
    category: "marketing",
  },
  {
    name: "scraper",
    label: "Web Scraper",
    webhook: `${N8N_BASE}/webhook/scraper`,
    description: "Scrape competitor data, pricing, and product information from websites",
    keywords: ["scrape", "scraper", "crawl", "extract", "competitor", "pricing", "spy"],
    examples: ["scrape a website", "get competitor prices", "crawl competitor", "extract data"],
    category: "data",
  },
  {
    name: "monday-orchestrator",
    label: "Monday.com Orchestrator",
    webhook: `${N8N_BASE}/webhook/monday-orchestrator`,
    description: "Central orchestrator that receives Monday.com item events and routes to specialist workflows",
    keywords: ["monday", "orchestrator", "board", "item", "task", "project"],
    examples: ["monday orchestrator", "process monday items", "monday automation"],
    category: "ai",
  },
];

export function getWorkflowByName(name: string): WorkflowDef | undefined {
  return WORKFLOWS.find(
    (w) => w.name === name || w.label.toLowerCase() === name.toLowerCase(),
  );
}
