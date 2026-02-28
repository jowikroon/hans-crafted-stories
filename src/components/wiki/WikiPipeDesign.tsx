const steps = [
  {
    label: "User Input",
    detail: "Raw text prompt typed into any chat panel",
    accent: "orange",
  },
  {
    label: "Context Filter Pills",
    detail: "Layer 1: Category — Layer 2: Sub-context",
    accent: "amber",
  },
  {
    label: "Command Suggestions",
    detail: "Layer 3: Top-10 smart prompts (usage-sorted, localStorage)",
    accent: "amber",
  },
  {
    label: "buildContextPrefix()",
    detail: "Prepends system hints based on selected category + sub-context",
    accent: "orange",
  },
  {
    label: "Intent Router",
    detail: "Optional: Compass button classifies the user's goal",
    accent: "violet",
    branches: [
      { label: "fastRoute()", detail: "Client-side keyword matching — score > 0.85 = direct route" },
      { label: "intent-router edge fn", detail: "LLM fallback — confidence < 0.5 triggers classification" },
    ],
  },
  {
    label: "Edge Function",
    detail: "hansai-chat (streaming) OR n8n-agent (non-streaming)",
    accent: "cyan",
  },
  {
    label: "Lovable AI Gateway",
    detail: "ai.gateway.lovable.dev/v1/chat/completions",
    accent: "emerald",
  },
  {
    label: "Response Rendering",
    detail: "Markdown with code blocks + inline code formatting",
    accent: "amber",
  },
  {
    label: "TVA Pipeline Bar",
    detail: "TRANSMIT → ANALYZE → SYNTHESIZE → COMPLETE",
    accent: "orange",
  },
];

const accentBorder: Record<string, string> = {
  orange: "border-orange-500/50",
  amber: "border-amber-500/50",
  violet: "border-violet-500/50",
  cyan: "border-cyan-500/50",
  emerald: "border-emerald-500/50",
};

const accentDot: Record<string, string> = {
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
};

const WikiPipeDesign = () => (
  <div className="relative pl-6">
    {/* Vertical connector line */}
    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/60 via-cyan-500/40 to-orange-500/60" />

    <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={i}>
          {/* Main node */}
          <div className="relative flex items-start gap-3 py-2">
            <div className={`absolute -left-6 top-3.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${accentDot[step.accent]}`} />
            <div className={`flex-1 rounded-lg border bg-card/50 px-4 py-3 ${accentBorder[step.accent]}`}>
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </div>

          {/* Branches */}
          {step.branches && (
            <div className="relative ml-8 space-y-1 pb-1">
              {step.branches.map((b, j) => (
                <div key={j} className="flex items-start gap-3 py-1">
                  <div className="mt-2 h-px w-4 bg-violet-500/40" />
                  <div className="flex-1 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2">
                    <p className="text-xs font-medium text-foreground">{b.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{b.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default WikiPipeDesign;
