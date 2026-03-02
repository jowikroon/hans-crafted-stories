import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/hooks/useLang";
import { PreloadedDataProvider, type PreloadedData } from "@/contexts/PreloadedDataContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import EmpireTerminalCard from "./components/empire/EmpireTerminalCard";
import CookieConsent from "./components/CookieConsent";
import TrackingScriptInjector from "./components/TrackingScriptInjector";

const queryClient = new QueryClient();

interface AppShellProps {
  initialLang?: "en" | "nl";
}

const AppShell = ({ initialLang }: AppShellProps) => {
  const location = useLocation();
  const isDarkPage = location.pathname === "/hansai" || location.pathname === "/empire";

  return (
    <AuthProvider>
      <LangProvider initialLang={initialLang}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground">
          Skip to content
        </a>
        <header>
          <Navbar variant={isDarkPage ? "dark" : "default"} />
        </header>
        <main id="main-content" className="min-h-screen">
          <AnimatedRoutes />
        </main>
        {!isDarkPage && <Footer />}
        {!isDarkPage && <EmpireTerminalCard />}
        <CookieConsent />
        <TrackingScriptInjector />
      </LangProvider>
    </AuthProvider>
  );
};

export interface AppProps {
  /** Client: from __PRELOADED__ script. Server: from prerender. */
  preloadedData?: PreloadedData | null;
  /** Set only during SSR/prerender; uses StaticRouter and preloaded blog post. */
  serverContext?: {
    location: string;
    preloadedBlogPost?: import("@/lib/api/content").BlogPostRow | null;
    /** Initial language for SSR (e.g. "en" for /about prerender). */
    initialLang?: "en" | "nl";
  };
}

const App = ({ preloadedData, serverContext }: AppProps) => {
  const Router = serverContext ? StaticRouter : BrowserRouter;
  const routerProps = serverContext ? { location: serverContext.location } : {};
  const preloaded: PreloadedData = serverContext
    ? { blogPost: serverContext.preloadedBlogPost ?? null }
    : (preloadedData ?? { blogPost: null });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router {...routerProps}>
          <PreloadedDataProvider value={preloaded}>
            <AppShell initialLang={serverContext?.initialLang} />
          </PreloadedDataProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
