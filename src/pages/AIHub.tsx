import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Terminal, MessageSquare, Zap, Wrench, Compass, Search,
  FileText, Sparkles, ExternalLink, Bot, Cpu, Code2
} from "lucide-react";
import HansAIOverlay from "@/components/overlays/HansAIOverlay";
import EmpireOverlay from "@/components/overlays/EmpireOverlay";
import N8nAgentModal from "@/components/portal/N8nAgentModal";
import KeywordResearchModal from "@/components/portal/KeywordResearchModal";

type Category = "All" | "Agents" | "Interfaces" | "Tools";

interface AICard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: Category;
  status: "active" | "beta" | "info";
  accent: string;
  action: "navigate" | "overlay" | "link" | "info";
  actionLabel: string;
}

const categories: Category[] = ["All", "Agents", "Interfaces", "Tools"];

const cards: AICard[] = [
  {
    id: "terminal",
    name: "Command Center Terminal",
    description: "Full terminal at /hansai — slash commands, intent pipeline, streaming AI responses.",
    icon: <Terminal size={20} />,
    category: "Interfaces",
    status: "active",
    accent: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    action: "navigate",
    actionLabel: "Open Terminal",
  },
  {
    id: "popup",
    name: "Command Center Popup",
    description: "Overlay version — same 10 categories, compact mode, global shortcut access.",
    icon: <MessageSquare size={20} />,
    category: "Interfaces",
    status: "active",
    accent: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    action: "overlay",
    actionLabel: "Open Popup",
  },
  {
    id: "empire",
    name: "Empire Commander",
    description: "Infrastructure ops AI — n8n, Cloudflare, VPS, Docker management via Claude.",
    icon: <Zap size={20} />,
    category: "Agents",
    status: "active",
    accent: "text-violet-400 border-violet-500/30 bg-violet-500/5",
    action: "overlay",
    actionLabel: "Launch Agent",
  },
  {
    id: "n8n",
    name: "n8n Agent",
    description: "Workflow engineer — build, fix, and troubleshoot n8n workflows with AI assistance.",
    icon: <Wrench size={20} />,
    category: "Agents",
    status: "active",
    accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
    action: "overlay",
    actionLabel: "Launch Agent",
  },
  {
    id: "intent",
    name: "Intent Router",
    description: "Classify prompts into workflow actions or AI fallback using the intent pipeline.",
    icon: <Compass size={20} />,
    category: "Tools",
    status: "info",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    action: "info",
    actionLabel: "Info Only",
  },
  {
    id: "autoseo",
    name: "AutoSEO Brain",
    description: "Batch SEO title optimization via n8n webhook — process product titles at scale.",
    icon: <Search size={20} />,
    category: "Tools",
    status: "active",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    action: "info",
    actionLabel: "Via Webhook",
  },
  {
    id: "content",
    name: "AI Content Suggest",
    description: "Generate copy for pages, products, and descriptions using Gemini models.",
    icon: <FileText size={20} />,
    category: "Tools",
    status: "beta",
    accent: "text-pink-400 border-pink-500/30 bg-pink-500/5",
    action: "info",
    actionLabel: "In Portal",
  },
  {
    id: "keyword",
    name: "Keyword Research",
    description: "Gemini-powered keyword analysis — find opportunities and search volumes.",
    icon: <Sparkles size={20} />,
    category: "Tools",
    status: "active",
    accent: "text-sky-400 border-sky-500/30 bg-sky-500/5",
    action: "overlay",
    actionLabel: "Open Tool",
  },
  {
    id: "template",
    name: "Standalone Template",
    description: "Self-contained HTML export of the Command Center — no dependencies required.",
    icon: <Code2 size={20} />,
    category: "Interfaces",
    status: "active",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    action: "link",
    actionLabel: "View Template",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  beta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

const AIHub = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Category>("All");
  const [hansaiOpen, setHansaiOpen] = useState(false);
  const [empireOpen, setEmpireOpen] = useState(false);
  const [n8nOpen, setN8nOpen] = useState(false);
  const [keywordOpen, setKeywordOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => { document.documentElement.classList.remove("dark"); };
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/portal");
  }, [user, loading, navigate]);

  const filtered = filter === "All" ? cards : cards.filter((c) => c.category === filter);

  const handleAction = (card: AICard) => {
    switch (card.id) {
      case "terminal": navigate("/hansai"); break;
      case "popup": setHansaiOpen(true); break;
      case "empire": setEmpireOpen(true); break;
      case "n8n": setN8nOpen(true); break;
      case "keyword": setKeywordOpen(true); break;
      case "template": window.open("/templates/command-center.html", "_blank"); break;
      default: break;
    }
  };

  if (loading) return <div className="min-h-screen bg-[hsl(220,20%,6%)]" />;

  return (
    <div className="min-h-screen bg-[hsl(220,20%,6%)] pt-28 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Bot size={22} className="text-orange-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              AI Interfaces
            </h1>
          </div>
          <p className="text-emerald-400/60 text-sm max-w-xl">
            Central hub for all AI agents, automation interfaces, and intelligence tools powering the system.
          </p>
        </div>

        {/* Sub-menu pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap border ${
                filter === cat
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-emerald-500/15 text-emerald-400/40 hover:border-emerald-500/30 hover:text-emerald-300"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="ml-auto text-xs text-emerald-500/30 font-mono hidden sm:block">
            {filtered.length} interface{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((card) => (
            <Card
              key={card.id}
              className={`group relative overflow-hidden border bg-[hsl(220,20%,8%)] hover:bg-[hsl(220,20%,10%)] transition-all duration-200 cursor-pointer ${card.accent.split(" ").filter(c => c.startsWith("border-"))[0]}`}
              onClick={() => handleAction(card)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg border ${card.accent}`}>
                    {card.icon}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wider ${statusColors[card.status]}`}
                  >
                    {card.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5 font-mono">
                  {card.name}
                </h3>
                <p className="text-xs text-emerald-400/50 leading-relaxed mb-4">
                  {card.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-500/30 font-mono">
                    {card.category}
                  </span>
                  {card.action !== "info" && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${card.accent.split(" ").filter(c => c.startsWith("text-"))[0]} group-hover:underline`}>
                      {card.actionLabel}
                      <ExternalLink size={10} />
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Overlays */}
      <HansAIOverlay open={hansaiOpen} onClose={() => setHansaiOpen(false)} />
      <EmpireOverlay open={empireOpen} onClose={() => setEmpireOpen(false)} />
      <N8nAgentModal open={n8nOpen} onClose={() => setN8nOpen(false)} />
      <KeywordResearchModal open={keywordOpen} onClose={() => setKeywordOpen(false)} />
    </div>
  );
};

export default AIHub;
