import { Bot, MessageSquare, Compass, Sparkles, HeartPulse, Filter, ListChecks, Route } from "lucide-react";

const components = [
  {
    name: "Command Center",
    type: "Unified Chat Panel",
    location: "Portal header",
    edgeFn: "n8n-agent",
    model: "Multi-model picker (Gemini/GPT)",
    files: ["src/components/portal/UnifiedChatPanel.tsx"],
    color: "orange",
    icon: MessageSquare,
    description: "Central chat interface with 12 context categories, TVA pipeline bar, and intent classification.",
  },
  {
    name: "Hans AI",
    type: "Overlay Chat",
    location: "Navbar + Portal",
    edgeFn: "hansai-chat",
    model: "Gemini 3 Flash (streaming)",
    files: ["src/components/overlays/HansAIOverlay.tsx", "src/pages/HansAI.tsx"],
    color: "emerald",
    icon: Bot,
    description: "Streaming chat overlay accessible from the navbar. Uses context filter pills and smart suggestions.",
  },
  {
    name: "Empire Commander",
    type: "Overlay Chat",
    location: "Portal",
    edgeFn: "n8n-agent",
    model: "Gemini 2.5 Flash",
    files: ["src/components/overlays/EmpireOverlay.tsx"],
    color: "violet",
    icon: Bot,
    description: "Infrastructure-focused overlay for monitoring and managing Empire services.",
  },
  {
    name: "n8n Agent",
    type: "Modal Chat",
    location: "Portal",
    edgeFn: "n8n-agent",
    model: "Gemini 2.5 Flash",
    files: ["src/components/portal/N8nAgentModal.tsx"],
    color: "cyan",
    icon: Bot,
    description: "Dedicated modal for interacting with n8n workflow automation agent.",
  },
  {
    name: "Intent Router",
    type: "Classifier",
    location: "Command Center",
    edgeFn: "intent-router",
    model: "Gemini 2.5 Flash",
    files: ["src/components/portal/IntentButton.tsx", "src/lib/intent/router.ts"],
    color: "amber",
    icon: Compass,
    description: "Classifies user goals and routes to the correct workflow or edge function.",
  },
  {
    name: "AI Content Suggest",
    type: "Copy Generator",
    location: "Page Content Editor",
    edgeFn: "ai-content-suggest",
    model: "Gemini 3 Flash",
    files: ["src/components/portal/PageContentEditorModal.tsx"],
    color: "pink",
    icon: Sparkles,
    description: "Generates copy suggestions for page content fields (titles, descriptions, body text).",
  },
  {
    name: "Empire Health",
    type: "Status Monitor",
    location: "Empire Dashboard",
    edgeFn: "empire-health",
    model: "N/A (HTTP checks)",
    files: ["src/components/empire/EmpireStatusGrid.tsx"],
    color: "green",
    icon: HeartPulse,
    description: "Runs HTTP health checks against infrastructure endpoints and reports status.",
  },
  {
    name: "Context Filter Pills",
    type: "UI Component",
    location: "All chat panels",
    edgeFn: "Client-side",
    model: "N/A",
    files: ["src/components/ai/ContextFilterPills.tsx", "src/components/ai/contextCategories.ts"],
    color: "slate",
    icon: Filter,
    description: "Two-layer category/sub-context pills that prefix system hints to user prompts.",
  },
  {
    name: "Command Suggestion List",
    type: "UI Component",
    location: "All chat panels",
    edgeFn: "Client-side (localStorage)",
    model: "N/A",
    files: ["src/components/ai/CommandSuggestionList.tsx", "src/components/ai/commandSuggestions.ts"],
    color: "slate",
    icon: ListChecks,
    description: "Top-10 smart prompt suggestions sorted by usage frequency, stored in localStorage.",
  },
  {
    name: "Fast Route",
    type: "Client Router",
    location: "Intent system",
    edgeFn: "Client-side keyword matching",
    model: "N/A",
    files: ["src/lib/intent/router.ts"],
    color: "yellow",
    icon: Route,
    description: "Client-side keyword matcher. Score >0.85 triggers direct routing without LLM fallback.",
  },
];

const colorMap: Record<string, string> = {
  orange: "border-orange-500/30 bg-orange-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  cyan: "border-cyan-500/30 bg-cyan-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  pink: "border-pink-500/30 bg-pink-500/5",
  green: "border-green-500/30 bg-green-500/5",
  slate: "border-border bg-secondary/30",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
};

const badgeColorMap: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
  amber: "bg-amber-500/15 text-amber-400",
  pink: "bg-pink-500/15 text-pink-400",
  green: "bg-green-500/15 text-green-400",
  slate: "bg-muted text-muted-foreground",
  yellow: "bg-yellow-500/15 text-yellow-400",
};

const WikiComponentRegistry = () => (
  <div className="grid gap-4 sm:grid-cols-2">
    {components.map((c) => {
      const Icon = c.icon;
      return (
        <div
          key={c.name}
          className={`rounded-xl border p-4 transition-colors hover:bg-secondary/20 ${colorMap[c.color]}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon size={16} className="shrink-0 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColorMap[c.color]}`}>
              {c.type}
            </span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{c.description}</p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/60">Location</span>
              <span className="text-muted-foreground">{c.location}</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/60">Backend</span>
              <span className="font-mono text-muted-foreground">{c.edgeFn}</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/60">Model</span>
              <span className="text-muted-foreground">{c.model}</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/60">Files</span>
              <span className="flex flex-wrap gap-1">
                {c.files.map((f) => (
                  <code key={f} className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    {f.split("/").pop()}
                  </code>
                ))}
              </span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default WikiComponentRegistry;
