/**
 * Command Center V3 data — categories, actions, delivery options.
 * Typed TypeScript module extracted from CommandCenterV3.jsx.
 */

export interface Category {
  icon: string;
  label: string;
  color: string;
  accent: string;
  desc: string;
}

export interface HeroAction {
  id: string;
  label: string;
  sub: string;
  cmd: string;
  tools: string[];
  deliveryType: keyof typeof DELIVERY_OPTIONS;
}

export interface CompactAction {
  id: string;
  label: string;
  sub: string;
  cmd: string;
  tools: string[];
  deliveryType: keyof typeof DELIVERY_OPTIONS;
}

export interface HistoryItem {
  cmd: string;
  ago: string;
  out: string;
}

export interface CategoryActions {
  hero: HeroAction[];
  compact: CompactAction[];
  history: HistoryItem[];
}

export type DeliveryAction = "show_chat" | "csv_download" | "send_n8n" | "send_slack" | "show_plan";

export interface DeliveryOption {
  icon: string;
  label: string;
  note: string;
  best?: boolean;
  action: DeliveryAction;
}

// ═══ CATEGORIES ═══════════════════════════════════════════
export const CATEGORIES: Record<string, Category> = {
  pricing:  { icon: "💰", label: "PRICING",  color: "#EAB308", accent: "#FDE047", desc: "Monitor, compare, alert" },
  seo:      { icon: "📈", label: "SEO",      color: "#22C55E", accent: "#86EFAC", desc: "Rank, audit, optimize" },
  product:  { icon: "📦", label: "PRODUCT",  color: "#A78BFA", accent: "#C4B5FD", desc: "Titles, content, catalog" },
  research: { icon: "🔍", label: "RESEARCH", color: "#60A5FA", accent: "#93C5FD", desc: "Market, gaps, trends" },
  automate: { icon: "🔄", label: "AUTOMATE", color: "#F472B6", accent: "#F9A8D4", desc: "Schedule, chain, monitor" },
  infra:    { icon: "🌐", label: "INFRA",    color: "#818CF8", accent: "#A5B4FC", desc: "Deploy, logs, health" },
  report:   { icon: "📊", label: "REPORT",   color: "#2DD4BF", accent: "#5EEAD4", desc: "KPIs, traffic, rankings" },
  comms:    { icon: "📬", label: "COMMS",    color: "#FB923C", accent: "#FDBA74", desc: "Email, calendar, Slack" },
  manage:   { icon: "📋", label: "MANAGE",   color: "#94A3B8", accent: "#CBD5E1", desc: "Tasks, sprints, boards" },
  ailab:    { icon: "🧠", label: "AI LAB",   color: "#C084FC", accent: "#D8B4FE", desc: "Generate, analyze, learn" },
};

// ═══ ACTIONS ═══════════════════════════════════════════════
export const ACTIONS: Record<string, CategoryActions> = {
  pricing: {
    hero: [
      { id: "p-pulse", label: "Am I being undercut?", sub: "Scan active products — flag every SKU where a competitor is cheaper right now", cmd: "/pricing find all products where competitors are cheaper", tools: ["Bright Data", "OpenAI", "n8n"], deliveryType: "data" },
      { id: "p-check", label: "Quick price check", sub: "Instant comparison on specific SKUs against your known competitors", cmd: "/pricing compare top SKUs against 4 competitors", tools: ["Bright Data", "Google Sheets"], deliveryType: "data" },
    ],
    compact: [
      { id: "p-monitor", label: "Set up competitor monitor", sub: "Recurring tracker with change alerts", cmd: "/pricing build competitor monitoring spreadsheet for 4 competitors", tools: ["Bright Data", "OpenAI", "n8n Schedule"], deliveryType: "data" },
      { id: "p-margin", label: "Margin analysis by category", sub: "Revenue × cost × positioning per category", cmd: "/pricing show margin analysis across product categories", tools: ["Supabase", "OpenAI"], deliveryType: "report" },
      { id: "p-history", label: "Price trend for a product", sub: "90-day movements for you and competitors on one SKU", cmd: "/pricing show price history for brake pads last 90 days", tools: ["Bright Data"], deliveryType: "report" },
      { id: "p-alert", label: "Create price drop alert", sub: "Instant notification when a competitor goes below threshold", cmd: "/pricing alert when autodoc drops below €24 on brake pads", tools: ["n8n", "Slack/Gmail"], deliveryType: "alert" },
    ],
    history: [
      { cmd: "compare brake pads vs autodoc + winparts + proxyparts", ago: "2h ago", out: "📗 340 SKU comparisons → 28 undercut" },
      { cmd: "alert when proxyparts drops oil filters < €8", ago: "Yesterday", out: "🔔 Active — checking every 6h" },
      { cmd: "full competitor sheet Q1 NL — 4 competitors", ago: "3 days", out: "📗 1,200 SKUs tracked across 4 stores" },
      { cmd: "margin analysis brake category all markets", ago: "1 week", out: "📊 Avg margin 34% — 12 repricing flags" },
    ],
  },
  seo: {
    hero: [
      { id: "s-rank", label: "How am I ranking today?", sub: "Current keyword positions vs last week — winners, losers, and movers", cmd: "/seo show current keyword rankings vs last week", tools: ["Ahrefs Rank Tracker"], deliveryType: "report" },
      { id: "s-bleed", label: "Pages losing traffic", sub: "Product and category pages with declining organic visits this month", cmd: "/seo which pages lost the most traffic this month", tools: ["Ahrefs Site Explorer", "Ahrefs Top Pages"], deliveryType: "report" },
    ],
    compact: [
      { id: "s-gaps", label: "Keywords I'm missing", sub: "What competitors rank for that you don't", cmd: "/seo find keyword gaps vs autodoc.nl", tools: ["Ahrefs Organic Keywords", "Ahrefs Competitors"], deliveryType: "data" },
      { id: "s-audit", label: "Full technical audit", sub: "Crawl issues, broken links, speed, meta coverage", cmd: "/seo full audit of connectcarparts.nl", tools: ["Ahrefs Site Audit", "Ahrefs Site Explorer"], deliveryType: "report" },
      { id: "s-links", label: "Backlink comparison", sub: "Your link profile vs a competitor — quality and growth", cmd: "/seo compare backlinks against autodoc.nl", tools: ["Ahrefs Backlinks", "Ahrefs Referring Domains"], deliveryType: "report" },
      { id: "s-titles", label: "Generate SEO titles", sub: "AutoSEO Brain — batch optimized titles for any SKU set", cmd: "/seo generate optimized titles for new SKUs", tools: ["AutoSEO Brain v2", "OpenAI"], deliveryType: "content" },
    ],
    history: [
      { cmd: "full audit connectcarparts.nl deep", ago: "4h ago", out: "📄 DR 42 — 156 issues, 23 critical" },
      { cmd: "keyword gaps vs autodoc.nl NL market", ago: "Yesterday", out: "📗 287 missing keywords, 45 quick wins" },
      { cmd: "generate titles 200 filter SKUs NL+DE", ago: "2 days", out: "📗 200 titles — avg score 87/100" },
      { cmd: "pages losing traffic this month", ago: "5 days", out: "📉 23 pages down >20% — actions created" },
    ],
  },
  product: {
    hero: [
      { id: "pr-weak", label: "Products needing attention", sub: "Low traffic, thin content, missing meta, poor conversion — flagged and prioritized", cmd: "/product show underperforming products that need attention", tools: ["Ahrefs Top Pages", "Supabase"], deliveryType: "data" },
      { id: "pr-batch", label: "Batch SEO title generator", sub: "AutoSEO Brain v2 — multi-market titles with intent detection, Channable-ready", cmd: "/product generate SEO titles for 500 brake pad SKUs", tools: ["AutoSEO Brain v2", "Magento API", "Google Sheets"], deliveryType: "content" },
    ],
    compact: [
      { id: "pr-desc", label: "AI descriptions for new stock", sub: "Unique SEO descriptions for recently added products", cmd: "/product create AI descriptions for new arrivals", tools: ["OpenAI", "Supabase"], deliveryType: "content" },
      { id: "pr-cat", label: "Category structure audit", sub: "Hierarchy depth, internal linking, SEO coverage", cmd: "/product audit category page structure", tools: ["Ahrefs Site Explorer"], deliveryType: "report" },
      { id: "pr-thin", label: "Find weak product content", sub: "SKUs with short descriptions or missing images", cmd: "/product find products with missing or thin descriptions", tools: ["Supabase", "Magento API"], deliveryType: "data" },
      { id: "pr-bulk", label: "Bulk attribute update", sub: "Mass-update tags, compatibility data, or specifications", cmd: "/product bulk update vehicle compatibility for filter SKUs", tools: ["Magento API", "Supabase"], deliveryType: "action" },
    ],
    history: [
      { cmd: "batch SEO titles 500 brake pads NL+DE", ago: "1 day", out: "📗 489 optimal titles — Channable exported" },
      { cmd: "find weak descriptions exhaust category", ago: "3 days", out: "⚠️ 67 SKUs flagged under 100 chars" },
      { cmd: "category structure audit full tree", ago: "1 week", out: "🗂️ 3 orphans, 8 too-deep paths found" },
      { cmd: "AI descriptions 30 new arrivals", ago: "1 week", out: "✍️ 30 unique descriptions generated" },
    ],
  },
  research: {
    hero: [
      { id: "r-land", label: "Who's winning in my niche?", sub: "Top competitors ranked by organic traffic, domain authority, and keyword count", cmd: "/research top 10 automotive parts sellers NL by organic traffic", tools: ["Ahrefs Batch Analysis", "Ahrefs Organic Competitors"], deliveryType: "report" },
      { id: "r-trend", label: "What's trending right now?", sub: "Rising search terms, seasonal shifts, emerging product categories", cmd: "/research trending keywords in car parts Q1 2026", tools: ["Ahrefs Keywords Explorer", "Ahrefs Volume History"], deliveryType: "report" },
    ],
    compact: [
      { id: "r-deep", label: "Deep-dive a competitor", sub: "Full breakdown: top pages, keywords, backlinks, strategy", cmd: "/research full analysis of autodoc.nl strategy", tools: ["Ahrefs Site Explorer", "Ahrefs Top Pages", "Ahrefs Backlinks"], deliveryType: "report" },
      { id: "r-gaps", label: "Market gaps in my category", sub: "Underserved queries with high volume, low competition", cmd: "/research find market gaps in brake parts NL", tools: ["Ahrefs Keywords Explorer"], deliveryType: "data" },
      { id: "r-season", label: "Seasonal demand forecast", sub: "Historical volume patterns for stock + campaign planning", cmd: "/research seasonal search trends winter tires NL", tools: ["Ahrefs Volume History"], deliveryType: "report" },
      { id: "r-expand", label: "NL vs DE market comparison", sub: "Side-by-side metrics for expansion planning", cmd: "/research compare NL vs DE automotive parts market", tools: ["Ahrefs Metrics by Country"], deliveryType: "report" },
    ],
    history: [
      { cmd: "top 10 auto parts NL organic traffic", ago: "2 days", out: "🏆 autodoc #1, bol.com #2, winparts #3" },
      { cmd: "seasonal trends winter tires 2024-2026", ago: "1 week", out: "📈 Peak Oct-Nov, +340% volume swing" },
      { cmd: "deep dive autodoc.nl content strategy", ago: "2 weeks", out: "📄 12-page brief — 3 replicable tactics" },
      { cmd: "NL vs DE comparison auto parts", ago: "2 weeks", out: "🌍 DE 4.2× volume, lower long-tail comp" },
    ],
  },
  automate: {
    hero: [
      { id: "a-status", label: "Status of my automations", sub: "Active workflows, last run times, success rates, any errors right now", cmd: "/automate show status of all running workflows", tools: ["Hostinger n8n", "n8n Cloud"], deliveryType: "report" },
      { id: "a-sched", label: "Schedule a workflow", sub: "Set any workflow to run daily, weekly, or custom cron", cmd: "/automate schedule SEO title generator every Monday 6AM", tools: ["Hostinger n8n", "n8n Schedule Trigger"], deliveryType: "action" },
    ],
    compact: [
      { id: "a-build", label: "Build new automation", sub: "Describe it — Claude builds the n8n workflow", cmd: "/automate create workflow: check stock levels, alert if low", tools: ["n8n", "Claude"], deliveryType: "action" },
      { id: "a-stock", label: "Stock level alerts", sub: "Notify when products drop below threshold", cmd: "/automate alert when top 50 products drop below 5 units", tools: ["n8n", "Magento API", "Slack"], deliveryType: "alert" },
      { id: "a-chain", label: "Chain workflows together", sub: "Connect output of one workflow as input to another", cmd: "/automate chain pricing → repricing rules → notifications", tools: ["n8n Workflow"], deliveryType: "action" },
      { id: "a-logs", label: "Execution logs", sub: "Debug recent runs — errors, timing, data flow", cmd: "/automate show last 10 execution logs for pricing monitor", tools: ["Hostinger n8n"], deliveryType: "report" },
    ],
    history: [
      { cmd: "schedule SEO brain every Monday 6AM", ago: "3 days", out: "✅ Active — next run Mon 6:00 CET" },
      { cmd: "status all workflows", ago: "Yesterday", out: "📡 2 active, 0 errors, 14 runs/week" },
      { cmd: "stock alert top 50 products < 5 units", ago: "1 week", out: "🔔 Monitoring 50 SKUs — active" },
      { cmd: "execution logs pricing monitor", ago: "5 days", out: "📋 10 runs — all passed, avg 12s" },
    ],
  },
  infra: {
    hero: [
      { id: "i-status", label: "Is everything running?", sub: "Deploy status, error count, database health, edge functions — one glance", cmd: "/infra full system health check", tools: ["Cloudflare", "Vercel", "Supabase", "n8n"], deliveryType: "report" },
      { id: "i-errors", label: "Show me recent errors", sub: "Errors across all services in the last 24 hours", cmd: "/infra error logs last 24 hours across all services", tools: ["Supabase Logs", "Vercel Runtime Logs"], deliveryType: "report" },
    ],
    compact: [
      { id: "i-deploy", label: "Push a deploy", sub: "Trigger deployment to Cloudflare or Vercel", cmd: "/infra deploy latest to production", tools: ["Vercel", "Cloudflare Pages"], deliveryType: "action" },
      { id: "i-db", label: "Database health", sub: "Tables, advisories, connections, migration status", cmd: "/infra database health for Claude n8n project", tools: ["Supabase"], deliveryType: "report" },
      { id: "i-dns", label: "DNS & domain check", sub: "Records, SSL status, propagation", cmd: "/infra show DNS records for hansvanleeuwen.com", tools: ["Cloudflare DNS"], deliveryType: "data" },
      { id: "i-edge", label: "Edge function status", sub: "List Supabase functions and Cloudflare workers", cmd: "/infra list all active edge functions and workers", tools: ["Supabase", "Cloudflare Workers"], deliveryType: "data" },
    ],
    history: [
      { cmd: "deploy status hansvanleeuwen.com", ago: "1h ago", out: "🚀 Live — build 847, 09:12 CET" },
      { cmd: "error logs last 24h all services", ago: "Yesterday", out: "🟢 0 errors across all services" },
      { cmd: "database health Claude n8n", ago: "3 days", out: "💚 14 tables, 0 advisories, healthy" },
      { cmd: "list edge functions", ago: "1 week", out: "⚡ 0 deployed — infrastructure ready" },
    ],
  },
  report: {
    hero: [
      { id: "rp-week", label: "This week's performance", sub: "Traffic, keyword movements, competitor changes, top pages — the full picture", cmd: "/report weekly ecommerce performance overview", tools: ["Ahrefs Web Analytics", "Ahrefs Site Explorer"], deliveryType: "report" },
      { id: "rp-where", label: "Where does my traffic come from?", sub: "Source breakdown: organic, direct, referral, social — with trends", cmd: "/report traffic sources breakdown last 30 days", tools: ["Ahrefs Web Analytics Sources"], deliveryType: "report" },
    ],
    compact: [
      { id: "rp-top", label: "Top pages by traffic", sub: "Best performing URLs ranked by organic visits", cmd: "/report top 50 pages by organic traffic", tools: ["Ahrefs Top Pages"], deliveryType: "data" },
      { id: "rp-vs", label: "Rankings vs competitors", sub: "Your positions vs theirs on shared keywords", cmd: "/report compare rankings against autodoc and winparts", tools: ["Ahrefs Rank Tracker"], deliveryType: "report" },
      { id: "rp-moves", label: "Keyword position changes", sub: "Winners and losers — what moved this week", cmd: "/report keyword position changes this week", tools: ["Ahrefs Rank Tracker"], deliveryType: "data" },
      { id: "rp-custom", label: "Build custom dashboard", sub: "Monday.com or sheet with your chosen metrics", cmd: "/report create custom KPI dashboard for ecommerce team", tools: ["Monday.com", "Google Sheets"], deliveryType: "action" },
    ],
    history: [
      { cmd: "weekly performance connectcarparts.nl", ago: "Monday", out: "📧 Sent — traffic +12%, 3 rank gains" },
      { cmd: "top 50 pages by organic traffic", ago: "3 days", out: "🏆 Brake pads hub #1 at 4.2K/mo" },
      { cmd: "traffic sources last 30 days", ago: "1 week", out: "🔀 Organic 64%, Direct 21%, Ref 11%" },
      { cmd: "competitor ranking comparison Q1", ago: "2 weeks", out: "⚔️ Gained 34, lost 12 vs autodoc" },
    ],
  },
  comms: {
    hero: [
      { id: "c-cal", label: "What's on my calendar today?", sub: "Today's meetings, deadlines, and blocks at a glance", cmd: "/comms show my calendar for today", tools: ["Google Calendar"], deliveryType: "data" },
      { id: "c-draft", label: "Draft a business email", sub: "AI-assisted email for suppliers, partners, or team", cmd: "/comms draft supplier email about Q2 pricing negotiations", tools: ["Gmail", "Claude"], deliveryType: "comms" },
    ],
    compact: [
      { id: "c-meet", label: "Find meeting time", sub: "Check team availability, suggest slots", cmd: "/comms find time for team sync this week", tools: ["Google Calendar"], deliveryType: "action" },
      { id: "c-find", label: "Find an email thread", sub: "Search Gmail for a specific conversation", cmd: "/comms find email thread about warehouse shipping", tools: ["Gmail Search"], deliveryType: "data" },
      { id: "c-update", label: "Send project update", sub: "Status email generated from your recent activity", cmd: "/comms draft project status update for team", tools: ["Gmail", "Claude"], deliveryType: "comms" },
      { id: "c-respond", label: "Draft customer response", sub: "Professional reply for inquiries or complaints", cmd: "/comms draft response to delayed order complaint", tools: ["Gmail", "Claude"], deliveryType: "comms" },
    ],
    history: [
      { cmd: "draft supplier email Q2 pricing", ago: "Yesterday", out: "📧 Draft saved — ready to review" },
      { cmd: "find team sync slot this week, 3 people", ago: "2 days", out: "📅 Wed 14:00-15:00 — all available" },
      { cmd: "search emails warehouse shipping delays", ago: "4 days", out: "🔍 8 threads found, latest Feb 27" },
      { cmd: "draft response delayed order customer", ago: "1 week", out: "💬 Created — apologetic + tracking" },
    ],
  },
  manage: {
    hero: [
      { id: "m-sprint", label: "Where's my sprint at?", sub: "Active items, progress bar, blockers, what's overdue", cmd: "/manage show current sprint status and blockers", tools: ["Linear", "Monday.com"], deliveryType: "report" },
      { id: "m-task", label: "Create a task", sub: "Add to monday.com or Linear with priority and assignment", cmd: "/manage create task: update pricing rules — high priority", tools: ["Monday.com", "Linear"], deliveryType: "action" },
    ],
    compact: [
      { id: "m-status", label: "Update task status", sub: "Move items between done, in progress, blocked", cmd: "/manage mark SEO title migration as complete", tools: ["Monday.com", "Linear"], deliveryType: "action" },
      { id: "m-board", label: "Create project board", sub: "New board with columns and groups for a project", cmd: "/manage create board for Q2 marketplace expansion", tools: ["Monday.com"], deliveryType: "action" },
      { id: "m-brief", label: "Write a project brief", sub: "Goals, scope, timeline, owners in one doc", cmd: "/manage write project brief for German market launch", tools: ["Monday.com Docs", "Claude"], deliveryType: "content" },
      { id: "m-load", label: "Team workload overview", sub: "Who's doing what — capacity across all boards", cmd: "/manage show team workload across active projects", tools: ["Monday.com"], deliveryType: "report" },
    ],
    history: [
      { cmd: "create task: update pricing rules brake pads", ago: "Today", out: "➕ Created — assigned, high priority" },
      { cmd: "current sprint status", ago: "Yesterday", out: "🏃 8/12 done, 2 in progress, 2 blocked" },
      { cmd: "create board Q2 marketplace expansion", ago: "1 week", out: "📋 Live — 4 groups, 6 columns" },
      { cmd: "team workload overview", ago: "1 week", out: "👥 1 overloaded, 2 balanced" },
    ],
  },
  ailab: {
    hero: [
      { id: "ai-brand", label: "How do AI assistants talk about me?", sub: "Brand mentions in ChatGPT, Perplexity, Gemini — your share of voice vs competitors", cmd: "/ailab check brand mentions across AI assistants for auto parts NL", tools: ["Ahrefs Brand Radar"], deliveryType: "report" },
      { id: "ai-gen", label: "Generate product images", sub: "AI backgrounds, lifestyle shots, or clean cutouts for your catalog", cmd: "/ailab generate product images for new oil filter line", tools: ["Hugging Face Spaces", "Stable Diffusion"], deliveryType: "content" },
    ],
    compact: [
      { id: "ai-model", label: "Find a model on HuggingFace", sub: "Search by task — classification, OCR, generation", cmd: "/ailab find best models for product image background removal", tools: ["Hugging Face Hub"], deliveryType: "data" },
      { id: "ai-run", label: "Run an AI task", sub: "Execute a HuggingFace Space — image gen, OCR, TTS", cmd: "/ailab run background removal on product photos", tools: ["Hugging Face Spaces"], deliveryType: "content" },
      { id: "ai-figma", label: "Figma design to code", sub: "Convert component or screen into production React", cmd: "/ailab convert product card design from Figma to React", tools: ["Figma MCP"], deliveryType: "content" },
      { id: "ai-papers", label: "Search AI research", sub: "Latest papers on pricing algorithms, recommendation engines", cmd: "/ailab find papers on dynamic pricing reinforcement learning", tools: ["Hugging Face Papers"], deliveryType: "data" },
    ],
    history: [
      { cmd: "background removal 15 product photos", ago: "2 days", out: "🎨 15 clean cutouts saved" },
      { cmd: "find models for product classification", ago: "4 days", out: "🔎 Top 3: CLIP, DINOv2, EfficientNet" },
      { cmd: "brand mentions ChatGPT auto parts NL", ago: "1 week", out: "👁️ Mentioned 23% of queries, #4 rank" },
      { cmd: "Figma product card → React component", ago: "2 weeks", out: "🎯 Exported — Tailwind + shadcn" },
    ],
  },
};

// ═══ DELIVERY OPTIONS ═══════════════════════════════════════
export const DELIVERY_OPTIONS: Record<string, DeliveryOption[]> = {
  data: [
    { icon: "💬", label: "Show in Chat", note: "Formatted results in the message area", best: true, action: "show_chat" },
    { icon: "📥", label: "CSV Download", note: "Download as spreadsheet file", action: "csv_download" },
    { icon: "🔄", label: "Send to n8n", note: "Forward to n8n for further processing", action: "send_n8n" },
  ],
  alert: [
    { icon: "💬", label: "Show in Chat", note: "Display alert setup confirmation", action: "show_chat" },
    { icon: "💬", label: "Send to Slack", note: "Post alert via Slack connector", best: true, action: "send_slack" },
    { icon: "🔄", label: "Create n8n Monitor", note: "Trigger n8n to schedule monitoring", action: "send_n8n" },
  ],
  report: [
    { icon: "💬", label: "Show in Chat", note: "Full report with tables & charts", best: true, action: "show_chat" },
    { icon: "📥", label: "CSV Download", note: "Export tabular data as CSV", action: "csv_download" },
    { icon: "📧", label: "Email via n8n", note: "n8n sends the report by email", action: "send_n8n" },
  ],
  content: [
    { icon: "💬", label: "Show in Chat", note: "Preview & edit content inline", best: true, action: "show_chat" },
    { icon: "📥", label: "CSV Download", note: "Export as spreadsheet-ready CSV", action: "csv_download" },
    { icon: "🔄", label: "Send to n8n", note: "Push to n8n for Channable/store integration", action: "send_n8n" },
  ],
  action: [
    { icon: "🔄", label: "Execute via n8n", note: "Trigger the relevant n8n webhook now", best: true, action: "send_n8n" },
    { icon: "📋", label: "Show Plan", note: "AI explains what will happen first", action: "show_plan" },
  ],
  comms: [
    { icon: "💬", label: "Show Draft", note: "Render email/message in chat for copy-paste", best: true, action: "show_chat" },
    { icon: "📧", label: "Send via n8n", note: "Trigger n8n Gmail workflow to create draft", action: "send_n8n" },
  ],
};

// ═══ AI MODELS ═══════════════════════════════════════════════
export type AIModelGroup = "gemini" | "openai" | "image";

export interface AIModel {
  id: string;
  label: string;
  tag: string;
  group: AIModelGroup;
}

export const AI_MODELS: AIModel[] = [
  // Google Gemini
  { id: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", tag: "Next-Gen", group: "gemini" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", tag: "Fast", group: "gemini" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Powerful", group: "gemini" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Balanced", group: "gemini" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", tag: "Lite", group: "gemini" },
  // OpenAI
  { id: "openai/gpt-5.2", label: "GPT-5.2", tag: "Latest", group: "openai" },
  { id: "openai/gpt-5", label: "GPT-5", tag: "Premium", group: "openai" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", tag: "Smart", group: "openai" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", tag: "Speed", group: "openai" },
  // Image Generation
  { id: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro Image", tag: "Image", group: "image" },
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image", tag: "Image", group: "image" },
];

export const MODEL_STORAGE_KEY = "portal_command_center_model";
export const HISTORY_KEY = "portal_chat_history_unified";

export function getStoredModel(): string {
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && AI_MODELS.some((m) => m.id === stored)) return stored;
  } catch { /* ignore */ }
  return AI_MODELS[0].id;
}

export const SYSTEM_PROMPT = `You are the Sovereign AI Command Center — a unified expert system for Hans van Leeuwen's complete digital infrastructure and marketing operations.

INFRASTRUCTURE: You manage n8n workflows, Cloudflare Workers, VPS servers (primary srv1402218 + industrial srv1411336), Docker MCP Gateway, Supabase, SSL/DNS, and Claude Code CLI sessions.

MARKETING & SEO: You optimize product feeds (Channable, Google Shopping), run SEO audits, manage Google Ads campaigns, analyze GA4/Search Console data, create content, and manage e-commerce operations.

When the user asks to **create**, **build**, or **generate** an n8n workflow, output a single, valid n8n workflow as a \`\`\`json code block\`\`\` with: \`name\` (string), \`nodes\` (array of node objects with id, type, name, position, parameters, typeVersion), and \`connections\` (object). Use standard n8n node types (e.g. n8n-nodes-base.webhook, n8n-nodes-base.httpRequest). The system will create the workflow in n8n automatically. Do not put credentials in the JSON; use "REPLACE_WITH_YOUR_CREDENTIAL_ID" for credential IDs.

Be concise, technical, and actionable. Format with markdown. Adapt your expertise based on the context filter selected.`;
