import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Search, Command, Sun, Moon } from "lucide-react";
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
    { to: "/about", label: lang === "nl" ? "Over Hans" : "About Hans" },
  ];
};

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
  const links = user ? [...allLinks, { to: "/hansai", label: t.commandCenter }] : allLinks;

  // Global theme state — default light; Portal forces dark via its own effect
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

  /* ─── Clean text nav link (inspired by reference) ─── */
  const navLink = (to: string, label: string) => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        className={`relative px-3 py-2 text-sm font-medium tracking-wide transition-colors duration-200 ${
          active
            ? isDark
              ? "text-emerald-300"
              : "text-foreground"
            : isDark
              ? "text-emerald-400/40 hover:text-emerald-300"
              : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${isDark ? "bg-emerald-400" : "bg-primary"}`}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
      </Link>
    );
  };

  const LangSwitch = () => (
    <div className="flex items-center gap-0.5 text-xs font-medium">
      <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded transition-colors ${lang === "nl" ? (isDark ? "text-emerald-300" : "text-foreground") : (isDark ? "text-emerald-400/40" : "text-muted-foreground") + " hover:text-foreground"}`}>NL</button>
      <span className={isDark ? "text-emerald-500/20" : "text-border"}>|</span>
      <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded transition-colors ${lang === "en" ? (isDark ? "text-emerald-300" : "text-foreground") : (isDark ? "text-emerald-400/40" : "text-muted-foreground") + " hover:text-foreground"}`}>ENG</button>
    </div>
  );

  return (
    <>
      {/* ═══ Search Overlay ═══ */}
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

      {/* ═══ NAVBAR ═══ */}
      <nav aria-label="Primary navigation" className={`fixed top-0 z-50 w-full backdrop-blur-md transition-colors ${isDark ? "bg-[hsl(220,20%,6%)]/90" : "bg-background/80"}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link to="/" className={`shrink-0 flex items-center gap-2.5 font-display text-lg font-bold tracking-tight transition-colors ${isDark ? "text-emerald-300" : "text-foreground"}`}>
              <img src={logoImg} alt="Hans van Leeuwen — Freelance E-commerce Manager" width={28} height={28} className={`h-7 w-7 object-contain ${isDark ? "invert brightness-200" : ""}`} />
              Hans van Leeuwen
            </Link>

            {/* Center nav links (desktop) */}
            <div className="hidden md:flex items-center">
              {links.map((l) => navLink(l.to, l.label))}
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`rounded-full p-2 transition-all ${
                  isDark
                    ? "text-emerald-400/50 hover:text-emerald-300 hover:bg-emerald-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-label="Search"
              >
                <Search size={16} />
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setSiteTheme(siteTheme === "dark" ? "light" : "dark")}
                className={`rounded-full p-2 transition-all ${isDark ? "text-emerald-400/50 hover:text-emerald-300 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                aria-label={siteTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {siteTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="hidden sm:block">
                <LangSwitch />
              </div>

              {/* Portal / Login — styled as outlined button (hidden on mobile) */}
              <Link
                to="/portal"
                className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive("/portal")
                    ? isDark
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                      : "border-primary bg-primary/10 text-primary"
                    : isDark
                      ? "border-emerald-500/30 text-emerald-400/60 hover:border-emerald-400 hover:text-emerald-300"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {user ? (
                  <>
                    <img src={user.user_metadata?.avatar_url || ""} alt="" className="h-4 w-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span>{t.portal}</span>
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    <span>{t.login}</span>
                  </>
                )}
              </Link>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden rounded-lg p-1.5 ${isDark ? "text-emerald-300" : "text-foreground"}`} aria-label="Toggle menu">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle separator */}
        <div className={`h-px ${isDark ? "bg-emerald-500/8" : "bg-border/40"}`} />

        {/* ─── ROW 2: Command Center link (desktop) — always visible ─── */}
        {user && (
          <div className="mx-auto max-w-6xl px-6 hidden md:block">
            <div className="flex items-center justify-end h-10">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate("/hansai")}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                    location.pathname === "/hansai"
                      ? "border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_10px_hsl(25_95%_53%/0.15)]"
                      : `${isDark ? "border-orange-500/15 text-orange-400/40 hover:border-orange-500/40 hover:text-orange-300" : "border-border text-muted-foreground hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-600"}`
                  }`}
                >
                  <Command size={11} />
                  Command Center
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom border */}
        <div className={`hidden md:block h-px ${isDark ? "bg-emerald-500/10" : "bg-border"}`} />

        {/* ═══ MOBILE MENU ═══ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden border-b md:hidden ${isDark ? "border-emerald-500/10 bg-[hsl(220,20%,6%)]" : "border-border bg-background"}`}
            >
              <div className="flex flex-col gap-1 px-4 py-4">
                {links.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive(link.to) ? (isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-accent text-accent-foreground") : (isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground")}`}>
                    {link.label}
                  </Link>
                ))}
                <div className={`my-1 h-px ${isDark ? "bg-emerald-500/10" : "bg-border"}`} />
                <div className="flex items-center justify-between px-3 py-2">
                  <LangSwitch />
                </div>
                <Link to="/portal" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-colors ${isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <LogIn size={14} />
                  {user ? t.portal : t.login}
                </Link>
                {user && (
                  <button onClick={() => { setMobileOpen(false); navigate("/hansai"); }} className={`rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-all border w-full text-left ${isDark ? "border-orange-500/15 text-orange-400/40" : "border-border text-muted-foreground"} hover:border-orange-500/40 hover:text-orange-600`}>
                    <Command size={14} />
                    Command Center
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* AI Overlay — unified via HansAIOverlay for now */}
      <HansAIOverlay open={commandCenterOpen} onClose={() => setCommandCenterOpen(false)} />
    </>
  );
};

export default Navbar;
