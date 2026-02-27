import { useLocation, useNavigate } from "react-router-dom";
import {
  Wrench,
  FileText,
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  LogOut,
  Terminal,
  Zap,
  Search,
  Moon,
  Sun,
  Crown,
  Workflow,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar";

type Tab = "tools" | "content" | "pages" | "users" | "status";

interface AdminSidebarProps {
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
}

const mainNav: { id: Tab; label: string; icon: typeof Wrench }[] = [
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "content", label: "Content", icon: FileText },
  { id: "pages", label: "Pages", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "status", label: "Status", icon: Activity },
];

const AdminSidebar = ({
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
}: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-[hsl(220,20%,6%)] text-white/80"
    >
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Crown size={16} className="text-amber-400" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-white">
              {userName || "Portal"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
              Admin
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="bg-white/[0.06]" />

      <SidebarContent className="px-2 py-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => onTabChange(item.id)}
                      className={
                        isActive
                          ? "bg-white/[0.08] text-white font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/[0.06]" />

        {/* AI Agents */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            AI Agents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={empireOpen}
                  tooltip="Empire AI (⌘E)"
                  onClick={onEmpireToggle}
                  className={
                    empireOpen
                      ? "bg-emerald-500/10 text-emerald-400 font-medium shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }
                >
                  <Terminal size={16} />
                  <span>Empire AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={n8nOpen}
                  tooltip="n8n Agent (⌘J)"
                  onClick={onN8nToggle}
                  className={
                    n8nOpen
                      ? "bg-purple-500/10 text-purple-400 font-medium shadow-[inset_0_0_0_1px_rgba(168,85,247,0.15)]"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }
                >
                  <Zap size={16} />
                  <span>n8n Agent</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/[0.06]" />

        {/* Quick Links */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Quick Links
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Empire Dashboard"
                  onClick={() => navigate("/empire")}
                  isActive={location.pathname === "/empire"}
                  className={
                    location.pathname === "/empire"
                      ? "bg-white/[0.08] text-white font-medium"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }
                >
                  <Crown size={16} />
                  <span>Empire</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="HansAI Terminal"
                  onClick={() => navigate("/hansai")}
                  isActive={location.pathname === "/hansai"}
                  className={
                    location.pathname === "/hansai"
                      ? "bg-white/[0.08] text-white font-medium"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }
                >
                  <Workflow size={16} />
                  <span>HansAI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarSeparator className="bg-white/[0.06]" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search (⌘K)"
              onClick={onCommandOpen}
              className="text-white/40 hover:bg-white/[0.04] hover:text-white/70"
            >
              <Search size={16} />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDark ? "Light mode" : "Dark mode"}
              onClick={onDarkToggle}
              className="text-white/40 hover:bg-white/[0.04] hover:text-white/70"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={onSignOut}
              className="text-white/40 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
