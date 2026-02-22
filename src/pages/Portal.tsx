import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, LogOut, Wrench, Workflow, Globe, Plus } from "lucide-react";

interface ToolCard {
  id: string;
  name: string;
  description: string;
  icon: typeof Wrench;
  action: () => void;
  color: string;
}

const Portal = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
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
          className="text-center"
        >
          <h1 className="mb-4 font-display text-4xl font-medium text-foreground">Portal</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Sign in to access your SEO tools, workflow triggers, and more.
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
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

  const tools: ToolCard[] = [
    {
      id: "keyword-research",
      name: "Keyword Research",
      description: "Analyze search volume, competition, and keyword opportunities.",
      icon: Globe,
      action: () => window.open("https://www.google.com/search?q=keyword+research+tool", "_blank"),
      color: "text-blue-500",
    },
    {
      id: "n8n-workflow",
      name: "N8N Workflows",
      description: "Trigger and manage your automation workflows.",
      icon: Workflow,
      action: () => {
        // Placeholder: trigger n8n webhook
        console.log("Triggering n8n workflow...");
      },
      color: "text-orange-500",
    },
    {
      id: "site-audit",
      name: "Site Audit",
      description: "Run a quick SEO audit on any website.",
      icon: Wrench,
      action: () => console.log("Site audit tool"),
      color: "text-green-500",
    },
  ];

  return (
    <section className="section-container pt-28 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Portal</p>
            <h1 className="mb-2 font-display text-4xl font-medium tracking-tight text-foreground">
              Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground">Your tools and workflows, all in one place.</p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={tool.action}
              className="group rounded-lg border border-border p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-md"
            >
              <tool.icon size={24} className={`mb-4 ${tool.color}`} />
              <h3 className="mb-1 font-display text-lg font-medium text-foreground">
                {tool.name}
                <ExternalLink size={12} className="ml-2 inline-block opacity-0 transition-opacity group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </motion.button>
          ))}

          {/* Add Tool Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: tools.length * 0.1 }}
            className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-muted-foreground/50"
          >
            <div className="text-center">
              <Plus size={24} className="mx-auto mb-2" />
              <p className="text-sm">Add more tools</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Portal;
