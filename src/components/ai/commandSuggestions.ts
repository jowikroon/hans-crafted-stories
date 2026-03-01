import { WORKFLOWS } from "@/lib/config/workflows";

export interface CommandSuggestion {
  text: string;
  verified: boolean;
}

/** Subcategory ID → workflow names that are "real" for that sub (used for availability filtering). */
const SUB_TO_WORKFLOW_NAMES: Record<string, string[]> = {
  autoseo: ["autoseo"],
  "product-titles": ["product-titles"],
  channable: ["product-feed"],
  "channable-feeds": ["product-feed"],
  custom: ["autoseo", "product-titles", "product-feed", "health-check", "campaign", "scraper", "monday-orchestrator", "google"],
  health: ["health-check"],
  "google-ads": ["campaign"],
  campaign: ["campaign"],
  "product-data": ["product-feed"],
  "google-shopping": ["product-feed"],
  scraper: ["scraper"],
  "monday-orchestrator": ["monday-orchestrator"],
  google: ["google"],
};

export const empireCommands: Record<string, CommandSuggestion[]> = {
  // Infrastructure
  "vps-primary": [
    { text: "Check VPS disk usage and memory", verified: true },
    { text: "Restart Nginx on primary server", verified: true },
    { text: "Show active Docker containers", verified: true },
    { text: "Check SSL certificate expiry dates", verified: true },
    { text: "Tail the last 100 lines of error log", verified: true },
    { text: "Set up a cron job for daily backups", verified: false },
    { text: "Optimize Nginx worker connections", verified: false },
    { text: "Configure fail2ban for SSH protection", verified: false },
    { text: "Set up log rotation for app logs", verified: false },
    { text: "Create a health check endpoint", verified: false },
  ],
  "vps-industrial": [
    { text: "Check CPU and RAM usage on industrial VPS", verified: true },
    { text: "List running Docker services", verified: true },
    { text: "Restart all Docker compose services", verified: true },
    { text: "Show disk I/O stats", verified: true },
    { text: "Check swap usage and memory pressure", verified: true },
    { text: "Set up monitoring with Prometheus", verified: false },
    { text: "Configure auto-scaling rules", verified: false },
    { text: "Optimize Docker resource limits", verified: false },
    { text: "Set up distributed logging", verified: false },
    { text: "Create backup strategy for volumes", verified: false },
  ],
  "cloudflare": [
    { text: "List all Cloudflare Workers", verified: true },
    { text: "Check Zero Trust access policies", verified: true },
    { text: "Purge CDN cache for all zones", verified: true },
    { text: "Show DNS records for primary domain", verified: true },
    { text: "Check Worker request analytics", verified: true },
    { text: "Set up a new Cloudflare Worker", verified: false },
    { text: "Configure WAF custom rules", verified: false },
    { text: "Set up rate limiting", verified: false },
    { text: "Enable bot protection", verified: false },
    { text: "Configure page rules for caching", verified: false },
  ],
  "dns": [
    { text: "List all DNS records", verified: true },
    { text: "Check DNS propagation status", verified: true },
    { text: "Show MX records configuration", verified: true },
    { text: "Verify DKIM and SPF records", verified: true },
    { text: "Check CNAME flattening status", verified: true },
    { text: "Set up wildcard DNS record", verified: false },
    { text: "Configure DNS-based failover", verified: false },
    { text: "Add CAA records for SSL", verified: false },
    { text: "Set up GeoDNS routing", verified: false },
    { text: "Migrate DNS to new provider", verified: false },
  ],
  "ssl": [
    { text: "Check SSL certificate expiry for all domains", verified: true },
    { text: "Test SSL configuration with SSL Labs", verified: true },
    { text: "Show current TLS versions enabled", verified: true },
    { text: "Verify HSTS headers are set", verified: true },
    { text: "Check certificate chain validity", verified: true },
    { text: "Generate new Let's Encrypt certificate", verified: false },
    { text: "Configure OCSP stapling", verified: false },
    { text: "Set up certificate auto-renewal", verified: false },
    { text: "Enable TLS 1.3 only mode", verified: false },
    { text: "Configure client certificate auth", verified: false },
  ],
  // Workflows
  "autoseo": [
    { text: "Check AutoSEO workflow execution status", verified: true },
    { text: "Show last 10 AutoSEO runs", verified: true },
    { text: "Debug AutoSEO webhook trigger", verified: true },
    { text: "List AutoSEO workflow nodes", verified: true },
    { text: "Check AutoSEO error logs", verified: true },
    { text: "Add new keyword source to AutoSEO", verified: false },
    { text: "Optimize AutoSEO batch processing", verified: false },
    { text: "Add competitor tracking node", verified: false },
    { text: "Set up A/B testing for titles", verified: false },
    { text: "Create AutoSEO performance dashboard", verified: false },
  ],
  "product-titles": [
    { text: "Run Product Title Optimizer on latest batch", verified: true },
    { text: "Show optimization statistics", verified: true },
    { text: "Check failed title optimizations", verified: true },
    { text: "Preview optimized vs original titles", verified: true },
    { text: "Export optimized titles to CSV", verified: true },
    { text: "Add brand guidelines to optimizer", verified: false },
    { text: "Set up multilingual title optimization", verified: false },
    { text: "Create title length validation rules", verified: false },
    { text: "Add category-specific templates", verified: false },
    { text: "Integrate with inventory system", verified: false },
  ],
  "channable": [
    { text: "Check Channable feed sync status", verified: true },
    { text: "Show feed error count", verified: true },
    { text: "List active Channable rules", verified: true },
    { text: "Preview feed output for sample products", verified: true },
    { text: "Check feed export schedule", verified: true },
    { text: "Create dynamic pricing rules", verified: false },
    { text: "Set up feed quality monitoring", verified: false },
    { text: "Add custom feed attributes", verified: false },
    { text: "Build Google Shopping compliance check", verified: false },
    { text: "Automate feed category mapping", verified: false },
  ],
  "custom": [
    { text: "List all active n8n workflows", verified: true },
    { text: "Show workflow execution history", verified: true },
    { text: "Check n8n server resource usage", verified: true },
    { text: "Export workflow as JSON", verified: true },
    { text: "Test webhook endpoint connectivity", verified: true },
    { text: "Build a data enrichment workflow", verified: false },
    { text: "Create error notification pipeline", verified: false },
    { text: "Set up workflow version control", verified: false },
    { text: "Build customer data sync workflow", verified: false },
    { text: "Create automated reporting pipeline", verified: false },
  ],
  // Security
  "zero-trust": [
    { text: "List all Zero Trust access policies", verified: true },
    { text: "Check active user sessions", verified: true },
    { text: "Show blocked access attempts", verified: true },
    { text: "Verify identity provider config", verified: true },
    { text: "Check tunnel health status", verified: true },
    { text: "Add new application to Zero Trust", verified: false },
    { text: "Set up device posture checks", verified: false },
    { text: "Configure geo-blocking rules", verified: false },
    { text: "Set up session duration limits", verified: false },
    { text: "Enable WARP client requirement", verified: false },
  ],
  "firewall": [
    { text: "Show current iptables rules", verified: true },
    { text: "List open ports on server", verified: true },
    { text: "Check fail2ban banned IPs", verified: true },
    { text: "Show recent SSH login attempts", verified: true },
    { text: "Verify UFW firewall status", verified: true },
    { text: "Set up port knocking", verified: false },
    { text: "Configure rate limiting per IP", verified: false },
    { text: "Block specific country ranges", verified: false },
    { text: "Set up intrusion detection", verified: false },
    { text: "Create firewall audit report", verified: false },
  ],
  "auth": [
    { text: "List all active API keys", verified: true },
    { text: "Check token expiry dates", verified: true },
    { text: "Show OAuth provider configuration", verified: true },
    { text: "Verify JWT signing keys", verified: true },
    { text: "Check RLS policy coverage", verified: true },
    { text: "Rotate all API keys", verified: false },
    { text: "Set up API key rate limiting", verified: false },
    { text: "Configure MFA for admin accounts", verified: false },
    { text: "Create API key audit trail", verified: false },
    { text: "Set up webhook signing", verified: false },
  ],
  // Monitoring
  "health": [
    { text: "Run full health check on all services", verified: true },
    { text: "Check all endpoint response times", verified: true },
    { text: "Show uptime percentage this month", verified: true },
    { text: "List services with degraded performance", verified: true },
    { text: "Check database connection pool status", verified: true },
    { text: "Set up synthetic monitoring", verified: false },
    { text: "Configure health check notifications", verified: false },
    { text: "Create status page", verified: false },
    { text: "Set up dependency health mapping", verified: false },
    { text: "Build SLA compliance dashboard", verified: false },
  ],
  "logs": [
    { text: "Show last 50 error logs", verified: true },
    { text: "Search logs for specific error pattern", verified: true },
    { text: "Show log volume by service", verified: true },
    { text: "Check application crash logs", verified: true },
    { text: "Show slow query log entries", verified: true },
    { text: "Set up centralized log aggregation", verified: false },
    { text: "Create log-based alerting rules", verified: false },
    { text: "Configure structured logging format", verified: false },
    { text: "Set up log retention policy", verified: false },
    { text: "Build error pattern detection", verified: false },
  ],
  "alerts": [
    { text: "List all active alert rules", verified: true },
    { text: "Show alert history for today", verified: true },
    { text: "Check notification channel status", verified: true },
    { text: "Show currently firing alerts", verified: true },
    { text: "Verify alert escalation paths", verified: true },
    { text: "Create CPU usage alert threshold", verified: false },
    { text: "Set up PagerDuty integration", verified: false },
    { text: "Configure alert suppression rules", verified: false },
    { text: "Build alert correlation engine", verified: false },
    { text: "Create on-call rotation schedule", verified: false },
  ],
  // Database
  "supabase": [
    { text: "Check database size and row counts", verified: true },
    { text: "List all tables with RLS policies", verified: true },
    { text: "Show active edge functions", verified: true },
    { text: "Check database connection count", verified: true },
    { text: "Show recent migration history", verified: true },
    { text: "Optimize slow performing queries", verified: false },
    { text: "Set up real-time subscriptions", verified: false },
    { text: "Create database backup strategy", verified: false },
    { text: "Add missing indexes for performance", verified: false },
    { text: "Set up connection pooling with PgBouncer", verified: false },
  ],
  "queries": [
    { text: "Show slowest queries in the last hour", verified: true },
    { text: "Analyze query execution plan", verified: true },
    { text: "Check index usage statistics", verified: true },
    { text: "Show table bloat percentage", verified: true },
    { text: "List missing indexes", verified: true },
    { text: "Optimize a specific slow query", verified: false },
    { text: "Create materialized view for reports", verified: false },
    { text: "Set up query performance monitoring", verified: false },
    { text: "Build query caching layer", verified: false },
    { text: "Create database partitioning strategy", verified: false },
  ],
  "migrations": [
    { text: "Show pending migrations", verified: true },
    { text: "Check migration history", verified: true },
    { text: "Validate current schema state", verified: true },
    { text: "Show latest migration diff", verified: true },
    { text: "Check for schema conflicts", verified: true },
    { text: "Generate migration for new feature", verified: false },
    { text: "Create rollback migration", verified: false },
    { text: "Set up migration CI/CD pipeline", verified: false },
    { text: "Build schema documentation", verified: false },
    { text: "Create seed data migration", verified: false },
  ],
  // Docker
  "mcp-gateway": [
    { text: "Check MCP Gateway health status", verified: true },
    { text: "List connected MCP servers", verified: true },
    { text: "Show MCP request logs", verified: true },
    { text: "Restart MCP Gateway container", verified: true },
    { text: "Check MCP server response times", verified: true },
    { text: "Add new MCP server integration", verified: false },
    { text: "Set up MCP load balancing", verified: false },
    { text: "Configure MCP request caching", verified: false },
    { text: "Build MCP health dashboard", verified: false },
    { text: "Create MCP failover strategy", verified: false },
  ],
  "containers": [
    { text: "List all running containers with stats", verified: true },
    { text: "Show container resource usage", verified: true },
    { text: "Check container restart counts", verified: true },
    { text: "Show Docker compose service status", verified: true },
    { text: "View container logs for last hour", verified: true },
    { text: "Optimize container image sizes", verified: false },
    { text: "Set up container auto-restart policies", verified: false },
    { text: "Create Docker compose override", verified: false },
    { text: "Build multi-stage Dockerfile", verified: false },
    { text: "Set up container vulnerability scanning", verified: false },
  ],
  "networking": [
    { text: "Show Docker network configuration", verified: true },
    { text: "List exposed ports per container", verified: true },
    { text: "Check inter-service connectivity", verified: true },
    { text: "Show network traffic statistics", verified: true },
    { text: "Verify DNS resolution in containers", verified: true },
    { text: "Set up service mesh", verified: false },
    { text: "Configure network segmentation", verified: false },
    { text: "Set up container-level firewall", verified: false },
    { text: "Build network monitoring dashboard", verified: false },
    { text: "Configure reverse proxy routing", verified: false },
  ],
};

export const hansAICommands: Record<string, CommandSuggestion[]> = {
  // SEO
  "technical-seo": [
    { text: "Run a Core Web Vitals audit", verified: true },
    { text: "Check robots.txt and sitemap.xml", verified: true },
    { text: "Analyze crawl errors in Search Console", verified: true },
    { text: "Check page load speed scores", verified: true },
    { text: "Verify canonical tag implementation", verified: true },
    { text: "Fix render-blocking resources", verified: false },
    { text: "Implement lazy loading for images", verified: false },
    { text: "Set up server-side rendering", verified: false },
    { text: "Optimize JavaScript bundle size", verified: false },
    { text: "Create XML sitemap automation", verified: false },
  ],
  "on-page": [
    { text: "Audit heading structure for top pages", verified: true },
    { text: "Check keyword density for target terms", verified: true },
    { text: "Analyze internal linking structure", verified: true },
    { text: "Review image alt tag coverage", verified: true },
    { text: "Check content readability scores", verified: true },
    { text: "Optimize content for featured snippets", verified: false },
    { text: "Create content gap analysis", verified: false },
    { text: "Build topic cluster strategy", verified: false },
    { text: "Set up content freshness automation", verified: false },
    { text: "Create FAQ schema for top pages", verified: false },
  ],
  "keywords": [
    { text: "Research keywords for brake pads category", verified: true },
    { text: "Show keyword ranking positions", verified: true },
    { text: "Find long-tail keyword opportunities", verified: true },
    { text: "Analyze competitor keyword gaps", verified: true },
    { text: "Check search intent for target keywords", verified: true },
    { text: "Build keyword clustering map", verified: false },
    { text: "Create seasonal keyword calendar", verified: false },
    { text: "Set up rank tracking automation", verified: false },
    { text: "Find question-based keywords", verified: false },
    { text: "Analyze keyword cannibalization", verified: false },
  ],
  "meta-tags": [
    { text: "Audit all meta titles for length compliance", verified: true },
    { text: "Check meta descriptions for uniqueness", verified: true },
    { text: "Verify Open Graph tags on all pages", verified: true },
    { text: "Show pages with missing meta tags", verified: true },
    { text: "Preview SERP snippets for top pages", verified: true },
    { text: "Generate optimized meta titles in bulk", verified: false },
    { text: "Create dynamic meta tag templates", verified: false },
    { text: "Set up meta tag A/B testing", verified: false },
    { text: "Build meta tag validation pipeline", verified: false },
    { text: "Create Twitter Card meta tags", verified: false },
  ],
  "schema": [
    { text: "Validate JSON-LD on all product pages", verified: true },
    { text: "Check rich snippet eligibility", verified: true },
    { text: "Show current schema markup coverage", verified: true },
    { text: "Test structured data with Google tool", verified: true },
    { text: "List pages missing schema markup", verified: true },
    { text: "Add FAQ schema to category pages", verified: false },
    { text: "Create HowTo schema for guides", verified: false },
    { text: "Build product schema generator", verified: false },
    { text: "Add breadcrumb schema markup", verified: false },
    { text: "Create organization schema", verified: false },
  ],
  // Content
  "blog": [
    { text: "Generate blog post outline for auto parts", verified: true },
    { text: "Optimize existing blog post for target keyword", verified: true },
    { text: "Create content calendar for next month", verified: true },
    { text: "Analyze top performing blog posts", verified: true },
    { text: "Check blog post internal link coverage", verified: true },
    { text: "Write a comparison article template", verified: false },
    { text: "Create pillar content strategy", verified: false },
    { text: "Build blog post scoring system", verified: false },
    { text: "Set up automated content brief generation", verified: false },
    { text: "Create content repurposing pipeline", verified: false },
  ],
  "product": [
    { text: "Optimize product descriptions for SEO", verified: true },
    { text: "Generate bullet points for product features", verified: true },
    { text: "Create product comparison copy", verified: true },
    { text: "Write category page introductions", verified: true },
    { text: "Check product copy for duplicate content", verified: true },
    { text: "Build product description templates", verified: false },
    { text: "Create multilingual product copy", verified: false },
    { text: "Set up AI product copy pipeline", verified: false },
    { text: "Build USP extraction from reviews", verified: false },
    { text: "Create product storytelling framework", verified: false },
  ],
  "landing": [
    { text: "Write hero section copy for landing page", verified: true },
    { text: "Create CTA variations for testing", verified: true },
    { text: "Optimize landing page for conversion", verified: true },
    { text: "Write social proof section copy", verified: true },
    { text: "Create urgency elements for campaigns", verified: true },
    { text: "Build landing page template library", verified: false },
    { text: "Create personalized landing page copy", verified: false },
    { text: "Set up multivariate copy testing", verified: false },
    { text: "Build headline formula generator", verified: false },
    { text: "Create industry-specific landing pages", verified: false },
  ],
  // Feeds
  "channable": [
    { text: "Check Channable feed health status", verified: true },
    { text: "Show products with feed errors", verified: true },
    { text: "List active feed rules and conditions", verified: true },
    { text: "Preview feed output for category", verified: true },
    { text: "Check feed export timing", verified: true },
    { text: "Create dynamic pricing feed rules", verified: false },
    { text: "Set up feed quality score tracking", verified: false },
    { text: "Build automated feed optimization", verified: false },
    { text: "Create feed A/B testing setup", verified: false },
    { text: "Build multi-marketplace feed strategy", verified: false },
  ],
  "google-shopping": [
    { text: "Check Google Merchant Center status", verified: true },
    { text: "Show disapproved products and reasons", verified: true },
    { text: "Verify product data specification compliance", verified: true },
    { text: "Check feed submission history", verified: true },
    { text: "Show products with missing GTIN", verified: true },
    { text: "Optimize product titles for Shopping", verified: false },
    { text: "Fix product image requirements", verified: false },
    { text: "Set up supplemental feeds", verified: false },
    { text: "Create promotion feeds", verified: false },
    { text: "Build local inventory feed", verified: false },
  ],
  "product-data": [
    { text: "Audit product data completeness", verified: true },
    { text: "Show products with missing attributes", verified: true },
    { text: "Check product category mapping accuracy", verified: true },
    { text: "Verify product image availability", verified: true },
    { text: "Show duplicate product entries", verified: true },
    { text: "Build product data enrichment pipeline", verified: false },
    { text: "Create automated data validation rules", verified: false },
    { text: "Set up product data normalization", verified: false },
    { text: "Build attribute extraction from descriptions", verified: false },
    { text: "Create product taxonomy mapping", verified: false },
  ],
  // Campaigns
  "google-ads": [
    { text: "Show Google Ads performance summary", verified: true },
    { text: "Check campaign budget utilization", verified: true },
    { text: "List underperforming ad groups", verified: true },
    { text: "Show quality score distribution", verified: true },
    { text: "Analyze search term reports", verified: true },
    { text: "Create new Shopping campaign structure", verified: false },
    { text: "Build automated bid strategy", verified: false },
    { text: "Set up negative keyword automation", verified: false },
    { text: "Create responsive search ad variations", verified: false },
    { text: "Build Performance Max campaign", verified: false },
  ],
  "social": [
    { text: "Create social media post for product launch", verified: true },
    { text: "Show social engagement metrics", verified: true },
    { text: "Generate hashtag suggestions", verified: true },
    { text: "Create social media content calendar", verified: true },
    { text: "Analyze best posting times", verified: true },
    { text: "Build influencer outreach campaign", verified: false },
    { text: "Create user-generated content strategy", verified: false },
    { text: "Set up social listening alerts", verified: false },
    { text: "Build cross-platform content automation", verified: false },
    { text: "Create social commerce strategy", verified: false },
  ],
  "email": [
    { text: "Create email campaign for new arrivals", verified: true },
    { text: "Show email open and click rates", verified: true },
    { text: "Generate subject line variations", verified: true },
    { text: "Build abandoned cart email sequence", verified: true },
    { text: "Check email deliverability score", verified: true },
    { text: "Create personalized email templates", verified: false },
    { text: "Set up email segmentation strategy", verified: false },
    { text: "Build email preference center", verified: false },
    { text: "Create win-back email automation", verified: false },
    { text: "Set up transactional email branding", verified: false },
  ],
  // Analytics
  "ga4": [
    { text: "Show GA4 traffic overview for this week", verified: true },
    { text: "Check conversion tracking status", verified: true },
    { text: "Show top landing pages by sessions", verified: true },
    { text: "Analyze user flow and drop-off points", verified: true },
    { text: "Check event tracking implementation", verified: true },
    { text: "Set up enhanced e-commerce tracking", verified: false },
    { text: "Create custom GA4 explorations", verified: false },
    { text: "Build audience segmentation strategy", verified: false },
    { text: "Set up cross-domain tracking", verified: false },
    { text: "Create attribution model comparison", verified: false },
  ],
  "gsc": [
    { text: "Show Search Console performance summary", verified: true },
    { text: "Check indexing coverage status", verified: true },
    { text: "List pages with declining impressions", verified: true },
    { text: "Show mobile usability issues", verified: true },
    { text: "Check Core Web Vitals report", verified: true },
    { text: "Find keyword cannibalization issues", verified: false },
    { text: "Create search performance alerts", verified: false },
    { text: "Build ranking opportunity report", verified: false },
    { text: "Set up automated GSC reporting", verified: false },
    { text: "Create content optimization queue", verified: false },
  ],
  "reporting": [
    { text: "Generate weekly SEO performance report", verified: true },
    { text: "Create campaign ROI dashboard", verified: true },
    { text: "Show month-over-month traffic trends", verified: true },
    { text: "Build executive summary report", verified: true },
    { text: "Compare performance across channels", verified: true },
    { text: "Create automated daily report email", verified: false },
    { text: "Build custom KPI dashboard", verified: false },
    { text: "Set up anomaly detection reporting", verified: false },
    { text: "Create cohort analysis report", verified: false },
    { text: "Build client-facing report template", verified: false },
  ],
  // Code
  "react": [
    { text: "Review component architecture", verified: true },
    { text: "Check for performance bottlenecks", verified: true },
    { text: "Audit state management patterns", verified: true },
    { text: "Show component dependency tree", verified: true },
    { text: "Check for accessibility issues", verified: true },
    { text: "Refactor to use custom hooks", verified: false },
    { text: "Add error boundaries to key sections", verified: false },
    { text: "Implement code splitting", verified: false },
    { text: "Create component testing suite", verified: false },
    { text: "Build design system documentation", verified: false },
  ],
  "api": [
    { text: "List all API endpoints and methods", verified: true },
    { text: "Check API response times", verified: true },
    { text: "Test API authentication flow", verified: true },
    { text: "Show API error rate statistics", verified: true },
    { text: "Verify API rate limit configuration", verified: true },
    { text: "Build API documentation with OpenAPI", verified: false },
    { text: "Set up API versioning strategy", verified: false },
    { text: "Create API monitoring dashboard", verified: false },
    { text: "Build webhook retry mechanism", verified: false },
    { text: "Set up API caching layer", verified: false },
  ],
  "automation": [
    { text: "List all running automation scripts", verified: true },
    { text: "Check cron job execution history", verified: true },
    { text: "Show automation error logs", verified: true },
    { text: "Verify CI/CD pipeline status", verified: true },
    { text: "Check scheduled task queue", verified: true },
    { text: "Build deployment automation script", verified: false },
    { text: "Create database seed automation", verified: false },
    { text: "Set up infrastructure as code", verified: false },
    { text: "Build automated testing pipeline", verified: false },
    { text: "Create release management automation", verified: false },
  ],
};

// Unified commands — merge empire + hansAI (rename channable to channable-feeds for hansAI)
export const unifiedCommands: Record<string, CommandSuggestion[]> = {
  ...empireCommands,
  ...Object.fromEntries(
    Object.entries(hansAICommands).map(([key, val]) =>
      key === "channable" ? ["channable-feeds", val] : [key, val]
    )
  ),
};

const STORAGE_KEY_EMPIRE = "cmd_usage_empire";
const STORAGE_KEY_HANSAI = "cmd_usage_hansai";
const STORAGE_KEY_UNIFIED = "cmd_usage_unified";

export function getUsageCounts(context: "empire" | "hansai" | "unified"): Record<string, number> {
  const key = context === "empire" ? STORAGE_KEY_EMPIRE : context === "hansai" ? STORAGE_KEY_HANSAI : STORAGE_KEY_UNIFIED;
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

export function incrementUsage(context: "empire" | "hansai" | "unified", commandText: string): void {
  const key = context === "empire" ? STORAGE_KEY_EMPIRE : context === "hansai" ? STORAGE_KEY_HANSAI : STORAGE_KEY_UNIFIED;
  const counts = getUsageCounts(context);
  counts[commandText] = (counts[commandText] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(counts));
}

export function getSortedCommands(
  commands: CommandSuggestion[],
  usageCounts: Record<string, number>
): CommandSuggestion[] {
  return [...commands].sort((a, b) => {
    const usageA = usageCounts[a.text] || 0;
    const usageB = usageCounts[b.text] || 0;
    if (usageB !== usageA) return usageB - usageA;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return 0;
  });
}

/** Phrases from real workflows for a sub (examples + labels) for availability ranking. */
function getAvailablePhrasesForSub(subId: string): Set<string> {
  const names = SUB_TO_WORKFLOW_NAMES[subId];
  if (!names?.length) return new Set();
  const phrases = new Set<string>();
  for (const w of WORKFLOWS) {
    if (!names.includes(w.name)) continue;
    phrases.add(w.label.toLowerCase());
    for (const ex of w.examples) phrases.add(ex.toLowerCase());
  }
  return phrases;
}

/** True if the command text is covered by real workflow examples/label (logical match). */
function commandMatchesAvailability(cmdText: string, availablePhrases: Set<string>): boolean {
  if (availablePhrases.size === 0) return false;
  const lower = cmdText.toLowerCase();
  for (const p of availablePhrases) {
    if (p.includes(lower) || lower.includes(p)) return true;
  }
  return false;
}

const TOP_10_LIMIT = 10;

/**
 * Top 10 commands for a sub: based on (1) latest success proxy = usage count,
 * (2) real functions availability = verified or matches workflow examples,
 * (3) logical ordering = usage desc, then verified, then availability match.
 * Returns at most TOP_10_LIMIT (10) items.
 */
export function getTop10Commands(
  subId: string,
  context: "empire" | "hansai" | "unified",
  usageCounts: Record<string, number>
): CommandSuggestion[] {
  const commandMap = context === "empire" ? empireCommands : context === "unified" ? unifiedCommands : hansAICommands;
  const rawCommands: CommandSuggestion[] = commandMap[subId] || [];
  const availablePhrases = getAvailablePhrasesForSub(subId);

  const sorted = [...rawCommands].sort((a, b) => {
    const usageA = usageCounts[a.text] || 0;
    const usageB = usageCounts[b.text] || 0;
    if (usageB !== usageA) return usageB - usageA;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const matchA = commandMatchesAvailability(a.text, availablePhrases) ? 1 : 0;
    const matchB = commandMatchesAvailability(b.text, availablePhrases) ? 1 : 0;
    if (matchB !== matchA) return matchB - matchA;
    return 0;
  });

  return sorted.slice(0, TOP_10_LIMIT);
}
