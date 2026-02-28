import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ShieldAlert, BookOpen, Cpu, GitBranch, Lightbulb, AlertTriangle, ArrowLeft } from "lucide-react";
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

  // Force dark mode
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
    document.title = "AI Wiki — Hans van Leeuwen";
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
          <p className="mb-6 text-muted-foreground">Admin access required to view the AI Wiki.</p>
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
            <BookOpen size={24} className="text-orange-500" />
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                AI Wiki
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Internal reference for all AI components, user flows, and system architecture.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion sections */}
        <Accordion type="multiple" defaultValue={["registry"]} className="space-y-3">
          <AccordionItem value="registry" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <Cpu size={15} className="text-orange-500" />
                AI Components Registry
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiComponentRegistry />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pipeline" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <GitBranch size={15} className="text-amber-500" />
                User Flow Pipe Design
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
                Worked-Out Examples
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <WikiExamples />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="errors" className="rounded-xl border border-border bg-card/50 px-4">
            <AccordionTrigger className="py-4 text-sm font-semibold text-foreground hover:no-underline">
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                Live Error Log
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
