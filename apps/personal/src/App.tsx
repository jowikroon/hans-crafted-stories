import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LangProvider } from "@/hooks/useLang";
import { PreloadedDataProvider, type PreloadedData } from "@/contexts/PreloadedDataContext";
import type { BlogPostRow } from "@/lib/api/content";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
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

/**
 * Per-route background for the <main> box.
 *
 * The navbar is a floating, semi-transparent pill (`position: fixed`), and
 * <main> carries a top padding (pt-16/pt-24) to clear it. That padding strip
 * sits *behind* the navbar. If a page paints its own (dark) background only on
 * an inner wrapper, the strip keeps showing the creme <body> colour — the
 * "dark below the menu, light above" band. <main> lives outside the page
 * transition transform, so giving it the page's own base colour makes the
 * strip and the content one continuous surface. Light / theme-aware pages
 * return undefined and keep inheriting the (flip-on-dark) <body> colour.
 */
const mainBackgroundFor = (pathname: string): string | undefined => {
  if (pathname === "/music") return "#08080A";        // .music-neon (After Hours)
  if (pathname === "/muziek/artist-radar") return "#151210"; // Artist Radar (dark)
  if (pathname === "/release-set") return "#07080C";  // Release Set studio
  if (pathname === "/god-structure") return "hsl(220, 20%, 6%)";
  if (pathname === "/samantha") return "#0A0A0C";     // Samantha immersive
  if (pathname.startsWith("/write")) return "#F1ECDF";      // Write CMS (light default)
  if (pathname.startsWith("/blog-cms")) return "#F1ECDF";   // Voice editor (write-cms styles)
  if (pathname.startsWith("/music-cms")) return "#FAF9F6";  // Music CMS paper
  return undefined;
};

const AppShell = ({ initialLang }: AppShellProps) => {
  const location = useLocation();
  const isCompact = location.pathname === "/samantha";
  const isDarkPage = isCompact || location.pathname === "/god-structure" || location.pathname.startsWith("/blog-cms") || location.pathname === "/music" || location.pathname.startsWith("/music/") || location.pathname === "/muziek/artist-radar" || location.pathname === "/release-set";
  const mainBg = mainBackgroundFor(location.pathname);

  return (
    <ThemeProvider>
    <AuthProvider>
      <LangProvider initialLang={initialLang}>
        <EditOverlayProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground">
            Skip to content
          </a>
          <ScrollProgress />
          <header>
            <Navbar variant={isDarkPage ? "dark" : "default"} compact={isCompact} />
          </header>
          <main id="main-content" style={mainBg ? { backgroundColor: mainBg } : undefined} className={`min-h-screen ${isDarkPage ? "pt-16" : "pt-24"}`}>
            <AnimatedRoutes />
          </main>
          {!isDarkPage && <Footer />}
          <SamanthaGlobalButton />
          <CookieConsent />
          <TrackingScriptInjector />
          <EditLayer />
        </EditOverlayProvider>
      </LangProvider>
    </AuthProvider>
    </ThemeProvider>
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
