import { Search, HeartPulse, FileText, Bug } from "lucide-react";

const examples = [
  {
    title: "SEO Title Optimization",
    icon: Search,
    color: "emerald",
    context: { category: "SEO", sub: "Keywords" },
    prompt: "Research keywords for brake pads",
    edgeFn: "hansai-chat",
    systemMod: "Context prefix adds: [SEO > Keywords] focus — keyword research mode",
    output: "Streaming markdown response with keyword table, search volume estimates, and title suggestions.",
  },
  {
    title: "Infrastructure Health Check",
    icon: HeartPulse,
    color: "violet",
    context: { category: "Monitoring", sub: "Health" },
    prompt: "Run full health check",
    edgeFn: "intent-router → health-check webhook",
    systemMod: "Intent router detects 'health check' keyword (fastRoute score 0.92) → direct webhook trigger",
    output: "Status grid with green/red indicators per service, response times, and uptime percentages.",
  },
  {
    title: "Content Generation",
    icon: FileText,
    color: "orange",
    context: { category: "Content", sub: "Blog" },
    prompt: "Generate blog post outline for auto parts",
    edgeFn: "n8n-agent",
    systemMod: "Context prefix adds: [Content > Blog] — generate content mode, include SEO meta fields",
    output: "Structured outline with H2/H3 headings, intro paragraph, key points, and meta description draft.",
  },
  {
    title: "Workflow Debugging",
    icon: Bug,
    color: "cyan",
    context: { category: "Automation", sub: "n8n" },
    prompt: "Fix Schedule trigger not firing",
    edgeFn: "n8n-agent (troubleshoot mode)",
    systemMod: "Auto-detects 'troubleshoot' intent — switches to diagnostic system prompt with log analysis",
    output: "Step-by-step diagnosis: cron expression validation, timezone check, node connection verification.",
  },
];

const colorMap: Record<string, { border: string; badge: string; bg: string }> = {
  emerald: { border: "border-emerald-500/30", badge: "bg-emerald-500/15 text-emerald-400", bg: "bg-emerald-500/5" },
  violet: { border: "border-violet-500/30", badge: "bg-violet-500/15 text-violet-400", bg: "bg-violet-500/5" },
  orange: { border: "border-orange-500/30", badge: "bg-orange-500/15 text-orange-400", bg: "bg-orange-500/5" },
  cyan: { border: "border-cyan-500/30", badge: "bg-cyan-500/15 text-cyan-400", bg: "bg-cyan-500/5" },
};

const WikiExamples = () => (
  <div className="grid gap-4 sm:grid-cols-2">
    {examples.map((ex) => {
      const Icon = ex.icon;
      const c = colorMap[ex.color];
      return (
        <div key={ex.title} className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
          <div className="mb-3 flex items-center gap-2">
            <Icon size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{ex.title}</h3>
          </div>

          <div className="space-y-2.5 text-[11px]">
            <div>
              <span className="text-muted-foreground/60">Context: </span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${c.badge}`}>
                {ex.context.category} › {ex.context.sub}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground/60">Prompt: </span>
              <span className="font-mono text-foreground">"{ex.prompt}"</span>
            </div>

            <div>
              <span className="text-muted-foreground/60">Edge Function: </span>
              <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">{ex.edgeFn}</code>
            </div>

            <div>
              <span className="text-muted-foreground/60">System Modification: </span>
              <span className="text-muted-foreground">{ex.systemMod}</span>
            </div>

            <div className="rounded-lg border border-border bg-card/50 p-2">
              <span className="text-muted-foreground/60">Expected Output: </span>
              <span className="text-muted-foreground">{ex.output}</span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default WikiExamples;
