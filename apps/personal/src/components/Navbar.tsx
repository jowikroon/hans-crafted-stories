import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, LogIn, Search, Sun, Moon, LogOut, BookOpen, LayoutDashboard,
  ChevronDown, Network, Sparkles, PenLine, SquarePen, LayoutGrid, BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import logoImg from "@/assets/logo-hvl-v2.png";

const THEME_KEY = "site_theme";

/* ─────────────────────────────────────────────────────────────
   ONE unified navigation, two layers.
   Tier 1 = primary bar (everyone, public light style).
   Tier 2 = either a dropdown panel (Work, Account) or a
            contextual sub-bar (CMS). Never deeper.
   Palette is the attachment's: warm paper bg, ink text,
   orange site-active underline, yellow CMS-active underline.
   ───────────────────────────────────────────────────────────── */

interface NavbarProps {
  /** Kept for App.tsx compatibility. The bar is a single light style;
      `compact` (immersive pages like /samantha) hides centre nav + sub-bar. */
  variant?: "default" | "dark";
  compact?: boolean;
}

const Navbar = ({ compact = false }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const t = translations[lang].nav;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const workCloseTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Theme toggle still controls page-content dark mode; the bar stays light. */
  const [siteTheme, setSiteTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined" && localStorage.getItem(THEME_KEY) === "dark") return "dark";
    return "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", siteTheme === "dark");
    localStorage.setItem(THEME_KEY, siteTheme);
  }, [siteTheme]);

  /* ── Nav model ── */
  const workChildren = [
    { to: "/work", label: t.workMenu.allCases },
    { to: "/work/connect-car-parts", label: "Connect Car Parts" },
    { group: t.workMenu.services },
    { to: "/amazon-nl-specialist", label: t.workMenu.amazon },
    { to: "/bol-com-consultant", label: t.workMenu.bol },
    { to: "/interim-ecommerce-manager", label: t.workMenu.interim },
  ] as const;

  const siteLinks = [
    { to: "/", label: t.home },
    { to: "/work", label: t.work, hasDropdown: true },
    { to: "/writing", label: t.writing },
    { to: "/about", label: t.about },
  ];

  const searchablePages = [
    { to: "/", label: t.home, keywords: ["home", "start", "landing"] },
    { to: "/work", label: t.work, keywords: ["work", "werk", "cases", "portfolio"] },
    { to: "/work/connect-car-parts", label: "Connect Car Parts", keywords: ["ccp", "case", "brake", "abs"] },
    { to: "/amazon-nl-specialist", label: t.workMenu.amazon, keywords: ["amazon", "nl", "specialist", "ads"] },
    { to: "/bol-com-consultant", label: t.workMenu.bol, keywords: ["bol", "consultant", "marketplace"] },
    { to: "/interim-ecommerce-manager", label: t.workMenu.interim, keywords: ["interim", "manager", "freelance"] },
    { to: "/writing", label: t.writing, keywords: ["blog", "writing", "artikelen", "posts"] },
    { to: "/about", label: t.about, keywords: ["about", "over", "contact", "cv"] },
    ...(user
      ? [
          { to: "/write", label: t.workspace.blogCms, keywords: ["blog", "cms", "editor", "write", "schrijven"] },
          { to: "/samantha", label: t.workspace.samantha, keywords: ["samantha", "ai", "command", "assistant"] },
          { to: "/portal", label: t.workspace.portal, keywords: ["portal", "dashboard", "tools"] },
          { to: "/wiki", label: t.workspace.docs, keywords: ["wiki", "docs", "documentation"] },
          ...(isAdmin ? [{ to: "/god-structure", label: t.workspace.dashboard, keywords: ["dashboard", "god", "structure", "admin", "infrastructure"] }] : []),
        ]
      : []),
  ];

  const filteredPages = searchQuery.trim()
    ? searchablePages.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keywords.some((k) => k.includes(searchQuery.toLowerCase())),
      )
    : searchablePages;

  /* ── Tier 2 contextual sub-bar (CMS modes), hidden on immersive/compact ── */
  const cmsModes = [
    { key: "write", to: "/write", label: t.cms.write, Icon: SquarePen },
    { key: "manage", to: "/write?mode=manage", label: t.cms.manage, Icon: LayoutGrid },
    { key: "analytics", to: "/write?mode=analytics", label: t.cms.analytics, Icon: BarChart3 },
  ];
  const onWriteSurface = location.pathname.startsWith("/write");
  const showSubbar = !compact && onWriteSurface;
  const activeMode = new URLSearchParams(location.search).get("mode") ?? "write";

  /* ── Effects ── */
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
  useEffect(() => setSelectedIndex(0), [searchQuery]);

  const isActive = (to: string) => location.pathname === to;
  const isWorkActive = location.pathname.startsWith("/work")
    || ["/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager"].includes(location.pathname);

  const openWork = () => { clearTimeout(workCloseTimer.current); setWorkOpen(true); };
  const closeWorkSoon = () => { workCloseTimer.current = setTimeout(() => setWorkOpen(false), 120); };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filteredPages.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filteredPages[selectedIndex]) { navigate(filteredPages[selectedIndex].to); setSearchOpen(false); }
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t.portal;

  /* ── Tier-1 site link (orange active underline) ── */
  const SiteLink = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
    <Link
      to={to}
      className={`relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
        active ? "text-[#15140F]" : "text-[#7E7A6F] hover:text-[#15140F]"
      }`}
    >
      {label}
      {active && <span className="absolute left-3.5 right-3.5 bottom-0.5 h-[2px] rounded-full bg-[#C2410C]" />}
    </Link>
  );

  return (
    <>
      {/* ═══ Search overlay (⌘K) ═══ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/30 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }} transition={{ duration: 0.15 }}
              className="w-full max-w-lg mx-4 rounded-xl border border-black/10 bg-[#FBF8F0] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10">
                <Search size={16} className="text-[#7E7A6F] shrink-0" />
                <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder={t.searchPlaceholder} className="flex-1 bg-transparent text-sm text-[#15140F] placeholder:text-[#7E7A6F] outline-none" />
                <kbd className="hidden sm:inline-flex items-center rounded border border-black/10 bg-[#E5DFCE] px-1.5 py-0.5 text-[10px] font-mono text-[#7E7A6F]">ESC</kbd>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredPages.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[#7E7A6F]">{t.noResults}</p>
                ) : (
                  filteredPages.map((page, i) => (
                    <button key={page.to} onClick={() => { navigate(page.to); setSearchOpen(false); }} onMouseEnter={() => setSelectedIndex(i)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${i === selectedIndex ? "bg-[#E5DFCE] text-[#15140F]" : "text-[#15140F] hover:bg-[#E5DFCE]/60"}`}>
                      <span className="font-medium">{page.label}</span>
                      <span className="ml-auto text-xs text-[#7E7A6F]">{page.to}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ NAVBAR ═══ */}
      <nav aria-label="Primary navigation" className="fixed top-0 z-50 w-full bg-[#F1ECDF]/95 backdrop-blur-lg border-b border-black/10">
        {/* ─── TIER 1 ─── */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
            {/* Brand */}
            <Link to="/" className="justify-self-start flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#15140F]">
              <img src={logoImg} alt="Hans van Leeuwen — Freelance E-commerce Manager" width={30} height={30} className="h-[30px] w-[30px] rounded-md object-contain" />
              <span className="hidden sm:inline">Hans van Leeuwen</span>
            </Link>

            {/* Centre nav + Work dropdown */}
            {!compact && (
              <div className="hidden md:flex items-center gap-1 justify-self-center">
                {siteLinks.map((l) =>
                  l.hasDropdown ? (
                    <div key={l.to} className="relative" onMouseEnter={openWork} onMouseLeave={closeWorkSoon}>
                      <button
                        onClick={() => navigate("/work")}
                        className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${isWorkActive ? "text-[#15140F]" : "text-[#7E7A6F] hover:text-[#15140F]"}`}
                      >
                        {l.label}
                        <ChevronDown size={13} className={`transition-transform ${workOpen ? "rotate-180" : ""}`} />
                        {isWorkActive && <span className="absolute left-3.5 right-7 bottom-0.5 h-[2px] rounded-full bg-[#C2410C]" />}
                      </button>
                      <AnimatePresence>
                        {workOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.14 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-64 rounded-xl border border-black/10 bg-[#FBF8F0] shadow-xl overflow-hidden py-1"
                          >
                            {workChildren.map((c, i) =>
                              "group" in c ? (
                                <p key={`g${i}`} className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[#7E7A6F] border-t border-black/[0.06] mt-1 first:border-0 first:mt-0">{c.group}</p>
                              ) : (
                                <Link key={c.to} to={c.to} onClick={() => setWorkOpen(false)} className={`block px-4 py-2.5 text-sm transition-colors ${isActive(c.to) ? "text-[#15140F] bg-[#E5DFCE]/60" : "text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60"}`}>{c.label}</Link>
                              ),
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <SiteLink key={l.to} to={l.to} label={l.label} active={isActive(l.to)} />
                  ),
                )}
              </div>
            )}

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 justify-self-end">
              <button onClick={() => setSearchOpen(true)} className="rounded-full p-2 text-[#7E7A6F] hover:text-[#15140F] hover:bg-[#E5DFCE] transition-all" aria-label={t.search}>
                <Search size={16} />
              </button>
              <button onClick={() => setSiteTheme(siteTheme === "dark" ? "light" : "dark")} className="rounded-full p-2 text-[#7E7A6F] hover:text-[#15140F] hover:bg-[#E5DFCE] transition-all" aria-label={siteTheme === "dark" ? "Light mode" : "Dark mode"}>
                {siteTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="hidden sm:flex items-center gap-0.5 font-mono text-xs">
                <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded ${lang === "nl" ? "text-[#15140F] font-semibold" : "text-[#7E7A6F] hover:text-[#15140F]"}`}>NL</button>
                <span className="text-black/20">|</span>
                <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded ${lang === "en" ? "text-[#15140F] font-semibold" : "text-[#7E7A6F] hover:text-[#15140F]"}`}>ENG</button>
              </div>

              {/* Account chip (logged-in) or Login pill */}
              {user ? (
                <div className="relative hidden sm:block">
                  <button onClick={() => setProfileOpen(!profileOpen)} className={`inline-flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-sm font-medium transition-all ${profileOpen ? "border-[#C2410C] bg-[#E5DFCE]" : "border-black/10 text-[#15140F] hover:bg-[#E5DFCE]"}`}>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#15140F] text-[11px] font-mono font-semibold text-[#F1ECDF]">{firstName.charAt(0).toLowerCase()}</span>
                    <span className="max-w-[90px] truncate">{firstName}</span>
                    <ChevronDown size={12} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 z-50 w-60 rounded-xl border border-black/10 bg-[#FBF8F0] shadow-xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-black/[0.07]">
                            <p className="text-sm font-medium truncate text-[#15140F]">{user.user_metadata?.full_name || "User"}</p>
                            <p className="text-xs truncate text-[#7E7A6F]">{user.email}</p>
                          </div>
                          <p className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[#7E7A6F]">{t.workspace.label}</p>
                          <div className="pb-1">
                            <a href="/write" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><PenLine size={15} /> {t.workspace.blogCms}</a>
                            <Link to="/samantha" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Sparkles size={15} /> {t.workspace.samantha}<span className="ml-auto text-[9px] font-mono text-[#7E7A6F]">⌘J</span></Link>
                            <Link to="/portal" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><LayoutDashboard size={15} /> {t.workspace.portal}</Link>
                            <Link to="/wiki" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><BookOpen size={15} /> {t.workspace.docs}</Link>
                            {isAdmin && <Link to="/god-structure" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Network size={15} /> {t.workspace.dashboard}</Link>}
                          </div>
                          <div className="border-t border-black/[0.07] py-1">
                            <button onClick={() => { signOut(); setProfileOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#C2410C] hover:bg-[#C2410C]/10 transition-colors"><LogOut size={15} /> {t.workspace.signOut}</button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/portal" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium text-[#15140F] hover:bg-[#E5DFCE] transition-all">
                  <LogIn size={14} /><span>{t.login}</span>
                </Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden rounded-lg p-1.5 text-[#15140F]" aria-label="Toggle menu">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── TIER 2 — contextual CMS sub-bar (yellow active underline) ─── */}
        {showSubbar && (
          <nav aria-label="CMS" className="hidden md:flex justify-center gap-1 border-t border-black/[0.06] bg-[#FBF8F0] px-6">
            {cmsModes.map((m) => {
              const active = m.key === activeMode;
              return (
                <Link key={m.key} to={m.to} className={`relative inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors ${active ? "text-[#15140F] font-semibold" : "text-[#7E7A6F] hover:text-[#15140F]"}`}>
                  <m.Icon size={15} /> {m.label}
                  {active && <span className="absolute left-4 right-4 bottom-0 h-[2px] rounded-full bg-[#F5C400]" />}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ═══ MOBILE MENU ═══ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-black/10 bg-[#F1ECDF] md:hidden">
              <div className="flex flex-col gap-1 px-4 py-4">
                <Link to="/" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isActive("/") ? "bg-[#E5DFCE] text-[#15140F]" : "text-[#7E7A6F] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"}`}>{t.home}</Link>
                {/* Work group */}
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[#7E7A6F]">{t.work}</p>
                {workChildren.map((c, i) => "group" in c
                  ? <p key={`mg${i}`} className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[#7E7A6F]">{c.group}</p>
                  : <Link key={c.to} to={c.to} onClick={() => setMobileOpen(false)} className={`rounded-lg px-5 py-2 text-sm ${isActive(c.to) ? "bg-[#E5DFCE] text-[#15140F]" : "text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"}`}>{c.label}</Link>)}
                <Link to="/writing" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isActive("/writing") ? "bg-[#E5DFCE] text-[#15140F]" : "text-[#7E7A6F] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"}`}>{t.writing}</Link>
                <Link to="/about" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${isActive("/about") ? "bg-[#E5DFCE] text-[#15140F]" : "text-[#7E7A6F] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"}`}>{t.about}</Link>

                <div className="my-1 h-px bg-black/10" />
                <div className="flex items-center gap-1 px-3 py-1 font-mono text-xs">
                  <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded ${lang === "nl" ? "text-[#15140F] font-semibold" : "text-[#7E7A6F]"}`}>NL</button>
                  <span className="text-black/20">|</span>
                  <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded ${lang === "en" ? "text-[#15140F] font-semibold" : "text-[#7E7A6F]"}`}>ENG</button>
                </div>

                {user ? (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-[#7E7A6F]">{t.workspace.label}</p>
                    <a href="/write" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"><PenLine size={14} /> {t.workspace.blogCms}</a>
                    <Link to="/samantha" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"><Sparkles size={14} /> {t.workspace.samantha}</Link>
                    <Link to="/portal" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"><LayoutDashboard size={14} /> {t.workspace.portal}</Link>
                    <Link to="/wiki" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"><BookOpen size={14} /> {t.workspace.docs}</Link>
                    {isAdmin && <Link to="/god-structure" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#4B4842] hover:bg-[#E5DFCE]/60 hover:text-[#15140F]"><Network size={14} /> {t.workspace.dashboard}</Link>}
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 text-[#C2410C] hover:bg-[#C2410C]/10 w-full text-left"><LogOut size={14} /> {t.workspace.signOut}</button>
                  </>
                ) : (
                  <Link to="/portal" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium inline-flex items-center gap-2 text-[#15140F] hover:bg-[#E5DFCE]/60"><LogIn size={14} /> {t.login}</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
