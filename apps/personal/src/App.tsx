import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/hooks/useLang";
import { PreloadedDataProvider, type PreloadedData } from "@/contexts/PreloadedDataContext";
import type { BlogPostRow } from "@/lib/api/content";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import SamanthaGlobalButton from "@/features/samantha/components/global/SamanthaGlobalButton";
import CookieConsent from "./components/CookieConsent";
import TrackingScriptInjector from "./components/TrackingScriptInjector";
import { EditOverlayProvider } from "./components/edit-overlay/EditOverlayProvider";
import EditLayer from "./components/edit-overlay/EditLayer";
import './styles/blog.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data fetched on one page stays fresh across navigations, so
      // revisiting /writing, /work, etc. renders instantly from cache
      // instead of re-running the Supabase query and flashing a loader.
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 30 * 60 * 1000, // keep cached data 30 min
      refetchOnWindowFocus: false, // no refetch/flash when tabbing back
      retry: 1,
    },
  },
});

interface AppShellProps {
  initialLang?: "en" | "nl";
}

const AppShell = ({ initialLang }: AppShellProps) => {
  const location = useLocation();
  const isCompact = location.pathname === "/samantha";
  // The /write Command Center is a full-page standalone app (its own cream
  // canvas + left mode-rail). Treat it like the other app surfaces: compact,
  // header blended onto the CMS background, and no marketing Footer.
  const isCmsPage = location.pathname === "/write" || location.pathname.startsWith("/write/");
  const isDarkPage = isCompact || location.pathname === "/god-structure" || location.pathname.startsWith("/blog-cms");
  const isAppPage = isDarkPage || isCmsPage;

  return (
    <AuthProvider>
      <LangProvider initialLang={initialLang}>
        <EditOverlayProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground">
            Skip to content
          </a>
          <header>
            <Navbar variant={isDarkPage ? "dark" : "default"} compact={isCompact || isCmsPage} />
          </header>
          <main
            id="main-content"
            className={`min-h-screen ${isAppPage ? "pt-16" : "pt-24"}`}
            style={isCmsPage ? { background: "#F1ECDF" } : undefined}
          >
            <AnimatedRoutes />
          </main>
          {!isAppPage && <Footer />}
          <SamanthaGlobalButton />
          <CookieConsent />
          <TrackingScriptInjector />
          <EditLayer />
        </EditOverlayProvider>
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
    preloadedBlogPost?: BlogPostRow | null;
    /** Pre-fetched blog posts for /writing prerender. */
    preloadedBlogPosts?: BlogPostRow[] | null;
    /** Initial language for SSR (e.g. "en" for /about prerender). */
    initialLang?: "en" | "nl";
  };
}

const App = ({ preloadedData, serverContext }: AppProps) => {
  const Router = serverContext ? StaticRouter : BrowserRouter;
  const routerProps = serverContext ? { location: serverContext.location } : { /* empty */ };
  const preloaded: PreloadedData = serverContext
    ? {
        blogPost: serverContext.preloadedBlogPost ?? null,
        blogPosts: serverContext.preloadedBlogPosts ?? null,
      }
    : {
        blogPost: (preloadedData as { blogPost?: BlogPostRow } | null | undefined)?.blogPost ?? null,
        blogPosts: (preloadedData as { blogPosts?: BlogPostRow[] } | null | undefined)?.blogPosts ?? null,
      };

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
