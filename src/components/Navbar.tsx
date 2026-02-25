import { useState, createContext, useContext, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Terminal, Search, Command, Bot, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import InfoTooltip from "@/components/portal/InfoTooltip";

type Lang = "nl" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "nl", setLang: () => {} });
export const useLang = () => useContext(LangContext);

const links = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/about", label: "About" },
];

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
  const [lang, setLang] = useState<Lang>("nl");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

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
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredPages.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredPages[selectedIndex]) {
      navigate(filteredPages[selectedIndex].to);
      setSearchOpen(false);
    }
  };

  // Current page indicator for BJ Fogg "progress" signal
  const currentPageLabel = [...links, { to: "/portal", label: "Portal" }, { to: "/hansai", label: "Hans AI" }, { to: "/empire", label: "Empire" }]
    .find((l) => l.to === location.pathname)?.label;

  const LangSwitch = () => (
    <div className="flex items-center gap-0.5 text-xs font-medium">
      <button
        onClick={() => setLang("nl")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "nl" ? (isDark ? "text-emerald-300" : "text-foreground") : (isDark ? "text-emerald-400/40" : "text-muted-foreground") + " hover:text-foreground"}`}
      >
        NL
      </button>
      <span className={isDark ? "text-emerald-500/20" : "text-border"}>|</span>
      <button
        onClick={() => setLang("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "en" ? (isDark ? "text-emerald-300" : "text-foreground") : (isDark ? "text-emerald-400/40" : "text-muted-foreground") + " hover:text-foreground"}`}
      >
        ENG
      </button>
    </div>
  );

  // Shared nav link style
  const navLinkClass = (to: string) => {
    const active = location.pathname === to;
    if (isDark) {
      return `rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active ? "bg-emerald-500/10 text-emerald-300" : "text-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-300"
      }`;
    }
    return `rounded-md px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {/* Search Overlay */}
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
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ESC
                </kbd>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredPages.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results found.</p>
                ) : (
                  filteredPages.map((page, i) => (
                    <button
                      key={page.to}
                      onClick={() => { navigate(page.to); setSearchOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        i === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <span className="font-medium">{page.label}</span>
                      {location.pathname === page.to && (
                        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{page.to}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className={`fixed top-0 z-50 w-full backdrop-blur-md transition-colors ${
          isDark
            ? "bg-[hsl(220,20%,6%)]/90 border-b border-emerald-500/10"
            : "bg-background/80"
        }`}
      >
        <div className="mx-auto max-w-6xl px-6">
          {/* Single row: Brand + Breadcrumb + Nav + Actions */}
          <div className="flex items-center justify-between h-14">
            {/* Left: Brand + page indicator */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className={`font-display text-lg font-bold tracking-tight ${isDark ? "text-emerald-300" : "text-foreground"}`}
              >
                Hans van Leeuwen
              </Link>
              {currentPageLabel && currentPageLabel !== "Home" && (
                <div className={`hidden md:flex items-center gap-1.5 text-xs ${isDark ? "text-emerald-400/30" : "text-muted-foreground/50"}`}>
                  <ChevronRight size={12} />
                  <span className={`font-medium ${isDark ? "text-emerald-400/60" : "text-muted-foreground"}`}>
                    {currentPageLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Center: Nav links — desktop */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: Search + AI links + Login */}
            <div className="hidden md:flex items-center gap-2">
              {/* Compact search */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  isDark
                    ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400/40 hover:border-emerald-500/30 hover:text-emerald-300"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Search size={12} />
                <kbd className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-mono ${
                  isDark ? "border-emerald-500/15 text-emerald-400/30" : "border-border bg-background text-muted-foreground"
                }`}>
                  <Command size={8} />K
                </kbd>
              </button>

              <LangSwitch />
              <div className={`h-3.5 w-px ${isDark ? "bg-emerald-500/15" : "bg-border"}`} />

              {/* Portal / Login */}
              <Link
                to="/portal"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  location.pathname === "/portal"
                    ? (isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-accent text-accent-foreground shadow-sm")
                    : (isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }`}
              >
                {user ? (
                  <>
                    <img
                      src={user.user_metadata?.avatar_url || ""}
                      alt=""
                      className="h-4 w-4 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    Portal
                  </>
                ) : (
                  <>
                    <LogIn size={12} />
                    Login
                  </>
                )}
              </Link>

              {/* AI links */}
              {isAdmin && (
                <Link
                  to="/hansai"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    location.pathname === "/hansai"
                      ? "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-[0_0_12px_hsl(160_80%_45%/0.2)]"
                      : `border ${isDark ? "border-emerald-500/15 text-emerald-400/40 hover:border-emerald-500/40 hover:text-emerald-300" : "border-border text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600"}`
                  }`}
                >
                  <Bot size={12} />
                  AI
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/empire"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    location.pathname === "/empire"
                      ? "border-2 border-purple-500 bg-purple-500/10 text-purple-600 shadow-[0_0_12px_hsl(270_80%_55%/0.2)]"
                      : `border ${isDark ? "border-purple-500/15 text-purple-400/40 hover:border-purple-500/40 hover:text-purple-300" : "border-border text-muted-foreground hover:border-purple-500/40 hover:bg-purple-500/5 hover:text-purple-600"}`
                  }`}
                >
                  <Terminal size={12} />
                  Empire
                </Link>
              )}
            </div>

            {/* Mobile: search + lang + toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className={`rounded-lg p-2 transition-colors ${isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <LangSwitch />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`rounded-lg p-2 ${isDark ? "text-emerald-300" : "text-foreground"}`}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className={`hidden md:block h-px ${isDark ? "bg-emerald-500/10" : "bg-border"}`} />

        {/* Mobile menu */}
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
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? (isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-accent text-accent-foreground")
                        : (isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/portal"
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    isDark ? "text-emerald-400/40 hover:text-emerald-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <LogIn size={14} />
                  {user ? "Portal" : "Login"}
                </Link>
                {isAdmin && (
                  <Link
                    to="/hansai"
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-all ${
                      location.pathname === "/hansai"
                        ? "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-[0_0_12px_hsl(160_80%_45%/0.2)]"
                        : `border ${isDark ? "border-emerald-500/15 text-emerald-400/40" : "border-border text-muted-foreground"} hover:border-emerald-500/40 hover:text-emerald-600`
                    }`}
                  >
                    <Bot size={14} />
                    Hans AI
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/empire"
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 transition-all ${
                      location.pathname === "/empire"
                        ? "border-2 border-purple-500 bg-purple-500/10 text-purple-600 shadow-[0_0_12px_hsl(270_80%_55%/0.2)]"
                        : `border ${isDark ? "border-purple-500/15 text-purple-400/40" : "border-border text-muted-foreground"} hover:border-purple-500/40 hover:text-purple-600`
                    }`}
                  >
                    <Terminal size={14} />
                    Empire
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </LangContext.Provider>
  );
};

export default Navbar;
