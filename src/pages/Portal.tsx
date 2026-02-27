import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { LogOut, Wrench, FileText, Activity, ShieldAlert, Users, Loader2, LayoutDashboard, Terminal, Zap, Cpu, HeartPulse, Bug, Search, Moon, Sun } from "lucide-react";
import PortalToolsTab from "@/components/portal/PortalToolsTab";
import PortalContentTab from "@/components/portal/PortalContentTab";
import PortalStatusTab from "@/components/portal/PortalStatusTab";
import PortalUsersManager from "@/components/portal/PortalUsersManager";
import PortalPagesTab from "@/components/portal/PortalPagesTab";
import InlineChatPanel from "@/components/portal/InlineChatPanel";
import PortalFloatingDock from "@/components/portal/PortalFloatingDock";
import PortalCommandPalette from "@/components/portal/PortalCommandPalette";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const EMPIRE_SYSTEM_PROMPT = `You are the Sovereign AI Empire Commander — an expert system operator for Hans van Leeuwen's AI infrastructure.
You manage n8n workflows, Cloudflare Workers, VPS servers, Docker MCP Gateway, Supabase, and Claude Code CLI sessions.
Be concise, technical, and actionable. Format with markdown.`;

const N8N_SYSTEM_PROMPT = `You are an expert n8n workflow automation engineer and AI agent. You specialize in building, fixing, and troubleshooting n8n workflows.
Output complete, valid n8n JSON when building. When fixing, explain root cause clearly. Format code in markdown code blocks.`;

const EMPIRE_SUGGESTIONS = [
  { icon: Wrench, text: "Fix my AutoSEO workflow — it stopped triggering" },
  { icon: Cpu, text: "Generate a new n8n workflow for Channable feed optimization" },
  { icon: HeartPulse, text: "Run a full health check on all services" },
];

const N8N_SUGGESTIONS = [
  { icon: Zap, text: "Build a Gmail → Slack alert workflow" },
  { icon: Wrench, text: "Fix 'Cannot read property of undefined' in Code node" },
  { icon: Bug, text: "Troubleshoot: my Schedule trigger isn't firing" },
];

type Tab = "tools" | "content" | "pages" | "status" | "users";

const DARK_MODE_KEY = "portal_dark_mode";

const Portal = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("tools");
  const [empireOpen, setEmpireOpen] = useState(false);
  const [n8nOpen, setN8nOpen] = useState(false);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "e") { e.preventDefault(); setEmpireOpen((v) => !v); }
      else if (e.key === "j") { e.preventDefault(); setN8nOpen((v) => !v); }
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
      <section className="flex min-h-screen items-center justify-center bg-[hsl(222,20%,8%)]">
        <p className="text-white/40">Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-[hsl(222,20%,8%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm text-center"
        >
          <h1 className="mb-4 font-display text-4xl font-medium text-white">Portal</h1>
          <p className="mb-8 text-white/50">
            Sign in to access your SEO tools, workflow triggers, and more.
          </p>

          <form onSubmit={handleEmailLogin} className="mb-6 space-y-3 text-left">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/30" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/30" />
            <Button type="submit" disabled={emailLoading} className="w-full">
              {emailLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[hsl(222,20%,8%)] px-2 text-white/30">or</span></div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-80"
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
      <section className="flex min-h-screen flex-col items-center justify-center bg-[hsl(222,20%,8%)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <ShieldAlert size={40} className="mx-auto mb-4 text-white/30" />
          <h1 className="mb-2 font-display text-2xl font-medium text-white">Access Denied</h1>
          <p className="mb-6 text-white/50">You don't have admin access to this portal.</p>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/80">
            <LogOut size={14} /> Sign out
          </button>
        </motion.div>
      </section>
    );
  }

  const welcomeName = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ")[0]
    : undefined;

  return (
    <>
      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEmpireToggle={() => setEmpireOpen((v) => !v)}
        onN8nToggle={() => setN8nOpen((v) => !v)}
        onCommandOpen={() => setCommandOpen(true)}
        onSignOut={signOut}
        isDark={isDark}
        onDarkToggle={() => setIsDark(!isDark)}
        empireOpen={empireOpen}
        n8nOpen={n8nOpen}
        userName={user.user_metadata?.full_name || "Hans van Leeuwen"}
        welcomeName={welcomeName}
      >
        {/* Inline AI Panels */}
        <AnimatePresence>
          {empireOpen && (
            <motion.div
              key="empire-inline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "40vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 overflow-hidden rounded-2xl border border-emerald-500/30 bg-[hsl(220,20%,10%)] shadow-lg shadow-emerald-500/5"
            >
              <InlineChatPanel
                systemPrompt={EMPIRE_SYSTEM_PROMPT}
                suggestions={EMPIRE_SUGGESTIONS}
                title="Empire Commander"
                subtitle="Ask Claude · Manage Infrastructure"
                icon={Terminal}
                placeholder="Claude, fix my AutoSEO workflow..."
                accentClass="emerald"
              />
            </motion.div>
          )}
          {n8nOpen && (
            <motion.div
              key="n8n-inline"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "40vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 overflow-hidden rounded-2xl border border-purple-500/30 bg-[hsl(220,20%,10%)] shadow-lg shadow-purple-500/5"
            >
              <InlineChatPanel
                systemPrompt={N8N_SYSTEM_PROMPT}
                suggestions={N8N_SUGGESTIONS}
                title="n8n Workflow Agent"
                subtitle="Build · Fix · Troubleshoot"
                icon={Zap}
                placeholder="Build a workflow for..."
                accentClass="purple"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "tools" && <PortalToolsTab userId={user.id} isAdmin={isAdmin} />}
          {activeTab === "content" && <PortalContentTab userId={user.id} isAdmin={isAdmin} />}
          {activeTab === "pages" && <PortalPagesTab />}
          {activeTab === "users" && <PortalUsersManager adminUserId={user.id} />}
          {activeTab === "status" && <PortalStatusTab />}
        </motion.div>
      </AdminLayout>

      <PortalFloatingDock activeTab={activeTab} onTabChange={setActiveTab} onCommandOpen={() => setCommandOpen(true)} />
      <PortalCommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onTabChange={setActiveTab} onEmpireOpen={() => setEmpireOpen((v) => !v)} onN8nOpen={() => setN8nOpen((v) => !v)} onSignOut={signOut} />
    </>
  );
};

export default Portal;
