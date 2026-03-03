import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Layout, ExternalLink, Crown, Wrench, Bot } from "lucide-react";

const templates = [
  {
    id: "command-center",
    name: "Command Center",
    description: "Self-contained HTML terminal with 10 V3 categories, slash commands, delivery picker, and TVA-style pipeline UI.",
    icon: <Terminal size={20} />,
    href: "/templates/command-center.html",
    tags: ["HTML", "Standalone", "AI"],
    accent: "text-orange-400 border-orange-500/30 bg-orange-500/5",
  },
  {
    id: "empire-dashboard",
    name: "Empire Dashboard",
    description: "Infrastructure monitoring template — status grid, audit trail, quick actions, and 7-layer spine indicator.",
    icon: <Crown size={20} />,
    href: "/templates/empire-dashboard.html",
    tags: ["HTML", "Standalone", "Infra"],
    accent: "text-violet-400 border-violet-500/30 bg-violet-500/5",
  },
  {
    id: "portal-tools",
    name: "Portal Tools Panel",
    description: "Tool catalog with category filters, gradient glass cards, feature badges — 12 tools across 5 categories.",
    icon: <Wrench size={20} />,
    href: "/templates/portal-tools.html",
    tags: ["HTML", "Standalone", "Tools"],
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  },
  {
    id: "ai-hub",
    name: "AI Hub",
    description: "Central hub for AI agents and interfaces — category tabs, status badges, and launch actions for 9 AI systems.",
    icon: <Bot size={20} />,
    href: "/templates/ai-hub.html",
    tags: ["HTML", "Standalone", "AI"],
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  },
];

const Templates = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => { document.documentElement.classList.remove("dark"); };
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] pt-28 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Layout size={22} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              Templates
            </h1>
          </div>
          <p className="text-emerald-400/60 text-sm max-w-xl">
            Standalone, self-contained interface exports — ready to download, embed, or deploy anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <a
              key={tpl.id}
              href={tpl.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className={`relative overflow-hidden border bg-[hsl(220,20%,8%)] hover:bg-[hsl(220,20%,10%)] transition-all duration-200 ${tpl.accent.split(" ").filter(c => c.startsWith("border-"))[0]}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg border ${tpl.accent}`}>
                      {tpl.icon}
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {tpl.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5 font-mono">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-emerald-400/50 leading-relaxed mb-4">
                    {tpl.description}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${tpl.accent.split(" ").filter(c => c.startsWith("text-"))[0]} group-hover:underline`}>
                    Open Template <ExternalLink size={10} />
                  </span>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;
