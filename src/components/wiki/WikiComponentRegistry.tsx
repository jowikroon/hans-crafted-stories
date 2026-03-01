import { useState } from "react";
import { MessageSquare, Bot, Compass, Sparkles, HeartPulse, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import WikiCommandFlow from "./WikiCommandFlow";

const tools = [
  {
    name: "Command Center",
    tagline: "Your main AI assistant",
    icon: MessageSquare,
    color: "orange",
    description: "Ask anything — from SEO advice to content writing. Pick a topic first to get smarter, more focused answers.",
    findIt: "Open it from the chat icon at the top of the Portal.",
    bestFor: "General questions, brainstorming, writing tasks",
    tip: "Select a topic category before typing to get much better results.",
  },
  {
    name: "Hans AI",
    tagline: "Quick AI chat, anywhere",
    icon: Bot,
    color: "emerald",
    description: "A fast, streaming chat that's accessible from any page. Great for quick questions without leaving what you're working on.",
    findIt: "Click the AI button in the top navigation bar.",
    bestFor: "Quick lookups, SEO checks, on-the-fly answers",
    tip: "Use the suggested prompts — they're sorted by what you use most.",
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
    tagline: "Finds the right tool for you",
    icon: Compass,
    color: "amber",
    description: "When you type a request, the system automatically figures out the best way to handle it — no extra steps needed.",
    findIt: "Use the compass button in the Command Center.",
    bestFor: "Complex requests that span multiple tools",
    tip: "Be specific about your goal — 'optimize product titles for SEO' works better than 'help with SEO'.",
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
    <div className="grid gap-4 sm:grid-cols-2">
      {tools.map((t) => {
        const Icon = t.icon;
        const isCommandCenter = t.name === "Command Center";
        return (
          <div
            key={t.name}
            className={`rounded-xl border p-4 transition-colors hover:bg-secondary/20 ${colorMap[t.color]} ${isCommandCenter ? "sm:col-span-2" : ""}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon size={16} className="shrink-0 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColorMap[t.color]}`}>
                {t.tagline}
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground/70">📍 Find it</span>
                <span className="text-muted-foreground">{t.findIt}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground/70">✦ Best for</span>
                <span className="text-muted-foreground">{t.bestFor}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground/70">💡 Pro tip</span>
                <span className="text-foreground/80">{t.tip}</span>
              </div>
            </div>

            {isCommandCenter && (
              <>
                <button
                  onClick={() => setShowFlow((v) => !v)}
                  className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-orange-400 transition-colors hover:text-orange-300"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${showFlow ? "rotate-180" : ""}`}
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
          </div>
        );
      })}
    </div>
  );
};

export default WikiComponentRegistry;
