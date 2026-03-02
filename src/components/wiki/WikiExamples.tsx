import { Search, HeartPulse, FileText, Bug } from "lucide-react";

const examples = [
  {
    title: "Find the best keywords for your products",
    icon: Search,
    color: "emerald",
    goal: "Discover high-value keywords to improve your product page rankings.",
    steps: [
      "Open Command Center from the Portal or navigation bar",
      "Select the topic: SEO › Keywords",
      "Type: \"Research keywords for brake pads\"",
    ],
    result: "A table of keywords with search volume estimates and ready-to-use title suggestions.",
  },
  {
    title: "Check if all your services are running",
    icon: HeartPulse,
    color: "violet",
    goal: "Instantly see which backend services are healthy and which need attention.",
    steps: [
      "Open the Command Center in the Portal",
      "Select the topic: Monitoring › Health",
      "Type: \"Run full health check\"",
    ],
    result: "A status grid showing green/red indicators per service, response times, and uptime.",
  },
  {
    title: "Generate a blog post outline",
    icon: FileText,
    color: "orange",
    goal: "Get a structured blog outline with SEO-optimized headings in seconds.",
    steps: [
      "Open the Command Center in the Portal",
      "Select the topic: Content › Blog",
      "Type: \"Generate blog post outline for auto parts\"",
    ],
    result: "A structured outline with H2/H3 headings, an intro paragraph, key points, and a meta description draft.",
  },
  {
    title: "Fix a broken automation",
    icon: Bug,
    color: "cyan",
    goal: "Diagnose why a workflow trigger stopped firing and get step-by-step fixes.",
    steps: [
      "Open Command Center from the Portal or navigation bar",
      "Type: \"Fix Schedule trigger not firing\"",
    ],
    result: "A step-by-step diagnosis: cron expression check, timezone validation, and node connection fixes.",
  },
];

const colorMap: Record<string, { border: string; bg: string; step: string; num: string }> = {
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", step: "text-emerald-400", num: "bg-emerald-500/20 text-emerald-400" },
  violet: { border: "border-violet-500/30", bg: "bg-violet-500/5", step: "text-violet-400", num: "bg-violet-500/20 text-violet-400" },
  orange: { border: "border-orange-500/30", bg: "bg-orange-500/5", step: "text-orange-400", num: "bg-orange-500/20 text-orange-400" },
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-500/5", step: "text-cyan-400", num: "bg-cyan-500/20 text-cyan-400" },
};

const WikiExamples = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Copy these prompts or follow the steps to get results quickly. Each example shows the goal, steps, and what you’ll get.
    </p>
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

          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{ex.goal}</p>

          {/* Steps */}
          <div className="mb-3 space-y-1.5">
            {ex.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${c.num}`}>
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="rounded-lg border border-border bg-card/50 p-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Outcome</span>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{ex.result}</p>
          </div>
        </div>
      );
    })}
    </div>
  </div>
);

export default WikiExamples;
