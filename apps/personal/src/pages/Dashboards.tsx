import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  TrendingUp, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ExternalLink, 
  Sun, 
  Moon, 
  Layers 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type DomainTab = "ccp" | "mpg" | "hvl";

export default function Dashboards() {
  const { toast } = useToast();
  const [domain, setDomain] = useState<DomainTab>("ccp");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark") || 
           localStorage.getItem("site_theme") === "dark" ||
           localStorage.getItem("ccp.theme") === "dark";
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync theme with document and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("site_theme", "dark");
      localStorage.setItem("ccp.theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("site_theme", "light");
      localStorage.setItem("ccp.theme", "light");
    }

    // Post theme update to embedded iframe
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: "THEME_CHANGE", theme: isDarkMode ? "dark" : "light" }, "*");
      } catch (err) {
        void err;
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    toast({
      title: isDarkMode ? "Lichte modus geactiveerd" : "Donkere modus geactiveerd",
      description: "Het dashboard en de site zijn automatisch gesynchroniseerd.",
    });
  };

  const handleRefresh = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.location.reload();
      toast({
        title: "Dashboard ververst",
        description: "Live data van Channable, Magento en Supabase wordt opnieuw gesynchroniseerd.",
      });
    }
  };

  return (
    <div className={`min-h-screen bg-background text-foreground transition-colors duration-200 ${isFullscreen ? "fixed inset-0 z-[1000] p-0" : "pt-24 pb-16"}`}>
      <div className={isFullscreen ? "h-full flex flex-col" : "container mx-auto max-w-7xl px-4 sm:px-6"}>
        
        {/* Top Control Bar (hidden in fullscreen) */}
        {!isFullscreen && (
          <div className="mb-6 space-y-4">
            
            {/* Header & Title */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link to="/portal" className="hover:text-primary transition-colors">Portal</Link>
                  <span>/</span>
                  <span className="text-foreground">Command Dashboards</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-base shadow-md shadow-blue-500/20">
                    CCP
                  </div>
                  <span>Connect Car Parts &amp; Marketplace Engine</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live eBay DE &amp; Multi-channel Command Center · Pacing Matrix · Ge&iuml;ntegreerd met Samantha Copilot
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleTheme}
                  className="h-9 gap-1.5 text-xs font-medium rounded-lg"
                  title="Wissel Dark/Light mode"
                >
                  {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-slate-600" />}
                  <span className="hidden sm:inline">{isDarkMode ? "Licht" : "Donker"}</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="h-9 gap-1.5 text-xs font-medium rounded-lg"
                >
                  <RefreshCw size={13} className="text-muted-foreground" />
                  <span className="hidden sm:inline">Ververs</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFullscreen(true)}
                  className="h-9 gap-1.5 text-xs font-medium rounded-lg"
                >
                  <Maximize2 size={13} className="text-muted-foreground" />
                  <span className="hidden sm:inline">Volledig Scherm</span>
                </Button>

                <Button 
                  size="sm" 
                  asChild
                  className="h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-purple-500/20 rounded-lg"
                >
                  <a href="/dashboards/ccp.html" target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} />
                    <span>Open Standalone ↗</span>
                  </a>
                </Button>
              </div>
            </div>

            {/* Domain Tabs Navigation (Mobile Swipeable) */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setDomain("ccp")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 ${
                  domain === "ccp" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <ShoppingBag size={14} />
                <span>Connect Car Parts (eBay DE Live)</span>
                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-400 font-bold">100/100</span>
              </button>

              <button
                type="button"
                onClick={() => setDomain("mpg")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 ${
                  domain === "mpg" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Layers size={14} />
                <span>Marketplace Growth (MPG SaaS)</span>
              </button>

              <button
                type="button"
                onClick={() => setDomain("hvl")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 ${
                  domain === "hvl" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <TrendingUp size={14} />
                <span>Hans van Leeuwen (SEO &amp; Traffic)</span>
              </button>
            </div>

            {/* Quick Metrics Bar (Responsive Grid) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>eBay DE Top-400</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">Live</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-foreground">250 / 400 SKU&apos;s</div>
                <div className="text-[11px] text-muted-foreground">Quality Score 100/100</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Q3 Pacing</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">W33</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-foreground">&euro; 100K Target</div>
                <div className="text-[11px] text-muted-foreground">Nulmeting actief</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Magento REST</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">14/14</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-foreground">40.049 Producten</div>
                <div className="text-[11px] text-muted-foreground">Live gesynchroniseerd</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Samantha AI</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">Online</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-foreground">Copilot Ready</div>
                <div className="text-[11px] text-muted-foreground">Toets &apos;S&apos; in dashboard</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-sm shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>Track &amp; Trace</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">ABS Gap</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-foreground">Push Ready</div>
                <div className="text-[11px] text-muted-foreground">Wacht op ABS harvest</div>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Interactive Command Center Frame */}
        <div className={`relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl transition-all ${
          isFullscreen ? "flex-1 rounded-none border-none h-screen" : "h-[880px]"
        }`}>
          {/* Floating Exit Button for Fullscreen */}
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-5 z-50 flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur border border-slate-700 hover:bg-slate-800 transition"
            >
              <Minimize2 size={13} />
              <span>Sluit Volledig Scherm (Esc)</span>
            </button>
          )}

          <iframe
            ref={iframeRef}
            src="/dashboards/ccp.html"
            title="Connect Car Parts Command Dashboard"
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write;"
          />
        </div>

      </div>
    </div>
  );
}
