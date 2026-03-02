import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldAlert, Sparkles, Wand2, Route, Lightbulb, Activity, ArrowLeft, MessageSquare, Bot, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
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

const THEME_KEY = "site_theme";

const Wiki = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    const prev = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_KEY, "dark");
    return () => {
      document.documentElement.classList.toggle("dark", prev === "dark");
      localStorage.setItem(THEME_KEY, prev);
    };
  }, []);

  useEffect(() => {
    document.title = "AI Guide — Hans van Leeuwen";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, []);

  if (loading || adminLoading) {
    return (
      <section className="section-container flex min-h-[60vh] items-center justify-center pt-28" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading guide…</p>
        </div>
      </section>
    );
  }

  if (!user || !isAdmin) {
    return (
      <section className="section-container flex min-h-[60vh] flex-col items-center justify-center pt-28" aria-labelledby="access-denied-heading">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <ShieldAlert size={48} className="mx-auto mb-4 text-muted-foreground" aria-hidden />
          <h1 id="access-denied-heading" className="mb-2 font-display text-2xl font-semibold text-foreground">Access denied</h1>
          <p className="mb-6 text-sm text-muted-foreground">Admin access is required to view the AI Guide. Sign in with an admin account or return to the Portal.</p>
          <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft size={14} aria-hidden /> Back to Portal
          </Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-container max-w-4xl mx-auto px-5 pb-28 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12" aria-label="AI Guide">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <header className="mb-10">
          <Link
            to="/portal"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Return to Portal"
          >
            <ArrowLeft size={14} aria-hidden /> Back to Portal
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <Sparkles size={24} className="text-orange-500" aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                AI Guide
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-xl">
                Use this guide to find the right tool, understand the flow from question to result, and try example prompts. Everything is intent-based: describe what you want and the system routes you there.
              </p>
            </div>
          </div>
        </header>

        {/* Quick Start */}
        <section className="mb-10" aria-labelledby="quick-start-heading">
          <h2 id="quick-start-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick start
          </h2>
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
                iconColor: "text-orange-400",
                numBg: "bg-orange-500/20 text-orange-400",
              },
              {
                icon: Bot,
                title: "Command Center everywhere",
                desc: "Click Command Center in the navbar from any page. Same intent-first panel, no need to open the Portal.",
                border: "border-emerald-500/30",
                bg: "bg-emerald-500/5",
                iconColor: "text-emerald-400",
                numBg: "bg-emerald-500/20 text-emerald-400",
              },
              {
                icon: Wrench,
                title: "Automate with n8n Agent",
                desc: "In the Portal, open the n8n Agent. Describe what you want to automate and it helps build the workflow.",
                border: "border-cyan-500/30",
                bg: "bg-cyan-500/5",
                iconColor: "text-cyan-400",
                numBg: "bg-cyan-500/20 text-cyan-400",
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
                    <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
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
                  <Lightbulb size={16} className="shrink-0 text-emerald-500" aria-hidden />
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
