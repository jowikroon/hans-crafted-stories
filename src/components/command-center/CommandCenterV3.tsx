import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// COMMAND CENTER v3 — Ecommerce Operations Terminal
// Layer 1: Category tabs
// Layer 2: Submenu drawer (2 hero + 4 compact + 4 history)
// Layer 3: Inline delivery picker (replaces submenu content)
// ═══════════════════════════════════════════════════════════════

const C = {
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

// ═══ ACTIONS — ordered by daily frequency ═══════════════════
// [0-1] = HERO: daily pulse checks (what's happening now?)
// [2-5] = COMPACT: builders & deep work
const A = {
  pricing: {
    hero: [
      {
        id: "p-pulse", label: "Am I being undercut?",
        sub: "Scan active products — flag every SKU where a competitor is cheaper right now",
        cmd: "/pricing find all products where competitors are cheaper",
        tools: ["Bright Data", "OpenAI", "n8n"],
        deliveryType: "data",
      },
      {
        id: "p-check", label: "Quick price check",
        sub: "Instant comparison on specific SKUs against your known competitors",
        cmd: "/pricing compare top SKUs against 4 competitors",
        tools: ["Bright Data", "Google Sheets"],
        deliveryType: "data",
      },
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
      {
        id: "s-rank", label: "How am I ranking today?",
        sub: "Current keyword positions vs last week — winners, losers, and movers",
        cmd: "/seo show current keyword rankings vs last week",
        tools: ["Ahrefs Rank Tracker"],
        deliveryType: "report",
      },
      {
        id: "s-bleed", label: "Pages losing traffic",
        sub: "Product and category pages with declining organic visits this month",
        cmd: "/seo which pages lost the most traffic this month",
        tools: ["Ahrefs Site Explorer", "Ahrefs Top Pages"],
        deliveryType: "report",
      },
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
      {
        id: "pr-weak", label: "Products needing attention",
        sub: "Low traffic, thin content, missing meta, poor conversion — flagged and prioritized",
        cmd: "/product show underperforming products that need attention",
        tools: ["Ahrefs Top Pages", "Supabase"],
        deliveryType: "data",
      },
      {
        id: "pr-batch", label: "Batch SEO title generator",
        sub: "AutoSEO Brain v2 — multi-market titles with intent detection, Channable-ready",
        cmd: "/product generate SEO titles for 500 brake pad SKUs",
        tools: ["AutoSEO Brain v2", "Magento API", "Google Sheets"],
        deliveryType: "content",
      },
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
      {
        id: "r-land", label: "Who's winning in my niche?",
        sub: "Top competitors ranked by organic traffic, domain authority, and keyword count",
        cmd: "/research top 10 automotive parts sellers NL by organic traffic",
        tools: ["Ahrefs Batch Analysis", "Ahrefs Organic Competitors"],
        deliveryType: "report",
      },
      {
        id: "r-trend", label: "What's trending right now?",
        sub: "Rising search terms, seasonal shifts, emerging product categories",
        cmd: "/research trending keywords in car parts Q1 2026",
        tools: ["Ahrefs Keywords Explorer", "Ahrefs Volume History"],
        deliveryType: "report",
      },
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
      {
        id: "a-status", label: "Status of my automations",
        sub: "Active workflows, last run times, success rates, any errors right now",
        cmd: "/automate show status of all running workflows",
        tools: ["Hostinger n8n", "n8n Cloud"],
        deliveryType: "report",
      },
      {
        id: "a-sched", label: "Schedule a workflow",
        sub: "Set any workflow to run daily, weekly, or custom cron",
        cmd: "/automate schedule SEO title generator every Monday 6AM",
        tools: ["Hostinger n8n", "n8n Schedule Trigger"],
        deliveryType: "action",
      },
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
      {
        id: "i-status", label: "Is everything running?",
        sub: "Deploy status, error count, database health, edge functions — one glance",
        cmd: "/infra full system health check",
        tools: ["Cloudflare", "Vercel", "Supabase", "n8n"],
        deliveryType: "report",
      },
      {
        id: "i-errors", label: "Show me recent errors",
        sub: "Errors across all services in the last 24 hours",
        cmd: "/infra error logs last 24 hours across all services",
        tools: ["Supabase Logs", "Vercel Runtime Logs"],
        deliveryType: "report",
      },
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
      {
        id: "rp-week", label: "This week's performance",
        sub: "Traffic, keyword movements, competitor changes, top pages — the full picture",
        cmd: "/report weekly ecommerce performance overview",
        tools: ["Ahrefs Web Analytics", "Ahrefs Site Explorer"],
        deliveryType: "report",
      },
      {
        id: "rp-where", label: "Where does my traffic come from?",
        sub: "Source breakdown: organic, direct, referral, social — with trends",
        cmd: "/report traffic sources breakdown last 30 days",
        tools: ["Ahrefs Web Analytics Sources"],
        deliveryType: "report",
      },
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
      {
        id: "c-cal", label: "What's on my calendar today?",
        sub: "Today's meetings, deadlines, and blocks at a glance",
        cmd: "/comms show my calendar for today",
        tools: ["Google Calendar"],
        deliveryType: "data",
      },
      {
        id: "c-draft", label: "Draft a business email",
        sub: "AI-assisted email for suppliers, partners, or team",
        cmd: "/comms draft supplier email about Q2 pricing negotiations",
        tools: ["Gmail", "Claude"],
        deliveryType: "comms",
      },
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
      {
        id: "m-sprint", label: "Where's my sprint at?",
        sub: "Active items, progress bar, blockers, what's overdue",
        cmd: "/manage show current sprint status and blockers",
        tools: ["Linear", "Monday.com"],
        deliveryType: "report",
      },
      {
        id: "m-task", label: "Create a task",
        sub: "Add to monday.com or Linear with priority and assignment",
        cmd: "/manage create task: update pricing rules — high priority",
        tools: ["Monday.com", "Linear"],
        deliveryType: "action",
      },
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
      {
        id: "ai-brand", label: "How do AI assistants talk about me?",
        sub: "Brand mentions in ChatGPT, Perplexity, Gemini — your share of voice vs competitors",
        cmd: "/ailab check brand mentions across AI assistants for auto parts NL",
        tools: ["Ahrefs Brand Radar"],
        deliveryType: "report",
      },
      {
        id: "ai-gen", label: "Generate product images",
        sub: "AI backgrounds, lifestyle shots, or clean cutouts for your catalog",
        cmd: "/ailab generate product images for new oil filter line",
        tools: ["Hugging Face Spaces", "Stable Diffusion"],
        deliveryType: "content",
      },
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

// ═══ DELIVERY OPTIONS — mapped to action types ══════════════
const D = {
  data:    [
    { icon: "📗", label: "Google Sheet", note: "Live-updating, shareable, filterable", best: true },
    { icon: "📥", label: "CSV Download", note: "Import into any system" },
    { icon: "📊", label: "Monday.com Board", note: "Visual cards with status tracking" },
  ],
  alert:   [
    { icon: "⚡", label: "Slack / Push", note: "Instant when triggered", best: true },
    { icon: "📧", label: "Email Alert", note: "Detailed with context" },
    { icon: "📋", label: "Auto-create Task", note: "Linear or Monday.com issue" },
  ],
  report:  [
    { icon: "📄", label: "PDF Report", note: "Professional, shareable document", best: true },
    { icon: "📧", label: "Email to Me", note: "HTML email — forward to anyone" },
    { icon: "📊", label: "Live Dashboard", note: "Monday.com or Google Sheet widget" },
  ],
  content: [
    { icon: "📗", label: "Export Spreadsheet", note: "Channable + Magento ready columns", best: true },
    { icon: "📦", label: "Push to Store", note: "Direct API update via Magento" },
    { icon: "📝", label: "Preview First", note: "Review here before exporting" },
  ],
  action:  [
    { icon: "✅", label: "Execute Now", note: "Run it immediately", best: true },
    { icon: "📋", label: "Add as Task", note: "Create follow-up on Monday.com" },
    { icon: "📧", label: "Email Instructions", note: "Send steps to a team member" },
  ],
  comms:   [
    { icon: "📧", label: "Save as Gmail Draft", note: "Review and send from inbox", best: true },
    { icon: "📝", label: "Show Preview", note: "Edit here before saving" },
    { icon: "📋", label: "Draft + Follow-up Task", note: "Save draft and track it" },
  ],
};

// ═══ MAIN COMPONENT ════════════════════════════════════════
export default function CommandCenter() {
  const [cat, setCat] = useState(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("browse"); // browse | delivery | exec | done
  const [picked, setPicked] = useState(null); // selected action
  const [delivery, setDelivery] = useState(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log, phase]);

  const push = (e) => setLog(p => [...p, e]);
  const catData = cat ? C[cat] : null;
  const actions = cat ? A[cat] : null;

  const reset = () => {
    setPhase("browse");
    setPicked(null);
    setDelivery(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const pickAction = (action) => {
    push({ t: "cmd", text: action.cmd });
    setPicked(action);
    setPhase("delivery");
  };

  const rerun = (h) => {
    push({ t: "cmd", text: `/pricing ${h.cmd}` });
    push({ t: "rerun", text: `Re-running verified command — last: ${h.out}` });
    setPicked({ id: "re", label: h.cmd, deliveryType: "data", tools: [], sub: h.out });
    setPhase("delivery");
  };

  const pickDelivery = (d) => {
    setDelivery(d);
    setCat(null);
    setPhase("exec");
    setTimeout(() => {
      push({ t: "done", label: picked?.label, via: d.label });
      setPhase("done");
    }, 1600);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const cmd = input.trim();
    push({ t: "cmd", text: cmd });
    setInput("");
    // Try match category
    for (const key of Object.keys(C)) {
      if (cmd.toLowerCase().startsWith(`/${key}`)) {
        setCat(key);
        const acts = [...A[key].hero, ...A[key].compact];
        let best = acts[0], score = 0;
        for (const a of acts) {
          const s = a.label.toLowerCase().split(" ").filter(w => cmd.toLowerCase().includes(w)).length;
          if (s > score) { score = s; best = a; }
        }
        setPicked(best);
        setPhase("delivery");
        return;
      }
    }
    push({ t: "sys", text: "Start with a category — click one above or type /" });
  };

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#07070B",
      color: "#A0A4AA",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontSize: 12,
    }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, #0C0C14 0%, #09090F 100%)",
        borderBottom: "1px solid #12121E",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E8E8F0", letterSpacing: "0.08em" }}>⌘ COMMAND CENTER</span>
          <span style={{
            fontSize: 9, color: "#2A2A3A", letterSpacing: "0.06em",
            border: "1px solid #1A1A28", borderRadius: 3, padding: "1px 5px",
          }}>v3</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E50" }} />
          <span style={{ fontSize: 9, color: "#22C55E90", letterSpacing: "0.06em" }}>14 SERVICES</span>
        </div>
      </header>

      {/* ═══ LAYER 1: CATEGORY TABS ═══ */}
      <nav style={{
        padding: "5px 16px 0",
        display: "flex", gap: 2, flexWrap: "wrap",
        background: "#08080E",
        borderBottom: cat ? "none" : "1px solid #12121E",
      }}>
        {Object.entries(C).map(([key, v]) => {
          const active = cat === key;
          return (
            <button key={key} onClick={() => {
              if (phase === "delivery" || phase === "exec") return;
              setCat(active ? null : key);
              setPicked(null);
              setPhase("browse");
            }} style={{
              background: active ? `${v.color}12` : "transparent",
              border: "1px solid transparent",
              borderBottom: active ? `2px solid ${v.color}` : "2px solid transparent",
              borderColor: active ? `${v.color}30` : "transparent",
              borderBottomColor: active ? v.color : "transparent",
              borderRadius: "5px 5px 0 0",
              padding: "6px 11px 5px",
              color: active ? v.color : "#3A3A4A",
              fontSize: 10, fontWeight: active ? 600 : 400,
              cursor: phase === "exec" ? "default" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.06em",
              transition: "all 0.1s ease",
              opacity: (phase === "delivery" || phase === "exec") && !active ? 0.3 : 1,
            }}
            onMouseEnter={(e) => { if (!active && phase === "browse") e.target.style.color = v.color + "90"; }}
            onMouseLeave={(e) => { if (!active) e.target.style.color = "#3A3A4A"; }}
            >
              {v.icon} {v.label}
            </button>
          );
        })}
      </nav>

      {/* ═══ LAYER 2: SUBMENU DRAWER ═══ */}
      {cat && phase === "browse" && actions && (
        <div style={{
          background: `linear-gradient(180deg, ${catData.color}08 0%, ${catData.color}02 100%)`,
          borderBottom: `1px solid ${catData.color}18`,
          padding: "14px 16px 12px",
          animation: "drawerOpen 0.2s ease-out",
          overflow: "hidden",
        }}>
          {/* Category title line */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{ color: catData.color, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em" }}>
              {catData.icon} {catData.label}
            </span>
            <span style={{ color: "#2A2A3A", fontSize: 10 }}>—</span>
            <span style={{ color: "#3A3A48", fontSize: 10 }}>{catData.desc}</span>
          </div>

          {/* ── 2 HERO CARDS (daily drivers) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {actions.hero.map((a, i) => (
              <button key={a.id} onClick={() => pickAction(a)} style={{
                padding: "12px 14px",
                background: `${catData.color}08`,
                border: `1px solid ${catData.color}20`,
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "all 0.12s ease",
                animation: `fadeSlide 0.2s ease-out ${i * 0.06}s both`,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = catData.color + "50";
                e.currentTarget.style.background = catData.color + "14";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = catData.color + "20";
                e.currentTarget.style.background = catData.color + "08";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
                <div style={{ color: "#E4E4EC", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
                  {a.label}
                </div>
                <div style={{ color: "#4A4A5A", fontSize: 10, lineHeight: 1.4 }}>
                  {a.sub}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                  {a.tools.map((t, ti) => (
                    <span key={ti} style={{
                      fontSize: 8, color: catData.color + "80",
                      background: catData.color + "0A",
                      border: `1px solid ${catData.color}15`,
                      borderRadius: 3, padding: "1px 5px",
                    }}>{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* ── 4 COMPACT ROWS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
            {actions.compact.map((a, i) => (
              <button key={a.id} onClick={() => pickAction(a)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px",
                background: "transparent",
                border: "1px solid #14141F",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "all 0.1s ease",
                animation: `fadeSlide 0.18s ease-out ${0.12 + i * 0.04}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = catData.color + "35";
                e.currentTarget.style.background = catData.color + "08";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#14141F";
                e.currentTarget.style.background = "transparent";
              }}>
                <span style={{ color: "#E0E0E8", fontSize: 11, fontWeight: 500, minWidth: 180, flexShrink: 0 }}>
                  {a.label}
                </span>
                <span style={{ color: "#333340", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.sub}
                </span>
                <span style={{ color: "#222230", fontSize: 10, flexShrink: 0 }}>⏎</span>
              </button>
            ))}
          </div>

          {/* ── SEPARATOR ── */}
          <div style={{
            borderTop: `1px solid ${catData.color}10`,
            marginBottom: 8,
            position: "relative",
          }}>
            <span style={{
              position: "absolute", top: -7,
              background: "#0A0A10",
              padding: "0 8px",
              fontSize: 9,
              color: "#22C55E60",
              letterSpacing: "0.1em",
            }}>LAST RUN — VERIFIED ✓</span>
          </div>

          {/* ── 4 HISTORY ITEMS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4 }}>
            {actions.history.map((h, i) => (
              <button key={i} onClick={() => rerun(h)} style={{
                display: "grid",
                gridTemplateColumns: "14px 1fr auto auto",
                gap: 8,
                alignItems: "center",
                padding: "5px 8px",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "all 0.1s ease",
                animation: `fadeSlide 0.18s ease-out ${0.28 + i * 0.04}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#22C55E06";
                e.currentTarget.style.borderColor = "#22C55E18";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}>
                <span style={{ color: "#22C55E70", fontSize: 10 }}>✓</span>
                <span style={{ color: "#4A4A58", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.cmd}
                </span>
                <span style={{ color: "#22222E", fontSize: 9, flexShrink: 0, whiteSpace: "nowrap" }}>{h.ago}</span>
                <span style={{ color: "#3A3A48", fontSize: 9, flexShrink: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.out}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LAYER 2B: DELIVERY PICKER (replaces actions in submenu area) ═══ */}
      {phase === "delivery" && picked && (
        <div style={{
          background: `linear-gradient(180deg, ${C[cat || picked.catKey || "pricing"]?.color || "#22C55E"}08 0%, transparent 100%)`,
          borderBottom: `1px solid ${C[cat || picked.catKey || "pricing"]?.color || "#22C55E"}18`,
          padding: "14px 16px",
          animation: "drawerOpen 0.18s ease-out",
        }}>
          {/* What you asked for */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#E4E4EC", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
              {picked.label}
            </div>
            <div style={{ color: "#3A3A48", fontSize: 10 }}>{picked.sub}</div>
          </div>

          {/* Delivery question */}
          <div style={{ color: "#6A6A78", fontSize: 11, marginBottom: 10, letterSpacing: "0.02em" }}>
            How would you like to receive this?
          </div>

          {/* 3 delivery options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {(D[picked.deliveryType] || D.data).map((d, i) => {
              const col = C[cat || picked.catKey || "pricing"]?.color || "#22C55E";
              return (
                <button key={i} onClick={() => pickDelivery(d)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: d.best ? `${col}0C` : "transparent",
                  border: `1px solid ${d.best ? col + "30" : "#14141F"}`,
                  borderRadius: 5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "all 0.12s ease",
                  animation: `fadeSlide 0.16s ease-out ${i * 0.05}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = col + "50";
                  e.currentTarget.style.background = col + "14";
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = d.best ? col + "30" : "#14141F";
                  e.currentTarget.style.background = d.best ? col + "0C" : "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: "center" }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#D8D8E0", fontSize: 11, fontWeight: 500 }}>{d.label}</span>
                      {d.best && (
                        <span style={{
                          fontSize: 8, color: col,
                          border: `1px solid ${col}30`,
                          borderRadius: 3, padding: "1px 6px",
                          letterSpacing: "0.08em", fontWeight: 600,
                        }}>BEST FIT</span>
                      )}
                    </div>
                    <span style={{ color: "#3A3A48", fontSize: 10 }}>{d.note}</span>
                  </div>
                  <span style={{ color: "#1A1A28", fontSize: 11 }}>→</span>
                </button>
              );
            })}
          </div>

          {/* Cancel */}
          <button onClick={() => { setCat(cat); setPicked(null); setPhase("browse"); }} style={{
            marginTop: 8, background: "transparent", border: "none",
            color: "#2A2A3A", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
            padding: "4px 0",
          }}
          onMouseEnter={(e) => e.target.style.color = "#5A5A6A"}
          onMouseLeave={(e) => e.target.style.color = "#2A2A3A"}
          >
            ← back to {C[cat]?.label || "actions"}
          </button>
        </div>
      )}

      {/* ═══ TERMINAL OUTPUT ═══ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {/* Empty state */}
        {log.length === 0 && phase === "browse" && !cat && (
          <div style={{ color: "#222230", fontSize: 11, lineHeight: 2 }}>
            <span style={{ color: "#3A3A48" }}>Select a category above to see your options.</span><br />
            <span style={{ color: "#1E1E2A" }}>Each category shows your top actions + verified history.</span>
          </div>
        )}

        {/* Log entries */}
        {log.map((e, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            {e.t === "cmd" && (
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "#22C55E" }}>❯</span>
                <span style={{ color: "#E2E2EA" }}>{e.text}</span>
              </div>
            )}
            {e.t === "sys" && <div style={{ color: "#EAB308", fontSize: 11, paddingLeft: 14 }}>{e.text}</div>}
            {e.t === "rerun" && <div style={{ color: "#22C55E80", fontSize: 10, paddingLeft: 14 }}>↻ {e.text}</div>}
            {e.t === "done" && (
              <div style={{
                border: "1px solid #22C55E20",
                borderRadius: 5, padding: 10, marginLeft: 14,
                background: "#22C55E06",
              }}>
                <span style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>✓ DONE</span>
                <span style={{ color: "#4A4A58", fontSize: 11 }}> — {e.label}</span>
                <div style={{ color: "#333340", fontSize: 10, marginTop: 3 }}>Delivered via {e.via}</div>
              </div>
            )}
          </div>
        ))}

        {/* Executing spinner */}
        {phase === "exec" && (
          <div style={{ marginLeft: 14, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              border: "2px solid #22C55E",
              borderTopColor: "transparent",
              animation: "spin 0.6s linear infinite",
            }} />
            <span style={{ color: "#22C55E90", fontSize: 11 }}>
              Executing → {delivery?.label}
            </span>
          </div>
        )}

        {/* Done actions */}
        {phase === "done" && (
          <div style={{ marginLeft: 14, marginTop: 6, display: "flex", gap: 6 }}>
            <button onClick={reset} style={{
              background: "transparent", border: "1px solid #14141F", borderRadius: 3,
              padding: "4px 10px", color: "#3A3A4A", fontSize: 10,
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#22C55E40"; e.target.style.color = "#22C55E"; }}
            onMouseLeave={(e) => { e.target.style.borderColor = "#14141F"; e.target.style.color = "#3A3A4A"; }}
            >NEW COMMAND ⏎</button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ═══ INPUT BAR ═══ */}
      <div style={{
        borderTop: "1px solid #12121E",
        padding: "9px 16px",
        background: "#08080E",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: "#22C55E", fontSize: 12 }}>❯</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder={cat ? `/${cat} ...` : "Select a category or type /pricing, /seo, /product ..."}
          disabled={phase === "exec"}
          style={{
            flex: 1, background: "transparent", border: "none",
            color: "#E2E2EA", fontSize: 12, fontFamily: "inherit", outline: "none",
            opacity: phase === "exec" ? 0.2 : 1,
          }}
        />
        <button onClick={handleSubmit} disabled={phase === "exec"} style={{
          background: "#22C55E", border: "none", borderRadius: 3,
          padding: "5px 10px", color: "#050505", fontSize: 10, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          opacity: phase === "exec" ? 0.2 : 1,
        }}>RUN</button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawerOpen {
          from { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
          to { opacity: 1; max-height: 700px; }
        }
      `}</style>
    </div>
  );
}
