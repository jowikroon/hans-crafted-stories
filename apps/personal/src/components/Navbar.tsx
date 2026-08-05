import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu, X, LogIn, Search, Sun, Moon, LogOut, BookOpen, LayoutDashboard,
  ChevronDown, Network, Sparkles, PenLine, Disc3, BarChart3, Cpu,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { logoById } from "@/lib/logos";
import { useActiveLogo, useLogoMotion } from "@/contexts/LogoContext";
import { useNavMenu } from "@/contexts/NavMenuContext";
import { useTheme } from "@/hooks/useTheme";


/* ─────────────────────────────────────────────────────────────
   ONE unified navigation, two layers.
   Tier 1 = primary bar (everyone, public light style).
   Tier 2 = either a dropdown panel (Work, Account) or a
            contextual sub-bar (CMS). Never deeper.
   Palette is the attachment's: warm paper bg, ink text,
   orange site-active underline, yellow CMS-active underline.
   ───────────────────────────────────────────────────────────── */

interface NavbarProps {
  /** Kept for App.tsx compatibility only. The bar is a single light style
      and renders identically on every page (variant/compact are ignored). */
  variant?: "default" | "dark";
  compact?: boolean;
}

const Navbar = (_props: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const t = translations[lang].nav;
  const logoSrc = logoById(useActiveLogo()).src;
  const logoMotion = useLogoMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const musicCloseTimer = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  /* Theme toggle still controls page-content dark mode; the bar stays light.
     State lives in the site-wide ThemeProvider (src/hooks/useTheme). */
  const { theme: siteTheme, toggleTheme } = useTheme();

  /* ── Nav model ── */
  /* Editable header menu (Design mode in /write); defaults mirror the old
     hardcoded list, so nothing changes until Hans customises it. */
  const { navItems } = useNavMenu();
  const siteLinks = [
    ...navItems
      .filter((i) => i.visible)
      .map((i) => ({ to: i.to, label: (lang === "nl" ? i.labelNl : i.labelEn) || i.labelNl || i.labelEn })),
  ];

  const searchablePages = [
    { to: "/", label: t.home, keywords: ["home", "start", "landing"] },
    { to: "/work", label: t.work, keywords: ["work", "werk", "cases", "portfolio"] },
    { to: "/work/connect-car-parts", label: "Connect Car Parts", keywords: ["ccp", "case", "brake", "abs"] },
    { to: "/amazon-nl-specialist", label: t.workMenu.amazon, keywords: ["amazon", "nl", "specialist", "ads"] },
    { to: "/bol-com-consultant", label: t.workMenu.bol, keywords: ["bol", "consultant", "marketplace"] },
    { to: "/interim-ecommerce-manager", label: t.workMenu.interim, keywords: ["interim", "manager", "freelance"] },
    { to: "/writing", label: t.writing, keywords: ["blog", "writing", "artikelen", "posts"] },
    { to: "/music", label: t.music, keywords: ["music", "muziek", "songs", "tracks", "spotify", "lyrics", "lo-fi", "ambient"] },
    { to: "/about", label: t.about, keywords: ["about", "over", "contact", "cv"] },
    ...(user
      ? [
          { to: "/write", label: t.workspace.blogCms, keywords: ["blog", "cms", "editor", "write", "schrijven"] },
          { to: "/samantha", label: t.workspace.samantha, keywords: ["samantha", "ai", "command", "assistant"] },
          { to: "/portal", label: t.workspace.portal, keywords: ["portal", "dashboard", "tools"] },
          { to: "/wiki", label: t.workspace.docs, keywords: ["wiki", "docs", "documentation"] },
          ...(isAdmin
            ? [
                { to: "/god-structure", label: t.workspace.dashboard, keywords: ["dashboard", "god", "structure", "admin", "infrastructure"] },
                { to: "/dashboards", label: "Dashboards", keywords: ["dashboards", "ccp", "connectcarparts", "sales", "ebay", "klanten"] },
              ]
            : []),
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

  const isCommandCenter = location.pathname.startsWith("/write");

  /* Backend surfaces are always light (/write, /music-cms, /portal, /wiki,
     /dashboards force or hardcode the light theme), so the bar must stay
     light there too — never inherit the visitor's dark toggle. */
  const isLightSurface =
    isCommandCenter ||
    ["/music-cms", "/portal", "/wiki", "/dashboards", "/blog-cms", "/pi"].some((p) =>
      location.pathname.startsWith(p)
    );

  /* Bar theme — follows the global dark toggle so header items stay visible in
     dark designs, but stays light on always-light backend surfaces. */
  const barDark = siteTheme === "dark" && !isLightSurface;
  const barInk = barDark ? "text-[#F5F1E6]" : "text-[#15140F]";
  const barMut = barDark ? "text-[#B4AE9F]" : "text-[#7E7A6F]";
  const barHovInk = barDark ? "hover:text-white" : "hover:text-[#15140F]";
  const barHovBg = barDark ? "hover:bg-white/10" : "hover:bg-[#E5DFCE]";
  const barBord = barDark ? "border-white/15" : "border-black/10";
  const barSep = barDark ? "text-white/25" : "text-black/20";
  const barPill = barDark ? "border-white/10 bg-[hsl(240,10%,7%)]/90" : "border-black/10 bg-[#F1ECDF]/90";
  const barChip = barDark ? "bg-white/10" : "bg-[#E5DFCE]";
  const barAvatar = barDark ? "bg-[#F5F1E6] text-[#15140F]" : "bg-[#15140F] text-[#F1ECDF]";

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

  // Scroll state — drives the floating pill's elevation (redesign shell)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) => location.pathname === to;
  const isWorkActive = location.pathname.startsWith("/work")
    || ["/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager"].includes(location.pathname);
  const isMusicActive = location.pathname === "/music" || location.pathname.startsWith("/music/") || location.pathname.startsWith("/muziek");


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
      className={`px-3.5 py-2 text-sm font-medium rounded-full transition-all ${
        active ? `${barChip} ${barInk}` : `${barMut} ${barHovInk} ${barHovBg}`
      }`}
    >
      {label}
    </Link>
  );

  /* Muziek dropdown — Overzicht (/music) + Artist Radar (static page under
     /muziek/, plain <a> = full nav). Best-in-class menu motion: hover-intent
     with a 140ms close-grace (a diagonal move to the panel never drops it),
     focus-open + Escape for keyboard, ARIA menu semantics, and a staggered
     item reveal on the site's signature ease. Honours prefers-reduced-motion. */
  const openMusic = () => {
    if (musicCloseTimer.current) { window.clearTimeout(musicCloseTimer.current); musicCloseTimer.current = null; }
    setMusicOpen(true);
  };
  const closeMusicSoon = () => {
    if (musicCloseTimer.current) window.clearTimeout(musicCloseTimer.current);
    musicCloseTimer.current = window.setTimeout(() => setMusicOpen(false), 140);
  };
  const musicPanel = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : { initial: { opacity: 0, y: -6, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -6, scale: 0.98 }, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } };
  const musicListV = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
  const musicItemV = prefersReduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const } } };
  const musicItemCls = "block px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 rounded-lg transition-colors dark:text-[#C9BFB0] dark:hover:text-white dark:hover:bg-white/5";
  const MusicNav = ({ label }: { label: string }) => (
    <div
      className="relative"
      onMouseEnter={openMusic}
      onMouseLeave={closeMusicSoon}
      onFocusCapture={openMusic}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) closeMusicSoon(); }}
      onKeyDown={(e) => { if (e.key === "Escape") { setMusicOpen(false); (e.currentTarget.querySelector("a") as HTMLElement | null)?.focus(); } }}
    >
      <Link
        to="/music"
        aria-haspopup="true"
        aria-expanded={musicOpen}
        className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${isMusicActive ? barInk : `${barMut} ${barHovInk}`}`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${musicOpen ? "rotate-180" : ""}`} />
        {isMusicActive && <span className="absolute left-3.5 right-6 bottom-0.5 h-[2px] rounded-full bg-[#2D9255]" />}
      </Link>
      <AnimatePresence>
        {musicOpen && (
          <motion.div {...musicPanel} style={{ transformOrigin: "top center" }} className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 w-56">
            <motion.div
              role="menu"
              aria-label={label}
              variants={musicListV}
              initial="hidden"
              animate="show"
              className="p-1.5 rounded-xl border border-black/10 bg-[#FBF8F0] shadow-[0_18px_46px_-22px_rgba(20,19,15,0.45)] dark:border-white/10 dark:bg-[hsl(40,8%,9%)]"
            >
              <motion.div variants={musicItemV}>
                <Link role="menuitem" to="/muziek/artist-radar" onClick={() => setMusicOpen(false)} className={musicItemCls}>Artist Radar</Link>
              </motion.div>
              <motion.div variants={musicItemV}>
                <Link role="menuitem" to="/music#songs" onClick={() => setMusicOpen(false)} className={musicItemCls}>Songs &amp; Production Notes</Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

      {/* ═══ NAVBAR — floating rounded pill (redesign) ═══ */}
      <nav aria-label="Primary navigation" className="fixed left-0 right-0 top-0 z-50 w-full">
        {/* ─── TIER 1 — detached pill ─── */}
        <div
          className={`mx-auto mt-3.5 grid grid-cols-[1fr_auto_1fr] items-center h-[60px] max-w-6xl rounded-[100px] border ${barPill} px-4 backdrop-blur-xl transition-shadow ${
            scrolled
              ? "shadow-[0_3px_9px_-3px_rgba(20,19,15,0.18),0_20px_46px_-22px_rgba(20,19,15,0.32)]"
              : "shadow-[0_2px_6px_-3px_rgba(20,19,15,0.12),0_14px_34px_-20px_rgba(20,19,15,0.22)]"
          }`}
          style={{ width: "calc(100% - 36px)" }}
        >
            {/* Brand */}
            <Link to="/" aria-label="Hans van Leeuwen, home" className={`group justify-self-start flex items-center gap-2.5 text-base font-semibold tracking-tight ${barInk}`}>
              <img
                src={logoSrc}
                alt="Hans van Leeuwen, Freelance E-commerce Manager"
                width={30}
                height={30}
                className={`h-[30px] w-[30px] rounded-md object-contain${logoMotion ? " transition-transform duration-300 group-hover:-translate-y-px group-hover:scale-105" : ""}`}
              />
            </Link>

            {/* Centre nav — plain links (Work hover dropdown removed) */}
            <div className="hidden md:flex items-center gap-1 justify-self-center">
                {siteLinks.map((l) => (
                  <SiteLink
                    key={l.to}
                    to={l.to}
                    label={l.label}
                    active={
                      l.to === "/work"
                        ? isWorkActive
                        : (l as { cc?: boolean }).cc
                        ? isCommandCenter
                        : isActive(l.to)
                    }
                  />
                ))}
              </div>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 justify-self-end">
              <button onClick={() => setSearchOpen(true)} className={`rounded-full p-2 ${barMut} ${barHovInk} ${barHovBg} transition-all`} aria-label={t.search}>
                <Search size={16} />
              </button>
              <button onClick={toggleTheme} className={`rounded-full p-2 ${barMut} ${barHovInk} ${barHovBg} transition-all`} aria-label={siteTheme === "dark" ? "Light mode" : "Dark mode"}>
                {siteTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="hidden sm:flex items-center gap-0.5 font-mono text-xs">
                <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded ${lang === "nl" ? `${barInk} font-semibold` : `${barMut} ${barHovInk}`}`}>NL</button>
                <span className={barSep}>|</span>
                <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded ${lang === "en" ? `${barInk} font-semibold` : `${barMut} ${barHovInk}`}`}>ENG</button>
              </div>

              {/* Account chip (logged-in) or Login pill */}
              {user ? (
                <div className="relative hidden sm:block">
                  <button onClick={() => setProfileOpen(!profileOpen)} className={`inline-flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-sm font-medium transition-all ${profileOpen ? `border-[#2D9255] ${barChip}` : `${barBord} ${barInk} ${barHovBg}`}`}>
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${barAvatar} text-[11px] font-mono font-semibold`}>{firstName.charAt(0).toLowerCase()}</span>
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
                            {isAdmin && <Link to="/write" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><PenLine size={15} /> {t.workspace.blogCms}</Link>}
                            {isAdmin && <Link to="/release-set" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Disc3 size={15} /> Release Set</Link>}
                            {isAdmin && <Link to="/samantha" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Sparkles size={15} /> {t.workspace.samantha}<span className="ml-auto text-[9px] font-mono text-[#7E7A6F]">⌘J</span></Link>}
                            <Link to="/portal" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><LayoutDashboard size={15} /> {t.workspace.portal}</Link>
                            {isAdmin && <Link to="/wiki" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><BookOpen size={15} /> {t.workspace.docs}</Link>}
                            {isAdmin && <Link to="/god-structure" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Network size={15} /> {t.workspace.dashboard}</Link>}
                            {isAdmin && <Link to="/dashboards" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><BarChart3 size={15} /> Dashboards</Link>}
                            {isAdmin && <Link to="/pi" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B4842] hover:text-[#15140F] hover:bg-[#E5DFCE]/60 transition-colors"><Cpu size={15} /> Raspberry Pi</Link>}
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
                <Link to="/portal" className={`hidden sm:inline-flex items-center gap-2 rounded-full border ${barBord} px-4 py-1.5 text-sm font-medium ${barInk} ${barHovBg} transition-all`}>
                  <LogIn size={14} /><span>{t.login}</span>
                </Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden rounded-lg p-1.5 ${barInk}`} aria-label="Toggle menu">
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
        </div>

        {/* ═══ MOBILE MENU — floating panel under the pill ═══ */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ width: "calc(100% - 36px)" }} className={`mx-auto mt-2 overflow-hidden rounded-2xl border ${barDark ? "border-white/10 bg-[hsl(240,8%,9%)]" : "border-black/10 bg-[#F1ECDF]"} shadow-[0_18px_46px_-22px_rgba(20,19,15,0.4)] md:hidden`}>
              <div className="flex flex-col gap-1 px-4 py-4">
                {/* Top-level links only — no sub-items/children in the mobile menu */}
                {siteLinks.map((l) => {
                  const cc = (l as { cc?: boolean }).cc;
                  const active = cc ? isCommandCenter : isActive(l.to);
                  return (
                    <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm font-medium ${active ? (cc ? "bg-[#2D9255] text-white" : `${barChip} ${barInk}`) : `${barMut} ${barHovBg} ${barHovInk}`}`}>{l.label}</Link>
                  );
                })}

                <div className={`my-1 h-px ${barDark ? "bg-white/10" : "bg-black/10"}`} />
                <div className="flex items-center gap-1 px-3 py-1 font-mono text-xs">
                  <button onClick={() => setLang("nl")} className={`px-1.5 py-0.5 rounded ${lang === "nl" ? `${barInk} font-semibold` : barMut}`}>NL</button>
                  <span className={barSep}>|</span>
                  <button onClick={() => setLang("en")} className={`px-1.5 py-0.5 rounded ${lang === "en" ? `${barInk} font-semibold` : barMut}`}>ENG</button>
                </div>

                {user ? (
                  <>
                    <p className={`px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold ${barMut}`}>{t.workspace.label}</p>
                    {isAdmin && <Link to="/write" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><PenLine size={14} /> {t.workspace.blogCms}</Link>}
                    {isAdmin && <Link to="/release-set" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><Disc3 size={14} /> Release Set</Link>}
                    {isAdmin && <Link to="/samantha" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><Sparkles size={14} /> {t.workspace.samantha}</Link>}
                    <Link to="/portal" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><LayoutDashboard size={14} /> {t.workspace.portal}</Link>
                    {isAdmin && <Link to="/wiki" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><BookOpen size={14} /> {t.workspace.docs}</Link>}
                    {isAdmin && <Link to="/god-structure" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><Network size={14} /> {t.workspace.dashboard}</Link>}
                    {isAdmin && <Link to="/dashboards" onClick={() => setMobileOpen(false)} className={`rounded-lg px-3 py-2.5 text-sm inline-flex items-center gap-2 ${barMut} ${barHovBg} ${barHovInk}`}><BarChart3 size={14} /> Dashboards</Link>}
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
