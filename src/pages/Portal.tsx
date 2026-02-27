import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useSearchParams } from "react-router-dom";
import { LogOut, Wrench, FileText, Activity, ShieldAlert, Users, Loader2, LayoutDashboard, Terminal, Crown, Search, Moon, Sun, Sparkles } from "lucide-react";
import PortalToolsTab from "@/components/portal/PortalToolsTab";
import PortalContentTab from "@/components/portal/PortalContentTab";
import PortalStatusTab from "@/components/portal/PortalStatusTab";
import PortalUsersManager from "@/components/portal/PortalUsersManager";
import PortalPagesTab from "@/components/portal/PortalPagesTab";
import PortalEmpireTab from "@/components/portal/PortalEmpireTab";
import PortalTerminalTab from "@/components/portal/PortalTerminalTab";
import InlineChatPanel from "@/components/portal/InlineChatPanel";
import PortalFloatingDock from "@/components/portal/PortalFloatingDock";
import PortalCommandPalette from "@/components/portal/PortalCommandPalette";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import InfoTooltip from "@/components/portal/InfoTooltip";

const HANSAI_SYSTEM_PROMPT = `You are HansAI — the unified intelligence behind Hans van Leeuwen's Sovereign AI Empire. You combine three roles seamlessly:

1. **Empire Commander** — Expert system operator for AI infrastructure: n8n workflows, Cloudflare Workers, VPS servers (srv1402218 + srv1411336), Docker MCP Gateway, Supabase, Claude Code CLI, Ollama + Open WebUI.
2. **n8n Workflow Engineer** — Build complete, valid n8n workflow JSON from scratch. Fix broken workflows, troubleshoot execution errors, explain root causes clearly.
3. **Marketing & SEO Strategist** — Help with automotive SEO, e-commerce automation, Google Ads, Channable feeds, product titles, campaign strategy.

Be concise, technical, and actionable. Format with markdown. Output code in code blocks. When building workflows, output complete valid n8n JSON.`;

const HANSAI_SUGGESTIONS = [
  { icon: Wrench, text: "Fix my AutoSEO workflow — it stopped triggering" },
  { icon: Crown, text: "Run a full health check on all 7 layers" },
  { icon: Terminal, text: "Build a Gmail → Slack alert n8n workflow" },
];

type Tab = "tools" | "content" | "empire" | "terminal" | "pages" | "status" | "users";

const tabs: { id: Tab; label: string; icon: typeof Wrench; hint: string }[] = [
  { id: "tools", label: "Tools", icon: Wrench, hint: "Manage SEO tools and integrations" },
  { id: "content", label: "Content", icon: FileText, hint: "Blog posts and case studies" },
  { id: "empire", label: "Empire", icon: Crown, hint: "7-layer infrastructure monitoring" },
  { id: "terminal", label: "Terminal", icon: Terminal, hint: "HansAI command center" },
  { id: "pages", label: "Pages", icon: LayoutDashboard, hint: "Page visibility and elements" },
  { id: "users", label: "Users", icon: Users, hint: "Manage user roles and access" },
  { id: "status", label: "Status", icon: Activity, hint: "System health and uptime" },
];

const DARK_MODE_KEY = "portal_dark_mode";

const Portal = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "tools";
  const [activeTab, setActiveTab] = useState<Tab>(tabs.some(t => t.id === initialTab) ? initialTab : "tools");
  const [aiOpen, setAiOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(DARK_MODE_KEY) === "true";
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(DARK_MODE_KEY, String(isDark));
  }, [isDark]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "tools" ? {} : { tab });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "e") { e.preventDefault(); setAiOpen((v) => !v); }
      else if (e.key === "k") { e.preventDefault(); setCommandOpen((v) => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setEmailLoading(true);
    const { error } = await signInWithEmail(email, password);
    if (error) toast({ title: "Login failed", description: error, variant: "destructive" });
    setEmailLoading(false);
  };

  if (loading || adminLoading) {
    return (
      <section className="section-container flex min-h-[60vh] items-center justify-center pt-28">
        <p className="text-muted-foreground">Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section-container flex min-h-[70vh] flex-col items-center justify-center pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm text-center">
          <h1 className="mb-4 font-display text-4xl font-medium text-foreground">Portal</h1>
          <p className="mb-8 text-muted-foreground">Sign in to access your SEO tools, workflow triggers, and more.</p>
          <form onSubmit={handleEmailLogin} className="mb-6 space-y-3 text-left">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-sm" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="text-sm" />
            <Button type="submit" disabled={emailLoading} className="w-full">
              {emailLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>
          <button onClick={signInWithGoogle} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80">
            <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </motion.div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="section-container flex min-h-[60vh] flex-col items-center justify-center pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ShieldAlert size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-2 font-display text-2xl font-medium text-foreground">Access Denied</h1>
          <p className="mb-6 text-muted-foreground">You don't have admin access to this portal.</p>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <LogOut size={14} /> Sign out
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-container pt-20 pb-28 sm:pb-20 sm:pt-28 px-5 sm:px-8 lg:px-12">
      <PageBreadcrumb items={[{ label: "Portal" }]} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1.5 text-sm font-medium uppercase tracking-[0.2em] text-primary sm:mb-2">Portal</p>
            <h1 className="mb-1.5 font-display text-2xl font-medium tracking-tight text-foreground sm:mb-2 sm:text-4xl">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground/80 sm:text-base sm:leading-normal sm:text-muted-foreground">
              Unified command center — tools, content, infrastructure, terminal.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 sm:mt-0 sm:gap-2">
            <button onClick={() => setIsDark(!isDark)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground transition-all hover:bg-secondary hover:text-foreground" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              onClick={() => setAiOpen((v) => !v)}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:px-3 sm:py-2 ${
                aiOpen
                  ? "border-2 border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">HansAI</span>
              <InfoTooltip text="Unified AI assistant — infrastructure, workflows, SEO, and more" />
              <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground sm:inline">⌘E</kbd>
            </button>

            <button onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex">
              <Search size={13} />
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground">⌘K</kbd>
            </button>

            <button onClick={signOut} className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97] sm:min-h-0 sm:py-2">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Unified AI Panel */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              key="hansai-inline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "40vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-lg"
            >
              <InlineChatPanel
                systemPrompt={HANSAI_SYSTEM_PROMPT}
                suggestions={HANSAI_SUGGESTIONS}
                title="HansAI"
                subtitle="Empire Commander · n8n Engineer · SEO Strategist"
                icon={Sparkles}
                placeholder="Ask anything — infrastructure, workflows, SEO..."
                accentClass="emerald"
                userId={user.id}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-secondary/50 p-1 pb-2 sm:mb-8 sm:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:py-2 ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <InfoTooltip text={tab.hint} />
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "tools" && <PortalToolsTab userId={user.id} isAdmin={isAdmin} />}
        {activeTab === "content" && <PortalContentTab userId={user.id} isAdmin={isAdmin} />}
        {activeTab === "empire" && <PortalEmpireTab />}
        {activeTab === "terminal" && <PortalTerminalTab />}
        {activeTab === "pages" && <PortalPagesTab />}
        {activeTab === "users" && <PortalUsersManager adminUserId={user.id} />}
        {activeTab === "status" && <PortalStatusTab />}
      </motion.div>

      <PortalFloatingDock activeTab={activeTab} onTabChange={handleTabChange} onCommandOpen={() => setCommandOpen(true)} />
      <PortalCommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onTabChange={handleTabChange} onAiOpen={() => setAiOpen((v) => !v)} onSignOut={signOut} />
    </section>
  );
};

export default Portal;
