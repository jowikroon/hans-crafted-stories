import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { LogOut, Wrench, FileText, Activity, ShieldAlert, Users, Loader2, LayoutDashboard, Command, Search, Zap, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import PortalToolsTab from "@/components/portal/PortalToolsTab";
import PortalContentTab from "@/components/portal/PortalContentTab";
import PortalStatusTab from "@/components/portal/PortalStatusTab";
import PortalUsersManager from "@/components/portal/PortalUsersManager";
import PortalPagesTab from "@/components/portal/PortalPagesTab";
import UnifiedChatPanel from "@/components/portal/UnifiedChatPanel";
import PortalFloatingDock from "@/components/portal/PortalFloatingDock";
import PortalCommandPalette from "@/components/portal/PortalCommandPalette";
import EmpireOverlay from "@/components/overlays/EmpireOverlay";
import N8nAgentModal from "@/components/portal/N8nAgentModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { usePageElements } from "@/hooks/usePageElements";



type Tab = "tools" | "content" | "pages" | "status" | "users";

const subMenuItems: Record<Tab, string[]> = {
  tools: ["All", "SEO", "Automation", "Data", "AI", "General"],
  content: ["All", "Blog Posts", "Case Studies", "Main Menu"],
  pages: ["All", "Published", "Hidden"],
  users: ["All", "Admins", "Members"],
  status: ["All", "Overview", "Test Results", "Issues", "Architecture"],
};

const tabs: { id: Tab; label: string; icon: typeof Wrench; hint: string }[] = [
  { id: "tools", label: "Tools", icon: Wrench, hint: "Manage SEO tools and integrations" },
  { id: "content", label: "Content", icon: FileText, hint: "Blog posts and case studies" },
  { id: "pages", label: "Pages", icon: LayoutDashboard, hint: "Page visibility and elements" },
  { id: "users", label: "Users", icon: Users, hint: "Manage user roles and access" },
  { id: "status", label: "Status", icon: Activity, hint: "System health and uptime" },
];

const THEME_KEY = "site_theme";

const Portal = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("tools");
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [subFilter, setSubFilter] = useState<string>("All");
  const [commandOpen, setCommandOpen] = useState(false);
  const [empireOpen, setEmpireOpen] = useState(false);
  const [n8nOpen, setN8nOpen] = useState(false);
  const { toast } = useToast();
  const { isVisible } = usePageElements("portal");

  // Force dark mode when Portal mounts; restore previous theme on unmount
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
    document.title = "Portal — Hans van Leeuwen";
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robots) { robots = document.createElement("meta"); robots.name = "robots"; document.head.appendChild(robots); }
    robots.content = "noindex, nofollow";
    return () => { if (robots) robots.content = "index, follow"; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "e" || e.key === "j") { e.preventDefault(); setCommandCenterOpen((v) => !v); }
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
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
    }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm text-center"
        >
          <h1 className="mb-4 font-display text-4xl font-medium text-foreground">Portal</h1>
          <p className="mb-8 text-muted-foreground">
            Sign in to access your SEO tools, workflow triggers, and more.
          </p>

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

          <button
            onClick={signInWithGoogle}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1.5 text-sm font-medium uppercase tracking-[0.2em] text-primary sm:mb-2">Portal</p>
            <h1 className="mb-1.5 font-display text-2xl font-medium tracking-tight text-foreground sm:mb-2 sm:text-4xl">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground/80 sm:text-base sm:leading-normal sm:text-muted-foreground">
              Your tools board — manage tools, content one place.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 sm:mt-0 sm:gap-2">
            {isVisible("empire_ai_button") && (
              <button
                onClick={() => setEmpireOpen((v) => !v)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:px-3 sm:py-2 ${
                  empireOpen
                    ? "border-2 border-violet-500 bg-violet-500/10 text-violet-500 shadow-[0_0_16px_hsl(263_70%_50%/0.35)]"
                    : "border border-border text-muted-foreground hover:border-violet-500/40 hover:text-foreground hover:shadow-[0_0_12px_hsl(263_70%_50%/0.15)]"
                }`}
              >
                <Zap size={14} />
                <span className="hidden sm:inline">Empire AI</span>
              </button>
            )}
            {isVisible("n8n_agent_button") && (
              <button
                onClick={() => setN8nOpen((v) => !v)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:px-3 sm:py-2 ${
                  n8nOpen
                    ? "border-2 border-cyan-500 bg-cyan-500/10 text-cyan-500 shadow-[0_0_16px_hsl(188_95%_43%/0.35)]"
                    : "border border-border text-muted-foreground hover:border-cyan-500/40 hover:text-foreground hover:shadow-[0_0_12px_hsl(188_95%_43%/0.15)]"
                }`}
              >
                <Wrench size={14} />
                <span className="hidden sm:inline">n8n Agent</span>
              </button>
            )}
            {isVisible("command_center_button") && (
              <button
                onClick={() => setCommandCenterOpen((v) => !v)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:px-3 sm:py-2 ${
                  commandCenterOpen
                    ? "border-2 border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_16px_hsl(25_95%_53%/0.35)]"
                    : "border border-border text-muted-foreground hover:border-orange-500/40 hover:text-foreground hover:shadow-[0_0_12px_hsl(25_95%_53%/0.15)]"
                }`}
              >
                <Command size={14} />
                <span className="hidden sm:inline">Command Center</span>
              </button>
            )}
            <Link
              to="/wiki"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97] sm:min-h-0 sm:px-3 sm:py-2"
              title="AI Wiki"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Wiki</span>
            </Link>
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            >
              <Search size={13} />
            </button>
            <button
              onClick={signOut}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97] sm:min-h-0 sm:py-2"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Unified Command Center Panel */}
        {isVisible("command_center_button") && (
          <AnimatePresence>
            {commandCenterOpen && (
              <motion.div
                key="command-center"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "50vh", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4 overflow-hidden rounded-2xl border-2 border-orange-500 bg-card shadow-lg flex flex-col"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-orange-500/20 px-3 py-2 bg-card/80">
                  <span className="text-[11px] font-medium text-foreground">Command Center</span>
                  {isAdmin ? (
                    <Link
                      to="/hansai"
                      className="rounded-md px-2.5 py-1 text-[10px] font-medium text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors"
                    >
                      Open full Command Center (terminal + filters) →
                    </Link>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Log in as admin to open the full terminal.</span>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  <UnifiedChatPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Tab Navigation */}
        <div className="mb-2 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-secondary/50 p-1 pb-2 sm:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSubFilter("All"); }}
                className={`flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all active:scale-[0.97] sm:min-h-0 sm:py-2 ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <nav className="mb-6 flex items-center overflow-x-auto">
          {subMenuItems[activeTab].map((item, i) => {
            const isActive = subFilter === item;
            return (
              <div key={item} className="flex items-center">
                <button
                  onClick={() => setSubFilter(item)}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "font-medium text-orange-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
                {i < subMenuItems[activeTab].length - 1 && (
                  <div className="h-3.5 w-px bg-border" />
                )}
              </div>
            );
          })}
        </nav>


        {/* Tab Content */}
        {activeTab === "tools" && <PortalToolsTab userId={user.id} isAdmin={isAdmin} subFilter={subFilter} />}
        {activeTab === "content" && <PortalContentTab userId={user.id} isAdmin={isAdmin} subFilter={subFilter} />}
        {activeTab === "pages" && <PortalPagesTab subFilter={subFilter} />}
        {activeTab === "users" && <PortalUsersManager adminUserId={user.id} subFilter={subFilter} />}
        {activeTab === "status" && <PortalStatusTab subFilter={subFilter} />}
      </motion.div>

      {isVisible("terminal_button") && (
        <PortalFloatingDock activeTab={activeTab} onTabChange={setActiveTab} onCommandOpen={() => setCommandOpen(true)} />
      )}
      <PortalCommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onTabChange={setActiveTab} onEmpireOpen={() => setCommandCenterOpen((v) => !v)} onN8nOpen={() => setCommandCenterOpen((v) => !v)} onSignOut={signOut} />
      <EmpireOverlay open={empireOpen} onClose={() => setEmpireOpen(false)} />
      <N8nAgentModal open={n8nOpen} onClose={() => setN8nOpen(false)} />
    </section>
  );
};

export default Portal;
