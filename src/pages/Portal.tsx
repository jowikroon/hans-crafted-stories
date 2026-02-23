import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { LogOut, Wrench, FileText, Activity, ShieldAlert, Users, Loader2, LayoutDashboard } from "lucide-react";
import PortalToolsTab from "@/components/portal/PortalToolsTab";
import PortalContentTab from "@/components/portal/PortalContentTab";
import PortalStatusTab from "@/components/portal/PortalStatusTab";
import PortalUsersManager from "@/components/portal/PortalUsersManager";
import PortalPagesTab from "@/components/portal/PortalPagesTab";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Tab = "tools" | "content" | "pages" | "status" | "users";

const tabs: { id: Tab; label: string; icon: typeof Wrench }[] = [
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "content", label: "Content", icon: FileText },
  { id: "pages", label: "Pages", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "status", label: "Status", icon: Activity },
];

const Portal = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("tools");
  const { toast } = useToast();

  // Email login state
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

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="mb-6 space-y-3 text-left">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm"
            />
            <Button type="submit" disabled={emailLoading} className="w-full">
              {emailLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShieldAlert size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-2 font-display text-2xl font-medium text-foreground">Access Denied</h1>
          <p className="mb-6 text-muted-foreground">You don't have admin access to this portal.</p>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={14} /> Sign out
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-container pt-28 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Portal</p>
            <h1 className="mb-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground">Admin dashboard — manage tools, content, and system health.</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "tools" && <PortalToolsTab userId={user.id} isAdmin={isAdmin} />}
        {activeTab === "content" && <PortalContentTab userId={user.id} isAdmin={isAdmin} />}
        {activeTab === "pages" && <PortalPagesTab />}
        {activeTab === "users" && <PortalUsersManager adminUserId={user.id} />}
        {activeTab === "status" && <PortalStatusTab />}
      </motion.div>
    </section>
  );
};

export default Portal;
