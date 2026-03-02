const steps = [
  {
    label: "Type your question",
    detail: "Open any AI chat and type what you need — a question, a task, or a request.",
    accent: "orange",
    number: "1",
  },
  {
    label: "Pick a topic",
    detail: "Choose a category like SEO, Content, or Monitoring. This helps the AI give you more relevant answers.",
    accent: "amber",
    number: "2",
  },
  {
    label: "Try a suggested prompt",
    detail: "Pick from your most-used prompts to save time, or type your own from scratch.",
    accent: "amber",
    number: "3",
  },
  {
    label: "AI processes your request",
    detail: "The system figures out the best way to handle your request and routes it to the right AI model automatically.",
    accent: "cyan",
    number: "4",
  },
  {
    label: "Get your answer",
    detail: "Results appear as formatted text with headings, tables, and highlights. The orange progress bar shows each step: Transmit → Analyze → Synthesize → Complete.",
    accent: "emerald",
    number: "5",
  },
];

const accentBorder: Record<string, string> = {
  orange: "border-orange-500/50",
  amber: "border-amber-500/50",
  cyan: "border-cyan-500/50",
  emerald: "border-emerald-500/50",
};

const accentDot: Record<string, string> = {
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
  emerald: "bg-emerald-500",
};

const accentNumber: Record<string, string> = {
  orange: "text-orange-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
};

const WikiPipeDesign = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      From your message to the result: the system interprets your intent, picks the right path, and returns a clear answer. The steps below outline the flow.
    </p>
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/60 via-cyan-500/40 to-emerald-500/60" aria-hidden />

      <div className="space-y-1">
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-start gap-3 py-2">
          <div className={`absolute -left-6 top-3.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-background ${accentDot[step.accent]}`}>
            <span className="text-[10px] font-bold text-background">{step.number}</span>
          </div>
          <div className={`flex-1 rounded-lg border bg-card/50 px-4 py-3 ${accentBorder[step.accent]}`}>
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        </div>
      ))}
      </div>
    </div>
  </div>
);

export default WikiPipeDesign;
