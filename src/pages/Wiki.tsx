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
      <section className="section-container flex min-h-[60vh] items-center justify-center pt-28">
        <p className="text-muted-foreground">Loading...</p>
      </section>
    );
  }

  if (!user || !isAdmin) {
    return (
      <section className="section-container flex min-h-[60vh] flex-col items-center justify-center pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ShieldAlert size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-2 font-display text-2xl font-medium text-foreground">Access Denied</h1>
          <p className="mb-6 text-muted-foreground">Admin access required to view the AI Guide.</p>
          <Link to="/portal" className="text-sm text-primary hover:underline">Back to Portal</Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-container px-5 pb-28 pt-20 sm:px-8 sm:pb-20 sm:pt-28 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/portal"
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={12} /> Back to Portal
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-orange-500" />
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                AI Guide
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you can do with AI in your portal — and how to get the best results.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Hero */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: "Ask the Command Center",
              desc: "Open the chat in the Portal header. Pick a topic, type your question, get an answer.",
              accent: "orange",
              border: "border-orange-500/30",
              bg: "bg-orange-500/5",
              iconColor: "text-orange-400",
              numBg: "bg-orange-500/20 text-orange-400",
            },
            {
              icon: Bot,
              title: "Chat with Hans AI",
              desc: "Click the AI button in the navbar for a quick, streaming answer — no matter what page you're on.",
              accent: "emerald",
              border: "border-emerald-500/30",
              bg: "bg-emerald-500/5",
              iconColor: "text-emerald-400",
              numBg: "bg-emerald-500/20 text-emerald-400",
            },
            {
              icon: Wrench,
              title: "Automate with n8n Agent",
              desc: "Open the n8n Agent in the Portal. Describe what you want to automate — it builds the workflow.",
              accent: "cyan",
              border: "border-cyan-500/30",
              bg: "bg-cyan-500/5",
              iconColor: "text-cyan-400",
              numBg: "bg-cyan-500/20 text-cyan-400",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`rounded-xl border p-4 transition-colors hover:bg-secondary/20 ${card.border} ${card.bg}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${card.numBg}`}>
                    {i + 1}
                  </span>
                  <Icon size={14} className={card.iconColor} />
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Accordion sections */}
        <Accordion type="multiple" defaultValue={["tools"]} className="space-y-3">
          <AccordionItem value="tools" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Wand2 size={15} className="text-orange-500" />
                What Can I Use?
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiComponentRegistry />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="flow" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Route size={15} className="text-amber-500" />
                How It Works
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiPipeDesign />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="examples" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Lightbulb size={15} className="text-emerald-500" />
                Try These Examples
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiExamples />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Activity size={15} className="text-red-500" />
                System Health
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiErrorLog />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>
    </section>
  );
};

export default Wiki;
