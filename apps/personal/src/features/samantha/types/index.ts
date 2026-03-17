// ═══════════════════════════════════════════════════════
//  Samantha — Core types
// ═══════════════════════════════════════════════════════

export type MessageRole = "user" | "samantha" | "system" | "tool";
export type Stage = "idle" | "listening" | "thinking" | "routing" | "executing";
export type Emotion = "calm" | "thinking" | "working" | "speaking" | "error" | "success";
export type ProviderKind = "cloud" | "local" | "agent";
export type ToolExecStatus = "running" | "success" | "error";
export type PanelId = "health" | "workflows" | "audit" | "operations" | null;

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: string;
  streaming?: boolean;
  toolStatus?: ToolExecStatus;
  toolName?: string;
  toolResult?: ToolResult;
}

export interface AIModel {
  id: string;
  label: string;
  provider: string;
  tag: string;
  kind: ProviderKind;
  color: string;
  description: string;
  suggestions: string[];
}

// ─── Tool Results (discriminated union) ──────────────

export type ToolResult =
  | { type: "health"; services: ServiceHealthEntry[] }
  | { type: "workflow"; workflowName: string; status: ToolExecStatus; message: string }
  | { type: "audit"; entries: AuditEntry[] }
  | { type: "task"; task: TaskRecord }
  | { type: "idea"; idea: TaskRecord }
  | { type: "workflows_list"; workflows: WorkflowInfo[] }
  | { type: "generic"; title: string; content: string };

export interface ServiceHealthEntry {
  name: string;
  ok: boolean;
  latency?: number;
  error?: string;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaskRecord {
  id: string;
  text: string;
  type: "task" | "idea";
  created_at: number;
  done?: boolean;
}

export interface WorkflowInfo {
  name: string;
  label: string;
  category: string;
  description: string;
}

// ─── Samantha Modes ─────────────────────────────────

export type SamanthaMode = "default" | "research" | "builder" | "operator" | "executive";

export interface ModeConfig {
  id: SamanthaMode;
  label: string;
  tagline: string;
  icon: string; // lucide icon name
  color: string; // tailwind color class for accents
  suggestions: string[];
  quickCommands: { cmd: string; desc: string; icon: string; color: string }[];
  systemBoost: string; // extra system prompt context for this mode
}

export const SAMANTHA_MODES: Record<SamanthaMode, ModeConfig> = {
  default: {
    id: "default",
    label: "Samantha",
    tagline: "AI operating layer. Talk naturally or use commands.",
    icon: "Sparkles",
    color: "text-rose-400",
    suggestions: ["Summarize this for me", "Help me write an email", "Explain how SEO works"],
    quickCommands: [
      { cmd: "/health", desc: "Check all services", icon: "HeartPulse", color: "text-emerald-400/50" },
      { cmd: "/run autoseo", desc: "Trigger AutoSEO Brain", icon: "Zap", color: "text-purple-400/50" },
      { cmd: "/task Review Q1 feeds", desc: "Save a task", icon: "ListChecks", color: "text-blue-400/50" },
      { cmd: "/audit", desc: "View recent activity", icon: "ScrollText", color: "text-amber-400/50" },
    ],
    systemBoost: "",
  },
  research: {
    id: "research",
    label: "Research",
    tagline: "SEO research, competitor analysis, and market intelligence.",
    icon: "Search",
    color: "text-cyan-400",
    suggestions: [
      "Audit my SEO for hansvanleeuwen.com",
      "Compare my Amazon listings to competitor X",
      "What keywords should I target for Bol.com?",
    ],
    quickCommands: [
      { cmd: "/run autoseo", desc: "Trigger AutoSEO Brain", icon: "Zap", color: "text-purple-400/50" },
      { cmd: "/health", desc: "Check infrastructure", icon: "HeartPulse", color: "text-emerald-400/50" },
      { cmd: "Audit hansvanleeuwen.com SEO", desc: "Full SEO audit", icon: "Search", color: "text-cyan-400/50" },
      { cmd: "Find competitor gaps", desc: "Gap analysis", icon: "Target", color: "text-amber-400/50" },
    ],
    systemBoost: `You are in RESEARCH MODE. Prioritize structured, data-driven outputs:
- SEO research briefs with keyword tables (volume, difficulty, intent)
- Competitor gap maps with actionable recommendations
- Market intelligence summaries with clear sections
- Always present findings in tables or structured lists, not prose.
- Include priority scores (High/Medium/Low) for recommendations.
- If the user asks broadly, suggest a specific research angle to start with.`,
  },
  builder: {
    id: "builder",
    label: "Builder",
    tagline: "Dashboards, trackers, templates, and structured outputs.",
    icon: "LayoutDashboard",
    color: "text-violet-400",
    suggestions: [
      "Build me a pricing comparison matrix",
      "Design a KPI tracker for Amazon campaigns",
      "Create a product feed quality scorecard",
    ],
    quickCommands: [
      { cmd: "Build a KPI dashboard", desc: "Start a dashboard", icon: "LayoutDashboard", color: "text-violet-400/50" },
      { cmd: "Design a tracker template", desc: "New tracker", icon: "Table", color: "text-blue-400/50" },
      { cmd: "Create a scorecard", desc: "Quality scorecard", icon: "ClipboardCheck", color: "text-emerald-400/50" },
      { cmd: "/task Build new tracker", desc: "Save for later", icon: "ListChecks", color: "text-amber-400/50" },
    ],
    systemBoost: `You are in BUILDER MODE. Generate structured, actionable outputs:
- Dashboard blueprints with specific KPIs, data sources, and layout
- Tracker templates in markdown tables with column definitions
- Pricing comparison matrices with clear axes
- Scorecards with weighted criteria and scoring scales
- Always provide the full structure, not just a description.
- Use markdown tables extensively. Include example data rows.
- For dashboards, specify: metric name, source, update frequency, threshold values.`,
  },
  operator: {
    id: "operator",
    label: "Operator",
    tagline: "Feed optimization, pricing, campaign operations.",
    icon: "Settings",
    color: "text-amber-400",
    suggestions: [
      "Review my product feed quality",
      "Optimize these product titles for Amazon NL",
      "Compare pricing across my catalog",
    ],
    quickCommands: [
      { cmd: "/run product-title-optimizer", desc: "Optimize titles", icon: "Type", color: "text-amber-400/50" },
      { cmd: "/run product-feed-optimizer", desc: "Optimize feed", icon: "Database", color: "text-orange-400/50" },
      { cmd: "/run campaign-generator", desc: "Generate campaigns", icon: "Megaphone", color: "text-pink-400/50" },
      { cmd: "/workflows", desc: "All workflows", icon: "GitBranch", color: "text-purple-400/50" },
    ],
    systemBoost: `You are in OPERATOR MODE. Focus on execution and optimization:
- Feed quality audits with specific field-level recommendations
- Title optimization with before/after comparisons
- Pricing analysis with competitive positioning
- Campaign structures with targeting and budget allocations
- Always be specific and actionable. No vague advice.
- Include checklists for operational tasks.
- Reference specific Amazon/Bol.com requirements when relevant.`,
  },
  executive: {
    id: "executive",
    label: "Executive",
    tagline: "Summaries, action plans, scorecards, and strategic briefs.",
    icon: "Briefcase",
    color: "text-emerald-400",
    suggestions: [
      "Give me an executive summary of system health",
      "Create a weekly action plan for marketplace growth",
      "Score my current e-commerce operations",
    ],
    quickCommands: [
      { cmd: "Weekly executive summary", desc: "Status overview", icon: "FileText", color: "text-emerald-400/50" },
      { cmd: "Create an action plan", desc: "Prioritized plan", icon: "ListOrdered", color: "text-blue-400/50" },
      { cmd: "/health", desc: "System status", icon: "HeartPulse", color: "text-green-400/50" },
      { cmd: "Score my operations", desc: "Operations scorecard", icon: "BarChart3", color: "text-violet-400/50" },
    ],
    systemBoost: `You are in EXECUTIVE MODE. Deliver high-signal, decision-ready outputs:
- Executive summaries: 3-5 bullet key findings, then detail if needed
- Action plans: numbered, with owner/deadline/priority columns
- Scorecards: weighted criteria, color-coded status (green/amber/red)
- Strategic briefs: situation → analysis → recommendation → next steps
- Always lead with the bottom line. Details go below.
- Use bold for key metrics and decisions.
- Keep language crisp and authoritative. No filler.`,
  },
};

// ─── Slash Commands ──────────────────────────────────

export interface SlashCommand {
  cmd: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  handler: "run" | "task" | "idea" | "workflows" | "health" | "audit" | "model" | "clear";
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/run", label: "Run Workflow", description: "Trigger an n8n workflow", icon: "Zap", handler: "run" },
  { cmd: "/task", label: "Create Task", description: "Save a task for later", icon: "ListChecks", handler: "task" },
  { cmd: "/idea", label: "Save Idea", description: "Capture an idea", icon: "Lightbulb", handler: "idea" },
  { cmd: "/tasks", label: "View Tasks", description: "Show all tasks & ideas", icon: "ListChecks", handler: "tasks" },
  { cmd: "/done", label: "Complete Task", description: "Mark a task done by number", icon: "CheckCircle", handler: "done" },
  { cmd: "/workflows", label: "List Workflows", description: "Show available workflows", icon: "GitBranch", handler: "workflows" },
  { cmd: "/health", label: "Health Check", description: "Check all services", icon: "HeartPulse", handler: "health" },
  { cmd: "/audit", label: "Audit Log", description: "View recent changes", icon: "ScrollText", handler: "audit" },
  { cmd: "/model", label: "Switch Model", description: "Change AI model", icon: "Brain", handler: "model" },
  { cmd: "/clear", label: "Clear Chat", description: "Clear conversation", icon: "Trash2", handler: "clear" },
];
