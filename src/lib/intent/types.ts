/**
 * Command Center hierarchy types.
 * Single source of truth for the 3-layer filter (Primary Goal → Tabs → Sub-tools).
 */

export type PrimaryGoal =
  | "seo_content"
  | "n8n_workflows"
  | "data_feeds"
  | "campaigns"
  | "web_scraping"
  | "system_health"
  | "general";

/** Base router context (scope etc.) used by intent-router and hansai-chat. */
export interface RouterContext {
  /** Optional scope/filter (e.g. workflow categories or sub-tool names). */
  scope?: string[];
}

export interface HierarchyContext extends RouterContext {
  primaryGoal: PrimaryGoal;
  activeTabs: string[];
  subTools: string[];
}

/** Exact hierarchy from spec: Laag 1 → Laag 2 (tabs) + Laag 3 (sub-tools). */
export const HIERARCHY_MAP: Record<
  PrimaryGoal,
  { tabs: string[]; subTools: string[] }
> = {
  seo_content: {
    tabs: ["SEO", "Content", "Campaigns", "Analytics"],
    subTools: ["AutoSEO Brain", "Product Title Optimizer", "GA4", "Content CMS"],
  },
  n8n_workflows: {
    tabs: ["Workflows", "Feeds", "Infrastructure"],
    subTools: ["Monday.com Orchestrator", "Channable Optimizer", "Product Feed"],
  },
  data_feeds: {
    tabs: ["Feeds", "Database", "Campaigns"],
    subTools: ["Magento Sync", "Channable Feeds", "Google Ads"],
  },
  campaigns: {
    tabs: ["Campaigns", "SEO", "Analytics"],
    subTools: ["Campaign Generator", "Google Ads"],
  },
  web_scraping: {
    tabs: ["Infrastructure", "Code", "SEO"],
    subTools: ["Web Scraper", "Custom Scrapers"],
  },
  system_health: {
    tabs: ["Infrastructure", "Monitoring", "Security"],
    subTools: ["VPS Primary", "Cloudflare", "DNS", "SSL", "Netdata"],
  },
  general: {
    tabs: ["All"],
    subTools: ["Alle resources"],
  },
};

/** All possible Laag 2 tabs (for reordering; all remain visible). */
export const ALL_TABS = [
  "All",
  "SEO",
  "Content",
  "Campaigns",
  "Analytics",
  "Workflows",
  "Feeds",
  "Infrastructure",
  "Database",
  "Code",
  "Monitoring",
  "Security",
] as const;

export type TabId = (typeof ALL_TABS)[number];

/** Default hierarchy state (empty selection → Algemeen). */
export const DEFAULT_PRIMARY_GOAL: PrimaryGoal = "general";

export function getDefaultHierarchyContext(): HierarchyContext {
  const def = HIERARCHY_MAP[DEFAULT_PRIMARY_GOAL];
  return {
    primaryGoal: DEFAULT_PRIMARY_GOAL,
    activeTabs: [...def.tabs],
    subTools: [...def.subTools],
    scope: [],
  };
}

/** Validate and parse persisted hierarchy from localStorage. */
export function parseHierarchyFromStorage(raw: string | null): HierarchyContext | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const primaryGoal = o.primaryGoal as string;
    const validGoals: PrimaryGoal[] = [
      "seo_content",
      "n8n_workflows",
      "data_feeds",
      "campaigns",
      "web_scraping",
      "system_health",
      "general",
    ];
    if (!validGoals.includes(primaryGoal as PrimaryGoal)) return null;
    const map = HIERARCHY_MAP[primaryGoal as PrimaryGoal];
    const activeTabs = Array.isArray(o.activeTabs)
      ? (o.activeTabs as string[]).filter((t): t is string => typeof t === "string")
      : [...map.tabs];
    const subTools = Array.isArray(o.subTools)
      ? (o.subTools as string[]).filter((s): s is string => typeof s === "string")
      : [...map.subTools];
    const scope = Array.isArray(o.scope)
      ? (o.scope as string[]).filter((s): s is string => typeof s === "string")
      : [];
    return {
      primaryGoal: primaryGoal as PrimaryGoal,
      activeTabs,
      subTools,
      scope,
    };
  } catch {
    return null;
  }
}
