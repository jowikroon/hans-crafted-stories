import { motion } from "framer-motion";
import { Wrench, FileText, LayoutDashboard, Users, Activity, Search } from "lucide-react";

type Tab = "tools" | "content" | "pages" | "status" | "users";

const dockItems: { id: Tab; icon: typeof Wrench; label: string }[] = [
  { id: "tools", icon: Wrench, label: "Tools" },
  { id: "content", icon: FileText, label: "Content" },
  { id: "pages", icon: LayoutDashboard, label: "Pages" },
  { id: "users", icon: Users, label: "Users" },
  { id: "status", icon: Activity, label: "Status" },
];

interface PortalFloatingDockProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCommandOpen: () => void;
}

const PortalFloatingDock = ({ activeTab, onTabChange, onCommandOpen }: PortalFloatingDockProps) => {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:hidden"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card/90 px-2 py-1.5 shadow-xl shadow-foreground/5 backdrop-blur-xl">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-all active:scale-[0.92] ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`mt-0.5 text-[9px] font-medium leading-none ${isActive ? "text-primary" : "text-muted-foreground/70"}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="dockIndicator"
                  className="absolute -top-0.5 h-0.5 w-4 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="mx-0.5 h-6 w-px bg-border/60" />

        {/* Command Palette trigger */}
        <button
          onClick={onCommandOpen}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1 text-muted-foreground transition-all hover:text-foreground active:scale-[0.92]"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-muted/80">
            <Search size={11} strokeWidth={2.5} />
          </div>
          <span className="mt-0.5 text-[9px] font-medium leading-none text-muted-foreground/70">Search</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PortalFloatingDock;
