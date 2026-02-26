import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Terminal, Search, Command, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLang } from "@/hooks/useLang";
import HansAIOverlay from "@/components/overlays/HansAIOverlay";
import EmpireOverlay from "@/components/overlays/EmpireOverlay";
import { translations } from "@/data/translations";
import type { Lang } from "@/hooks/useLang";

const getLinks = (lang: Lang) => {
  const t = translations[lang].nav;
  return [
    { to: "/", label: t.home },
    { to: "/work", label: t.work },
    { to: "/writing", label: t.writing },
    { to: "/about", label: t.about },
  ];
};

const searchablePages = [
  { to: "/", label: "Home", keywords: ["home", "start", "landing"] },
  { to: "/work", label: "Work", keywords: ["work", "cases", "projects", "portfolio"] },
  { to: "/writing", label: "Writing", keywords: ["blog", "writing", "articles", "posts"] },
  { to: "/about", label: "About", keywords: ["about", "contact", "info", "cv"] },
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
  const [aiOpen, setAiOpen] = useState(false);
  const [empireOpen, setEmpireOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const t = translations[lang].nav;
  const links = getLinks(lang);

  const isDark = variant === "dark";

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

  /* ─── Pill-style nav link (row 2) ─── */
  const navPill = (to: string, label: string) => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        className={`relative rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-200 ${
          active
            ? isDark
              ? "bg-emerald-500/15 text-emerald-300 shadow-[inset_0_1px_0_hsl(160_60%_70%/0.15)]"
              : "bg-primary/10 text-primary shadow-[inset_0_1px_0_hsl(var(--primary)/0.15)]"
            : isDark
              ? "text-emerald-400/40 hover:text-emerald-300 hover:bg-emerald-500/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {label}
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className={`absolute -bottom-[9px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full ${isDark ? "bg-emerald-400" : "bg-primary"}`}
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

      {/* ═══ 2-ROW NAVBAR ═══ */}
      <nav className={`fixed top-0 z-50 w-full backdrop-blur-md transition-colors ${isDark ? "bg-[hsl(220,20%,6%)]/90" : "bg-background/80"}`}>
        {/* ─── ROW 1: Brand + Search + Lang + Login/Portal ─── */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between h-12">
            {/* Brand */}
            <Link to="/" className={`font-display text-lg font-bold tracking-tight transition-colors ${isDark ? "text-emerald-300" : "text-foreground"}`}>
              Hans van Leeuwen
            </Link>

            {/* Right cluster */}
            <div className="flex items-center gap-2.5">
              {/* Search — desktop */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`hidden md:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                  isDark
                    ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400/50 hover:border-emerald-500/30 hover:text-emerald-300"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/20"
                }`}
              >
                <Search size={12} />
                <span className="hidden lg:inline">{t.search}</span>
                <kbd className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-mono ${isDark ? "border-emerald-500/15 text-emerald-400/25" : "border-border bg-background text-muted-foreground/60"}`}>
                  <Command size={8} />K
                </kbd>
              </button>

              <LangSwitch />

              <div className={`hidden md:block h-4 w-px ${isDark ? "bg-emerald-500/15" : "bg-border"}`} />

              {/* Portal / Login */}
              <Link
                to="/portal"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive("/portal")
                    ? isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-primary/10 text-primary"
                    : isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {user ? (
                  <>
                    <img src={user.user_metadata?.avatar_url || ""} alt="" className="h-4 w-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {t.portal}
                  </>
                ) : (
                  <>
                    <LogIn size={12} />
                    {t.login}
                  </>
                )}
              </Link>

              {/* Mobile: search + hamburger */}
              <button onClick={() => setSearchOpen(true)} className={`md:hidden rounded-lg p-1.5 transition-colors ${isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:text-foreground"}`} aria-label="Search">
                <Search size={16} />
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden rounded-lg p-1.5 ${isDark ? "text-emerald-300" : "text-foreground"}`} aria-label="Toggle menu">
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle separator */}
        <div className={`h-px ${isDark ? "bg-emerald-500/8" : "bg-border/50"}`} />

        {/* ─── ROW 2: Nav pills + AI/Empire links ─── */}
        <div className="mx-auto max-w-6xl px-6 hidden md:block">
          <div className="flex items-center justify-between h-10">
            {/* Page nav pills */}
            <div className="flex items-center gap-0.5">
              {links.map((l) => navPill(l.to, l.label))}
            </div>

            {/* AI + Empire quick links */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAiOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                    aiOpen
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-[0_0_10px_hsl(160_80%_45%/0.15)]"
                      : `${isDark ? "border-emerald-500/15 text-emerald-400/40 hover:border-emerald-500/40 hover:text-emerald-300" : "border-border text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600"}`
                  }`}
                >
                  <Bot size={11} />
                  AI
                </button>
                <button
                  onClick={() => setEmpireOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                    empireOpen
                      ? "border-violet-500 bg-violet-500/10 text-violet-600 shadow-[0_0_10px_hsl(270_80%_55%/0.15)]"
                      : `${isDark ? "border-violet-500/15 text-violet-400/40 hover:border-violet-500/40 hover:text-violet-300" : "border-border text-muted-foreground hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-violet-600"}`
                  }`}
                >
                  <Terminal size={11} />
                  Empire
                </button>
              </div>
            )}
          </div>
        </div>

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
                <Link to="/portal" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-colors ${isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <LogIn size={14} />
                  {user ? t.portal : t.login}
                </Link>
                {isAdmin && (
                  <>
                    <button onClick={() => { setMobileOpen(false); setAiOpen(true); }} className={`rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-all border w-full text-left ${isDark ? "border-emerald-500/15 text-emerald-400/40" : "border-border text-muted-foreground"} hover:border-emerald-500/40 hover:text-emerald-600`}>
                      <Bot size={14} />
                      Hans AI
                    </button>
                    <button onClick={() => { setMobileOpen(false); setEmpireOpen(true); }} className={`rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-all border w-full text-left ${isDark ? "border-violet-500/15 text-violet-400/40" : "border-border text-muted-foreground"} hover:border-violet-500/40 hover:text-violet-600`}>
                      <Terminal size={14} />
                      Empire
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* AI & Empire Overlays */}
      <HansAIOverlay open={aiOpen} onClose={() => setAiOpen(false)} />
      <EmpireOverlay open={empireOpen} onClose={() => setEmpireOpen(false)} />
    </>
  );
};

export default Navbar;
