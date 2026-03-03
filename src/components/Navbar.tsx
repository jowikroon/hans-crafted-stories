import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Search, Sun, Moon, Grid3X3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLang } from "@/hooks/useLang";
import HansAIOverlay from "@/components/overlays/HansAIOverlay";
import { translations } from "@/data/translations";
import type { Lang } from "@/hooks/useLang";
import logoImg from "@/assets/logo.png";

const THEME_KEY = "site_theme";

const getLinks = (lang: Lang) => {
  const t = translations[lang].nav;
  return [
    { to: "/", label: t.home },
    { to: "/work", label: t.work },
    { to: "/writing", label: t.writing },
    { to: "/about", label: lang === "nl" ? "Over Hans" : "About" },
  ];
};

const servicePages = [
  { to: "/amazon-nl-specialist", label: "Amazon NL Specialist" },
  { to: "/bol-com-consultant", label: "Bol.com Consultant" },
  { to: "/interim-ecommerce-manager", label: "Interim E-commerce Manager" },
];

const toolPages = [
  { to: "/portal", label: "Portal" },
  { to: "/empire", label: "Empire" },
  { to: "/hansai", label: "Hans AI" },
  { to: "/wiki", label: "Wiki" },
];

const searchablePages = [
  { to: "/", label: "Home", keywords: ["home", "start", "landing"] },
  { to: "/work", label: "Work", keywords: ["work", "cases", "projects", "portfolio"] },
  { to: "/writing", label: "Writing", keywords: ["blog", "writing", "articles", "posts"] },
  { to: "/about", label: "About", keywords: ["about", "contact", "info", "cv"] },
  { to: "/amazon-nl-specialist", label: "Amazon NL Specialist", keywords: ["amazon", "nl", "specialist", "ads", "listing"] },
  { to: "/bol-com-consultant", label: "Bol.com Consultant", keywords: ["bol", "bol.com", "consultant", "ads", "marketplace"] },
  { to: "/interim-ecommerce-manager", label: "Interim E-commerce Manager", keywords: ["interim", "manager", "freelance", "ecommerce", "lead"] },
  { to: "/portal", label: "Portal", keywords: ["portal", "dashboard", "login", "tools"] },
  { to: "/empire", label: "Empire", keywords: ["empire", "admin", "terminal", "system"] },
  { to: "/hansai", label: "Hans AI", keywords: ["ai", "chat", "llm", "claude", "gemini", "gpt"] },
];

interface NavbarProps {
  variant?: "default" | "dark";
}

const Navbar = ({ variant = "default" }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const t = translations[lang].nav;
  const allLinks = getLinks(lang);
  const links = user ? [...allLinks, { to: "/ai", label: "AI Hub" }] : allLinks;

  const [siteTheme, setSiteTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark") return "dark";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", siteTheme === "dark");
    localStorage.setItem(THEME_KEY, siteTheme);
  }, [siteTheme]);

  const isDark = variant === "dark" || siteTheme === "dark";

  const filteredPages = searchQuery.trim()
    ? searchablePages.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : searchablePages;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearchOpen((o) => !o); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (searchOpen) { setTimeout(() => searchInputRef.current?.focus(), 100); setSearchQuery(""); setSelectedIndex(0); }
  }, [searchOpen]);

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filteredPages.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filteredPages[selectedIndex]) { navigate(filteredPages[selectedIndex].to); setSearchOpen(false); }
  };

  const isActive = (to: string) => location.pathname === to;

  const LangSwitch = () => (
    <div className="flex items-center gap-0.5 text-xs tracking-widest">
      <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded transition-colors ${lang === "nl" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>NL</button>
      <span className="text-border">/</span>
      <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded transition-colors ${lang === "en" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
    </div>
  );

  return (
    <>
      {/* ═══ Search Overlay (⌘K) ═══ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-background/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={16} className="text-muted-foreground shrink-0" />
                <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={t.searchPlaceholder} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredPages.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t.noResults}</p>
                ) : (
                  filteredPages.map((page, i) => (
                    <button key={page.to} onClick={() => { navigate(page.to); setSearchOpen(false); }} onMouseEnter={() => setSelectedIndex(i)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${i === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"}`}>
                      <span className="font-medium">{page.label}</span>
                      {location.pathname === page.to && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                      <span className="ml-auto text-xs text-muted-foreground">{page.to}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ NAVBAR — flat, full-width, editorial ═══ */}
      <nav aria-label="Primary navigation" className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Brand — serif logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70">
            <img src={logoImg} alt="Hans van Leeuwen" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            Hans van Leeuwen
          </Link>

          {/* Center nav links — sans-serif, wide tracking */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`group relative px-4 py-2 text-[13px] tracking-[0.08em] uppercase rounded-full transition-all duration-300 ease-out ${
                  isActive(l.to)
                    ? "text-foreground font-medium bg-foreground/[0.06]"
                    : "text-muted-foreground font-normal hover:text-foreground hover:bg-foreground/[0.04]"
                }`}
              >
                <span className="relative z-10">{l.label}</span>
                {isActive(l.to) && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border-2 border-foreground/20 bg-foreground/[0.06]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right cluster — theme, lang, CTA */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setSiteTheme(siteTheme === "dark" ? "light" : "dark")}
              className={`group relative rounded-full p-2 transition-all duration-300 ease-out active:scale-90 ${
                siteTheme === "dark"
                  ? "text-[hsl(45,80%,55%)] hover:text-[hsl(50,95%,60%)] hover:bg-[hsl(45,80%,55%,0.12)] hover:shadow-[0_0_14px_hsl(45,80%,55%/0.25)] active:shadow-[0_0_20px_hsl(50,95%,60%/0.45)] active:bg-[hsl(50,95%,60%,0.18)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label={siteTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {siteTheme === "dark" ? <Sun size={16} className="transition-transform duration-300 group-hover:rotate-45 group-active:rotate-90" /> : <Moon size={16} className="transition-transform duration-300 group-hover:-rotate-12" />}
            </button>

            <div className="hidden sm:block">
              <LangSwitch />
            </div>

            {/* Quick Access dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                  aria-label="Quick access pages"
                >
                  <Grid3X3 size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-normal">
                  Services
                </DropdownMenuLabel>
                {servicePages.map((p) => (
                  <DropdownMenuItem
                    key={p.to}
                    onClick={() => navigate(p.to)}
                    className="cursor-pointer text-[13px]"
                  >
                    {p.label}
                  </DropdownMenuItem>
                ))}
                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-normal">
                      Tools
                    </DropdownMenuLabel>
                    {toolPages.map((p) => (
                      <DropdownMenuItem
                        key={p.to}
                        onClick={() => navigate(p.to)}
                        className="cursor-pointer text-[13px]"
                      >
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Portal / Login — pill CTA */}
            <Link
              to="/portal"
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[13px] tracking-wide transition-all duration-200 ${
                isActive("/portal")
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:bg-foreground hover:text-background hover:border-foreground"
              }`}
            >
              {user ? (
                <>
                  <img src={user.user_metadata?.avatar_url || ""} alt="" className="h-4 w-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span>{t.portal}</span>
                </>
              ) : (
                <>
                  <LogIn size={13} />
                  <span>{t.login}</span>
                </>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden rounded-lg p-1.5 text-foreground" aria-label="Toggle menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ═══ MOBILE MENU ═══ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden border-t border-border/40 md:hidden bg-background/95 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-1 px-6 py-5">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] transition-colors ${
                      isActive(link.to)
                        ? "text-foreground font-medium bg-muted/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border/50" />
                <span className="px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Services</span>
                {servicePages.map((p) => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/30"
                  >
                    {p.label}
                  </Link>
                ))}
                {user && (
                  <>
                    <span className="px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-1">Tools</span>
                    {toolPages.map((p) => (
                      <Link
                        key={p.to}
                        to={p.to}
                        onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/30"
                      >
                        {p.label}
                      </Link>
                    ))}
                  </>
                )}
                <div className="my-2 h-px bg-border/50" />
                <div className="flex items-center justify-between px-3 py-2">
                  <LangSwitch />
                </div>
                <Link
                  to="/portal"
                  onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="mt-1 rounded-full border border-border px-4 py-3 text-center text-[13px] uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {user ? t.portal : t.login}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* AI Overlay */}
      <HansAIOverlay open={commandCenterOpen} onClose={() => setCommandCenterOpen(false)} />
    </>
  );
};

export default Navbar;
