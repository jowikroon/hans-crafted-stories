import { useState } from "react";
import { MessageSquare, Bot, Compass, Sparkles, HeartPulse, ChevronDown, MapPin, Target, Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import WikiCommandFlow from "./WikiCommandFlow";

const tools = [
  {
    name: "Command Center",
    tagline: "The only link to intent",
    icon: MessageSquare,
    color: "orange",
    description: "The single entry point for everything. Type a goal in plain language — it classifies your intent, triggers the right workflow automatically, and falls back to AI chat when no workflow matches. Unmatched requests are logged so you learn from them over time.",
    findIt: "Portal → Command Center button, or click 'Command Center' in the top navigation. Both open the same intent-first panel.",
    bestFor: "Triggering workflows, SEO tasks, infra commands, AI questions",
    tip: "No need to pick a workflow manually — just describe your goal and Command Center routes it for you.",
  },
  {
    name: "Hans AI Terminal",
    tagline: "Full-page command terminal",
    icon: Bot,
    color: "emerald",
    description: "The full-screen terminal view of Command Center. Supports slash commands (/run, /task, /idea), workflow clarification, and streaming AI chat — all powered by the same intent pipeline.",
    findIt: "Navigate to /hansai, or click 'Full Terminal →' inside the Command Center overlay.",
    bestFor: "Power users who prefer a terminal UI, slash commands, reviewing command history",
    tip: "Type /workflows to see all available n8n workflows you can trigger directly.",
  },
  {
    name: "Empire Commander",
    tagline: "Manage your infrastructure",
    icon: Bot,
    color: "violet",
    description: "Monitor and manage your backend services. Check what's running, troubleshoot issues, and run health checks.",
    findIt: "Open from the Empire AI button in the Portal.",
    bestFor: "Server monitoring, deployment status, debugging",
    tip: "Ask 'run full health check' to instantly scan all services.",
  },
  {
    name: "n8n Agent",
    tagline: "Workflow automation helper",
    icon: Bot,
    color: "cyan",
    description: "Get help building, debugging, and managing your automated workflows. It knows your workflow setup.",
    findIt: "Click the n8n Agent button in the Portal.",
    bestFor: "Building automations, fixing triggers, workflow questions",
    tip: "Describe what you want to automate in plain language — it will suggest a workflow.",
  },
  {
    name: "Smart Routing",
    tagline: "Built into every send",
    icon: Compass,
    color: "amber",
    description: "Every message you send through Command Center is automatically routed: fast keyword matching first, then LLM classification, then clarification if needed, and unmatched requests are logged for future improvement.",
    findIt: "It runs automatically on every message in Command Center. Use the compass icon to manually classify an input before sending.",
    bestFor: "Understanding which workflow will run, pre-routing before sending",
    tip: "Click the compass icon next to the input to preview which workflow your message will trigger before you send.",
  },
  {
    name: "AI Content Writer",
    tagline: "Generate copy instantly",
    icon: Sparkles,
    color: "pink",
    description: "Generates titles, descriptions, and body text for any page. Just pick a field and let AI draft it for you.",
    findIt: "Edit any page content and click the sparkle icon next to a text field.",
    bestFor: "Page titles, meta descriptions, blog intros",
    tip: "Review and tweak the suggestions — AI gives you a strong starting point, not the final word.",
  },
  {
    name: "Health Monitor",
    tagline: "See if everything is running",
    icon: HeartPulse,
    color: "green",
    description: "Shows real-time status of all your backend services — green means good, red means something needs attention.",
    findIt: "Go to the Empire Dashboard page.",
    bestFor: "Checking uptime, spotting outages, response times",
    tip: "If a service shows red, try asking Empire Commander to diagnose the issue.",
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
};

const badgeColorMap: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  violet: "bg-violet-500/15 text-violet-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
  amber: "bg-amber-500/15 text-amber-400",
  pink: "bg-pink-500/15 text-pink-400",
  green: "bg-green-500/15 text-green-400",
};

const WikiComponentRegistry = () => {
  const [showFlow, setShowFlow] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        These are the main AI-powered tools in your portal. Each has a clear role — start with Command Center, then explore the others as needed.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isCommandCenter = t.name === "Command Center";
          return (
            <article
              key={t.name}
              className={`rounded-xl border p-4 transition-colors hover:bg-secondary/10 ${colorMap[t.color]} ${isCommandCenter ? "sm:col-span-2" : ""}`}
              aria-labelledby={`tool-${t.name.replace(/\s+/g, "-")}-title`}
            >
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <Icon size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                <h3 id={`tool-${t.name.replace(/\s+/g, "-")}-title`} className="text-sm font-semibold text-foreground">{t.name}</h3>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColorMap[t.color]}`}>
                  {t.tagline}
                </span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
              <div className="space-y-2.5 text-[11px]">
                <div className="flex gap-2">
                  <span className="flex shrink-0 items-start gap-1 font-medium text-muted-foreground">
                    <MapPin size={11} className="mt-0.5 shrink-0" aria-hidden /> Find it
                  </span>
                  <span className="text-muted-foreground">{t.findIt}</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex shrink-0 items-start gap-1 font-medium text-muted-foreground">
                    <Target size={11} className="mt-0.5 shrink-0" aria-hidden /> Best for
                  </span>
                  <span className="text-muted-foreground">{t.bestFor}</span>
                </div>
                <div className="flex gap-2">
                  <span className="flex shrink-0 items-start gap-1 font-medium text-muted-foreground">
                    <Lightbulb size={11} className="mt-0.5 shrink-0" aria-hidden /> Pro tip
                  </span>
                  <span className="text-foreground/90">{t.tip}</span>
                </div>
              </div>

            {isCommandCenter && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFlow((v) => !v)}
                  className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-orange-400 transition-colors hover:text-orange-300"
                  aria-expanded={showFlow}
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${showFlow ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                  {showFlow ? "Hide workflow" : "See how it works"}
                </button>
                <AnimatePresence>
                  {showFlow && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <WikiCommandFlow />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </article>
        );
      })}
      </div>
    </div>
  );
};

export default WikiComponentRegistry;
