import { useState } from "react";
import { Search, HeartPulse, FileText, Bug, Rss, Megaphone, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Example {
  title: string;
  icon?: typeof Search;
  color: string;
  goal: string;
  steps: string[];
  result: string;
}

const staticExamples: Example[] = [
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
  {
    title: "Optimize your Channable product feed",
    icon: Rss,
    color: "pink",
    goal: "Improve feed quality scores and fix disapproved items in your Channable export.",
    steps: [
      "Open the Command Center in the Portal",
      "Select the topic: Feeds › Channable",
      "Type: \"Optimize feed rules for brake pads category\"",
    ],
    result: "Updated feed rules with title templates, missing-attribute fixes, and a quality score improvement plan.",
  },
  {
    title: "Audit your Google Ads campaigns",
    icon: Megaphone,
    color: "amber",
    goal: "Find wasted spend and optimization opportunities across your ad campaigns.",
    steps: [
      "Open the Command Center in the Portal",
      "Select the topic: Campaigns › Google Ads",
      "Type: \"Audit Google Ads campaigns for last 30 days\"",
    ],
    result: "A report highlighting low-performing keywords, negative keyword suggestions, and bid adjustment recommendations.",
  },
  {
    title: "Track keyword position changes",
    icon: BarChart3,
    color: "sky",
    goal: "See which keywords moved up or down this week and identify quick wins.",
    steps: [
      "Open the Command Center in the Portal",
      "Select the topic: Analytics › Search Console",
      "Type: \"Show keyword position changes this week\"",
    ],
    result: "A ranked list of movers: keywords gained, keywords lost, and opportunities within striking distance.",
  },
];

const colorMap: Record<string, { border: string; bg: string; step: string; num: string }> = {
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", step: "text-emerald-400", num: "bg-emerald-500/20 text-emerald-400" },
  violet:  { border: "border-violet-500/30",  bg: "bg-violet-500/5",  step: "text-violet-400",  num: "bg-violet-500/20 text-violet-400" },
  orange:  { border: "border-orange-500/30",  bg: "bg-orange-500/5",  step: "text-orange-400",  num: "bg-orange-500/20 text-orange-400" },
  cyan:    { border: "border-cyan-500/30",    bg: "bg-cyan-500/5",    step: "text-cyan-400",    num: "bg-cyan-500/20 text-cyan-400" },
  pink:    { border: "border-pink-500/30",    bg: "bg-pink-500/5",    step: "text-pink-400",    num: "bg-pink-500/20 text-pink-400" },
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/5",   step: "text-amber-400",   num: "bg-amber-500/20 text-amber-400" },
  sky:     { border: "border-sky-500/30",     bg: "bg-sky-500/5",     step: "text-sky-400",     num: "bg-sky-500/20 text-sky-400" },
  rose:    { border: "border-rose-500/30",    bg: "bg-rose-500/5",    step: "text-rose-400",    num: "bg-rose-500/20 text-rose-400" },
  teal:    { border: "border-teal-500/30",    bg: "bg-teal-500/5",    step: "text-teal-400",    num: "bg-teal-500/20 text-teal-400" },
  indigo:  { border: "border-indigo-500/30",  bg: "bg-indigo-500/5",  step: "text-indigo-400",  num: "bg-indigo-500/20 text-indigo-400" },
  lime:    { border: "border-lime-500/30",    bg: "bg-lime-500/5",    step: "text-lime-400",    num: "bg-lime-500/20 text-lime-400" },
  fuchsia: { border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/5", step: "text-fuchsia-400", num: "bg-fuchsia-500/20 text-fuchsia-400" },
};

const AI_COLORS = ["rose", "teal", "indigo", "lime", "fuchsia", "pink", "amber", "sky", "emerald", "violet"];

const GENERATE_PROMPT = `You are a technical writer for an AI-powered e-commerce Command Center. Generate exactly 5 NEW example prompts that demonstrate the 2-layer filter flow (Category > Sub-category > prompt).

Available categories and subcategories:
- SEO: Technical SEO, On-Page, Keywords, Meta Tags, Schema
- Content: Blog Posts, Product Copy, Landing Pages
- Feeds: Channable, Google Shopping, Product Data
- Campaigns: Google Ads, Social Media, Email
- Analytics: GA4, Search Console, Reporting
- Infrastructure: VPS Primary, VPS Industrial, Cloudflare, DNS, SSL
- Workflows: AutoSEO, Product Titles, Channable, Custom
- Monitoring: Health Checks, Logs, Alerts
- Database: Supabase, Queries, Migrations
- Docker: MCP Gateway, Containers, Networking

Return ONLY a JSON array (no markdown, no code fences) with exactly 5 objects, each having:
- "title": short action-oriented title (max 8 words)
- "color": one of: rose, teal, indigo, lime, fuchsia
- "goal": one sentence explaining the benefit
- "steps": array of exactly 3 strings: step 1 = open command center, step 2 = select Category > Sub-category, step 3 = type the prompt
- "result": one sentence describing the output

Make each example use a DIFFERENT category+subcategory combination. Be specific to automotive e-commerce.`;

function ExampleCard({ ex, index }: { ex: Example; index: number }) {
  const Icon = ex.icon;
  const c = colorMap[ex.color] || colorMap.cyan;
  return (
    <div className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon size={15} className="text-muted-foreground" />}
        {!Icon && <Sparkles size={15} className="text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{ex.title}</h3>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{ex.goal}</p>
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
      <div className="rounded-lg border border-border bg-card/50 p-2.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">Outcome</span>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{ex.result}</p>
      </div>
    </div>
  );
}

const WikiExamples = () => {
  const [extraExamples, setExtraExamples] = useState<Example[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateMore = async () => {
    setIsLoading(true);
    try {
      // Use fetch directly to get the raw SSE stream
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hansai-chat`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: GENERATE_PROMPT }],
          model: "google/gemini-2.5-flash",
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const text = await response.text();

      // Parse SSE stream: extract content deltas
      let fullContent = "";
      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6).trim();
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {}
      }

      // Clean potential markdown fences
      fullContent = fullContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      const examples: Example[] = JSON.parse(fullContent);
      if (!Array.isArray(examples) || examples.length === 0) throw new Error("Invalid response");

      // Assign safe colors
      const colored = examples.map((ex, i) => ({
        ...ex,
        color: AI_COLORS[i % AI_COLORS.length],
        icon: undefined,
      }));

      setExtraExamples((prev) => [...prev, ...colored]);
    } catch (err) {
      console.error("Generate examples error:", err);
      toast.error("Failed to generate examples. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Copy these prompts or follow the steps to get results quickly. Each example shows the goal, steps, and what you'll get.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {staticExamples.map((ex, i) => (
          <ExampleCard key={ex.title} ex={ex} index={i} />
        ))}
        <AnimatePresence>
          {extraExamples.map((ex, i) => (
            <motion.div
              key={`ai-${i}-${ex.title}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <ExampleCard ex={ex} index={staticExamples.length + i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={generateMore}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {isLoading ? "Generating…" : "Generate 5 more examples"}
        </Button>
      </div>
    </div>
  );
};

export default WikiExamples;
