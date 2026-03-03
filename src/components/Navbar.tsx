import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogIn, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLang } from "@/hooks/useLang";
import HansAIOverlay from "@/components/overlays/HansAIOverlay";
import { translations } from "@/data/translations";
import logoImg from "@/assets/logo.png";
import { getLinks, THEME_KEY } from "./navbar/navData";
import SearchOverlay from "./navbar/SearchOverlay";
import QuickAccessDropdown from "./navbar/QuickAccessDropdown";
import MobileMenu from "./navbar/MobileMenu";

interface NavbarProps {
  variant?: "default" | "dark";
}

const Navbar = ({ variant = "default" }: NavbarProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
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

  // ⌘K shortcut
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

  const isActive = (to: string) => location.pathname === to;

  const LangSwitch = () => (
    <div className="flex items-center gap-0.5 text-xs tracking-widest">
      <button
        onClick={() => setLang("nl")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "nl" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        NL
      </button>
      <span className="text-border">/</span>
      <button
        onClick={() => setLang("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "en" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        EN
      </button>
    </div>
  );

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} />

      <nav aria-label="Primary navigation" className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Brand */}
          <Link to="/" className="shrink-0 flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70">
            <img src={logoImg} alt="Hans van Leeuwen" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            Hans van Leeuwen
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <motion.div key={l.to} whileTap={{ scale: 0.95 }} className="inline-flex">
              <Link
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
              </motion.div>
            ))}
          </div>

          {/* Right cluster */}
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
              {siteTheme === "dark" ? (
                <Sun size={16} className="transition-transform duration-300 group-hover:rotate-45 group-active:rotate-90" />
              ) : (
                <Moon size={16} className="transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </button>

            <div className="hidden sm:block">
              <LangSwitch />
            </div>

            <QuickAccessDropdown user={user} />

            {/* Portal / Login pill */}
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

        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          links={links}
          user={user}
          lang={lang}
          setLang={setLang}
        />
      </nav>

      <HansAIOverlay open={commandCenterOpen} onClose={() => setCommandCenterOpen(false)} />
    </>
  );
};

export default Navbar;
