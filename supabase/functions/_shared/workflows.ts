/**
 * Deno-compatible workflow config + fast router.
 * Mirrors src/lib/config/workflows.ts and src/lib/intent/router.ts
 * for use in Supabase Edge Functions.
 */

export interface WorkflowDef {
  name: string;
  label: string;
  webhook: string;
  description: string;
  keywords: string[];
  examples: string[];
  category: "seo" | "data" | "infra" | "ai" | "marketing";
}

export interface RouteResult {
  workflow: WorkflowDef | null;
  confidence: number;
  method: "exact" | "keyword" | "llm" | "clarify";
  alternatives?: WorkflowDef[];
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

// ── Fast Router ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "i", "me", "my", "we", "our", "you", "your", "it", "its", "he",
  "she", "they", "them", "this", "that", "these", "those", "and",
  "but", "or", "nor", "not", "so", "yet", "for", "of", "in", "on",
  "at", "to", "by", "with", "from", "up", "about", "into", "through",
  "please", "run", "start", "launch", "trigger", "execute", "go",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function scoreWorkflow(tokens: string[], wf: WorkflowDef): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  const inputJoined = tokens.join(" ");

  if (inputJoined === wf.name || inputJoined === wf.label.toLowerCase()) {
    return 1.0;
  }

  if (inputJoined.includes(wf.name)) {
    score = Math.max(score, 0.9);
  }

  const keywordHits = wf.keywords.filter((kw) =>
    tokens.some((t) => t === kw || kw.includes(t) || t.includes(kw)),
  ).length;
  const keywordScore = keywordHits / Math.max(wf.keywords.length, 1);
  score = Math.max(score, keywordScore);

  for (const example of wf.examples) {
    const exTokens = tokenize(example);
    if (exTokens.length === 0) continue;
    const overlap = exTokens.filter((et) =>
      tokens.some((t) => t === et || et.includes(t) || t.includes(et)),
    ).length;
    const exScore = overlap / Math.max(exTokens.length, 1);
    score = Math.max(score, exScore * 0.95);
  }

  return score;
}

export function fastRoute(input: string): RouteResult {
  const tokens = tokenize(input);
  if (tokens.length === 0) {
    return { workflow: null, confidence: 0, method: "keyword" };
  }

  const scored = WORKFLOWS.map((wf) => ({
    wf,
    score: scoreWorkflow(tokens, wf),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (best.score >= 0.85) {
    return {
      workflow: best.wf,
      confidence: best.score,
      method: best.score >= 1.0 ? "exact" : "keyword",
    };
  }

  if (best.score >= 0.5) {
    const alternatives = scored
      .filter((s) => s.score >= 0.3)
      .slice(0, 3)
      .map((s) => s.wf);
    return {
      workflow: best.wf,
      confidence: best.score,
      method: "clarify",
      alternatives,
    };
  }

  return { workflow: null, confidence: best.score, method: "keyword" };
}

export function getWorkflowByName(name: string): WorkflowDef | undefined {
  return WORKFLOWS.find(
    (w) => w.name === name || w.label.toLowerCase() === name.toLowerCase(),
  );
}
