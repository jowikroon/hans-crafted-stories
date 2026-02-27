import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";
import { Search } from "lucide-react";

type Tab = "tools" | "content" | "pages" | "users" | "status";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onEmpireToggle: () => void;
  onN8nToggle: () => void;
  onCommandOpen: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onDarkToggle: () => void;
  empireOpen: boolean;
  n8nOpen: boolean;
  userName?: string;
  welcomeName?: string;
}

const AdminLayout = ({
  children,
  activeTab,
  onTabChange,
  onEmpireToggle,
  onN8nToggle,
  onCommandOpen,
  onSignOut,
  isDark,
  onDarkToggle,
  empireOpen,
  n8nOpen,
  userName,
  welcomeName,
}: AdminLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onEmpireToggle={onEmpireToggle}
        onN8nToggle={onN8nToggle}
        onCommandOpen={onCommandOpen}
        onSignOut={onSignOut}
        isDark={isDark}
        onDarkToggle={onDarkToggle}
        empireOpen={empireOpen}
        n8nOpen={n8nOpen}
        userName={userName}
      />
      <SidebarInset className="bg-[hsl(222,20%,8%)]">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-white/40 hover:text-white/70 hover:bg-white/[0.04]" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-medium text-white/90">
                Welcome back
                {welcomeName ? `, ${welcomeName}` : ""}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCommandOpen}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search for tools</span>
              <kbd className="hidden rounded border border-white/[0.1] bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] text-white/30 sm:inline">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
