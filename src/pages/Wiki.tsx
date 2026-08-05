import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Route, Lightbulb, Activity, MessageSquare, Bot, Wrench, Wand2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import WikiComponentRegistry from "@/components/wiki/WikiComponentRegistry";
import WikiPipeDesign from "@/components/wiki/WikiPipeDesign";
import WikiExamples from "@/components/wiki/WikiExamples";
import WikiErrorLog from "@/components/wiki/WikiErrorLog";

const Wiki = () => {
  useEffect(() => {
    document.title = "AI Guide — Hans van Leeuwen";
  }, []);

  return (
    <section aria-label="AI Guide">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <Sparkles size={24} className="text-orange-500" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                AI Guide
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
                Use this guide to find the right tool, understand the flow from question to result, and try example prompts. Everything is intent-based: describe what you want and the system routes you there.
              </p>
            </div>
          </div>
        </header>

        {/* Quick Start */}
        <section className="mb-10" aria-labelledby="quick-start-heading">
          <h3 id="quick-start-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick start
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Three ways to get started. Pick one and follow the steps in the sections below.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: "Ask the Command Center",
                desc: "Open it from the Portal or nav bar. Describe your goal — it routes to a workflow automatically or answers with AI.",
                border: "border-orange-500/30",
                bg: "bg-orange-500/5",
                iconColor: "text-orange-500",
                numBg: "bg-orange-500/20 text-orange-600",
              },
              {
                icon: Bot,
                title: "Command Center everywhere",
                desc: "Click Command Center in the navbar from any page. Same intent-first panel, no need to open the Portal.",
                border: "border-primary/30",
                bg: "bg-primary/5",
                iconColor: "text-primary",
                numBg: "bg-primary/20 text-primary-foreground",
              },
              {
                icon: Wrench,
                title: "Automate with n8n Agent",
                desc: "In the Portal, open the n8n Agent. Describe what you want to automate and it helps build the workflow.",
                border: "border-cyan-500/30",
                bg: "bg-cyan-500/5",
                iconColor: "text-cyan-500",
                numBg: "bg-cyan-500/20 text-cyan-600",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`rounded-xl border p-4 transition-colors hover:bg-secondary/10 ${card.border} ${card.bg}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${card.numBg}`} aria-hidden>
                      {i + 1}
                    </span>
                    <Icon size={16} className={card.iconColor} aria-hidden />
                    <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Guide sections */}
        <nav aria-label="Guide sections" className="space-y-2">
          <Accordion type="multiple" defaultValue={["tools"]} className="space-y-2">
            <AccordionItem value="tools" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2">
                  <Wand2 size={16} className="shrink-0 text-orange-500" aria-hidden />
                  What can I use?
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <WikiComponentRegistry />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="flow" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2">
                  <Route size={16} className="shrink-0 text-amber-500" aria-hidden />
                  How it works
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <WikiPipeDesign />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="examples" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2">
                  <Lightbulb size={16} className="shrink-0 text-primary" aria-hidden />
                  Try these examples
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <WikiExamples />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="health" className="rounded-xl border border-border bg-card/50 px-4">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline [&[data-state=open]]:pb-2">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="shrink-0 text-red-500" aria-hidden />
                  System health
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0">
                <WikiErrorLog />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </nav>
      </motion.div>
    </section>
  );
};

export default Wiki;
