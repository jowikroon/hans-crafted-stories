import { useState, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Lang = "nl" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "nl", setLang: () => {} });
export const useLang = () => useContext(LangContext);

const links = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/about", label: "About" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("nl");
  const { user } = useAuth();

  const LangSwitch = () => (
    <div className="flex items-center gap-0.5 text-xs font-medium">
      <button
        onClick={() => setLang("nl")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "nl" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        NL
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => setLang("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${lang === "en" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        ENG
      </button>
    </div>
  );

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-foreground">
          Hans van Leeuwen
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/portal"
            className={`inline-flex items-center gap-1.5 nav-link ${location.pathname === "/portal" ? "active" : ""}`}
          >
            {user ? (
              <>
                <img
                  src={user.user_metadata?.avatar_url || ""}
                  alt=""
                  className="h-5 w-5 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                Portal
              </>
            ) : (
              <>
                <LogIn size={14} />
                Login
              </>
            )}
          </Link>
          <div className="ml-1 border-l border-border pl-3">
            <LangSwitch />
          </div>
        </div>

        {/* Mobile: lang + toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <LangSwitch />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link text-base ${location.pathname === link.to ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/portal"
                onClick={() => setMobileOpen(false)}
                className={`nav-link text-base inline-flex items-center gap-2 ${location.pathname === "/portal" ? "active" : ""}`}
              >
                <LogIn size={14} />
                {user ? "Portal" : "Login"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </LangContext.Provider>
  );
};

export default Navbar;
