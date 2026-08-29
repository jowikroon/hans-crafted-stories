import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, BookOpen, Bot } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";

const EmpireLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/portal" replace />;

  const tabs = [
    { name: "Dashboard", path: "/empire", icon: Crown, exact: true },
    { name: "Wiki", path: "/empire/wiki", icon: BookOpen, exact: false },
    { name: "OpenClaw", path: "/empire/openclaw", icon: Bot, exact: false },
  ];

  const getBreadcrumbLabel = () => {
    if (location.pathname.includes("/wiki")) return "Wiki";
    if (location.pathname.includes("/openclaw")) return "OpenClaw";
    return "Empire";
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-secondary/30">
              <Crown size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Sovereign AI Empire
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Operations Command Center</p>
            </div>
          </div>
          
          {/* Headless Sub-Navigation Menu */}
          <nav className="flex items-center gap-1 bg-secondary/20 p-1 rounded-lg border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.exact 
                ? location.pathname === tab.path 
                : location.pathname.startsWith(tab.path);
                
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-primary" : ""} />
                  {tab.name}
                </NavLink>
              );
            })}
          </nav>
        </motion.div>

        {/* Child Pages Render Here */}
        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EmpireLayout;
