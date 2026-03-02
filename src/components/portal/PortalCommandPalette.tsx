import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Terminal, Zap, Wrench, FileText, LayoutDashboard, Users, Activity, X, ArrowRight } from "lucide-react";

type Tab = "tools" | "content" | "pages" | "status" | "users";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: typeof Wrench;
  action: () => void;
  group: string;
}

interface PortalCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onTabChange: (tab: Tab) => void;
  onEmpireOpen: () => void;
  onN8nOpen: () => void;
  onSignOut: () => void;
}

const PortalCommandPalette = ({
  open,
  onClose,
  onTabChange,
  onEmpireOpen,
  onN8nOpen,
  onSignOut,
}: PortalCommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: "nav-tools", label: "Tools", description: "Manage SEO tools", icon: Wrench, action: () => { onTabChange("tools"); onClose(); }, group: "Navigate" },
    { id: "nav-content", label: "Content", description: "Blog posts & case studies", icon: FileText, action: () => { onTabChange("content"); onClose(); }, group: "Navigate" },
    { id: "nav-pages", label: "Pages", description: "Page visibility", icon: LayoutDashboard, action: () => { onTabChange("pages"); onClose(); }, group: "Navigate" },
    { id: "nav-users", label: "Users", description: "Manage access", icon: Users, action: () => { onTabChange("users"); onClose(); }, group: "Navigate" },
    { id: "nav-status", label: "Status", description: "System health", icon: Activity, action: () => { onTabChange("status"); onClose(); }, group: "Navigate" },
    // AI
    { id: "ai-empire", label: "Empire AI", description: "Infrastructure commander", icon: Terminal, action: () => { onEmpireOpen(); onClose(); }, group: "AI Agents" },
    { id: "ai-n8n", label: "n8n Agent", description: "Workflow automation", icon: Zap, action: () => { onN8nOpen(); onClose(); }, group: "AI Agents" },
  ];

  const filtered = query
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groups = [...new Set(filtered.map((c) => c.group))];

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[15%] z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:top-[20%]"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search size={16} className="shrink-0 text-muted-foreground/60" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                style={{ fontFamily: "var(--font-body)" }}
              />
              <button
                onClick={onClose}
                className="flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X size={12} />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {groups.map((group) => (
                <div key={group}>
                  <p className="mb-1 px-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {group}
                  </p>
                  {filtered
                    .filter((c) => c.group === group)
                    .map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary/80 active:scale-[0.98]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                            <p className="truncate text-[11px] text-muted-foreground/60">{cmd.description}</p>
                          </div>
                          <ArrowRight size={12} className="shrink-0 text-muted-foreground/30" />
                        </button>
                      );
                    })}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground/50">No results found</p>
              )}
            </div>

            {/* Footer hint */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PortalCommandPalette;
